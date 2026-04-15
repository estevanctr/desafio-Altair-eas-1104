import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function HeaderCardSkeleton() {
  return (
    <Card data-slot="process-details-header-skeleton">
      <CardContent className="flex flex-col gap-3 py-1">
        <Skeleton className="h-5 w-2/3" />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

function CommunicationCardSkeleton() {
  return (
    <Card data-slot="communication-card-skeleton">
      <CardContent className="flex flex-col gap-4 py-1">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-28" />
        </div>

        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
    </Card>
  );
}

function ProcessDetailsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4">
      <HeaderCardSkeleton />
      {Array.from({ length: count }).map((_, index) => (
        <CommunicationCardSkeleton key={index} />
      ))}
    </div>
  );
}

export { ProcessDetailsSkeleton, CommunicationCardSkeleton };
