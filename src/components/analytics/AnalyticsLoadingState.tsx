import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalyticsLoadingStateProps {
  variant?: 'kpi' | 'table' | 'chart' | 'full';
}

export const AnalyticsLoadingState = ({ variant = 'full' }: AnalyticsLoadingStateProps) => {
  if (variant === 'kpi') {
    return (
      <div className="grid gap-6 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Table header skeleton */}
            <div className="flex space-x-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
              ))}
            </div>
            {/* Table rows skeleton */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex space-x-4">
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton key={j} className="h-6 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'chart') {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-16" />
              ))}
            </div>
            <div className="flex justify-between">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-16" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full loading state
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Period selector skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-12" />
            ))}
            <Skeleton className="h-5 w-40 ml-auto" />
          </div>
        </CardContent>
      </Card>

      {/* KPI cards skeleton */}
      <AnalyticsLoadingState variant="kpi" />

      {/* Table skeleton */}
      <AnalyticsLoadingState variant="table" />
    </div>
  );
};