"use client";

import * as React from "react";
import { CalendarDays, Search } from "lucide-react";

import { cn } from "@/lib/cn";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRef, useState } from "react";

const COURTS = ["TRT10", "TJTO", "TJRS"] as const;

export type ProcessesFiltersValue = {
  processNumber: string;
  courtAcronym: string;
  publicationDateFrom: string;
  publicationDateTo: string;
};

type ProcessesFiltersProps = {
  value: ProcessesFiltersValue;
  onChange: (next: ProcessesFiltersValue) => void;
};

function ProcessesFilters({ value, onChange }: ProcessesFiltersProps) {
  return (
    <Card>
      <CardContent>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              placeholder="Buscar por número do processo"
              className="h-10 pl-8"
              value={value.processNumber}
              onChange={(event) =>
                onChange({ ...value, processNumber: event.target.value })
              }
            />
          </div>

          <Select
            value={value.courtAcronym}
            onValueChange={(next) =>
              onChange({ ...value, courtAcronym: next ?? "" })
            }
          >
            <SelectTrigger className="h-10 md:w-[200px]">
              <SelectValue placeholder="Selecione um tribunal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os tribunais</SelectItem>
              {COURTS.map((court) => (
                <SelectItem key={court} value={court}>
                  {court}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DateRangeField
            from={value.publicationDateFrom}
            to={value.publicationDateTo}
            onFromChange={(next) =>
              onChange({ ...value, publicationDateFrom: next })
            }
            onToChange={(next) =>
              onChange({ ...value, publicationDateTo: next })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

type DateRangeFieldProps = {
  from: string;
  to: string;
  onFromChange: (next: string) => void;
  onToChange: (next: string) => void;
};

function DateRangeField({
  from,
  to,
  onFromChange,
  onToChange,
}: DateRangeFieldProps) {
  const hasAny = Boolean(from || to);
  const [expanded, setExpanded] = useState(hasAny);
  const containerRef = useRef<HTMLDivElement>(null);
  const fromRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (hasAny && !expanded) setExpanded(true);
  }, [hasAny, expanded]);

  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
    if (containerRef.current?.contains(event.relatedTarget as Node | null)) {
      return;
    }
    if (!from && !to) setExpanded(false);
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => {
          setExpanded(true);
          window.setTimeout(() => fromRef.current?.focus(), 0);
        }}
        className={cn(
          "flex h-10 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm text-muted-foreground transition-colors outline-none hover:bg-accent/40 dark:bg-input/30",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        )}
      >
        <CalendarDays className="size-4 shrink-0" aria-hidden />
        <span>Data inicial - Data final</span>
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      onBlur={handleBlur}
      className={cn(
        "flex h-10 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm text-muted-foreground dark:bg-input/30",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
      )}
    >
      <CalendarDays className="size-4 shrink-0" aria-hidden />
      <input
        ref={fromRef}
        type="date"
        aria-label="Data inicial"
        className="w-[120px] bg-transparent text-foreground outline-none"
        value={from}
        onChange={(event) => onFromChange(event.target.value)}
      />
      <span aria-hidden>—</span>
      <input
        type="date"
        aria-label="Data final"
        className="w-[120px] bg-transparent text-foreground outline-none"
        value={to}
        onChange={(event) => onToChange(event.target.value)}
      />
    </div>
  );
}

export { ProcessesFilters };
