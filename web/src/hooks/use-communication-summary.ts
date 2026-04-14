"use client";

import { useQuery } from "@tanstack/react-query";

type CommunicationSummaryResponse = {
  id: string;
  aiSummary: string;
  cached: boolean;
};

async function fetchCommunicationSummary(
  communicationId: string,
): Promise<CommunicationSummaryResponse> {
  const response = await fetch(
    `/api/processes/communications/${communicationId}/summary`,
  );
  if (!response.ok) {
    throw new Error("Falha ao gerar resumo");
  }
  return response.json();
}

export function useCommunicationSummary(
  communicationId: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["communication-summary", communicationId],
    queryFn: () => fetchCommunicationSummary(communicationId),
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
}

export type { CommunicationSummaryResponse };
