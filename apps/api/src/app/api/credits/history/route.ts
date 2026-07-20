/**
 * GET /api/credits/history
 * Get user's credit transaction history
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getCreditHistory } from "@/lib/credits";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type") as
      "FREE_CREDITS" | "PURCHASE" | "USAGE" | "REFUND" | null;

    const result = await getCreditHistory(sessionUser.id, {
      limit: Math.min(limit, 100), // Max 100 per request
      offset,
      type: type || undefined,
    });

    return NextResponse.json({
      success: true,
      transactions: result.transactions.map((tx) => ({
        id: tx.id,
        amount: tx.amount,
        type: tx.type,
        description: tx.description,
        date: tx.createdAt,
      })),
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + limit < result.total,
      },
    });
  } catch (error) {
    console.error("Error fetching credit history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch history" },
      { status: 500 },
    );
  }
}
