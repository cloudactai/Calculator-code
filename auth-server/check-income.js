// Usage: node check-income.js CA-2026-00002
const prisma = require("./prismaClient");

const matterNumber = process.argv[2] || "CA-2026-00002";

async function main() {
  const matter = await prisma.matter.findFirst({
    where: { matterNumber },
  });

  if (!matter) {
    console.log("Matter not found:", matterNumber);
    return;
  }

  console.log("Matter ID:", matter.id, "| Number:", matter.matterNumber);

  const record = await prisma.matterRecord.findUnique({
    where: { matterId_dataType: { matterId: matter.id, dataType: "income_benefits" } },
  });

  if (!record) {
    console.log("\nNo income_benefits record exists for this matter.");
  } else {
    console.log("\nincome_benefits data:");
    console.log(JSON.stringify(record.data, null, 2));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
