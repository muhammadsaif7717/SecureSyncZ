import { use, Suspense } from "react";
import PasswordPageClient from "@/components/PasswordPageClient";

export default function PasswordPage({
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
      <PasswordPageClient name={name} />
    </Suspense>
  );
}
