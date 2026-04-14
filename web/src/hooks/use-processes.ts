"use client";

import { useQuery } from "@tanstack/react-query";
import type { ProcessesFilters, ProcessesListResponse } from "@/types/process";

async function fetchProcesses(
  filters: ProcessesFilters,
): Promise<ProcessesListResponse> {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  if (filters.processNumber) params.set("processNumber", filters.processNumber);
  if (filters.courtAcronym) params.set("courtAcronym", filters.courtAcronym);
  if (filters.publicationDateFrom)
    params.set("publicationDateFrom", filters.publicationDateFrom);
  if (filters.publicationDateTo)
    params.set("publicationDateTo", filters.publicationDateTo);

  const response = await fetch(`/api/processes?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Falha ao carregar comunicações");
  }
  return response.json();
}

export function useProcesses(filters: ProcessesFilters) {
  return useQuery({
    queryKey: ["processes", filters],
    queryFn: () => fetchProcesses(filters),
    placeholderData: (prev) => prev,
  });
}
