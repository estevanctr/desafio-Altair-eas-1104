"use client";

import { useQuery } from "@tanstack/react-query";
import type { ProcessCommunicationsResponse } from "@/types/process";

const PROCESS_NOT_FOUND = "PROCESS_NOT_FOUND";

async function fetchProcessCommunications(
  processId: string,
  page: number,
): Promise<ProcessCommunicationsResponse> {
  const response = await fetch(
    `/api/processes/${processId}/communications?page=${page}`,
  );
  if (response.status === 404) {
    throw new Error(PROCESS_NOT_FOUND);
  }
  if (!response.ok) {
    throw new Error("Falha ao carregar comunicações");
  }
  return response.json();
}

export function useProcessCommunications(processId: string, page: number) {
  return useQuery({
    queryKey: ["process-communications", processId, page],
    queryFn: () => fetchProcessCommunications(processId, page),
    placeholderData: (prev) => prev,
    retry: (failureCount, err) => {
      if (err instanceof Error && err.message === PROCESS_NOT_FOUND) return false;
      return failureCount < 2;
    },
  });
}

export { PROCESS_NOT_FOUND };
