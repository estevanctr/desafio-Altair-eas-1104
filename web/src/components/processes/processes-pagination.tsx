"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type ProcessesPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function buildRange(page: number, totalPages: number): number[] {
  if (totalPages <= 0) return [];
  const maxVisible = 5;
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const start = Math.max(1, Math.min(page - 2, totalPages - maxVisible + 1));
  return Array.from({ length: maxVisible }, (_, index) => start + index);
}

function ProcessesPagination({
  page,
  totalPages,
  onPageChange,
}: ProcessesPaginationProps) {
  if (totalPages <= 1) return null;
  const pages = buildRange(page, totalPages);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          />
        </PaginationItem>
        {pages.map((entry) => (
          <PaginationItem key={entry}>
            <PaginationLink
              isActive={entry === page}
              onClick={() => onPageChange(entry)}
            >
              {entry}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export { ProcessesPagination };
