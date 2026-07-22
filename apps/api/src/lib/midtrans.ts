/**
 * Midtrans Payment Integration
 *
 * Handles:
 * - Create Snap token for payment
 * - Handle payment notification webhook
 */

import { prisma, CreditTransactionType, PaymentStatus } from "@klipai/db";
import { addCredits } from "./credits";
import { logger } from "@klipai/core/logger";

// Midtrans Server Key (from environment)
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || "";
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";
const MIDTRANS_URL = MIDTRANS_IS_PRODUCTION
  ? "https://api.midtrans.com"
  : "https://api.sandbox.midtrans.com";

/**
 * Get Midtrans authorization header
 */
function getAuthHeader(): string {
  const encoded = Buffer.from(MIDTRANS_SERVER_KEY + ":").toString("base64");
  return `Basic ${encoded}`;
}

/**
 * Create a new order ID for Midtrans
 */
function createOrderId(packageSlug: string, userId: string): string {
  const timestamp = Date.now();
  return `KLIP_${packageSlug.toUpperCase()}_${userId.slice(-8)}_${timestamp}`;
}

export interface CreatePaymentParams {
  packageId: string;
  packageSlug: string;
  packageName: string;
  credits: number;
  priceIdr: number;
  userId: string;
  userEmail: string;
  userName?: string;
}

export interface CreatePaymentResult {
  success: boolean;
  orderId: string;
  snapToken?: string;
  redirectUrl?: string;
  error?: string;
}

/**
 * Create Midtrans Snap payment token
 *
 * This creates a Snap transaction that user can complete via:
 * - OVO, GoPay, DANA, ShopeePay
 * - Credit/Debit Card
 * - QRIS
 * - Virtual Account
 * - Internet Banking
 */
export async function createSnapPayment(
  params: CreatePaymentParams,
): Promise<CreatePaymentResult> {
  const {
    packageId,
    packageSlug,
    packageName,
    credits,
    priceIdr,
    userId,
    userEmail,
    userName,
  } = params;

  // Validate Midtrans configuration
  if (!MIDTRANS_SERVER_KEY) {
    return {
      success: false,
      orderId: "",
      error: "Midtrans not configured",
    };
  }

  const orderId = createOrderId(packageSlug, userId);

  try {
    // Create transaction record first (pending)
    await prisma.creditTransaction.create({
      data: {
        userId,
        packageId,
        amount: credits,
        type: CreditTransactionType.PURCHASE,
        description: `Purchase: ${packageName} (${credits} credits)`,
        orderId,
        paymentStatus: PaymentStatus.PENDING,
        metadata: {
          packageSlug,
          packageName,
          credits,
          priceIdr,
          userEmail,
        },
      },
    });

    // Call Midtrans Snap API
    const response = await fetch(`${MIDTRANS_URL}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: priceIdr,
        },
        customer_details: {
          first_name: userName || "Customer",
          email: userEmail,
        },
        item_details: [
          {
            id: packageId,
            name: packageName,
            price: priceIdr,
            quantity: 1,
          },
        ],
        credit_card: {
          secure: true,
        },
        callbacks: {
          finish: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/credits/success?order_id=${orderId}`,
          error: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/credits/error?order_id=${orderId}`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/credits/pending?order_id=${orderId}`,
        },
        expiry: {
          start_time: new Date().toISOString(),
          unit: "hours",
          duration: 24,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Midtrans API error", {
        orderId,
        statusCode: response.status,
        errorText,
      });

      // Update transaction as failed
      await prisma.creditTransaction.updateMany({
        where: { orderId },
        data: { paymentStatus: PaymentStatus.FAILED },
      });

      return {
        success: false,
        orderId,
        error: "Failed to create payment",
      };
    }

    const responseData = await response.json();

    return {
      success: true,
      orderId,
      snapToken: responseData.token,
      redirectUrl: responseData.redirect_url,
    };
  } catch (error) {
    logger.error("Error creating Midtrans payment", {
      orderId,
      error: error instanceof Error ? error.message : String(error),
    });

    // Update transaction as failed
    await prisma.creditTransaction
      .updateMany({
        where: { orderId },
        data: { paymentStatus: PaymentStatus.FAILED },
      })
      .catch(() => {}); // Ignore if orderId doesn't exist yet

    return {
      success: false,
      orderId,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export interface MidtransNotification {
  order_id: string;
  transaction_status:
    | "capture"
    | "settlement"
    | "pending"
    | "deny"
    | "cancel"
    | "expire"
    | "refund";
  status_code: string;
  transaction_id: string;
  gross_amount: string;
  payment_type: string;
  signature_key?: string;
}

export interface HandleNotificationResult {
  success: boolean;
  message: string;
}

/**
 * Handle Midtrans payment notification webhook
 *
 * This endpoint is called by Midtrans when payment status changes.
 * IMPORTANT: Verify the signature to ensure it's really from Midtrans.
 *
 * Uses atomic conditional update to prevent race conditions when Midtrans
 * sends multiple notifications for the same order (retry scenarios).
 */
export async function handleMidtransNotification(
  notification: MidtransNotification,
): Promise<HandleNotificationResult> {
  const { order_id, transaction_status, status_code } = notification;

  // Log only order_id and status (redact sensitive data)
  logger.info("Midtrans notification received", {
    orderId: order_id,
    transactionStatus: transaction_status,
    statusCode: status_code,
    paymentType: notification.payment_type,
  });

  // Map Midtrans status to our PaymentStatus
  let newStatus: PaymentStatus;
  switch (transaction_status) {
    case "capture":
    case "settlement":
      newStatus = PaymentStatus.COMPLETED;
      break;
    case "pending":
      newStatus = PaymentStatus.PENDING;
      break;
    case "deny":
    case "cancel":
    case "expire":
      newStatus = PaymentStatus.FAILED;
      break;
    case "refund":
      newStatus = PaymentStatus.REFUNDED;
      break;
    default:
      newStatus = PaymentStatus.PROCESSING;
  }

  // Atomic update: only update if NOT already COMPLETED
  // This prevents race conditions where two concurrent webhooks both try to process
  const updated = await prisma.creditTransaction.updateMany({
    where: {
      orderId: order_id,
      paymentStatus: { not: PaymentStatus.COMPLETED },
    },
    data: {
      paymentStatus: newStatus,
      metadata: {
        midtransStatus: transaction_status,
        midtransTransactionId: notification.transaction_id,
        processedAt: new Date().toISOString(),
      },
    },
  });

  // If no rows updated, transaction either doesn't exist or was already processed
  if (updated.count === 0) {
    // Check if it exists but was already completed (idempotent)
    const existing = await prisma.creditTransaction.findFirst({
      where: { orderId: order_id },
      select: { paymentStatus: true },
    });

    if (existing?.paymentStatus === PaymentStatus.COMPLETED) {
      logger.info("Transaction already processed, skipping", {
        orderId: order_id,
      });
      return { success: true, message: "Already processed" };
    }

    logger.warn("Transaction not found for Midtrans notification", {
      orderId: order_id,
    });
    return { success: false, message: "Transaction not found" };
  }

  // Fetch the updated transaction to get user details and credit amount
  const transaction = await prisma.creditTransaction.findFirst({
    where: { orderId: order_id },
    include: {
      package: true,
      user: true,
    },
  });

  if (!transaction) {
    logger.error("Transaction disappeared after update", {
      orderId: order_id,
    });
    return { success: false, message: "Transaction not found after update" };
  }

  // If payment is completed (settlement/capture), add credits to user
  if (newStatus === PaymentStatus.COMPLETED) {
    const credits = transaction.amount;

    await addCredits(
      transaction.userId,
      credits,
      CreditTransactionType.PURCHASE,
      `Credits purchase completed: ${transaction.package?.name || "Unknown package"}`,
      transaction.packageId || undefined,
      {
        orderId: order_id,
        midtransTransactionId: notification.transaction_id,
        paymentType: notification.payment_type,
      },
    );

    logger.info("Credits added to user", {
      userId: transaction.userId,
      credits,
      orderId: order_id,
    });
  } else if (newStatus === PaymentStatus.FAILED) {
    logger.info("Payment failed", { orderId: order_id });
  }

  return { success: true, message: `Status updated to ${newStatus}` };
}

/**
 * Get payment status by order ID
 */
export async function getPaymentStatus(orderId: string) {
  const transaction = await prisma.creditTransaction.findFirst({
    where: { orderId },
    select: {
      id: true,
      orderId: true,
      paymentStatus: true,
      amount: true,
      description: true,
      createdAt: true,
      package: {
        select: {
          name: true,
          credits: true,
        },
      },
    },
  });

  if (!transaction) {
    return null;
  }

  return {
    orderId: transaction.orderId,
    status: transaction.paymentStatus,
    credits: transaction.amount,
    packageName: transaction.package?.name,
    packageCredits: transaction.package?.credits,
    description: transaction.description,
    createdAt: transaction.createdAt,
  };
}

/**
 * Get Midtrans Snap script URL for frontend
 * The frontend will use this to initialize Snap payment modal
 */
export function getMidtransSnapUrl(): string {
  return MIDTRANS_IS_PRODUCTION
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
}

/**
 * Get Midtrans client key for frontend
 */
export function getMidtransClientKey(): string {
  return MIDTRANS_CLIENT_KEY;
}
