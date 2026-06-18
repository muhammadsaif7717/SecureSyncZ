"use client";
import CardsList from "@/components/CardsList";
import React from "react";

export default function CardsPage() {
  return (
    <div className="flex min-h-[calc(100vh-56px)] justify-center bg-slate-50 px-4 py-8 sm:min-h-[calc(100vh-60px)] sm:px-6 sm:py-12 dark:bg-[#0a0e1a]">
      <div className="w-full max-w-2xl">
        <CardsList />
      </div>
    </div>
  );
}
