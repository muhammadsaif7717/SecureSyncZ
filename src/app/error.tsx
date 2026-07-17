"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    // console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-slate-50 px-4 sm:min-h-[calc(100vh-60px)] dark:bg-[#0a0e1a]">
      <div className="glass flex w-full max-w-md flex-col items-center rounded-2xl p-8 text-center shadow-xl dark:shadow-black/20">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
          Something went wrong!
        </h2>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          An unexpected error occurred while rendering this page.
        </p>
        <Button
          onClick={() => reset()}
          className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white transition-all hover:shadow-lg dark:from-emerald-500 dark:to-teal-500"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
