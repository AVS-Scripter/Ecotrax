import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-72 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <Skeleton className="h-7 w-44 rounded-full" />
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-7 w-20 rounded-lg" />
              <Skeleton className="h-3 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 glass border-white/5 rounded-3xl overflow-hidden p-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-3 w-72 rounded-md" />
          </div>
          <Skeleton className="h-[300px] w-full rounded-2xl" />
        </div>

        {/* Pie Chart */}
        <div className="glass border-white/5 rounded-3xl overflow-hidden p-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28 rounded-lg" />
            <Skeleton className="h-3 w-60 rounded-md" />
          </div>
          <div className="flex items-center justify-center h-[200px]">
            <Skeleton className="w-40 h-40 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="w-2 h-2 rounded-full" />
                <Skeleton className="h-3 w-12 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="glass border-white/5 rounded-3xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36 rounded-lg" />
            <Skeleton className="h-3 w-80 rounded-md" />
          </div>
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-44 rounded-md" />
                </div>
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-4 w-20 rounded-full ml-auto" />
                <Skeleton className="h-3 w-16 rounded-md ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
