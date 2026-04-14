import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="pagination"
      role="navigation"
      aria-label="Paginação"
      className={cn("flex items-center justify-end", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem(props: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & React.ComponentProps<typeof Button>;

function PaginationLink({
  className,
  isActive,
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      data-slot="pagination-link"
      aria-current={isActive ? "page" : undefined}
      variant={isActive ? "outline" : "ghost"}
      size="icon-sm"
      className={cn("size-8 rounded-md text-sm", className)}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="pagination-previous"
      variant="ghost"
      size="sm"
      className={cn("gap-1 px-2", className)}
      {...props}
    >
      <ChevronLeft className="size-4" />
      <span>Anterior</span>
    </Button>
  );
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="pagination-next"
      variant="ghost"
      size="sm"
      className={cn("gap-1 px-2", className)}
      {...props}
    >
      <span>Próximo</span>
      <ChevronRight className="size-4" />
    </Button>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
};
