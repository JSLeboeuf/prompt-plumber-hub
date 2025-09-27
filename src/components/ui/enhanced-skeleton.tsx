import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'table' | 'stats' | 'avatar' | 'text';
  lines?: number;
}

const Skeleton = ({ className, variant = 'default', lines = 1, ...props }: SkeletonProps) => {
  if (variant === 'card') {
    return (
      <div className={cn("animate-pulse", className)} {...props}>
        <div className="bg-muted rounded-lg p-6 space-y-4">
          <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
          <div className="h-8 bg-muted-foreground/20 rounded w-1/2"></div>
          <div className="h-3 bg-muted-foreground/20 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (variant === 'stats') {
    return (
      <div className={cn("animate-pulse", className)} {...props}>
        <div className="bg-muted rounded-lg p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-muted-foreground/20 rounded w-16"></div>
              <div className="h-8 bg-muted-foreground/20 rounded w-20"></div>
            </div>
            <div className="h-8 w-8 bg-muted-foreground/20 rounded"></div>
          </div>
          <div className="h-3 bg-muted-foreground/20 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn("animate-pulse space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="grid grid-cols-7 gap-4">
            <div className="h-4 bg-muted-foreground/20 rounded"></div>
            <div className="h-4 bg-muted-foreground/20 rounded"></div>
            <div className="h-4 bg-muted-foreground/20 rounded"></div>
            <div className="h-4 bg-muted-foreground/20 rounded"></div>
            <div className="h-4 bg-muted-foreground/20 rounded"></div>
            <div className="h-4 bg-muted-foreground/20 rounded"></div>
            <div className="h-8 bg-muted-foreground/20 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div className={cn("animate-pulse", className)} {...props}>
        <div className="h-10 w-10 bg-muted-foreground/20 rounded-full"></div>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={cn("animate-pulse space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "h-4 bg-muted-foreground/20 rounded",
              i === lines - 1 ? "w-3/4" : "w-full"
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted-foreground/20", className)}
      {...props}
    />
  );
};

export { Skeleton, type SkeletonProps };