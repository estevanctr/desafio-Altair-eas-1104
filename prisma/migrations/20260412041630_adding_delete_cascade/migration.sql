-- DropForeignKey
ALTER TABLE "communications" DROP CONSTRAINT "communications_processId_fkey";

-- DropForeignKey
ALTER TABLE "recipients" DROP CONSTRAINT "recipients_communicationId_fkey";

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_processId_fkey" FOREIGN KEY ("processId") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipients" ADD CONSTRAINT "recipients_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "communications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
