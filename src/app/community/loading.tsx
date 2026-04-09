import { Skeleton } from "@/components/ui/skeleton";

export default function CommunityLoading() {
  return (
    <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-36 rounded-md" />
          <Skeleton className="h-12 w-96 rounded-xl" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>
        <div className="glass p-6 rounded-2xl border border-white/5 min-w-[240px] flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16 rounded-md" />
            <Skeleton className="h-7 w-12 rounded-lg" />
          </div>
          <div className="h-10 w-[1px] bg-white/10" />
          <div className="space-y-2 text-right">
            <Skeleton className="h-3 w-20 rounded-md ml-auto" />
            <Skeleton className="h-7 w-16 rounded-lg ml-auto" />
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Challenges Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section title */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-44 rounded-xl" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>

          {/* Challenge Cards */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass p-6 rounded-3xl border border-white/5">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
                <div className="flex-1 w-full space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-16 rounded-md" />
                      <Skeleton className="h-6 w-40 rounded-lg" />
                    </div>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-3 w-16 rounded-md" />
                      <Skeleton className="h-3 w-20 rounded-md" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-16 rounded-md" />
                      <Skeleton className="h-3 w-8 rounded-md" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                  <div className="flex justify-end">
                    <Skeleton className="h-9 w-36 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Leaderboard Sidebar */}
        <div className="space-y-6">
          <Skeleton className="h-7 w-44 rounded-xl" />
          <div className="glass rounded-3xl border border-white/5 overflow-hidden">
            {/* Leaderboard header */}
            <div className="bg-white/5 p-4 border-b border-white/5 flex items-center justify-between">
              <Skeleton className="h-3 w-16 rounded-md" />
              <Skeleton className="w-4 h-4 rounded" />
            </div>

            {/* Leaderboard entries */}
            <div className="divide-y divide-white/5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-6 h-6 rounded-lg" />
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="h-2.5 w-16 rounded-md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white/5 flex justify-center">
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
          </div>

          {/* Donate Card */}
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
            <Skeleton className="h-5 w-44 rounded-lg" />
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="h-3 w-3/4 rounded-md" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
