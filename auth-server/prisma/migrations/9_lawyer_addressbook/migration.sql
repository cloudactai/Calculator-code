-- Lawyer address book: a per-user list of lawyers (own firm + outside counsel)
-- used to auto-fill the lawyer block on the Background information form.
-- The DDL is exactly what `prisma migrate diff --from-empty
-- --to-schema-datamodel prisma/schema.prisma` emits for LawyerContact, so the
-- schema and the deployed database stay drift-free.

-- CreateTable
CREATE TABLE "LawyerContact" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "municipality" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "memberOfFirm" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawyerContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LawyerContact_userId_idx" ON "LawyerContact"("userId");

-- AddForeignKey
ALTER TABLE "LawyerContact" ADD CONSTRAINT "LawyerContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
