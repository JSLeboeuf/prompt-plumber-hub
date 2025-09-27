import { Skeleton } from "./enhanced-skeleton";
import { Card, CardContent, CardHeader } from "./card";

export const DashboardLoadingSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Header Skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>

    {/* Stats Cards Skeleton */}
    <div className="grid gap-6 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} variant="stats" />
      ))}
    </div>

    {/* Content Areas */}
    <div className="grid gap-6 md:grid-cols-2">
      <Skeleton variant="card" />
      <Skeleton variant="card" />
    </div>
  </div>
);

export const TableLoadingSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-4">
    <Skeleton variant="table" lines={rows} />
  </div>
);

export const CallsLoadingSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Header */}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>

    {/* Stats Grid */}
    <div className="grid gap-6 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-12" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
            <Skeleton className="h-3 w-24 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Filters */}
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Table */}
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <TableLoadingSkeleton />
      </CardContent>
    </Card>
  </div>
);

export const CRMLoadingSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Header */}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>

    {/* Stats Overview */}
    <div className="grid gap-6 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} variant="stats" />
      ))}
    </div>

    {/* Filters */}
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-16" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Clients Table */}
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <TableLoadingSkeleton rows={8} />
      </CardContent>
    </Card>
  </div>
);