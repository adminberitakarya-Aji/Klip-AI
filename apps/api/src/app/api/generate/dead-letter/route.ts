import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { generationService } from "@klipai/ai/services/generation-service";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 },
      );
    }

    const items = await generationService.listDeadLetterQueue({
      userId: sessionUser.id,
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("Dead letter queue error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to load dead letter queue",
        },
      },
      { status: 500 },
    );
  }
}
