"use client";

import * as React from "react";
import { CalendarDays, Search, X } from "lucide-react";
import { ptBR } from "date-fns/locale/pt-BR";
import { format } from "date-fns/format";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/cn";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

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
            onRangeChange={(from, to) =>
              onChange({
                ...value,
                publicationDateFrom: from,
                publicationDateTo: to,
              })
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
  onRangeChange: (from: string, to: string) => void;
};

function parseIsoDate(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function DateRangeField({ from, to, onRangeChange }: DateRangeFieldProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<DateRange | undefined>(undefined);
  const hasValue = Boolean(from && to);

  const label = hasValue
    ? `${format(parseIsoDate(from)!, "dd/MM/yyyy")} - ${format(parseIsoDate(to)!, "dd/MM/yyyy")}`
    : "Data inicial - Data final";

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setPending({ from: parseIsoDate(from), to: parseIsoDate(to) });
    }
    setOpen(nextOpen);
  }

  function handleSelect(range: DateRange | undefined) {
    setPending(range);
    if (range?.from && range.to) {
      onRangeChange(toIsoDate(range.from), toIsoDate(range.to));
      setOpen(false);
    }
  }

  function handleClear(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    onRangeChange("", "");
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        className={cn(
          "flex h-10 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none hover:bg-accent/40 dark:bg-input/30",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          hasValue ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <CalendarDays className="size-4 shrink-0" aria-hidden />
        <span>{label}</span>
        {hasValue ? (
          <X
            role="button"
            aria-label="Limpar datas"
            className="ml-1 size-3.5 text-muted-foreground hover:text-foreground"
            onClick={handleClear}
          />
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <Calendar
          mode="range"
          min={1}
          numberOfMonths={2}
          locale={ptBR}
          defaultMonth={parseIsoDate(from) ?? new Date()}
          selected={pending}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}

export { ProcessesFilters };
