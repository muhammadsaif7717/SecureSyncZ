"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { showToast } from "@/lib/toast";
import {
  Trash2,
  RefreshCcw,
  Key,
  CreditCard,
  FileText,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface TrashItem {
  _id: string;
  type: "password" | "card" | "note";
  title: string;
  deletedAt: string;
}

export default function TrashPageClient() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [isEmptyDialogOpen, setIsEmptyDialogOpen] = useState(false);

  const fetchTrashItems = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/v1/trash/get");
      setItems(response.data);
    } catch (error) {
      showToast({
        title: "Error",
        description: "Failed to fetch trash items.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashItems();
  }, []);

  const handleRestore = async (item: TrashItem) => {
    setIsActionLoading(`restore-${item._id}`);
    try {
      await axios.post("/api/v1/trash/restore", {
        id: item._id,
        type: item.type,
      });
      showToast({
        title: "Restored",
        description: `${item.title} has been restored successfully.`,
      });
      fetchTrashItems();
    } catch (error) {
      showToast({
        title: "Error",
        description: "Failed to restore item.",
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const handlePermanentDelete = async (item: TrashItem) => {
    setIsActionLoading(`delete-${item._id}`);
    try {
      let endpoint = "";
      if (item.type === "password")
        endpoint = `/api/v1/passwords/delete/${item._id}?permanent=true`;
      if (item.type === "card")
        endpoint = `/api/v1/cards/delete/${item._id}?permanent=true`;
      if (item.type === "note")
        endpoint = `/api/v1/notes/delete/${item._id}?permanent=true`;

      await axios.delete(endpoint);
      showToast({
        title: "Deleted Permanently",
        description: `${item.title} has been permanently deleted.`,
      });
      fetchTrashItems();
    } catch (error) {
      showToast({
        title: "Error",
        description: "Failed to delete item permanently.",
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleEmptyTrash = () => {
    setIsEmptyDialogOpen(true);
  };

  const confirmEmptyTrash = async () => {
    setIsActionLoading("empty-trash");
    try {
      await axios.delete("/api/v1/trash/empty");
      showToast({
        title: "Trash Emptied",
        description: "All items have been permanently deleted.",
      });
      fetchTrashItems();
    } catch (error) {
      showToast({
        title: "Error",
        description: "Failed to empty trash.",
      });
    } finally {
      setIsActionLoading(null);
      setIsEmptyDialogOpen(false);
    }
  };

  const getDaysRemaining = (deletedAtStr: string) => {
    const deletedAt = new Date(deletedAtStr);
    const expireDate = new Date(deletedAt);
    expireDate.setDate(expireDate.getDate() + 30);
    const today = new Date();

    const diffTime = expireDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  const getIcon = (type: string) => {
    if (type === "password")
      return <Key className="h-5 w-5 text-emerald-500" />;
    if (type === "card")
      return <CreditCard className="h-5 w-5 text-blue-500" />;
    if (type === "note") return <FileText className="h-5 w-5 text-amber-500" />;
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-56px)] overflow-hidden bg-slate-50 sm:min-h-[calc(100vh-60px)] dark:bg-[#0a0e1a]">
      {/* Background glow effects */}
      <div className="animate-glow-pulse absolute top-1/4 left-1/4 h-48 w-48 rounded-full bg-emerald-500/10 blur-[80px] sm:h-72 sm:w-72 dark:bg-emerald-500/[0.06]" />
      <div className="animate-glow-pulse absolute right-1/4 bottom-1/4 h-48 w-48 rounded-full bg-teal-500/10 blur-[80px] sm:h-72 sm:w-72 dark:bg-teal-500/[0.05]" />

      <div className="relative z-10 mx-auto max-w-4xl p-4 sm:p-6 md:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Trash
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Items in the trash will be permanently deleted after 30 days.
            </p>
          </div>

          {items.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleEmptyTrash}
              disabled={isActionLoading === "empty-trash"}
              className="flex items-center gap-2"
            >
              {isActionLoading === "empty-trash" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Empty Trash
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <Card className="glass border-dashed text-center">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Trash2 className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                Your trash is empty
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                No items have been deleted recently.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => {
              const daysLeft = getDaysRemaining(item.deletedAt);

              return (
                <Card
                  key={item._id}
                  className="animate-fade-in-up glass group relative overflow-hidden rounded-[2rem] border border-white/20 p-0 shadow-xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl dark:border-white/5 dark:shadow-emerald-900/20"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-cyan-500/10" />
                  <div className="relative z-10">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800">
                          {getIcon(item.type)}
                        </div>
                        <div className="flex-1 truncate">
                          <CardTitle className="truncate text-base">
                            {item.title}
                          </CardTitle>
                          <CardDescription className="capitalize">
                            {item.type}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="mb-4 flex items-center text-xs text-orange-600 dark:text-orange-400">
                        <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                        Deletes in {daysLeft} {daysLeft === 1 ? "day" : "days"}
                      </div>
                      <div className="flex w-full gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                          onClick={() => handleRestore(item)}
                          disabled={isActionLoading !== null}
                        >
                          {isActionLoading === `restore-${item._id}` ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCcw className="mr-2 h-4 w-4" />
                          )}
                          Restore
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
                          onClick={() => handlePermanentDelete(item)}
                          disabled={isActionLoading !== null}
                        >
                          {isActionLoading === `delete-${item._id}` ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={isEmptyDialogOpen} onOpenChange={setIsEmptyDialogOpen}>
          <DialogContent className="w-[calc(100vw-2rem)] sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">
                Empty Trash?
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                Are you sure you want to empty the trash? All items will be
                permanently deleted and cannot be recovered.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEmptyDialogOpen(false)}
                disabled={isActionLoading === "empty-trash"}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmEmptyTrash}
                disabled={isActionLoading === "empty-trash"}
                className="w-full sm:w-auto"
              >
                {isActionLoading === "empty-trash" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Empty Trash
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
