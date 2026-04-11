-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processes" (
    "id" TEXT NOT NULL,
    "processNumber" TEXT NOT NULL,
    "courtAcronym" TEXT NOT NULL,
    "organName" TEXT NOT NULL,
    "hasFinalJudgment" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communications" (
    "id" TEXT NOT NULL,
    "externalId" INTEGER NOT NULL,
    "publicationDate" TIMESTAMP(3) NOT NULL,
    "communicationType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT,
    "aiSummary" TEXT,
    "processId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "oabNumber" TEXT,
    "oabState" TEXT,
    "isLawyer" BOOLEAN NOT NULL DEFAULT false,
    "communicationId" TEXT NOT NULL,

    CONSTRAINT "recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "processes_processNumber_key" ON "processes"("processNumber");

-- CreateIndex
CREATE INDEX "processes_processNumber_idx" ON "processes"("processNumber");

-- CreateIndex
CREATE INDEX "processes_courtAcronym_idx" ON "processes"("courtAcronym");

-- CreateIndex
CREATE UNIQUE INDEX "communications_externalId_key" ON "communications"("externalId");

-- CreateIndex
CREATE INDEX "communications_processId_idx" ON "communications"("processId");

-- CreateIndex
CREATE INDEX "communications_publicationDate_idx" ON "communications"("publicationDate");

-- CreateIndex
CREATE INDEX "communications_externalId_idx" ON "communications"("externalId");

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_processId_fkey" FOREIGN KEY ("processId") REFERENCES "processes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipients" ADD CONSTRAINT "recipients_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "communications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
