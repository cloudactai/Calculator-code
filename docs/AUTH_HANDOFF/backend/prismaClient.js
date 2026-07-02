// Prisma client wired to Postgres through the pg adapter. Copy verbatim.
// Render's EXTERNAL database URLs (host ending in .render.com) require SSL;
// internal URLs (same private network) don't — this auto-detects.
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env") });
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Set it to your Postgres connection string.",
  );
}

const needsSsl = /\.render\.com/i.test(databaseUrl);
const pool = new Pool({
  connectionString: databaseUrl,
  ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
