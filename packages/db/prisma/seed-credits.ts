/**
 * Seed credit packages for the billing system
 * Run: pnpm --filter @klipai/db db:seed:credits
 * Or: npx prisma db seed --prisma ../../packages/db/prisma/schema.prisma
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const creditPackages = [
  {
    name: "Starter Pack",
    slug: "starter",
    credits: 20,
    priceIdr: 50000, // Rp 50.000
    priceUsd: 3.0,
    description:
      "Cocok untuk coba-coba. Dapatkan 20 credits untuk mulai membuat video.",
    features: ["20 Credits", "Semua template", "Support via email"],
    isActive: true,
    isPopular: false,
    sortOrder: 1,
  },
  {
    name: "Pro Pack",
    slug: "pro",
    credits: 100,
    priceIdr: 200000, // Rp 200.000
    priceUsd: 12.0,
    description: "Paket paling populer untuk kreator konten aktif.",
    features: [
      "100 Credits",
      "Semua template",
      "Priority support",
      "Akses early feature",
    ],
    isActive: true,
    isPopular: true,
    sortOrder: 2,
  },
  {
    name: "Business Pack",
    slug: "business",
    credits: 500,
    priceIdr: 800000, // Rp 800.000
    priceUsd: 48.0,
    description: "Untuk agency dan bisnis yang butuh volume tinggi.",
    features: [
      "500 Credits",
      "Semua template",
      "Priority support",
      "Volume discount",
      "Custom integration",
    ],
    isActive: true,
    isPopular: false,
    sortOrder: 3,
  },
];

const FREE_CREDITS_AMOUNT = 10; // 10 credits gratis untuk new user

async function main() {
  console.log("🌱 Seeding credit packages...");

  // Upsert credit packages
  for (const pkg of creditPackages) {
    const existing = await prisma.creditPackage.findUnique({
      where: { slug: pkg.slug },
    });

    if (existing) {
      console.log(`  ↻ Updating: ${pkg.name}`);
      await prisma.creditPackage.update({
        where: { id: existing.id },
        data: pkg,
      });
    } else {
      console.log(`  + Creating: ${pkg.name}`);
      await prisma.creditPackage.create({
        data: pkg,
      });
    }
  }

  console.log("\n✅ Credit packages seeded successfully!");
  console.log(`\n📦 Summary:`);
  console.log(`   - Starter Pack: 20 credits @ Rp 50.000`);
  console.log(`   - Pro Pack: 100 credits @ Rp 200.000 (POPULAR)`);
  console.log(`   - Business Pack: 500 credits @ Rp 800.000`);
  console.log(
    `   - Free Credits: ${FREE_CREDITS_AMOUNT} credits for new users`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Error seeding credit packages:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { FREE_CREDITS_AMOUNT };
