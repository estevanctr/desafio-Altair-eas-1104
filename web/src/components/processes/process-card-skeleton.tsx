import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ProcessCardSkeleton() {
  return (
    <Card data-slot="process-card-skeleton">
      <CardContent className="flex flex-col gap-4 py-1">
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </CardContent>
    </Card>
  );
}

function ProcessesListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProcessCardSkeleton key={index} />
      ))}
    </div>
  );
}

export { ProcessCardSkeleton, ProcessesListSkeleton };
