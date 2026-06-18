import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center sm:min-h-[calc(100vh-60px)]">
      <div className="flex flex-col items-center gap-4 text-emerald-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="animate-pulse text-sm font-medium text-slate-500 dark:text-slate-400">
          Loading Vault...
        </p>
      </div>
    </div>
  );
}
