import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { BatchStatus, PrismaClient } from "../src/generated/prisma/client";

/**
 * Demo data for testing: ~100 internees with Pakistani names/cities spread
 * across six batches, each with one or two tenures (scores on closed batches).
 *
 * Deterministic (seeded PRNG) and guarded: refuses to run if internees
 * already exist so it never duplicates. Run with: npm run db:seed:demo
 */

// --- deterministic PRNG (mulberry32) ---------------------------------------

let prngState = 20260810;
function random(): number {
  prngState |= 0;
  prngState = (prngState + 0x6d2b79f5) | 0;
  let t = Math.imul(prngState ^ (prngState >>> 15), 1 | prngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(random() * arr.length)];
const int = (min: number, max: number): number => min + Math.floor(random() * (max - min + 1));
const chance = (p: number): boolean => random() < p;

// --- data pools -------------------------------------------------------------

const MALE_NAMES = [
  "Ahmed", "Ali", "Hassan", "Hussain", "Usman", "Bilal", "Hamza", "Zain",
  "Fahad", "Umar", "Saad", "Taha", "Danish", "Kashif", "Waleed", "Abdullah",
  "Raheel", "Shahzaib", "Noman", "Junaid",
];
const FEMALE_NAMES = [
  "Fatima", "Ayesha", "Zainab", "Maryam", "Hira", "Sana", "Amna", "Iqra",
  "Mahnoor", "Khadija", "Rabia", "Noor", "Laiba", "Areeba", "Emaan", "Bushra",
  "Sadia", "Kinza", "Tooba", "Nimra",
];
const LAST_NAMES = [
  "Khan", "Ahmed", "Malik", "Butt", "Sheikh", "Qureshi", "Siddiqui",
  "Chaudhry", "Raza", "Abbasi", "Javed", "Iqbal", "Baig", "Mirza", "Ansari",
  "Hashmi", "Farooq", "Gillani", "Bhatti", "Awan",
];
const CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan",
  "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Hyderabad", "Bahawalpur",
  "Sargodha", "Abbottabad", "Sukkur",
];
const INSTITUTES = [
  "FAST-NUCES", "NUST Islamabad", "COMSATS", "UET Lahore", "Punjab University",
  "LUMS", "GIKI", "IBA Karachi", "Bahria University", "Air University",
  "NED University", "UET Peshawar",
];
const DEGREES = [
  "BS CS", "BS SE", "BS IT", "BS EE", "BS Data Science", "BS AI", "BBA", "MCS",
];
const SKILLS = [
  "HTML, CSS, JavaScript", "React, Next.js", "Node.js, Express, MySQL",
  "Python, Django", "Flutter, Dart", "Java, Spring Boot", "PHP, Laravel",
  "C#, .NET", "Figma, UI/UX", "Python, Pandas, SQL",
];
const SKILLS_LEARNED = [
  "React hooks, REST APIs, Git workflow", "Next.js app router, Prisma, code review",
  "Database design, query optimization", "Agile practices, unit testing",
  "TypeScript, component architecture", "CI basics, debugging, pair programming",
];
const REFERRERS = [
  "LinkedIn", "Facebook Ad", "University job fair", "Alumni referral",
  "Instagram", "Friend", "Rozee.pk",
];
const GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+"];

// Weekday bitmask: MON=1 TUE=2 WED=4 THU=8 FRI=16 SAT=32 SUN=64
const MWF = 21;
const TTH = 10;
const WEEKDAYS = 31;

interface BatchSeed {
  name: string;
  status: BatchStatus;
  start: [number, number, number];
  end: [number, number, number];
  startTimeMin: number;
  endTimeMin: number;
  daysOfWeek: number;
  /** Relative share of internees placed in this batch. */
  weight: number;
}

const BATCHES: BatchSeed[] = [
  { name: "Spring 2025", status: "CLOSED", start: [2025, 2, 3], end: [2025, 4, 25], startTimeMin: 540, endTimeMin: 780, daysOfWeek: MWF, weight: 15 },
  { name: "Summer 2025", status: "CLOSED", start: [2025, 6, 2], end: [2025, 8, 22], startTimeMin: 600, endTimeMin: 840, daysOfWeek: WEEKDAYS, weight: 20 },
  { name: "Fall 2025", status: "CLOSED", start: [2025, 10, 6], end: [2025, 12, 26], startTimeMin: 540, endTimeMin: 780, daysOfWeek: TTH, weight: 18 },
  { name: "Spring 2026", status: "CLOSED", start: [2026, 2, 2], end: [2026, 4, 24], startTimeMin: 540, endTimeMin: 780, daysOfWeek: MWF, weight: 20 },
  { name: "Summer 2026", status: "ACTIVE", start: [2026, 6, 1], end: [2026, 8, 28], startTimeMin: 600, endTimeMin: 840, daysOfWeek: WEEKDAYS, weight: 22 },
  { name: "Fall 2026", status: "UPCOMING", start: [2026, 10, 5], end: [2026, 12, 24], startTimeMin: 540, endTimeMin: 780, daysOfWeek: TTH, weight: 5 },
];

// DATE columns are written as UTC midnight (see README "Dates").
const utcDate = ([y, m, d]: [number, number, number]): Date => new Date(Date.UTC(y, m - 1, d));
const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * 86_400_000);

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set");
  const db = new PrismaClient({ adapter: new PrismaMariaDb(url) });

  try {
    const existing = await db.internee.count();
    if (existing >= 50) {
      console.log(`Found ${existing} internees — demo data appears seeded already. Aborting.`);
      return;
    }

    // Lookups (idempotent).
    for (const name of CITIES) await db.city.upsert({ where: { name }, update: {}, create: { name } });
    for (const name of INSTITUTES) await db.institute.upsert({ where: { name }, update: {}, create: { name } });
    for (const name of DEGREES) await db.degree.upsert({ where: { name }, update: {}, create: { name } });
    const cities = await db.city.findMany();
    const institutes = await db.institute.findMany();
    const degrees = await db.degree.findMany();
    console.log(`Lookups ready: ${cities.length} cities, ${institutes.length} institutes, ${degrees.length} degrees`);

    // Batches (matched by name so re-runs and the existing "Winter 25" survive).
    const batchIds: { id: number; seed: BatchSeed }[] = [];
    for (const seed of BATCHES) {
      let batch = await db.batch.findFirst({ where: { name: seed.name, deletedAt: null } });
      batch ??= await db.batch.create({
        data: {
          name: seed.name,
          status: seed.status,
          startDate: utcDate(seed.start),
          endDate: utcDate(seed.end),
          startTimeMin: seed.startTimeMin,
          endTimeMin: seed.endTimeMin,
          daysOfWeek: seed.daysOfWeek,
          roadmap: chance(0.7) ? "Weeks 1-2 fundamentals, 3-8 project work, 9-12 final project & demo day" : null,
          createdAt: addDays(utcDate(seed.start), -30),
        },
      });
      batchIds.push({ id: batch.id, seed });
    }
    console.log(`Batches ready: ${batchIds.length}`);

    // Weighted pool to distribute internees across batches.
    const weighted = batchIds.flatMap((b) => Array<typeof b>(b.seed.weight).fill(b));

    let created = 0;
    let tenures = 0;
    for (let i = 0; i < 100; i++) {
      const isFemale = chance(0.4);
      const firstName = isFemale ? pick(FEMALE_NAMES) : pick(MALE_NAMES);
      const lastName = pick(LAST_NAMES);
      const email = `${firstName}.${lastName}.${i}@example.com`.toLowerCase();

      const first = pick(weighted);
      const alsoIn = chance(0.2)
        ? pick(batchIds.filter((b) => b.id !== first.id && b.seed.status !== "UPCOMING"))
        : null;

      const makeTenure = ({ id, seed }: { id: number; seed: BatchSeed }) => {
        const start = utcDate(seed.start);
        const droppedOut = seed.status === "CLOSED" && chance(0.08);
        const end = droppedOut ? addDays(start, int(14, 45)) : utcDate(seed.end);
        const scored = seed.status === "CLOSED" && !droppedOut;
        const score = scored ? int(50, 99) + (chance(0.5) ? 0.5 : 0) : null;
        const certified = scored && (score ?? 0) >= 60 && chance(0.8);
        const degreeStart = addDays(start, -int(365, 1100));
        return {
          batchId: id,
          startDate: start,
          endDate: end,
          instituteId: pick(institutes).id,
          degreeId: pick(degrees).id,
          degreeStartDate: degreeStart,
          degreeEndDate: addDays(degreeStart, 4 * 365),
          semester: int(3, 8),
          grade: chance(0.8) ? pick(GRADES) : null,
          skills: pick(SKILLS),
          skillsLearned: scored ? pick(SKILLS_LEARNED) : null,
          miscCourses: chance(0.3) ? "Coursera: Meta Front-End Developer" : null,
          score,
          certStartDate: certified ? start : null,
          certEndDate: certified ? end : null,
          certIssueDate: certified ? addDays(end, int(7, 21)) : null,
          comments: droppedOut ? "Left the program early." : chance(0.15) ? "Strong performer, consider for future hiring." : null,
          createdAt: addDays(start, -int(7, 21)),
        };
      };

      const tenureData = [makeTenure(first), ...(alsoIn ? [makeTenure(alsoIn)] : [])];
      const joinedAt = tenureData[0].createdAt;

      await db.person.create({
        data: {
          firstName,
          lastName,
          email,
          phone: `+923${int(0, 4)}${int(1000000, 9999999)}${int(0, 9)}`,
          gender: isFemale ? "FEMALE" : "MALE",
          cityId: pick(cities).id,
          createdAt: joinedAt,
          internee: {
            create: {
              fatherName: `${pick(MALE_NAMES)} ${lastName}`,
              guardianPhone: chance(0.7) ? `+923${int(0, 4)}${int(1000000, 9999999)}${int(0, 9)}` : null,
              referredBy: chance(0.6) ? pick(REFERRERS) : null,
              createdAt: joinedAt,
              tenures: { create: tenureData },
            },
          },
        },
      });
      created += 1;
      tenures += tenureData.length;
    }

    console.log(`Created ${created} internees with ${tenures} tenures across ${batchIds.length} batches.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
