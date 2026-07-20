/**
 * GET /api/credits/packages
 * Get all available credit packages for purchase
 */

import { NextResponse } from "next/server";
import { getCreditPackages } from "@/lib/credits";
import { formatPriceIdr } from "@klipai/ai/pricing";

export async function GET() {
  try {
    const packages = await getCreditPackages();

    // Format for display
    const formattedPackages = packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      slug: pkg.slug,
      credits: pkg.credits,
      price: {
        idr: pkg.priceIdr,
        formatted: formatPriceIdr(pkg.priceIdr),
      },
      description: pkg.description,
      features: pkg.features,
      isPopular: pkg.isPopular,
      // Calculate discount vs starter
      perCreditPrice: Math.ceil(pkg.priceIdr / pkg.credits),
      discount:
        pkg.slug === "starter"
          ? 0
          : Math.round((1 - pkg.priceIdr / pkg.credits / 2500) * 100), // vs starter price
    }));

    return NextResponse.json({
      success: true,
      packages: formattedPackages,
    });
  } catch (error) {
    console.error("Error fetching credit packages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch credit packages" },
      { status: 500 },
    );
  }
}
