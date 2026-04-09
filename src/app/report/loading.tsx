import { Skeleton } from "@/components/ui/skeleton";

export default function ReportLoading() {
  return (
    <div className="pt-24 pb-24 px-4 md:px-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-44 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col space-y-4">
            {/* Title + Status */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40 rounded-lg" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>

            {/* Tag */}
            <Skeleton className="h-3 w-16 rounded-md" />

            {/* Description */}
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-full rounded-md" />
              <Skeleton className="h-3 w-5/6 rounded-md" />
              <Skeleton className="h-3 w-3/4 rounded-md" />
            </div>

            {/* Location */}
            <div className="flex items-center gap-2">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-3 w-36 rounded-md" />
            </div>

            {/* Image placeholder */}
            <Skeleton className="h-40 w-full rounded-xl" />

            {/* Footer */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <Skeleton className="h-3 w-24 rounded-md" />
              <Skeleton className="h-3 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
