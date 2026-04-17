/**
 * Seed : crée le compte administrateur initial.
 * Usage : npx tsx prisma/seed.ts
 */
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("Admin@2026!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@tchings.com" },
    update: {},
    create: {
      email: "admin@tchings.com",
      password: hash,
      nom: "Administrateur",
      role: "ADMIN",
    },
  });

  console.log("✅ Admin créé :", admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
