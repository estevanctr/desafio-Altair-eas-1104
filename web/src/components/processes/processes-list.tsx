"use client";

import * as React from "react";

import { useProcesses } from "@/hooks/use-processes";
import { Card, CardContent } from "@/components/ui/card";
import {
  ProcessesFilters,
  type ProcessesFiltersValue,
} from "@/components/processes/processes-filters";
import { ProcessCard } from "@/components/processes/process-card";
import { ProcessesPagination } from "@/components/processes/processes-pagination";

const INITIAL_FILTERS: ProcessesFiltersValue = {
  processNumber: "",
  courtAcronym: "",
  publicationDateFrom: "",
  publicationDateTo: "",
};

function toIsoDateOrUndefined(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function ProcessesList() {
  const [filters, setFilters] =
    React.useState<ProcessesFiltersValue>(INITIAL_FILTERS);
  const [page, setPage] = React.useState(1);

  const debouncedProcessNumber = useDebounced(filters.processNumber, 400);

  React.useEffect(() => {
    setPage(1);
  }, [
    debouncedProcessNumber,
    filters.courtAcronym,
    filters.publicationDateFrom,
    filters.publicationDateTo,
  ]);

  const dateFrom = toIsoDateOrUndefined(filters.publicationDateFrom);
  const dateTo = toIsoDateOrUndefined(filters.publicationDateTo);
  const bothDates = dateFrom && dateTo;

  const queryFilters = React.useMemo(
    () => ({
      page,
      processNumber: debouncedProcessNumber.trim() || undefined,
      courtAcronym: filters.courtAcronym.trim().toUpperCase() || undefined,
      publicationDateFrom: bothDates ? dateFrom : undefined,
      publicationDateTo: bothDates ? dateTo : undefined,
    }),
    [page, debouncedProcessNumber, filters.courtAcronym, bothDates, dateFrom, dateTo],
  );

  const { data, isLoading, isError, error } = useProcesses(queryFilters);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-1 py-1">
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Comunicações
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe as comunicações processuais obtidas do Diário de Justiça
            Eletrônico Nacional, organizadas e salvas automaticamente para sua
            consulta.
          </p>
        </CardContent>
      </Card>

      <ProcessesFilters value={filters} onChange={setFilters} />

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Carregando comunicações...
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
      ) : !data || data.items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma comunicação encontrada.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {data.items.map((process) => (
            <ProcessCard key={process.id} process={process} />
          ))}
        </div>
      )}

      {data ? (
        <ProcessesPagination
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}

export { ProcessesList };
