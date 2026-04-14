"use client";

import * as React from "react";
import { CalendarDays, FileText, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { htmlToRichText } from "@/lib/html-to-text";
import type { ProcessCommunicationItem } from "@/types/process";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function highlightFinalJudgment(text: string): React.ReactNode[] {
  const regex = /transitou em julgado/gi;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(
      <strong key={`fj-${key++}`} className="font-semibold">
        {match[0]}
      </strong>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
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

function CommunicationCard({ item }: { item: ProcessCommunicationItem }) {
  const content = htmlToRichText(item.content);
  const recipients = item.recipients.map((r) => r.name).join(", ");

  return (
    <Card data-slot="communication-card">
      <CardContent className="relative flex flex-col gap-4 py-1">
        <div className="absolute top-0 right-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <Sparkles className="size-3.5" aria-hidden />
            Resumir
          </Button>
        </div>

        <div className="pr-24">
          <Field icon={CalendarDays} label="Data">
            {formatDate(item.publicationDate)}
          </Field>
        </div>

        <Field icon={Users} label="Destinatários">
          {recipients || "—"}
        </Field>

        <Field icon={FileText} label="Conteúdo da movimentação">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {highlightFinalJudgment(content)}
          </p>
        </Field>
      </CardContent>
    </Card>
  );
}

export { CommunicationCard };
