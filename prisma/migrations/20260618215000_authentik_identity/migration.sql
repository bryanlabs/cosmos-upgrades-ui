ALTER TABLE "User" ADD COLUMN "email" TEXT;
ALTER TABLE "User" ADD COLUMN "name" TEXT;
ALTER TABLE "User" ADD COLUMN "image" TEXT;
ALTER TABLE "User" ADD COLUMN "authProvider" TEXT;
ALTER TABLE "User" ADD COLUMN "authSubject" TEXT;

CREATE UNIQUE INDEX "User_authProvider_authSubject_key"
ON "User"("authProvider", "authSubject");
