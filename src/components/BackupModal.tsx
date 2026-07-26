import { useState, useRef, useEffect } from "react";
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
import { Download, Upload, UploadCloud, Loader2, KeyRound } from "lucide-react";
import { useEncryption } from "@/providers/EncryptionProvider";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

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

  const { cryptoKey, isUnlocked, unlockVault } = useEncryption();
  const [passkey, setPasskey] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passkey.length !== 6) return;

    setIsVerifying(true);
    const success = await unlockVault(passkey);
    if (success) {
      toast.success("Vault Unlocked");
    } else {
      toast.error("Invalid passkey. Try again.");
      setPasskey("");
    }
    setIsVerifying(false);
  };

  useEffect(() => {
    if (passkey.length === 6 && !isVerifying) {
      handleVerify();
    }
  }, [passkey]);

  const resetState = () => {
    setSelectedFile(null);
    setIsDragging(false);
    setPasskey("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleExport = async () => {
    if (!cryptoKey) {
      toast.error(
        "Encryption key not found. Please setup your passkey or secret key first."
      );
      return;
    }

    try {
      setIsLoading(true);
      toast.loading("Decrypting and exporting data...", { id: "export" });
      const response = await fetch(`/api/v1/data/export`);

      if (!response.ok) throw new Error("Export failed");

      const rawData = await response.json();
      const { decryptData } = await import("@/lib/clientCrypto");

      const decryptedData = {
        passwords: [] as any[],
        cards: [] as any[],
        notes: [] as any[],
      };

      if (rawData.passwords && Array.isArray(rawData.passwords)) {
        for (const p of rawData.passwords) {
          try {
            const decryptedPassword = p.password
              ? await decryptData(p.password, cryptoKey)
              : "";
            const decryptedNote = p.note
              ? await decryptData(p.note, cryptoKey)
              : "";
            decryptedData.passwords.push({
              ...p,
              password: decryptedPassword,
              note: decryptedNote,
            });
          } catch (e) {
            decryptedData.passwords.push({ ...p });
          }
        }
      }

      if (rawData.cards && Array.isArray(rawData.cards)) {
        for (const c of rawData.cards) {
          try {
            const decryptedCardNumber = c.cardNumber
              ? await decryptData(c.cardNumber, cryptoKey)
              : "";
            const decryptedExpiry = c.expiry
              ? await decryptData(c.expiry, cryptoKey)
              : "";
            const decryptedCvv = c.cvv
              ? await decryptData(c.cvv, cryptoKey)
              : "";
            const decryptedNote = c.note
              ? await decryptData(c.note, cryptoKey)
              : "";
            decryptedData.cards.push({
              ...c,
              cardNumber: decryptedCardNumber,
              expiry: decryptedExpiry,
              cvv: decryptedCvv,
              note: decryptedNote,
            });
          } catch (e) {
            decryptedData.cards.push({ ...c });
          }
        }
      }

      if (rawData.notes && Array.isArray(rawData.notes)) {
        for (const n of rawData.notes) {
          try {
            const decryptedContent = n.content
              ? await decryptData(n.content, cryptoKey)
              : "";
            decryptedData.notes.push({ ...n, content: decryptedContent });
          } catch (e) {
            decryptedData.notes.push({ ...n });
          }
        }
      }

      const jsonString = JSON.stringify(decryptedData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "securesyncz-backup-decrypted.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Successfully exported data", { id: "export" });
      handleClose();
    } catch (error) {
      toast.error("Failed to export data", { id: "export" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file.");
      return;
    }

    if (!cryptoKey) {
      toast.error(
        "Encryption key not found. Please setup your passkey or secret key first."
      );
      return;
    }

    try {
      setIsLoading(true);
      toast.loading("Encrypting and importing data...", { id: "import" });

      const fileContent = await selectedFile.text();
      const isCSV = selectedFile.name.toLowerCase().endsWith(".csv");

      let payload = {
        passwords: [] as any[],
        cards: [] as any[],
        notes: [] as any[],
      };

      const { encryptData } = await import("@/lib/clientCrypto");

      if (isCSV) {
        const Papa = await import("papaparse");
        const results = Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
        });

        for (const record of results.data as any[]) {
          const encryptedPassword = record.password
            ? await encryptData(record.password, cryptoKey)
            : "";
          const encryptedNote = record.note
            ? await encryptData(record.note, cryptoKey)
            : "";

          payload.passwords.push({
            website: record.url || record.name || "Unknown",
            username: record.username || "",
            password: encryptedPassword,
            note: encryptedNote,
            isFavorite: false,
            tags: [],
          });
        }
      } else {
        let data;
        try {
          data = JSON.parse(fileContent);
        } catch (e) {
          throw new Error("Invalid JSON file");
        }

        if (data.passwords && Array.isArray(data.passwords)) {
          for (const p of data.passwords) {
            const encryptedPassword = p.password
              ? await encryptData(p.password, cryptoKey)
              : "";
            const encryptedNote = p.note
              ? await encryptData(p.note, cryptoKey)
              : "";
            payload.passwords.push({
              ...p,
              password: encryptedPassword,
              note: encryptedNote,
            });
          }
        }
        if (data.cards && Array.isArray(data.cards)) {
          for (const c of data.cards) {
            const encryptedCardNumber = c.cardNumber
              ? await encryptData(c.cardNumber, cryptoKey)
              : "";
            const encryptedExpiry = c.expiry
              ? await encryptData(c.expiry, cryptoKey)
              : "";
            const encryptedCvv = c.cvv
              ? await encryptData(c.cvv, cryptoKey)
              : "";
            const encryptedNote = c.note
              ? await encryptData(c.note, cryptoKey)
              : "";
            payload.cards.push({
              ...c,
              cardNumber: encryptedCardNumber,
              expiry: encryptedExpiry,
              cvv: encryptedCvv,
              note: encryptedNote,
            });
          }
        }
        if (data.notes && Array.isArray(data.notes)) {
          for (const n of data.notes) {
            const encryptedContent = n.content
              ? await encryptData(n.content, cryptoKey)
              : "";
            payload.notes.push({ ...n, content: encryptedContent });
          }
        }
      }

      const endpoint = "/api/v1/data/import";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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

  if (!isUnlocked) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl bg-white sm:w-full dark:bg-slate-900">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <KeyRound className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center">Unlock Vault</DialogTitle>
            <DialogDescription className="text-center">
              Please enter your 6-digit passkey to unlock your vault before you
              can import or export data.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleVerify}
            className="flex flex-col items-center space-y-6 py-4"
          >
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={passkey}
              onChange={(value) => setPasskey(value)}
              autoFocus
            >
              <InputOTPGroup className="gap-2">
                {[...Array(6)].map((_, i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="h-10 w-10 rounded-md border-slate-200 bg-white/60 text-base sm:h-12 sm:w-12 sm:text-lg dark:border-white/10 dark:bg-white/5"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>

            <Button
              type="submit"
              disabled={passkey.length !== 6 || isVerifying}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-500 dark:to-teal-500"
            >
              {isVerifying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Unlock Vault
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

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
