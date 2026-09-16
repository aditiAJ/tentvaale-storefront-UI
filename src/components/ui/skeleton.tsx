import { cn } from "cn"

/**
 * A travelling sheen rather than a pulsing block. A pulse reads as "broken /
 * disabled"; a sweep reads as "arriving", which is what a loading state should
 * communicate. The sweep is a background-position animation on a static
 * gradient, so it costs one paint and no layout.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "shimmer relative overflow-hidden rounded-lg bg-muted/70",
        className
      )}
      {...props}
    />
  )
}

/** Card-shaped placeholder: image block, two text lines, a price line. */
function SkeletonCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton-card"
      className={cn(
        "flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3",
        className
      )}
      {...props}
    >
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="h-3 w-2/5" />
      <Skeleton className="h-3.5 w-4/5" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  )
}

/** Stacked text lines; `lines` controls how many. Last line is short, as real copy is. */
function SkeletonText({
  lines = 3,
  className,
  ...props
}: React.ComponentProps<"div"> & { lines?: number }) {
  return (
    <div
      data-slot="skeleton-text"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3.5", i === lines - 1 ? "w-3/5" : "w-full")}
        />
      ))}
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonText }
