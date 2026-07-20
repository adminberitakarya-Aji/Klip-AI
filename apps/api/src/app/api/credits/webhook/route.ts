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
    console.warn("Midtrans webhook missing signature_key");
    return false;
  }

  // Check if server key is configured
  if (!MIDTRANS_SERVER_KEY) {
    console.error(
      "MIDTRANS_SERVER_KEY not configured - cannot verify signature",
    );
    // In development without server key, we might want to be lenient
    // but in production this should never happen
    if (process.env.NODE_ENV === "development") {
      console.warn("DEV MODE: Skipping signature verification");
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
  const isValid = crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(providedSignature),
  );

  if (!isValid) {
    console.warn(`Invalid Midtrans signature for ${notification.order_id}`);
    console.warn(`Expected: ${expectedSignature}`);
    console.warn(`Got: ${providedSignature}`);
  }

  return isValid;
}

export async function POST(request: NextRequest) {
  try {
    const notification: MidtransNotification = await request.json();

    // Log raw notification for debugging
    console.log(
      "Received Midtrans webhook:",
      JSON.stringify(notification, null, 2),
    );

    // CRITICAL: Verify signature to prevent fake webhook attacks
    // This protects against users creating fake settlement notifications
    // to get free credits without paying
    if (!verifySignature(notification)) {
      console.warn(
        `Rejected webhook for ${notification.order_id}: Invalid signature`,
      );
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 403 },
      );
    }

    console.log(`Signature verified for order: ${notification.order_id}`);

    // Handle the notification
    const result = await handleMidtransNotification(notification);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing Midtrans webhook:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process notification" },
      { status: 500 },
    );
  }
}
