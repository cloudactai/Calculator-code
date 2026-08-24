// One-time seed: loads tax_constants.json into the TaxConstant table.
// Run with: node scripts/seed-tax-constants.js
//
// Safe to re-run — uses upsert so existing rows are updated, not duplicated.

const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const prisma = require("../prismaClient");
const TAX_CONSTANTS = require("../src/data/tax_constants.json");

async function seed() {
  const years = Object.keys(TAX_CONSTANTS);
  console.log(`Seeding ${years.length} tax year(s): ${years.join(", ")}`);

  for (const yearStr of years) {
    const year = Number(yearStr);
    await prisma.taxConstant.upsert({
      where: { year },
      update: { data: TAX_CONSTANTS[yearStr] },
      create: { year, data: TAX_CONSTANTS[yearStr] },
    });
    console.log(`  ✓ ${year}`);
  }

  console.log("Done.");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
