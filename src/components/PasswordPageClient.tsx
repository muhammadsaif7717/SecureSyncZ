"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Check,
} from "lucide-react";
import { PasswordGenerator } from "@/components/PasswordGenerator";
import { TagInput } from "@/components/TagInput";
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSearch = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  useEffect(() => {
    const q = searchParams.get("search");
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editableData, setEditableData] = useState<PasswordsData | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);

  const { cryptoKey, isUnlocked } = useEncryption();

  const { data, isLoading, refetch } = useQuery<PasswordsData[]>({
    queryKey: ["passwords", !!cryptoKey],
    queryFn: () => loadPasswordsData(cryptoKey),
  });

  const fetchedPasswordsData = data ?? [];
  const originalItem = editableData
    ? fetchedPasswordsData.find((p) => p._id === editableData._id)
    : null;
  const hasChanges =
    editableData && originalItem
      ? (editableData.website || "") !== (originalItem.website || "") ||
        (editableData.username || "") !== (originalItem.username || "") ||
        (editableData.password || "") !== (originalItem.password || "") ||
        (editableData.note || "") !== (originalItem.note || "") ||
        JSON.stringify(editableData.tags || []) !==
          JSON.stringify(originalItem.tags || [])
      : false;

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
    id: string,
    type: "password" | "username" = "password"
  ) => {
    navigator.clipboard.writeText(text);
    setCopiedId(`${id}-${type}`);
    setTimeout(() => setCopiedId(null), 2000);
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
      if (filteredPassData.length <= 1) {
        router.push("/passwords");
      }
    } catch (err) {
      showToast({
        title: err instanceof Error ? err.message : "Error",
        description: "Failed to delete password.",
      });
    }
  };

  if (filteredPassData.length === 0) {
    return (
      <div className="mt-20 flex flex-col items-center justify-center space-y-4 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
          <KeyRound className="h-10 w-10 text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          No passwords found
        </h3>
        <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
          You haven't saved any passwords here yet. Add your first password to
          keep it secure and synced.
        </p>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <VerifyPasskey
        reasonText={
          <>Please enter your 6-digit passkey to access your saved passwords.</>
        }
      />
    );
  }

  return (
    <section className="pb-28">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:p-6">
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
            className="h-10 border-slate-200 bg-white/60 pl-9 text-sm transition-colors focus:border-emerald-300 focus:bg-white sm:pl-10 dark:border-white/10 dark:bg-white/5 dark:placeholder-slate-500 dark:focus:border-emerald-500/30 dark:focus:bg-white/[0.07]"
          />
        </div>

        {displayPassData.length === 0 && searchQuery !== "" ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No passwords found matching "{searchQuery}".
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayPassData.map((item) => (
              <Card
                key={item._id}
                className="animate-fade-in-up glass group relative h-full space-y-4 overflow-hidden rounded-[2rem] border border-white/20 p-0 shadow-xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl dark:border-white/5 dark:shadow-emerald-900/20"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-cyan-500/10" />
                <div className="relative z-10 flex h-full flex-col">
                  {/* Top accent */}
                  <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

                  <div className="space-y-4 p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(
                            item.updatedAt || item.createdAt
                          ).toLocaleDateString()}
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
                              copyToClipboard(
                                item.username,
                                item._id as string,
                                "username"
                              )
                            }
                            className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                          >
                            {copiedId === `${item._id}-username` ? (
                              <Check className="text-emerald-500" size={16} />
                            ) : (
                              <Copy size={16} />
                            )}
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
                              copyToClipboard(
                                item.password,
                                item._id as string,
                                "password"
                              )
                            }
                            className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                          >
                            {copiedId === `${item._id}-password` ? (
                              <Check className="text-emerald-500" size={16} />
                            ) : (
                              <Copy size={16} />
                            )}
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

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2 sm:justify-end sm:gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 flex-1 border-emerald-200 text-sm text-emerald-700 transition-all hover:bg-emerald-50 sm:flex-none dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
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
                        size="sm"
                        className="h-10 flex-1 text-sm sm:flex-none"
                      >
                        Move to Trash
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:w-full">
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
                  {showGenerator ? (
                    <div className="flex h-11 w-full items-center justify-between border border-transparent px-3 sm:h-10">
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        Using Password Generator
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowGenerator(false)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
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
                        onClick={() => setShowGenerator(true)}
                        className="absolute top-0 right-0 flex h-11 w-10 items-center justify-center text-emerald-500 hover:text-emerald-600 sm:h-10 dark:hover:text-emerald-400"
                        title="Open Password Generator"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
                {showGenerator && (
                  <div className="mt-2">
                    <PasswordGenerator
                      onGenerate={(password) =>
                        setEditableData({
                          ...editableData,
                          password,
                        })
                      }
                    />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">Tags</Label>
                <TagInput
                  tags={editableData.tags || []}
                  setTags={(tags) => setEditableData({ ...editableData, tags })}
                />
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
                  disabled={
                    !hasChanges ||
                    !editableData.website ||
                    !editableData.password
                  }
                  className="h-11 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-auto dark:from-emerald-500 dark:to-teal-500"
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
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">
              Move to Trash
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to move this password to the trash? You can
              restore it later if needed.
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
              Move to Trash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
