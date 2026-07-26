import React, { Suspense } from "react";
import NotePageClient from "@/components/NotePageClient";

export default async function NotePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  return (
    <Suspense
      fallback={
        <div className="mt-10 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Loading...
        </div>
      }
    >
      <NotePageClient name={name} />
    </Suspense>
  );
}
