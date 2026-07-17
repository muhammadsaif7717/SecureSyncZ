"use client";

import { useState, useEffect } from "react";
import { Copy, FileText, KeyRound, Loader2, Search } from "lucide-react";
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
import VerifyPasskey from "@/components/VerifyPasskey";

const loadNotesData = async (cryptoKey: CryptoKey | null) => {
  const data = await getNotes(cryptoKey);
  return data;
};

export default function NotePageClient({ name }: { name: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editableData, setEditableData] = useState<NotesData | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { cryptoKey, isUnlocked } = useEncryption();

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast({
      title: "✅ Copied to clipboard",
      description: `Note has been copied successfully. It will be cleared from your clipboard in 30 seconds.`,
    });

    setTimeout(async () => {
      try {
        const currentClipboard = await navigator.clipboard.readText();
        if (currentClipboard === text) {
          await navigator.clipboard.writeText("");
          showToast({
            title: "🛡️ Clipboard Cleared",
            description:
              "Your copied data has been removed from the clipboard for security.",
          });
        }
      } catch (e) {}
    }, 30000);
  };

  const decodedSlug = decodeURIComponent(name)
    .toLowerCase()
    .replace(/\s+/g, "-");

  const filteredNotes = fetchedNotesData.filter((item) => {
    return item.title.toLowerCase().replace(/\s+/g, "-") === decodedSlug;
  });

  const actualName =
    filteredNotes.length > 0
      ? filteredNotes[0].title
      : decodeURIComponent(name);

  const displayNotes = filteredNotes.filter((item) =>
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    } catch (err) {
      showToast({
        title: err instanceof Error ? err.message : "Error",
        description: "Failed to delete note.",
      });
    }
  };

  if (filteredNotes.length === 0) {
    return (
      <div className="mt-10 text-center text-sm font-medium text-red-500 dark:text-red-400">
        No notes found.
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <VerifyPasskey
        reasonText={
          <>
            Please enter your 6-digit passkey to access notes for{" "}
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
          <FileText className="h-6 w-6 text-emerald-500" />
          <span className="capitalize">{actualName}</span>
        </h2>

        {displayNotes.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Note not found.
          </p>
        ) : (
          displayNotes.map((item) => (
            <Card
              key={item._id}
              className="glass group mb-5 space-y-4 overflow-hidden rounded-2xl p-0 shadow-lg shadow-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 sm:mb-6 dark:shadow-black/20"
            >
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
                      onClick={() => copyToClipboard(item.title)}
                      className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      <Copy size={16} />
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
                      onClick={() => copyToClipboard(item.content)}
                      className="absolute top-2 right-2 p-1 text-slate-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      <Copy size={16} />
                    </button>
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
              Are you sure you want to delete this note? This action cannot be
              undone.
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
