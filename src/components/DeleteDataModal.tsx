import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, AlertTriangle, Download, Loader2 } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

interface DeleteDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteDataModal({ isOpen, onClose }: DeleteDataModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { logout } = useAuth();

  const resetState = () => {
    setConfirmText("");
  };

  const handleClose = () => {
    if (isDeleting || isExporting) return;
    resetState();
    onClose();
  };

  const handleQuickExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch(`/api/v1/data/export`);

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "securesyncz-backup.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Successfully exported data");
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/v1/data/delete-all`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete data");
      }

      toast.success("All your data has been deleted.");
      handleClose();
      // Reload the page to clear the UI state
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete data");
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] rounded-2xl border-red-500/20 bg-white sm:mx-auto sm:max-w-md dark:bg-slate-900">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl text-red-600 dark:text-red-500">
            Danger Zone
          </DialogTitle>
          <DialogDescription className="text-center font-medium text-slate-700 dark:text-slate-300">
            Warning: This action cannot be undone. All your saved passwords,
            cards, and notes will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
            <p className="mb-3 text-sm text-amber-800 dark:text-amber-300">
              Before deleting your data, please make sure you have exported a
              backup.
            </p>
            <Button
              variant="outline"
              onClick={handleQuickExport}
              disabled={isExporting || isDeleting}
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:text-amber-400 dark:hover:bg-amber-500/20"
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Quick Export Data
            </Button>
          </div>

          <div className="space-y-3">
            <Label htmlFor="confirmDelete" className="text-sm font-semibold">
              Type{" "}
              <span className="font-bold text-red-600 dark:text-red-500">
                DELETE
              </span>{" "}
              to confirm
            </Label>
            <Input
              id="confirmDelete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="border-red-200 focus-visible:ring-red-500 dark:border-red-900/50"
              disabled={isDeleting || isExporting}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting || isExporting}
            className="sm:w-1/2"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmText !== "DELETE" || isDeleting || isExporting}
            className="bg-red-600 hover:bg-red-700 sm:w-1/2"
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete My Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
