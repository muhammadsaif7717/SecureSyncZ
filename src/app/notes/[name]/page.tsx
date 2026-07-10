import React from "react";
import NotePageClient from "@/components/NotePageClient";

export default async function NotePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  return <NotePageClient name={name} />;
}
