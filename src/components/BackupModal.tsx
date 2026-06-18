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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, Upload, UploadCloud, Eye, EyeOff } from "lucide-react";

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "passwords" | "cards";
  action: "export" | "import";
}

export function BackupModal({
  isOpen,
  onClose,
  type,
  action,
}: BackupModalProps) {
  const [masterPassword, setMasterPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setMasterPassword("");
    setSelectedFile(null);
    setIsDragging(false);
    setShowPassword(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleExport = async () => {
    if (!masterPassword) {
      toast.error("Please enter a master password to encrypt your backup.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/${type}/export-encrypted`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterPassword }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-encrypted.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(`Successfully exported encrypted ${type}`);
      handleClose();
    } catch (error) {
      toast.error(`Failed to export ${type}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file.");
      return;
    }
    const isCSV = selectedFile.name.toLowerCase().endsWith(".csv");

    if (!isCSV && !masterPassword) {
      toast.error("Please enter the master password for the encrypted JSON.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    if (!isCSV) {
      formData.append("masterPassword", masterPassword);
    }

    try {
      setIsLoading(true);
      toast.loading(`Importing ${type}...`, { id: "import" });
      const endpoint = isCSV
        ? `/api/v1/${type}/import`
        : `/api/v1/${type}/import-encrypted`;

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Import failed");
      }

      toast.success(`Successfully imported ${type}`, { id: "import" });
      handleClose();
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast.error(error.message || `Failed to import ${type}`, {
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {action === "export"
              ? `Export Encrypted ${type}`
              : `Import Encrypted ${type}`}
          </DialogTitle>
          <DialogDescription>
            {action === "export"
              ? "Your backup will be exported as an AES-encrypted JSON file. Choose a strong master password."
              : "Upload an AES-encrypted JSON backup or a standard CSV file (like Chrome export)."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {action === "import" && (
            <div className="space-y-2">
              <Label>Backup File (.json or .csv)</Label>
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

          {(!selectedFile ||
            !selectedFile.name.toLowerCase().endsWith(".csv") ||
            action === "export") && (
            <div className="space-y-2">
              <Label htmlFor="masterPassword">Master Password</Label>
              <div className="relative">
                <Input
                  id="masterPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter master password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {action === "export" && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Do not lose this password! You cannot restore the backup
                  without it.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={action === "export" ? handleExport : handleImport}
            disabled={Boolean(
              isLoading ||
                (action === "export" && !masterPassword) ||
                (action === "import" && !selectedFile) ||
                (action === "import" &&
                  selectedFile &&
                  !selectedFile.name.toLowerCase().endsWith(".csv") &&
                  !masterPassword)
            )}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
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
