"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Copy, FileText, KeyRound, Loader2, Search, Check } from "lucide-react";
import { TagInput } from "@/components/TagInput";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import getNotes from "@/lib/getNotes";
import { useQuery } from "@tanstack/react-query";
import { NotesData } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/lib/toast";
import getURL from "@/lib/getURL";
import axios from "axios";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useEncryption } from "@/providers/EncryptionProvider";
import { encryptData } from "@/lib/clientCrypto";

import { useAuth } from "@/providers/AuthProvider";
import PremiumPaywallModal from "@/components/PremiumPaywallModal";
import VerifyPasskey from "@/components/VerifyPasskey";

const loadNotesData = async (cryptoKey: CryptoKey | null) => {
  const data = await getNotes(cryptoKey);
  return data;
};

export default function NotePageClient({ name }: { name: string }) {
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editableData, setEditableData] = useState<NotesData | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { cryptoKey, isUnlocked } = useEncryption();
  const { user } = useAuth();
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (user && !user.isPremium) {
      setShowPaywall(true);
    }
  }, [user]);

  const { data, isLoading, refetch } = useQuery<NotesData[]>({
    queryKey: ["notes", !!cryptoKey],
    queryFn: () => loadNotesData(cryptoKey),
  });

  const fetchedNotesData = data ?? [];

  if (isLoading) {
    return (
      <div className="mt-10 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
        Loading...
      </div>
    );
  }

  const copyToClipboard = (
    text: string,
    id: string,
    type: "title" | "content" = "content"
  ) => {
    navigator.clipboard.writeText(text);
    setCopiedId(`${id}-${type}`);
    setTimeout(() => setCopiedId(null), 2000);
    showToast({
      title: "✅ Copied to clipboard",
      description: `Note has been copied successfully. It will be cleared from your clipboard in 30 seconds.`,
    });

    setTimeout(async () => {
      try {
        const currentClipboard = await navigator.clipboard.readText();
        if (currentClipboard === text) {
          await navigator.clipboard.writeText("");
        }
      } catch (e) {}
    }, 30000);
  };

  const decodedSlug = decodeURIComponent(name)
    .toLowerCase()
    .replace(/\s+/g, "-");

  const filteredNotesData = fetchedNotesData.filter((item) => {
    return item.title.toLowerCase().replace(/\s+/g, "-") === decodedSlug;
  });

  if (!isUnlocked) {
    return (
      <VerifyPasskey
        reasonText={
          <>Please enter your 6-digit passkey to access your secure notes.</>
        }
      />
    );
  }

  const actualName =
    filteredNotesData.length > 0
      ? filteredNotesData[0].title
      : decodeURIComponent(name);

  const displayNotes = filteredNotesData.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const originalItem = editableData
    ? fetchedNotesData.find((p) => p._id === editableData._id)
    : null;
  const hasChanges =
    editableData && originalItem
      ? (editableData.title || "") !== (originalItem.title || "") ||
        (editableData.content || "") !== (originalItem.content || "") ||
        JSON.stringify(editableData.tags || []) !==
          JSON.stringify(originalItem.tags || [])
      : false;

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editableData) return;

    const encryptedContent = await encryptData(
      editableData.content,
      cryptoKey!
    );

    const EditedData = {
      title: editableData.title,
      content: encryptedContent,
      isFavorite: editableData.isFavorite,
      tags: editableData.tags,
    };

    const id = editableData._id;
    const url = await getURL();

    try {
      const response = await axios.put(`${url}/notes/update/${id}`, EditedData);

      if (!response.data) {
        throw new Error("Failed to update note");
      }

      showToast({
        title: "✅ Note updated successfully",
        description: "Your note has been updated.",
      });

      setIsDialogOpen(false);
      await refetch();
    } catch (err) {
      showToast({
        title: err instanceof Error ? err.message : "Error",
        description: "Failed to update note.",
      });
    }
  };

  const handleToggleFavorite = async (item: NotesData) => {
    try {
      const url = await getURL();
      const encryptedContent = await encryptData(item.content, cryptoKey!);

      await axios.put(`${url}/notes/update/${item._id}`, {
        ...item,
        content: encryptedContent,
        isFavorite: !item.isFavorite,
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
      const response = await axios.delete(`${url}/notes/delete/${deleteId}`);
      if (!response.data) {
        throw new Error("Failed to delete note");
      }

      showToast({
        title: "✅ Note deleted successfully",
        description: "Your note has been deleted.",
      });

      setIsDeleteDialogOpen(false);
      setDeleteId(null);
      await refetch();
      if (filteredNotesData.length <= 1) {
        router.push("/notes");
      }
    } catch (err) {
      showToast({
        title: err instanceof Error ? err.message : "Error",
        description: "Failed to delete note.",
      });
    }
  };

  if (filteredNotesData.length === 0) {
    if (user && !user.isPremium) {
      return (
        <div className="flex min-h-[calc(100vh-56px)] items-center justify-center p-4">
          <PremiumPaywallModal
            isOpen={true}
            onClose={() => window.history.back()}
            featureName="Secure Notes"
          />
        </div>
      );
    }
    return (
      <div className="mt-20 flex flex-col items-center justify-center space-y-4 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-50 dark:bg-cyan-500/10">
          <FileText className="h-10 w-10 text-cyan-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          No notes found
        </h3>
        <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
          You haven't saved any secure notes here yet. Add your first note to
          keep your private text safe.
        </p>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <VerifyPasskey
        reasonText={
          <>Please enter your 6-digit passkey to access your secure notes.</>
        }
      />
    );
  }

  return (
    <section className="pb-28">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:p-6">
        <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-900 sm:mb-6 sm:text-2xl dark:text-white">
          <FileText className="h-6 w-6 text-emerald-500" />
          <span className="capitalize">{actualName}</span>
        </h2>

        {displayNotes.length === 0 && searchQuery !== "" ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No notes found matching "{searchQuery}".
          </p>
        ) : (
          <div
            className={
              displayNotes.length === 1
                ? "mx-auto max-w-2xl"
                : "grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3"
            }
          >
            {displayNotes.map((item) => (
              <Card
                key={item._id}
                className="animate-fade-in-up glass group relative h-full space-y-4 overflow-hidden rounded-[2rem] border border-white/20 p-0 shadow-xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl dark:border-white/5 dark:shadow-emerald-900/20"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-cyan-500/10" />
                <div className="relative z-10 flex h-full flex-col">
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

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Title
                      </Label>
                      <div className="relative">
                        <div className="flex h-auto min-h-[40px] w-full items-center rounded-md border border-slate-200 bg-white/50 px-3 py-2 pr-10 text-sm break-words break-all whitespace-pre-wrap dark:border-white/[0.08] dark:bg-white/5">
                          {item.title}
                        </div>
                        <button
                          type="button"
                          aria-label="Copy title"
                          onClick={() =>
                            copyToClipboard(
                              item.title,
                              item._id as string,
                              "title"
                            )
                          }
                          className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                          {copiedId === `${item._id}-title` ? (
                            <Check className="text-emerald-500" size={16} />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Content
                      </Label>
                      <div className="relative">
                        <div className="min-h-[120px] w-full rounded-md border border-slate-200 bg-white/50 px-3 py-2 pr-10 text-sm break-words break-all whitespace-pre-wrap dark:border-white/[0.08] dark:bg-white/5">
                          {item.content}
                        </div>
                        <button
                          type="button"
                          aria-label="Copy content"
                          onClick={() =>
                            copyToClipboard(
                              item.content,
                              item._id as string,
                              "content"
                            )
                          }
                          className="absolute top-2 right-2 rounded-md bg-white/80 p-1 text-slate-400 backdrop-blur-sm transition-colors hover:text-emerald-600 dark:bg-slate-900/80 dark:hover:text-emerald-400"
                        >
                          {copiedId === `${item._id}-content` ? (
                            <Check className="text-emerald-500" size={16} />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2 sm:justify-end sm:gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 flex-1 border-emerald-200 text-sm text-emerald-700 transition-all hover:bg-emerald-50 sm:flex-none dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                        onClick={() => {
                          if (user && !user.isPremium) {
                            setShowPaywall(true);
                            return;
                          }
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
              Edit Note
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Update your secure note below.
            </DialogDescription>
          </DialogHeader>

          {editableData && (
            <form onSubmit={handleEdit} className="space-y-3.5 sm:space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs sm:text-sm">
                  Title
                </Label>
                <Input
                  id="title"
                  value={editableData.title}
                  onChange={(e) =>
                    setEditableData({
                      ...editableData,
                      title: e.target.value,
                    })
                  }
                  className="h-11 text-sm sm:h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="content" className="text-xs sm:text-sm">
                  Content
                </Label>
                <Textarea
                  id="content"
                  value={editableData.content}
                  onChange={(e) =>
                    setEditableData({
                      ...editableData,
                      content: e.target.value,
                    })
                  }
                  className="min-h-[150px] text-sm break-words break-all"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">Tags</Label>
                <TagInput
                  tags={editableData.tags || []}
                  setTags={(tags) => setEditableData({ ...editableData, tags })}
                />
              </div>
              <DialogFooter className="pt-3 sm:pt-4">
                <Button
                  type="submit"
                  disabled={
                    !hasChanges || !editableData.title || !editableData.content
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
              Are you sure you want to move this note to the trash? You can
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
      {/* Premium Paywall Modal for Edit block */}
      <PremiumPaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName="Secure Notes"
      />
    </section>
  );
}
