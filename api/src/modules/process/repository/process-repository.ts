import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import type { CommunicationType } from '../types/communication-type';
import type { ListProcessCommunicationsRequest } from '../types/list-process-communications-request-type';
import type { ListProcessesRequest } from '../types/list-processes-request-type';
import type { ProcessType } from '../types/process-type';
import type { ProcessWithLatestCommunicationType } from '../types/process-with-latest-communication-type';
import type {
  IProcessRepository,
  PaginatedResult,
} from './contracts/process-repository';
import { CommunicationMapper } from './mappers/communication-mapper';
import { ProcessMapper } from './mappers/process-mapper';

type RawProcessWithLatestCommunicationRow = {
  id: string;
  processNumber: string;
  courtAcronym: string;
  organName: string;
  communicationType: string;
  publicationDate: Date;
  content: string;
  aiSummary: string | null;
  recipient_names: string;
};

type RawCountRow = { count: bigint };

@Injectable()
export class ProcessRepository implements IProcessRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listProcessesWithLatestCommunication(
    filters: ListProcessesRequest,
    pageSize: number,
  ): Promise<PaginatedResult<ProcessWithLatestCommunicationType>> {
    const page = filters.page < 1 ? 1 : filters.page;
    const offset = (page - 1) * pageSize;

    const innerWhereClauses: Prisma.Sql[] = [];

    if (filters.courtAcronym) {
      innerWhereClauses.push(
        Prisma.sql`p."courtAcronym" = ${filters.courtAcronym}`,
      );
    }
    if (filters.processNumber) {
      innerWhereClauses.push(
        Prisma.sql`p."processNumber" = ${filters.processNumber}`,
      );
    }

    const innerWhereSql =
      innerWhereClauses.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(innerWhereClauses, ' AND ')}`
        : Prisma.empty;

    const outerWhereClauses: Prisma.Sql[] = [];

    if (filters.publicationDateFrom) {
      outerWhereClauses.push(
        Prisma.sql`latest."publicationDate" >= ${filters.publicationDateFrom}`,
      );
    }
    if (filters.publicationDateTo) {
      outerWhereClauses.push(
        Prisma.sql`latest."publicationDate" <= ${filters.publicationDateTo}`,
      );
    }

    const outerWhereSql =
      outerWhereClauses.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(outerWhereClauses, ' AND ')}`
        : Prisma.empty;

    const rows = await this.prisma.$queryRaw<RawProcessWithLatestCommunicationRow[]>`
      SELECT
        latest.id,
        latest."processNumber",
        latest."courtAcronym",
        latest."organName",
        latest."communicationType",
        latest."publicationDate",
        latest."content",
        latest."aiSummary",
        latest.recipient_names
      FROM (
        SELECT DISTINCT ON (p.id)
          p.id,
          p."processNumber",
          p."courtAcronym",
          p."organName",
          c."communicationType",
          c."publicationDate",
          c."content",
          c."aiSummary",
          string_agg(r."name", ', ') OVER (PARTITION BY c.id) AS recipient_names
        FROM public.processes p
        INNER JOIN public.communications c ON c."processId" = p.id
        INNER JOIN public.recipients r ON r."communicationId" = c.id
        ${innerWhereSql}
        ORDER BY p.id, c."publicationDate" DESC
      ) AS latest
      ${outerWhereSql}
      ORDER BY latest."publicationDate" DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;

    const totalRows = await this.prisma.$queryRaw<RawCountRow[]>`
      SELECT COUNT(*)::bigint AS count FROM (
        SELECT DISTINCT ON (p.id)
          p.id,
          c."publicationDate"
        FROM public.processes p
        INNER JOIN public.communications c ON c."processId" = p.id
        INNER JOIN public.recipients r ON r."communicationId" = c.id
        ${innerWhereSql}
        ORDER BY p.id, c."publicationDate" DESC
      ) AS latest
      ${outerWhereSql}
    `;

    const total = Number(totalRows[0]?.count ?? 0);

    const items: ProcessWithLatestCommunicationType[] = rows.map((row) => ({
      id: row.id,
      processNumber: row.processNumber,
      courtAcronym: row.courtAcronym,
      organName: row.organName,
      communicationType: row.communicationType,
      publicationDate: row.publicationDate,
      content: row.content,
      aiSummary: row.aiSummary,
      recipientNames: row.recipient_names,
    }));

    return { items, total, page, pageSize };
  }

  async findById(id: string): Promise<ProcessType | null> {
    const record = await this.prisma.process.findUnique({ where: { id } });
    return record ? ProcessMapper.toDomain(record) : null;
  }

  async findCommunicationById(id: string): Promise<CommunicationType | null> {
    const record = await this.prisma.communication.findUnique({
      where: { id },
      include: { recipients: true },
    });
    return record ? CommunicationMapper.toDomain(record) : null;
  }

  async updateCommunicationAiSummary(
    id: string,
    aiSummary: string,
  ): Promise<CommunicationType> {
    const record = await this.prisma.communication.update({
      where: { id },
      data: { aiSummary },
      include: { recipients: true },
    });
    return CommunicationMapper.toDomain(record);
  }

  async listCommunicationsByProcess(
    input: ListProcessCommunicationsRequest,
    pageSize: number,
  ): Promise<PaginatedResult<CommunicationType>> {
    const page = input.page < 1 ? 1 : input.page;
    const skip = (page - 1) * pageSize;

    const [records, total] = await Promise.all([
      this.prisma.communication.findMany({
        where: { processId: input.processId },
        orderBy: { publicationDate: 'desc' },
        include: { recipients: true },
        skip,
        take: pageSize,
      }),
      this.prisma.communication.count({
        where: { processId: input.processId },
      }),
    ]);

    return {
      items: records.map((record) => CommunicationMapper.toDomain(record)),
      total,
      page,
      pageSize,
    };
  }
}
