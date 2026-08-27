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
import {
  Download,
  Upload,
  UploadCloud,
  Loader2,
  KeyRound,
  Globe,
  ShieldCheck,
} from "lucide-react";
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

  const [exportFormat, setExportFormat] = useState<"browser" | "vault">(
    "browser"
  );

  const resetState = () => {
    setSelectedFile(null);
    setIsDragging(false);
    setPasskey("");
    setExportFormat("browser");
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
      toast.loading("Decrypting and preparing export file...", {
        id: "export",
      });
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
      let csvString = "";
      let downloadFilename = "securesyncz-vault-backup.csv";

      if (exportFormat === "browser") {
        // Strict Chrome / Safari / Edge standard format: name,url,username,password,note
        const chromeRows: any[] = [];
        downloadFilename = "chrome-passwords.csv";

        const formatUrlForChrome = (rawUrl: string, name: string): string => {
          let u = (rawUrl || "").trim();
          if (!u) {
            u = (name || "").trim();
          }
          if (!u) {
            return "https://example.com";
          }

          // Remove whitespace
          u = u.replace(/\s+/g, "");

          // Prepend https:// if protocol is missing
          if (!/^https?:\/\//i.test(u)) {
            u = `https://${u}`;
          }

          // Remove trailing slashes and invalid trailing characters
          u = u.replace(/[\/,]+$/, "");

          try {
            const urlObj = new URL(u);
            if (!urlObj.hostname.includes(".")) {
              return `https://${urlObj.hostname}.com`;
            }
            return (
              urlObj.origin +
              (urlObj.pathname && urlObj.pathname !== "/"
                ? urlObj.pathname
                : "")
            );
          } catch (e) {
            const cleanDomain = u
              .replace(/^https?:\/\//i, "")
              .replace(/[^a-zA-Z0-9.-]/g, "");
            return cleanDomain.includes(".")
              ? `https://${cleanDomain}`
              : `https://${cleanDomain || "example"}.com`;
          }
        };

        decryptedData.passwords.forEach((p) => {
          const pwd = (p.password || "").trim();
          // Google Chrome strictly requires non-empty passwords for each entry
          if (!pwd) {
            return;
          }

          const siteUrl = formatUrlForChrome(p.website, p.name);
          const entryName = (p.name || p.website || "Login").trim();
          const username = (p.username || "").trim();
          const note = (p.note || "").trim();

          chromeRows.push({
            name: entryName,
            url: siteUrl,
            username: username,
            password: pwd,
            note: note,
          });
        });

        if (chromeRows.length === 0) {
          toast.error(
            "No passwords with valid password field found to export for Chrome.",
            {
              id: "export",
            }
          );
          return;
        }

        csvString = Papa.unparse({
          fields: ["name", "url", "username", "password", "note"],
          data: chromeRows,
        });
      } else {
        // Full Vault Backup format
        const exportRows: any[] = [];
        downloadFilename = "securesyncz-full-vault-backup.csv";

        decryptedData.passwords.forEach((p) => {
          const siteUrl = p.website || "";
          const entryName = p.name || siteUrl || "Login";
          exportRows.push({
            name: entryName,
            url: siteUrl,
            username: p.username || "",
            password: p.password || "",
            note: p.note || "",
            type: "password",
            cardNumber: "",
            cardType: "",
            expiry: "",
            cvv: "",
            pin: "",
            title: entryName,
            content: "",
            isFavorite: p.isFavorite ? "true" : "false",
            tags: Array.isArray(p.tags) ? p.tags.join(",") : p.tags || "",
            website: siteUrl,
            _id: p._id || "",
            createdAt: p.createdAt || "",
            updatedAt: p.updatedAt || "",
          });
        });

        decryptedData.cards.forEach((c) => {
          const cardName = c.name || c.serviceName || "Credit Card";
          exportRows.push({
            name: cardName,
            url: c.website || "",
            username: "",
            password: "",
            note: c.note || "",
            type: "card",
            cardNumber: c.cardNumber || "",
            cardType: c.cardType || "Others",
            expiry: c.expiry || "",
            cvv: c.cvv || "",
            pin: c.pin || "",
            title: cardName,
            content: "",
            isFavorite: c.isFavorite ? "true" : "false",
            tags: Array.isArray(c.tags) ? c.tags.join(",") : c.tags || "",
            website: c.website || "",
            _id: c._id || "",
            createdAt: c.createdAt || "",
            updatedAt: c.updatedAt || "",
          });
        });

        decryptedData.notes.forEach((n) => {
          const noteTitle = n.title || "Secure Note";
          const noteContent = n.content || "";
          exportRows.push({
            name: noteTitle,
            url: "",
            username: "",
            password: "",
            note: noteContent,
            type: "note",
            cardNumber: "",
            cardType: "",
            expiry: "",
            cvv: "",
            pin: "",
            title: noteTitle,
            content: noteContent,
            isFavorite: n.isFavorite ? "true" : "false",
            tags: Array.isArray(n.tags) ? n.tags.join(",") : n.tags || "",
            website: "",
            _id: n._id || "",
            createdAt: n.createdAt || "",
            updatedAt: n.updatedAt || "",
          });
        });

        csvString = Papa.unparse(exportRows, {
          quotes: true,
          header: true,
        });
      }

      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(
        exportFormat === "browser"
          ? "Chrome compatible password CSV exported!"
          : "Full vault backup exported successfully!",
        { id: "export" }
      );
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
        skipEmptyLines: "greedy",
        transformHeader: (header) => header.trim(),
      });

      const getField = (
        row: Record<string, any>,
        ...keys: string[]
      ): string => {
        if (!row || typeof row !== "object") return "";
        for (const k of keys) {
          if (
            row[k] !== undefined &&
            row[k] !== null &&
            String(row[k]).trim() !== ""
          ) {
            return String(row[k]).trim();
          }
        }
        const rowKeys = Object.keys(row);
        for (const k of keys) {
          const targetKey = k.toLowerCase().replace(/[^a-z0-9]/g, "");
          const matchedKey = rowKeys.find(
            (rk) => rk.toLowerCase().replace(/[^a-z0-9]/g, "") === targetKey
          );
          if (
            matchedKey &&
            row[matchedKey] !== undefined &&
            row[matchedKey] !== null &&
            String(row[matchedKey]).trim() !== ""
          ) {
            return String(row[matchedKey]).trim();
          }
        }
        return "";
      };

      for (const record of results.data as any[]) {
        if (!record || typeof record !== "object") continue;

        const rawType = getField(
          record,
          "type",
          "item_type",
          "category"
        ).toLowerCase();
        const name = getField(
          record,
          "name",
          "title",
          "Title",
          "serviceName",
          "cardName",
          "login_name"
        );
        const url = getField(
          record,
          "url",
          "URL",
          "website",
          "login_uri",
          "uri",
          "web",
          "link"
        );
        const username = getField(
          record,
          "username",
          "Username",
          "login_username",
          "user",
          "email",
          "login"
        );
        const password = getField(
          record,
          "password",
          "Password",
          "login_password",
          "pass",
          "secret"
        );
        const note = getField(
          record,
          "note",
          "notes",
          "Notes",
          "comment",
          "description",
          "extra"
        );
        const cardNumber = getField(
          record,
          "cardNumber",
          "card_number",
          "number",
          "card",
          "cardnumber"
        );
        const cardType =
          getField(record, "cardType", "card_type", "brand", "type_card") ||
          "Others";
        const expiry = getField(
          record,
          "expiry",
          "expiration",
          "exp",
          "valid_thru",
          "expiry_date"
        );
        const cvv = getField(
          record,
          "cvv",
          "cvc",
          "security_code",
          "securitycode"
        );
        const pin = getField(record, "pin", "card_pin", "pin_code");
        const content = getField(
          record,
          "content",
          "body",
          "text",
          "note_content"
        );
        const isFavoriteVal = getField(
          record,
          "isFavorite",
          "favorite",
          "is_favorite"
        ).toLowerCase();
        const isFavorite =
          isFavoriteVal === "true" ||
          isFavoriteVal === "1" ||
          isFavoriteVal === "yes";
        const rawTags = getField(record, "tags", "tag", "folder");
        const tags = rawTags
          ? rawTags
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean)
          : [];
        const _id = getField(record, "_id", "id") || undefined;
        const createdAt =
          getField(record, "createdAt", "created_at", "timeCreated") ||
          undefined;
        const updatedAt =
          getField(
            record,
            "updatedAt",
            "updated_at",
            "timeLastUsed",
            "timePasswordChanged"
          ) || undefined;

        if (
          !name &&
          !url &&
          !username &&
          !password &&
          !note &&
          !cardNumber &&
          !content
        ) {
          continue;
        }

        const isCard =
          rawType === "card" ||
          rawType === "credit_card" ||
          rawType === "debit_card" ||
          Boolean(cardNumber);

        const isNote =
          rawType === "note" ||
          rawType === "secure_note" ||
          (Boolean(content) && !password && !username && !cardNumber);

        if (isCard) {
          const encryptedCardNumber = cardNumber
            ? await encryptData(cardNumber, cryptoKey)
            : "";
          const encryptedExpiry = expiry
            ? await encryptData(expiry, cryptoKey)
            : "";
          const encryptedCvv = cvv ? await encryptData(cvv, cryptoKey) : "";
          const encryptedPin = pin ? await encryptData(pin, cryptoKey) : "";
          const encryptedNote = note ? await encryptData(note, cryptoKey) : "";

          payload.cards.push({
            _id,
            name: name || "Credit Card",
            serviceName:
              getField(record, "serviceName") || name || "Credit Card",
            cardType: cardType,
            website: url,
            cardNumber: encryptedCardNumber,
            expiry: encryptedExpiry,
            cvv: encryptedCvv,
            pin: encryptedPin,
            note: encryptedNote,
            isFavorite,
            tags,
            createdAt,
            updatedAt,
          });
        } else if (isNote) {
          const noteText = content || note || "";
          const encryptedContent = noteText
            ? await encryptData(noteText, cryptoKey)
            : "";

          payload.notes.push({
            _id,
            title: name || getField(record, "title") || "Secure Note",
            content: encryptedContent,
            isFavorite,
            tags,
            createdAt,
            updatedAt,
          });
        } else {
          const encryptedPassword = password
            ? await encryptData(password, cryptoKey)
            : "";
          const encryptedNote = note ? await encryptData(note, cryptoKey) : "";

          const site = url || name || "Unknown";
          const displayName = name || url || "Login";

          payload.passwords.push({
            _id,
            name: displayName,
            website: site,
            username: username || "",
            password: encryptedPassword,
            note: encryptedNote,
            isFavorite,
            tags,
            createdAt,
            updatedAt,
          });
        }
      }

      const totalItems =
        payload.passwords.length + payload.cards.length + payload.notes.length;

      if (totalItems === 0) {
        throw new Error(
          "No valid password, card, or note entries found in the file."
        );
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
          {action === "export" && (
            <div className="space-y-3">
              <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Select Export Target
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div
                  onClick={() => setExportFormat("browser")}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                    exportFormat === "browser"
                      ? "border-emerald-500 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20 dark:border-emerald-500/80 dark:bg-emerald-950/20"
                      : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 rounded-lg p-2 ${
                        exportFormat === "browser"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
                        Google Chrome & Browsers
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        Strict format for Chrome, Safari, Edge, Firefox password
                        managers.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setExportFormat("vault")}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                    exportFormat === "vault"
                      ? "border-emerald-500 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20 dark:border-emerald-500/80 dark:bg-emerald-950/20"
                      : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 rounded-lg p-2 ${
                        exportFormat === "vault"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
                        Full Vault Backup
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        Complete backup with Passwords, Cards, Notes & Tags for
                        SecureSyncZ.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                      Supports Chrome, Safari, Bitwarden, or SecureSyncZ CSV
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
