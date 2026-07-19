import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@klipai/db/client";
import { captureError } from "@/lib/error-capture";

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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(
      Math.max(1, parseInt(searchParams.get("pageSize") || "20")),
      50,
    ); // Max 50 per page

    const result = await prisma.generation.findMany({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await prisma.generation.count({
      where: { userId: sessionUser.id },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: result,
        total,
        page,
        pageSize,
        hasMore: total > page * pageSize,
      },
    });
  } catch (error) {
    captureError("GET /api/user/generations", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch generations",
        },
      },
      { status: 500 },
    );
  }
}
