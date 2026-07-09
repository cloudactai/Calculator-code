-- Personal profile fields edited on the Profile page: first/last name, phone
-- number, the free-text "Job Title" (description), a base64 signature image and
-- the mailing address (street / province / country).
ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN "lastName" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "description" TEXT;
ALTER TABLE "User" ADD COLUMN "signature" TEXT;
ALTER TABLE "User" ADD COLUMN "street" TEXT;
ALTER TABLE "User" ADD COLUMN "addressProvince" TEXT;
ALTER TABLE "User" ADD COLUMN "country" TEXT;
