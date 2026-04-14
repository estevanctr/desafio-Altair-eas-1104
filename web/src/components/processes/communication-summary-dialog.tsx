"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCommunicationSummary } from "@/hooks/use-communication-summary";
import { useTypewriter } from "@/hooks/use-typewriter";

type CommunicationSummaryDialogProps = {
  communicationId: string;
};

function CommunicationSummaryDialog({
  communicationId,
}: CommunicationSummaryDialogProps) {
  const [open, setOpen] = useState(false);

  const { data, isLoading, isError, error } = useCommunicationSummary(
    communicationId,
    open,
  );

  const shouldAnimate = open && data !== undefined && !data.cached;
  const { displayed, isTyping } = useTypewriter(
    data?.aiSummary ?? "",
    shouldAnimate,
  );

  return (
    <Dialog open={open} onOpenChange={(value) => setOpen(value)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="size-3.5" aria-hidden />
        Resumir
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resumo com IA</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto text-sm leading-relaxed text-foreground">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Gerando resumo…
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Falha ao gerar resumo"}
            </p>
          ) : (
            <p className="whitespace-pre-wrap">
              {displayed}
              {isTyping ? (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-foreground align-middle" />
              ) : null}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { CommunicationSummaryDialog };
