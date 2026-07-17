"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Copy,
  Lock,
  KeyRound,
  Loader2,
  Search,
  Globe,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import getPasswords from "@/lib/getPasswords";
import { useQuery } from "@tanstack/react-query";
import { PasswordsData } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { showToast } from "@/lib/toast";
import getURL from "@/lib/getURL";
import axios from "axios";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { extractRootDomain } from "@/lib/utils";
import { useEncryption } from "@/providers/EncryptionProvider";
import { encryptData } from "@/lib/clientCrypto";
import VerifyPasskey from "@/components/VerifyPasskey";

const loadPasswordsData = async (cryptoKey: CryptoKey | null) => {
  const data = await getPasswords(cryptoKey);
  return data;
};

export default function PasswordPageClient({ name }: { name: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editableData, setEditableData] = useState<PasswordsData | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { cryptoKey, isUnlocked } = useEncryption();

  const { data, isLoading, refetch } = useQuery<PasswordsData[]>({
    queryKey: ["passwords", !!cryptoKey],
    queryFn: () => loadPasswordsData(cryptoKey),
  });

  const fetchedPasswordsData = data ?? [];
  if (isLoading) {
    return (
      <div className="mt-10 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
        Loading...
      </div>
    );
  }

  const toggleVisibility = (id: string) => {
    setVisible((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (
    text: string,
    type: "password" | "username" = "password"
  ) => {
    navigator.clipboard.writeText(text);
    showToast({
      title: "✅ Copied to clipboard",
      description: `${type === "password" ? "Password" : "Username"} has been copied successfully. It will be cleared from your clipboard in 30 seconds.`,
    });

    // Auto-clear clipboard after 30 seconds
    setTimeout(async () => {
      try {
        const currentClipboard = await navigator.clipboard.readText();
        // Only clear if the clipboard still contains the text we copied
        if (currentClipboard === text) {
          await navigator.clipboard.writeText("");
          showToast({
            title: "🛡️ Clipboard Cleared",
            description:
              "Your copied data has been removed from the clipboard for security.",
          });
        }
      } catch (e) {
        // Ignore clipboard read errors (e.g. if document lost focus)
      }
    }, 30000);
  };

  const decodedSlug = decodeURIComponent(name)
    .toLowerCase()
    .replace(/\s+/g, "-");

  const filteredPassData = fetchedPasswordsData.filter((item) => {
    const rootDomain = extractRootDomain(item.website);
    return rootDomain.toLowerCase().replace(/\s+/g, "-") === decodedSlug;
  });

  const actualName =
    filteredPassData.length > 0
      ? extractRootDomain(filteredPassData[0].website)
      : decodeURIComponent(name);

  const displayPassData = filteredPassData.filter((item) =>
    item.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generatePassword = () => {
    if (!editableData) return;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let password = "";
    for (let i = 0, n = charset.length; i < 16; ++i) {
      password += charset.charAt(Math.floor(Math.random() * n));
    }
    setEditableData({ ...editableData, password });
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length > 7) strength += 1;
    if (password.length > 12) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const strength = editableData
    ? getPasswordStrength(editableData.password)
    : 0;
  const getStrengthColor = () => {
    if (!editableData || editableData.password.length === 0)
      return "bg-transparent";
    if (strength <= 2) return "bg-red-500";
    if (strength <= 4) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editableData) return;

    const encryptedPassword = await encryptData(
      editableData.password,
      cryptoKey!
    );
    const encryptedNote = editableData.note
      ? await encryptData(editableData.note, cryptoKey!)
      : "";

    const EditedData = {
      username: editableData.username,
      password: encryptedPassword,
      note: encryptedNote,
      website: editableData.website,
    };

    const id = editableData._id;
    const url = await getURL();
    // console.log(url);

    try {
      const response = await axios.put(
        `${url}/passwords/update/${id}`,
        EditedData
      );

      if (!response.data) {
        throw new Error("Failed to update password");
      }

      showToast({
        title: "✅ Password updated successfully",
        description: "Your password has been updated.",
      });

      setIsDialogOpen(false);
      await refetch();
    } catch (err) {
      showToast({
        title: err instanceof Error ? err.message : "Error",
        description: "Failed to update password.",
      });
    }
  };

  const handleToggleFavorite = async (item: PasswordsData) => {
    try {
      const url = await getURL();
      // Need to re-encrypt password/note because they are currently decrypted in `item`
      const encryptedPassword = await encryptData(item.password, cryptoKey!);
      const encryptedNote = item.note
        ? await encryptData(item.note, cryptoKey!)
        : "";

      await axios.put(`${url}/passwords/update/${item._id}`, {
        username: item.username,
        password: encryptedPassword,
        note: encryptedNote,
        website: item.website,
        isFavorite: !item.isFavorite,
        tags: item.tags,
      });
      await refetch();
    } catch (err) {
      showToast({
        title: "Error",
        description: "Failed to toggle favorite status.",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    const url = await getURL();
    try {
      const response = await axios.delete(
        `${url}/passwords/delete/${deleteId}`
      );
      if (!response.data) {
        throw new Error("Failed to delete password");
      }

      showToast({
        title: "✅ Password deleted successfully",
        description: "Your password has been deleted.",
      });

      setIsDeleteDialogOpen(false);
      setDeleteId(null);
      await refetch();
    } catch (err) {
      showToast({
        title: err instanceof Error ? err.message : "Error",
        description: "Failed to delete password.",
      });
    }
  };

  if (filteredPassData.length === 0) {
    return (
      <div className="mt-10 text-center text-sm font-medium text-red-500 dark:text-red-400">
        No password data found.
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <VerifyPasskey
        reasonText={
          <>
            Please enter your 6-digit passkey to access passwords for{" "}
            <span className="font-semibold capitalize">{name}</span>.
          </>
        }
      />
    );
  }

  return (
    <section className="pb-28">
      <div className="mx-auto max-w-xl px-4 py-6 sm:p-6">
        <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-900 sm:mb-6 sm:text-2xl dark:text-white">
          <img
            src={`https://www.google.com/s2/favicons?domain=${name}&sz=64`}
            alt={`${name} icon`}
            className="h-6 w-6 rounded-md bg-white p-0.5 shadow-sm sm:h-8 sm:w-8"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="capitalize">{actualName}</span> Passwords
        </h2>

        <div className="relative mb-5 sm:mb-6">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 border-slate-200 bg-white/60 pl-9 text-sm transition-colors focus:border-emerald-300 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:placeholder-slate-500 dark:focus:border-emerald-500/30 dark:focus:bg-white/[0.07]"
          />
        </div>

        {displayPassData.length === 0 && searchQuery !== "" ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No passwords found matching "{searchQuery}".
          </p>
        ) : (
          displayPassData.map((item) => (
            <Card
              key={item._id}
              className="glass group mb-5 space-y-4 overflow-hidden rounded-2xl p-0 shadow-lg shadow-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 sm:mb-6 dark:shadow-black/20"
            >
              {/* Top accent */}
              <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

              <div className="space-y-4 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleToggleFavorite(item)}
                      className="rounded-full p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Toggle Favorite"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={item.isFavorite ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`h-4 w-4 ${item.isFavorite ? "text-yellow-500" : "text-slate-400"}`}
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {item.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Username
                    </Label>
                    <div className="relative">
                      <div className="h-auto min-h-[40px] w-full rounded-md border border-slate-200 bg-white/50 px-3 py-2 pr-10 text-sm break-words break-all whitespace-pre-wrap dark:border-white/[0.08] dark:bg-white/5">
                        {item.username}
                      </div>
                      <button
                        type="button"
                        aria-label="Copy username"
                        onClick={() =>
                          copyToClipboard(item.username, "username")
                        }
                        className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Site
                    </Label>
                    <div>
                      <a
                        href={
                          item.website.startsWith("http")
                            ? item.website
                            : `https://${item.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-center gap-1.5 truncate text-sm text-emerald-600 transition-colors hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
                      >
                        <Globe className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {extractRootDomain(item.website)}
                        </span>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 sm:gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Password
                    </Label>
                    <div className="relative">
                      <div className="h-auto min-h-[40px] w-full rounded-md border border-slate-200 bg-white/50 px-3 py-2 pr-20 text-sm break-words break-all whitespace-pre-wrap dark:border-white/[0.08] dark:bg-white/5">
                        {visible[item._id as string]
                          ? item.password
                          : "•".repeat(Math.min(item.password.length, 64))}
                      </div>
                      <button
                        type="button"
                        aria-label={
                          visible[item._id as string]
                            ? "Hide password"
                            : "Show password"
                        }
                        onClick={() => toggleVisibility(item._id as string)}
                        className="absolute top-1/2 right-10 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        {visible[item._id as string] ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                      <button
                        type="button"
                        aria-label="Copy password"
                        onClick={() =>
                          copyToClipboard(item.password, "password")
                        }
                        className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Note
                    </Label>
                    <div className="h-auto min-h-[40px] w-full rounded-md border border-slate-200 bg-white/50 px-3 py-2 text-sm break-words break-all whitespace-pre-wrap text-slate-500 dark:border-white/[0.08] dark:bg-white/5 dark:text-slate-400">
                      {item.note || "No note available"}
                    </div>
                  </div>
                </div>

                {/* Action buttons — stack on mobile */}
                <div className="flex flex-col gap-2 pt-3 sm:flex-row sm:justify-end sm:gap-4 sm:pt-4">
                  <Button
                    variant="outline"
                    className="h-10 border-emerald-200 text-sm text-emerald-700 transition-all hover:bg-emerald-50 sm:w-28 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                    onClick={() => {
                      setEditableData(item);
                      setIsDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => {
                      setDeleteId(item._id as string);
                      setIsDeleteDialogOpen(true);
                    }}
                    variant="destructive"
                    className="h-10 text-sm sm:w-28"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl bg-white sm:w-full dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">
              Edit Password
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Update your password details below.
            </DialogDescription>
          </DialogHeader>

          {editableData && (
            <form onSubmit={handleEdit} className="space-y-3.5 sm:space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="website" className="text-xs sm:text-sm">
                  Website URL
                </Label>
                <Input
                  id="website"
                  value={editableData.website}
                  onChange={(e) =>
                    setEditableData({
                      ...editableData,
                      website: e.target.value,
                    })
                  }
                  className="h-11 text-sm sm:h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs sm:text-sm">
                  Username
                </Label>
                <Input
                  id="username"
                  value={editableData.username}
                  onChange={(e) =>
                    setEditableData({
                      ...editableData,
                      username: e.target.value,
                    })
                  }
                  className="h-11 text-sm sm:h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs sm:text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    value={editableData.password}
                    onChange={(e) =>
                      setEditableData({
                        ...editableData,
                        password: e.target.value,
                      })
                    }
                    className="h-11 pr-10 text-sm sm:h-10"
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-2 -translate-y-1/2 p-0.5 text-slate-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                    onClick={generatePassword}
                    title="Generate Password"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
                {editableData.password && (
                  <div className="mt-2 flex h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div
                      className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                      style={{ width: `${(strength / 5) * 100}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note" className="text-xs sm:text-sm">
                  Note
                </Label>
                <Input
                  id="note"
                  value={editableData.note}
                  onChange={(e) =>
                    setEditableData({
                      ...editableData,
                      note: e.target.value,
                    })
                  }
                  className="h-11 text-sm sm:h-10"
                />
              </div>
              <DialogFooter className="pt-3 sm:pt-4">
                <Button
                  type="submit"
                  className="h-11 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-sm text-white sm:h-10 sm:w-auto dark:from-emerald-500 dark:to-teal-500"
                >
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl bg-white sm:w-full dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to delete this password? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:space-x-2">
            <Button
              variant="outline"
              className="h-11 text-sm sm:h-10"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="h-11 text-sm sm:h-10"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
