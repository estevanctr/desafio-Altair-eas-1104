"use client";

import Link from "next/link";
import {
  CalendarDays,
  FileText,
  Gavel,
  Info,
  Scale,
  Users,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { htmlToPlainText } from "@/lib/html-to-text";
import type { Process } from "@/types/process";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        <span>{label}</span>
      </div>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

function ProcessCard({ process }: { process: Process }) {
  const {
    id,
    processNumber,
    courtAcronym,
    organName,
    latestCommunication: {
      communicationType,
      publicationDate,
      content,
      recipients,
    },
  } = process;

  const contentPreview = htmlToPlainText(content);

  return (
    <Link
      href={`/process/${id}`}
      aria-label={`Abrir detalhes do processo ${processNumber}`}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <Card
        data-slot="process-card"
        className="transition-colors hover:ring-primary/40"
      >
        <CardContent className="relative flex flex-col gap-4 py-1">
          <div className="grid gap-4 md:grid-cols-2">
            <Field icon={Scale} label="Processo">
              {processNumber} - {organName}
            </Field>
            <Field icon={CalendarDays} label="Data">
              {formatDate(publicationDate)}
            </Field>
            <Field icon={Gavel} label="Tribunal">
              {courtAcronym}
            </Field>
            <Field icon={Info} label="Tipo da comunicação">
              {communicationType}
            </Field>
          </div>

          <Field icon={Users} label="Destinatários">
            {recipients.length > 0 ? recipients.join(", ") : "—"}
          </Field>

          <Field icon={FileText} label="Conteúdo">
            <p className="line-clamp-3 text-sm leading-relaxed text-foreground">
              {contentPreview}
            </p>
          </Field>
        </CardContent>
      </Card>
    </Link>
  );
}

export { ProcessCard };
