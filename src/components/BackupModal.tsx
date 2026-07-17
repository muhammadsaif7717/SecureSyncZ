import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Upload, UploadCloud } from "lucide-react";

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: "export" | "import";
}

export function BackupModal({ isOpen, onClose, action }: BackupModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setSelectedFile(null);
    setIsDragging(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
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
      handleClose();
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setIsLoading(true);
      toast.loading("Importing data...", { id: "import" });
      const endpoint = "/api/v1/data/import";

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Import failed");
      }

      toast.success("Successfully imported data", { id: "import" });
      handleClose();
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast.error(error.message || "Failed to import data", {
        id: "import",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl bg-white sm:w-full dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle>
            {action === "export" ? "Export Backup (JSON)" : "Import Backup"}
          </DialogTitle>
          <DialogDescription>
            {action === "export"
              ? "Download all your secure data into a single JSON file. The data will remain encrypted on your device if zero-knowledge encryption is active."
              : "Upload a JSON backup file or a CSV file (e.g., from Chrome) to import your passwords, cards, and notes."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {action === "import" && (
            <div className="space-y-2">
              <div
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-500/10"
                    : selectedFile
                      ? "border-emerald-500 bg-emerald-500/5"
                      : "border-slate-300 hover:border-emerald-500/50 dark:border-slate-700"
                }`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ cursor: "pointer" }}
              >
                <input
                  type="file"
                  accept=".json,.csv"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                {selectedFile ? (
                  <div className="text-center">
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {selectedFile.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Click to change file
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <UploadCloud className="mb-2 h-8 w-8 text-slate-400" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Drag and drop your JSON or CSV backup here
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      or click to browse files
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="sm:w-1/2"
          >
            Cancel
          </Button>
          <Button
            onClick={action === "export" ? handleExport : handleImport}
            disabled={Boolean(
              isLoading || (action === "import" && !selectedFile)
            )}
            className="bg-emerald-600 text-white hover:bg-emerald-700 sm:w-1/2"
          >
            {action === "export" ? (
              <>
                <Download className="mr-2 h-4 w-4" /> Export Backup
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" /> Import Backup
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
