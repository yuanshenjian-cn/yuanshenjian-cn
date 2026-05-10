export function ArticlesSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-4 w-48 bg-muted rounded"></div>
      </div>
      <div className="flex flex-wrap gap-2 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-16 bg-muted rounded"></div>
        ))}
      </div>
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 w-24 bg-muted rounded"></div>
            <div className="h-6 w-3/4 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
