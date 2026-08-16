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
import { useAuth } from "@/providers/AuthProvider";
import PremiumPaywallModal from "@/components/PremiumPaywallModal";

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
  const { user } = useAuth();
  const [passkey, setPasskey] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passkey.length !== 6) return;

    setIsVerifying(true);
    const result = await unlockVault(passkey);
    if (result.success) {
      toast.success("Vault Unlocked");
    } else {
      toast.error(result.error || "Invalid passkey. Try again.");
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
            const decryptedPin = c.pin
              ? await decryptData(c.pin, cryptoKey)
              : "";
            const decryptedNote = c.note
              ? await decryptData(c.note, cryptoKey)
              : "";
            decryptedData.cards.push({
              ...c,
              cardNumber: decryptedCardNumber,
              expiry: decryptedExpiry,
              cvv: decryptedCvv,
              pin: decryptedPin,
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

      const Papa = await import("papaparse");
      const exportRows: any[] = [];

      decryptedData.passwords.forEach((p) => {
        exportRows.push({
          _id: p._id || "",
          type: "password",
          name: p.name || "",
          website: p.website || "",
          username: p.username || "",
          password: p.password || "",
          note: p.note || "",
          serviceName: "",
          cardType: "",
          cardNumber: "",
          expiry: "",
          cvv: "",
          pin: "",
          title: "",
          content: "",
          isFavorite: p.isFavorite ? "true" : "false",
          tags: p.tags ? p.tags.join(",") : "",
          createdAt: p.createdAt || "",
          updatedAt: p.updatedAt || "",
        });
      });

      decryptedData.cards.forEach((c) => {
        exportRows.push({
          _id: c._id || "",
          type: "card",
          name: c.name || "",
          website: c.website || "",
          username: "",
          password: "",
          note: c.note || "",
          serviceName: c.serviceName || "",
          cardType: c.cardType || "",
          cardNumber: c.cardNumber || "",
          expiry: c.expiry || "",
          cvv: c.cvv || "",
          pin: c.pin || "",
          title: "",
          content: "",
          isFavorite: c.isFavorite ? "true" : "false",
          tags: c.tags ? c.tags.join(",") : "",
          createdAt: c.createdAt || "",
          updatedAt: c.updatedAt || "",
        });
      });

      decryptedData.notes.forEach((n) => {
        exportRows.push({
          _id: n._id || "",
          type: "note",
          name: "",
          website: "",
          username: "",
          password: "",
          note: "",
          serviceName: "",
          cardType: "",
          cardNumber: "",
          expiry: "",
          cvv: "",
          pin: "",
          title: n.title || "",
          content: n.content || "",
          isFavorite: n.isFavorite ? "true" : "false",
          tags: n.tags ? n.tags.join(",") : "",
          createdAt: n.createdAt || "",
          updatedAt: n.updatedAt || "",
        });
      });

      const csvString = Papa.unparse(exportRows);
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "securesyncz-backup-decrypted.csv";
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

      if (!isCSV) {
        throw new Error("Only CSV files are supported for import.");
      }

      let payload = {
        passwords: [] as any[],
        cards: [] as any[],
        notes: [] as any[],
      };

      const { encryptData } = await import("@/lib/clientCrypto");
      const Papa = await import("papaparse");
      const results = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
      });

      for (const record of results.data as any[]) {
        const type = record.type || "password";

        if (type === "password") {
          const encryptedPassword = record.password
            ? await encryptData(record.password, cryptoKey)
            : "";
          const encryptedNote = record.note
            ? await encryptData(record.note, cryptoKey)
            : "";

          payload.passwords.push({
            _id: record._id || undefined,
            name: record.name || record.cardName || "",
            website: record.website || record.url || "Unknown",
            username: record.username || "",
            password: encryptedPassword,
            note: encryptedNote,
            isFavorite: record.isFavorite === "true",
            tags: record.tags ? record.tags.split(",").filter(Boolean) : [],
            createdAt: record.createdAt || undefined,
            updatedAt: record.updatedAt || undefined,
          });
        } else if (type === "card") {
          const encryptedCardNumber = record.cardNumber
            ? await encryptData(record.cardNumber, cryptoKey)
            : "";
          const encryptedExpiry = record.expiry
            ? await encryptData(record.expiry, cryptoKey)
            : "";
          const encryptedCvv = record.cvv
            ? await encryptData(record.cvv, cryptoKey)
            : "";
          const encryptedPin = record.pin
            ? await encryptData(record.pin, cryptoKey)
            : "";
          const encryptedNote = record.note
            ? await encryptData(record.note, cryptoKey)
            : "";

          payload.cards.push({
            _id: record._id || undefined,
            name: record.name || record.cardName || "Unknown",
            serviceName:
              record.serviceName || record.name || record.cardName || "Unknown",
            cardType: record.cardType || "Others",
            website: record.website || "",
            cardNumber: encryptedCardNumber,
            expiry: encryptedExpiry,
            cvv: encryptedCvv,
            pin: encryptedPin,
            note: encryptedNote,
            isFavorite: record.isFavorite === "true",
            tags: record.tags ? record.tags.split(",").filter(Boolean) : [],
            createdAt: record.createdAt || undefined,
            updatedAt: record.updatedAt || undefined,
          });
        } else if (type === "note") {
          const encryptedContent = record.content
            ? await encryptData(record.content, cryptoKey)
            : "";

          payload.notes.push({
            _id: record._id || undefined,
            title: record.title || "Unknown",
            content: encryptedContent,
            isFavorite: record.isFavorite === "true",
            tags: record.tags ? record.tags.split(",").filter(Boolean) : [],
            createdAt: record.createdAt || undefined,
            updatedAt: record.updatedAt || undefined,
          });
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
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-full">
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

  if (user && !user.isPremium) {
    return (
      <PremiumPaywallModal
        isOpen={isOpen}
        onClose={handleClose}
        featureName="Encrypted Backup"
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle>
            {action === "export" ? "Export Backup (CSV)" : "Import Backup"}
          </DialogTitle>
          <DialogDescription>
            {action === "export"
              ? "Download all your data into a single CSV file. The data will be decrypted in the downloaded file."
              : "Upload a CSV backup file to import your passwords, cards, and notes."}
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
                  accept=".csv"
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
                      Drag and drop your CSV backup here
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
