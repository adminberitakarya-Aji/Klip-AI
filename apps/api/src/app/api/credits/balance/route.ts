/**
 * GET /api/credits/balance
 * Get user's current credit balance
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getCreditBalance, grantFreeCredits } from "@/lib/credits";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const userId = sessionUser.id;
    const { balance, hasReceivedFreeCredits } = await getCreditBalance(userId);

    return NextResponse.json({
      success: true,
      balance,
      hasReceivedFreeCredits,
      canClaimFreeCredits: !hasReceivedFreeCredits,
    });
  } catch (error) {
    console.error("Error fetching credit balance:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch balance" },
      { status: 500 },
    );
  }
}
