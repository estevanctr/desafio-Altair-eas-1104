import { ProcessDetails } from "@/components/processes/process-details";

export default async function ProcessDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProcessDetails processId={id} />;
}
