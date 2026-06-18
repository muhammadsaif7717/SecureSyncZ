"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

const loadPasswordsData = async () => {
  const data = await getPasswords();
  return data;
};

export default function PasswordPageClient({ name }: { name: string }) {
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editableData, setEditableData] = useState<PasswordsData | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<PasswordsData[]>({
    queryKey: ["passwords"],
    queryFn: loadPasswordsData,
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
      description: `${type === "password" ? "Password" : "Username"} has been copied successfully.`,
    });
  };

  const decodedName = decodeURIComponent(name).toLowerCase();

  const filteredPassData = fetchedPasswordsData.filter(
    (item) => item.website.toLowerCase() === decodedName
  );

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editableData) return;

    const EditedData = {
      username: editableData.username,
      password: editableData.password,
      note: editableData.note,
    };

    const id = editableData._id;
    const url = await getURL();
    console.log(url);

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

  return (
    <section>
      <div className="mx-auto max-w-xl px-4 py-6 sm:p-6">
        <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-900 sm:mb-6 sm:text-2xl dark:text-white">
          <Lock className="h-5 w-5 text-emerald-500 sm:h-6 sm:w-6" />
          <span className="capitalize">{name}</span> Passwords
        </h2>

        {filteredPassData.map((item) => (
          <Card
            key={item._id}
            className="glass group mb-5 space-y-4 overflow-hidden rounded-2xl p-0 shadow-lg shadow-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 sm:mb-6 dark:shadow-black/20"
          >
            {/* Top accent */}
            <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

            <div className="space-y-4 p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Username
                  </Label>
                  <div className="relative">
                    <Input
                      value={item.username}
                      readOnly
                      className="h-10 border-slate-200 bg-white/50 pr-10 text-sm dark:border-white/[0.08] dark:bg-white/5"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.username, "username")}
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
                  <a
                    href={`https://${item.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    {item.website}
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={visible[item._id as string] ? "text" : "password"}
                      value={item.password}
                      readOnly
                      className="h-10 border-slate-200 bg-white/50 pr-20 text-sm dark:border-white/[0.08] dark:bg-white/5"
                    />
                    <button
                      type="button"
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
                      onClick={() => copyToClipboard(item.password, "password")}
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
                  <Input
                    placeholder={item.note || "No note available"}
                    readOnly
                    className="h-10 border-slate-200 bg-white/50 text-sm dark:border-white/[0.08] dark:bg-white/5"
                  />
                </div>
              </div>

              {/* Action buttons — stack on mobile */}
              <div className="flex flex-col gap-2 pt-3 sm:flex-row sm:justify-between sm:gap-4 sm:pt-4">
                <Button
                  variant="outline"
                  className="h-10 border-emerald-200 text-sm text-emerald-700 transition-all hover:bg-emerald-50 sm:w-1/4 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
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
                  className="h-10 text-sm sm:w-1/4"
                >
                  Delete
                </Button>
                <Button variant="secondary" className="h-10 text-sm sm:w-1/4">
                  Share
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass mx-4 max-w-[calc(100vw-2rem)] rounded-2xl sm:mx-auto sm:max-w-md">
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
                <Input
                  id="password"
                  value={editableData.password}
                  onChange={(e) =>
                    setEditableData({
                      ...editableData,
                      password: e.target.value,
                    })
                  }
                  className="h-11 text-sm sm:h-10"
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
        <DialogContent className="glass mx-4 max-w-[calc(100vw-2rem)] rounded-2xl sm:mx-auto sm:max-w-md">
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
