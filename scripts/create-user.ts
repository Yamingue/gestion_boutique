/**
 * Crée un utilisateur en base de données.
 *
 * Usage :
 *   npx tsx scripts/create-user.ts <email> <mot_de_passe> <nom> [ADMIN|VENDEUR]
 *
 * Exemples :
 *   npx tsx scripts/create-user.ts admin@tchings.com MonPass123! "Administrateur" ADMIN
 *   npx tsx scripts/create-user.ts vendeur@tchings.com Pass456! "Jean Dupont" VENDEUR
 */

import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
})

async function main() {
  const [, , email, password, nom, roleArg] = process.argv;

  if (!email || !password || !nom) {
    console.error(
      "❌  Usage : npx tsx scripts/create-user.ts <email> <mot_de_passe> <nom> [ADMIN|VENDEUR]"
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("❌  Le mot de passe doit contenir au moins 8 caractères.");
    process.exit(1);
  }

  const role = (roleArg?.toUpperCase() === "ADMIN" ? "ADMIN" : "VENDEUR") as
    | "ADMIN"
    | "VENDEUR";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`❌  Un utilisateur avec l'email « ${email} » existe déjà.`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, password: hash, nom, role },
  });

  console.log("✅  Utilisateur créé :");
  console.log(`    ID    : ${user.id}`);
  console.log(`    Email : ${user.email}`);
  console.log(`    Nom   : ${user.nom}`);
  console.log(`    Rôle  : ${user.role}`);
}

main()
  .catch((err) => {
    console.error("❌  Erreur :", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
