import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-950 border border-brand-700/60 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <div className="w-4 h-4 rounded-full bg-brand-500 animate-ping" />
        </div>
        <Skeleton className="h-6 w-3/4 mx-auto rounded-lg" />
        <Skeleton className="h-4 w-1/2 mx-auto rounded-lg" />
        <div className="pt-4 space-y-2">
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
