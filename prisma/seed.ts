import "dotenv/config";

import { hash } from "bcryptjs";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient, UserRole } from "../src/generated/prisma/client";

const INSTITUTES = ["FAST Faisalabad", "UET Lahore", "GC Faisalabad"];
const DEGREES = ["BS CS", "BS IT", "BS SE"];
const CITIES = ["Faisalabad", "Lahore", "Islamabad", "Karachi", "Multan"];

const BCRYPT_ROUNDS = 12;

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const db = new PrismaClient({ adapter: new PrismaMariaDb(url) });

  try {
    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      throw new Error(
        "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env to seed the admin account",
      );
    }
    if (adminPassword.length < 10) {
      throw new Error("SEED_ADMIN_PASSWORD must be at least 10 characters");
    }

    const passwordHash = await hash(adminPassword, BCRYPT_ROUNDS);
    // The admin is a Person like everyone else; the User row holds only
    // credentials and links to it.
    const adminPerson = await db.person.upsert({
      where: { email: adminEmail },
      update: {},
      create: { firstName: "Admin", lastName: "", email: adminEmail },
    });
    await db.user.upsert({
      where: { personId: adminPerson.id },
      update: {},
      create: {
        personId: adminPerson.id,
        passwordHash,
        role: UserRole.ADMIN,
      },
    });
    console.log(`Admin user ready: ${adminEmail}`);

    for (const name of INSTITUTES) {
      await db.institute.upsert({ where: { name }, update: {}, create: { name } });
    }
    console.log(`Institutes ready: ${INSTITUTES.length}`);

    for (const name of DEGREES) {
      await db.degree.upsert({ where: { name }, update: {}, create: { name } });
    }
    console.log(`Degrees ready: ${DEGREES.length}`);

    for (const name of CITIES) {
      await db.city.upsert({ where: { name }, update: {}, create: { name } });
    }
    console.log(`Cities ready: ${CITIES.length}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
