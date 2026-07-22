/**
 * POST /api/credits/purchase
 * Initiate credit package purchase via Midtrans
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getCreditPackageBySlug } from "@/lib/credits";
import { createSnapPayment } from "@/lib/midtrans";
import { captureError } from "@/lib/error-capture";

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { packageSlug } = body;

    if (!packageSlug) {
      return NextResponse.json(
        { success: false, error: "Package slug is required" },
        { status: 400 },
      );
    }

    // Get package details
    const pkg = await getCreditPackageBySlug(packageSlug);

    if (!pkg) {
      return NextResponse.json(
        { success: false, error: "Package not found" },
        { status: 404 },
      );
    }

    // Create Midtrans payment
    const result = await createSnapPayment({
      packageId: pkg.id,
      packageSlug: pkg.slug,
      packageName: pkg.name,
      credits: pkg.credits,
      priceIdr: pkg.priceIdr,
      userId: sessionUser.id,
      userEmail: sessionUser.email || "",
      userName: undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to create payment" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      snapToken: result.snapToken,
      redirectUrl: result.redirectUrl,
      package: {
        name: pkg.name,
        credits: pkg.credits,
        price: pkg.priceIdr,
      },
    });
  } catch (error) {
    captureError("POST /api/credits/purchase", error);
    return NextResponse.json(
      { success: false, error: "Failed to create purchase" },
      { status: 500 },
    );
  }
}
