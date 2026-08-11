"use client";
import NotesList from "@/components/NotesList";
import React, { Suspense } from "react";

export default function NotesPage() {
  return (
    <div className="relative flex min-h-[calc(100vh-56px)] justify-center overflow-hidden bg-slate-50 px-4 py-8 sm:min-h-[calc(100vh-60px)] sm:px-6 sm:py-12 dark:bg-[#0a0e1a]">
      {/* Background glow effects */}
      <div className="animate-glow-pulse absolute top-1/4 left-1/4 h-48 w-48 rounded-full bg-emerald-500/10 blur-[80px] sm:h-72 sm:w-72 dark:bg-emerald-500/[0.06]" />
      <div className="animate-glow-pulse absolute right-1/4 bottom-1/4 h-48 w-48 rounded-full bg-teal-500/10 blur-[80px] sm:h-72 sm:w-72 dark:bg-teal-500/[0.05]" />

      <div className="relative z-10 w-full max-w-2xl">
        <Suspense
          fallback={
            <div className="mt-10 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Loading...
            </div>
          }
        >
          <NotesList />
        </Suspense>
      </div>
    </div>
  );
}
