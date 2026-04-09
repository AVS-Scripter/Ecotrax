import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="relative overflow-hidden animate-in fade-in duration-300">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full animate-pulse delay-1000" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div className="space-y-8">
            <Skeleton className="h-7 w-52 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-14 w-[80%] rounded-xl" />
              <Skeleton className="h-14 w-[50%] rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-full max-w-lg rounded-lg" />
              <Skeleton className="h-5 w-3/4 max-w-lg rounded-lg" />
            </div>
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-11 w-40 rounded-full" />
              <Skeleton className="h-11 w-40 rounded-full" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-8 w-16 rounded-lg" />
                  <Skeleton className="h-3 w-14 rounded-md" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column — Hero Image */}
          <div className="relative">
            <div className="glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl aspect-video lg:aspect-square">
              <Skeleton className="w-full h-full rounded-none" />

              {/* Monitoring Card Skeleton */}
              <div className="absolute bottom-6 left-6 right-6 glass p-6 rounded-2xl border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="h-3 w-20 rounded-md" />
                    </div>
                  </div>
                  <div className="text-right space-y-1.5">
                    <Skeleton className="h-5 w-12 rounded-md ml-auto" />
                    <Skeleton className="h-2.5 w-20 rounded-md ml-auto" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-14 rounded-md" />
                        <Skeleton className="h-2.5 w-16 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <Skeleton className="h-10 w-80 rounded-xl mx-auto" />
          <Skeleton className="h-4 w-96 rounded-lg mx-auto" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass p-8 rounded-3xl border border-white/5 space-y-6">
              <Skeleton className="w-12 h-12 rounded-2xl" />
              <Skeleton className="h-6 w-36 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full rounded-md" />
                <Skeleton className="h-3 w-5/6 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
