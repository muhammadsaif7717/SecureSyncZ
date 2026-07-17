import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, ShieldAlert, Download, X } from "lucide-react";
import { showToast } from "@/lib/toast";

interface EmergencyKitModalProps {
  isOpen: boolean;
  secretKey: string;
  onConfirm: () => void;
}

export function EmergencyKitModal({
  isOpen,
  secretKey,
  onConfirm,
}: EmergencyKitModalProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(secretKey);
    showToast({
      title: "Copied to Clipboard",
      description: "Secret Key copied. Store it securely!",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md scale-95 rounded-2xl bg-white transition-transform sm:w-full sm:scale-100 dark:bg-slate-900 [&>button]:hidden">
        <div className="absolute top-4 right-4">
          <button
            onClick={onConfirm}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-slate-900 dark:text-white">
            Your Secret Key
          </DialogTitle>
          <DialogDescription className="text-center text-slate-500 dark:text-slate-400">
            This is your <strong>Emergency Kit</strong>. We do NOT store this
            key on our servers. If you lose this key, you will{" "}
            <strong>permanently lose access</strong> to all your passwords.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-4 dark:bg-emerald-500/10">
          <p className="text-center font-mono text-sm font-semibold break-all text-emerald-700 dark:text-emerald-400">
            {secretKey}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
          >
            <Copy className="h-4 w-4" />
            Copy Secret Key
          </Button>
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
          >
            <Download className="h-4 w-4" />
            Save as PDF
          </Button>
        </div>

        <DialogFooter className="mt-6 flex-col gap-2 sm:flex-row sm:space-x-0">
          <Button
            onClick={onConfirm}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700 dark:from-red-500 dark:to-orange-500"
          >
            I have saved it securely
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
