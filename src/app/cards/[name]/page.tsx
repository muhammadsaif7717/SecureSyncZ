import { use, Suspense } from "react";
import CardPageClient from "@/components/CardPageClient";

export default function CardPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  return (
    <div className="relative min-h-[calc(100vh-56px)] overflow-hidden bg-slate-50 sm:min-h-[calc(100vh-60px)] dark:bg-[#0a0e1a]">
      {/* Background glow effects */}
      <div className="animate-glow-pulse absolute top-1/4 left-1/4 h-48 w-48 rounded-full bg-emerald-500/10 blur-[80px] sm:h-72 sm:w-72 dark:bg-emerald-500/[0.06]" />
      <div className="animate-glow-pulse absolute right-1/4 bottom-1/4 h-48 w-48 rounded-full bg-teal-500/10 blur-[80px] sm:h-72 sm:w-72 dark:bg-teal-500/[0.05]" />

      <div className="relative z-10">
        <Suspense
          fallback={
            <div className="mt-10 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Loading...
            </div>
          }
        >
          <CardPageClient name={name} />
        </Suspense>
      </div>
    </div>
  );
}
