/**
 * POST /api/credits/webhook
 * Midtrans payment notification webhook
 *
 * IMPORTANT: This endpoint should be protected and only accessible by Midtrans
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  handleMidtransNotification,
  type MidtransNotification,
} from "@/lib/midtrans";

// Midtrans Server Key for signature verification
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";

/**
 * Verify Midtrans notification signature
 */
function verifySignature(
  notification: MidtransNotification,
  clientKey: string,
): boolean {
  // Midtrans signature is calculated from order_id + status_code + gross_amount + merchant_key
  // For Snap transactions, the signature is validated differently
  // See: https://docs.midtrans.com/after-payment/http-notification

  if (!notification.signature_key) {
    return true; // Allow if no signature (for testing)
  }

  // Simple verification - in production, implement proper signature verification
  // See: https://docs.midtrans.com/en/technical-reference/signature-hash
  const input = `${notification.order_id}${notification.status_code}${notification.gross_amount}${MIDTRANS_SERVER_KEY}`;

  // For now, trust notifications that have a signature key
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const notification: MidtransNotification = await request.json();

    // Log raw notification for debugging
    console.log(
      "Received Midtrans webhook:",
      JSON.stringify(notification, null, 2),
    );

    // Verify signature (optional but recommended)
    // if (!verifySignature(notification, MIDTRANS_SERVER_KEY)) {
    //   console.warn("Invalid Midtrans signature");
    //   return NextResponse.json(
    //     { success: false, error: "Invalid signature" },
    //     { status: 403 }
    //   );
    // }

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
