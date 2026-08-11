import { Skeleton } from "@/components/ui/skeleton";

export default function InterneesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-4 rounded-xl bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-10 w-40" />
        </div>
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    </div>
  );
}
