import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

declare const process: {
  exit(code?: number): never;
};

const prisma = new PrismaClient();

async function main() {
  const email = "admin@klip.ai";
  const password = "adminpassword123";
  const name = "Admin Klip-AI";

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: Role.ADMIN,
      credits: 9999,
      hasReceivedFreeCredits: true,
    },
    create: {
      email,
      name,
      passwordHash,
      role: Role.ADMIN,
      credits: 9999,
      hasReceivedFreeCredits: true,
    },
  });

  console.log("✅ Admin account successfully created/updated:");
  console.log(`- Email: ${admin.email}`);
  console.log(`- Password: ${password}`);
  console.log(`- Role: ${admin.role}`);
  console.log(`- Credits: ${admin.credits}`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
