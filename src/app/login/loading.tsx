import { Skeleton } from "@/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-6 relative overflow-hidden animate-in fade-in duration-300">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(0,255,159,0.03)_0%,transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-md relative">
        <div className="glass p-10 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-8">
          {/* Icon + Title */}
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-3xl" />
            <Skeleton className="h-8 w-48 rounded-xl" />
            <Skeleton className="h-4 w-64 rounded-lg" />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-12 rounded-md ml-1" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <Skeleton className="h-3 w-16 rounded-md" />
                <Skeleton className="h-3 w-12 rounded-md" />
              </div>
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-[1px] bg-white/5" />
            <Skeleton className="h-3 w-28 rounded-md" />
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>

          {/* Social Login */}
          <Skeleton className="h-12 w-full rounded-2xl" />

          {/* Sign up link */}
          <div className="flex justify-center">
            <Skeleton className="h-4 w-52 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
