"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Clock, Gavel, Scale, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CommunicationCard } from "@/components/processes/communication-card";
import { ProcessesPagination } from "@/components/processes/processes-pagination";
import {
  PROCESS_NOT_FOUND,
  useProcessCommunications,
} from "@/hooks/use-process-communications";
import { useState } from "react";

function uniqueRecipients(
  items: ReadonlyArray<{ recipients: ReadonlyArray<{ name: string }> }>,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    for (const recipient of item.recipients) {
      if (!seen.has(recipient.name)) {
        seen.add(recipient.name);
        out.push(recipient.name);
      }
    }
  }
  return out;
}

function Breadcrumb() {
  return (
    <nav
      aria-label="breadcrumb"
      className="flex items-center gap-2 text-sm text-muted-foreground"
    >
      <Link
        href="/processes-list"
        className="hover:text-foreground focus-visible:outline-none focus-visible:underline"
      >
        Diário Oficial
      </Link>
      <ChevronRight className="size-4" aria-hidden />
      <span className="font-semibold text-foreground">
        Detalhes do processo
      </span>
    </nav>
  );
}

function HeaderCard({
  processNumber,
  subtitle,
  courtAcronym,
  recipients,
  updatesCount,
  hasFinalJudgment,
}: {
  processNumber: string;
  subtitle: string;
  courtAcronym: string;
  recipients: string;
  updatesCount: number;
  hasFinalJudgment: boolean;
}) {
  return (
    <Card data-slot="process-details-header">
      <CardContent className="relative flex flex-col gap-3 py-1">
        {hasFinalJudgment ? (
          <div className="absolute top-0 right-4">
            <Badge variant="destructive" className="h-6 gap-1.5 px-2.5">
              <Clock className="size-3" aria-hidden />
              Transitou em julgado
            </Badge>
          </div>
        ) : null}

        <h1 className="pr-48 font-heading text-lg font-semibold text-foreground">
          {processNumber}
          {subtitle ? ` - ${subtitle}` : null}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Gavel className="size-3.5" aria-hidden />
            {courtAcronym}
          </span>
          <span aria-hidden className="text-border">
            |
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" aria-hidden />
            {recipients || "—"}
          </span>
          <span aria-hidden className="text-border">
            |
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden />
            {updatesCount} {updatesCount === 1 ? "atualização" : "atualizações"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function ProcessDetails({ processId }: { processId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useProcessCommunications(
    processId,
    page,
  );

  const isNotFound =
    error instanceof Error && error.message === PROCESS_NOT_FOUND;

  const recipients = data ? uniqueRecipients(data.items).join(", ") : "";

  const subtitle = data?.items[0]?.communicationType ?? "";

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb />

      {isLoading && !data ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Carregando comunicações...
          </CardContent>
        </Card>
      ) : isNotFound ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Scale className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium text-foreground">
              Processo não encontrado
            </p>
            <Link
              href="/processes-list"
              className="text-sm text-primary hover:underline"
            >
              Voltar para a listagem
            </Link>
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : "Falha ao carregar comunicações"}
          </CardContent>
        </Card>
      ) : data ? (
        <>
          <HeaderCard
            processNumber={data.process.processNumber}
            subtitle={subtitle}
            courtAcronym={data.process.courtAcronym}
            recipients={recipients}
            updatesCount={data.total}
            hasFinalJudgment={data.process.hasFinalJudgment}
          />

          {data.items.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma comunicação encontrada.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {data.items.map((item) => (
                <CommunicationCard key={item.id} item={item} />
              ))}
            </div>
          )}

          <ProcessesPagination
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </>
      ) : null}
    </div>
  );
}

export { ProcessDetails };
