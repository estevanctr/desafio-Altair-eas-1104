import * as fs from 'fs';
import * as path from 'path';
import { CommunicationSource, PrismaClient } from '../../generated/prisma/client';

function normalizeSource(value: string | null | undefined): CommunicationSource | null {
  if (value == null) return null;
  const v = value.trim().toUpperCase();
  if (v === 'D' || v === 'DIARIO') return CommunicationSource.DIARIO;
  if (v === 'E' || v === 'EDITAL') return CommunicationSource.EDITAL;
  return null;
}

const prisma = new PrismaClient();

const BATCH_SIZE = 50;

type RecipientJson = {
  name: string;
  role?: string | null;
  oabNumber?: string | null;
  oabState?: string | null;
  isLawyer?: boolean;
};

type CommunicationJson = {
  externalId: number;
  publicationDate: string;
  communicationType: string;
  content: string;
  source?: string | null;
  recipients: RecipientJson[];
};

type ProcessJson = {
  processNumber: string;
  courtAcronym: string;
  organName: string;
  hasFinalJudgment: boolean;
  communications: CommunicationJson[];
};

type SeedFile = { processes: ProcessJson[] };

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function seedBatch(batch: ProcessJson[], batchIdx: number, totalBatches: number) {
  const processData = batch.map((p) => ({
    processNumber: p.processNumber,
    courtAcronym: p.courtAcronym,
    organName: p.organName,
    hasFinalJudgment: p.hasFinalJudgment,
  }));

  await prisma.process.createMany({ data: processData, skipDuplicates: true });

  const processNumbers = batch.map((p) => p.processNumber);
  const persistedProcesses = await prisma.process.findMany({
    where: { processNumber: { in: processNumbers } },
    select: { id: true, processNumber: true },
  });
  const processIdByNumber = new Map(persistedProcesses.map((p) => [p.processNumber, p.id]));

  const allCommunications = batch.flatMap((p) => {
    const processId = processIdByNumber.get(p.processNumber);
    if (!processId) return [];
    return p.communications.map((c) => ({
      json: c,
      row: {
        externalId: c.externalId,
        publicationDate: new Date(c.publicationDate),
        communicationType: c.communicationType,
        content: c.content,
        source: normalizeSource(c.source),
        processId,
      },
    }));
  });

  if (allCommunications.length === 0) {
    console.log(`[${batchIdx}/${totalBatches}] nothing to insert`);
    return { processes: batch.length, communications: 0, recipients: 0 };
  }

  await prisma.communication.createMany({
    data: allCommunications.map((c) => c.row),
    skipDuplicates: true,
  });

  const externalIds = allCommunications.map((c) => c.row.externalId);
  const persistedComms = await prisma.communication.findMany({
    where: { externalId: { in: externalIds } },
    select: {
      id: true,
      externalId: true,
      recipients: { select: { id: true } },
    },
  });
  const commIdByExternal = new Map(persistedComms.map((c) => [c.externalId, c.id]));
  const commHasRecipients = new Set(persistedComms.filter((c) => c.recipients.length > 0).map((c) => c.externalId));

  const recipientRows = allCommunications.flatMap((c) => {
    if (commHasRecipients.has(c.row.externalId)) return [];
    const communicationId = commIdByExternal.get(c.row.externalId);
    if (!communicationId) return [];
    return c.json.recipients.map((r) => ({
      name: r.name,
      role: r.role ?? null,
      oabNumber: r.oabNumber ?? null,
      oabState: r.oabState ?? null,
      isLawyer: r.isLawyer ?? false,
      communicationId,
    }));
  });

  if (recipientRows.length > 0) {
    await prisma.recipient.createMany({ data: recipientRows });
  }

  console.log(
    `[${batchIdx}/${totalBatches}] processes=${batch.length} communications=${allCommunications.length} recipients=${recipientRows.length}`,
  );

  return {
    processes: batch.length,
    communications: allCommunications.length,
    recipients: recipientRows.length,
  };
}

async function main() {
  const filePath = path.join(__dirname, 'seed_data.json');
  console.log(`Reading ${filePath}...`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data: SeedFile = JSON.parse(raw) as unknown as SeedFile;

  const batches = chunk(data.processes, BATCH_SIZE);
  console.log(`Loaded ${data.processes.length} processes → ${batches.length} batches of ${BATCH_SIZE}`);

  const totals = { processes: 0, communications: 0, recipients: 0 };

  for (let i = 0; i < batches.length; i++) {
    const result = await seedBatch(batches[i], i + 1, batches.length);
    totals.processes += result.processes;
    totals.communications += result.communications;
    totals.recipients += result.recipients;
  }

  console.log('Seed finished:', totals);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
