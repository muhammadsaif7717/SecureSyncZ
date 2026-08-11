import TrashPageClient from "@/components/TrashPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trash | SecureSyncZ",
  description: "View and restore deleted items.",
};

export default function TrashPage() {
  return <TrashPageClient />;
}
