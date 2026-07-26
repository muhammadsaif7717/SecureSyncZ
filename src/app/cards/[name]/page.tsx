import { use, Suspense } from "react";
import CardPageClient from "@/components/CardPageClient";

export default function CardPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  return (
    <Suspense
      fallback={
        <div className="mt-10 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Loading...
        </div>
      }
    >
      <CardPageClient name={name} />
    </Suspense>
  );
}
