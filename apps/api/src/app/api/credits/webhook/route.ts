/**
 * POST /api/credits/webhook
 * Midtrans payment notification webhook
 *
 * IMPORTANT: This endpoint is protected by signature verification
 * to prevent fake webhook submissions that could grant free credits.
 * See: https://docs.midtrans.com/after-payment/http-notification
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";
import {
  handleMidtransNotification,
  type MidtransNotification,
} from "@/lib/midtrans";
import { logger } from "@klipai/core/logger";

// Midtrans Server Key for signature verification
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";

/**
 * Verify Midtrans notification signature
 *
 * IMPORTANT: Midtrans uses SHA512 hash to verify webhook authenticity.
 * The signature_key is calculated as:
 * SHA512(order_id + status_code + gross_amount + server_key)
 *
 * This prevents attackers from sending fake webhook notifications
 * to grant themselves free credits.
 */
function verifySignature(notification: MidtransNotification): boolean {
  // Reject if no signature provided - this is required for security
  if (!notification.signature_key) {
    logger.warn("Midtrans webhook missing signature_key", {
      orderId: notification.order_id,
    });
    return false;
  }

  // Check if server key is configured
  if (!MIDTRANS_SERVER_KEY) {
    logger.error(
      "MIDTRANS_SERVER_KEY not configured - cannot verify signature",
    );
    // In development without server key, we might want to be lenient
    // but in production this should never happen
    if (process.env.NODE_ENV === "development") {
      logger.warn("DEV MODE: Skipping signature verification");
      return true;
    }
    return false;
  }

  // Calculate expected signature
  // Format: SHA512(order_id + status_code + gross_amount + server_key)
  const input = `${notification.order_id}${notification.status_code}${notification.gross_amount}${MIDTRANS_SERVER_KEY}`;
  const expectedSignature = crypto
    .createHash("sha512")
    .update(input)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  const providedSignature = notification.signature_key;

  // Validate signature length before comparison
  // SHA512 produces 128 hex characters
  if (providedSignature.length !== 128) {
    logger.warn(
      `Invalid signature length for ${notification.order_id}: expected 128, got ${providedSignature.length}`,
    );
    return false;
  }

  let isValid = false;
  try {
    isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(providedSignature),
    );
  } catch (error) {
    // Handle case where buffers have different lengths (shouldn't happen after length check)
    // or any other crypto error
    logger.warn(`Signature comparison failed for ${notification.order_id}:`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }

  if (!isValid) {
    logger.warn(`Invalid Midtrans signature for ${notification.order_id}`);
  }

  return isValid;
}

export async function POST(request: NextRequest) {
  try {
    const notification: MidtransNotification = await request.json();

    // Log only order_id and status for debugging (redact sensitive data)
    logger.info("Received Midtrans webhook", {
      orderId: notification.order_id,
      transactionStatus: notification.transaction_status,
      statusCode: notification.status_code,
    });

    // CRITICAL: Verify signature to prevent fake webhook attacks
    // This protects against users creating fake settlement notifications
    // to get free credits without paying
    if (!verifySignature(notification)) {
      logger.warn(
        `Rejected webhook for ${notification.order_id}: Invalid signature`,
      );
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 403 },
      );
    }

    logger.info("Signature verified for order", {
      orderId: notification.order_id,
    });

    // Handle the notification
    const result = await handleMidtransNotification(notification);

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error processing Midtrans webhook", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: "Failed to process notification" },
      { status: 500 },
    );
  }
}
