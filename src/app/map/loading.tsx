import { Skeleton } from "@/components/ui/skeleton";

export default function MapLoading() {
  return (
    <div className="h-[100vh] pt-20 flex relative animate-in fade-in duration-300">
      {/* Sidebar Overlay */}
      <div className="absolute top-24 left-6 z-10 w-80 space-y-4">
        <div className="glass p-4 rounded-2xl border border-white/5 space-y-4 shadow-2xl">
          {/* Search */}
          <Skeleton className="h-11 w-full rounded-xl" />

          {/* Filter Badges */}
          <div className="flex flex-wrap gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-7 w-16 rounded-full" />
            ))}
          </div>

          {/* Locate Button */}
          <Skeleton className="h-9 w-full rounded-xl" />

          {/* Info text */}
          <div className="flex justify-between px-1">
            <Skeleton className="h-2.5 w-36 rounded-md" />
            <Skeleton className="h-2.5 w-16 rounded-md" />
          </div>
        </div>
      </div>

      {/* Main Map Area Skeleton */}
      <div className="flex-1 relative bg-background overflow-hidden">
        <div className="absolute inset-0 bg-[#0c1410]" />
        <div className="absolute inset-0 bg-grid-white" />

        {/* Fake map markers */}
        {[
          { x: 30, y: 40 },
          { x: 55, y: 25 },
          { x: 70, y: 60 },
          { x: 20, y: 75 },
          { x: 45, y: 45 },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
        ))}

        {/* Floating Controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="flex flex-col gap-0 rounded-xl overflow-hidden border border-white/10">
            <Skeleton className="w-10 h-10 rounded-none" />
            <Skeleton className="w-10 h-10 rounded-none" />
          </div>
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>

        {/* Coordinates readout */}
        <div className="absolute bottom-6 left-6 z-10">
          <Skeleton className="h-6 w-72 rounded-full" />
        </div>
      </div>
    </div>
  );
}
