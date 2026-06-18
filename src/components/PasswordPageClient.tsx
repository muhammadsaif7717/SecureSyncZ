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

const loadPasswordsData = async () => {
  const data = await getPasswords();
  return data;
};

export default function PasswordPageClient({ name }: { name: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editableData, setEditableData] = useState<PasswordsData | null>(null);

  const [isVerified, setIsVerified] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<PasswordsData[]>({
    queryKey: ["passwords"],
    queryFn: loadPasswordsData,
  });

  const fetchedPasswordsData = data ?? [];

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passkey.length !== 6) return;

    setIsVerifying(true);
    try {
      const response = await axios.post("/api/v1/auth/passkey/verify", {
        passkey,
      });
      if (response.data.success) {
        setIsVerified(true);
        showToast({ title: "Success", description: "Passkey verified!" });
      }
    } catch (err) {
      showToast({ title: "Error", description: "Invalid passkey. Try again." });
      setPasskey("");
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (passkey.length === 6 && !isVerifying) {
      handleVerify();
    }
  }, [passkey]);

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
    (item) => extractRootDomain(item.website).toLowerCase() === decodedName
  );

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

    const EditedData = {
      username: editableData.username,
      password: editableData.password,
      note: editableData.note,
      website: editableData.website,
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

  const handleToggleFavorite = async (item: PasswordsData) => {
    try {
      const url = await getURL();
      await axios.put(`${url}/passwords/update/${item._id}`, {
        username: item.username,
        password: item.password,
        note: item.note,
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

  if (!isVerified) {
    return (
      <section className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center bg-slate-50 px-4 py-6 sm:min-h-[calc(100vh-60px)] dark:bg-[#0a0e1a]">
        <div className="w-full max-w-md">
          <Card className="glass overflow-hidden rounded-2xl border border-emerald-500/20 p-6 shadow-xl dark:shadow-emerald-500/5">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
                Verify Passkey
              </h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                Please enter your 6-digit passkey to access passwords for{" "}
                <span className="font-semibold capitalize">{name}</span>.
              </p>

              <form
                onSubmit={handleVerify}
                className="flex w-full flex-col items-center space-y-6"
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
                        className="h-12 w-12 rounded-md border-slate-200 bg-white/60 text-lg sm:h-14 sm:w-14 sm:text-xl dark:border-white/10 dark:bg-white/5"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>

                <Button
                  type="submit"
                  disabled={passkey.length !== 6 || isVerifying}
                  className="h-11 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.99] dark:from-emerald-500 dark:to-teal-500"
                >
                  {isVerifying ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Verify Access
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section>
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
          <span className="capitalize">{name}</span> Passwords
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
                      <Input
                        value={item.username}
                        readOnly
                        className="h-10 border-slate-200 bg-white/50 pr-10 text-sm dark:border-white/[0.08] dark:bg-white/5"
                      />
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
                        className="inline-flex items-center gap-1.5 text-sm text-emerald-600 transition-colors hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
                      >
                        <Globe className="h-4 w-4" />
                        {item.website}
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
                      <Input
                        type={visible[item._id as string] ? "text" : "password"}
                        value={item.password}
                        readOnly
                        className="h-10 border-slate-200 bg-white/50 pr-20 text-sm dark:border-white/[0.08] dark:bg-white/5"
                      />
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
          ))
        )}
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
