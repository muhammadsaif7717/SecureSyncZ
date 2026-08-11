"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Camera,
  Loader2,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Check,
  X,
  Crown,
} from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { showToast } from "@/lib/toast";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { DeleteDataModal } from "@/components/DeleteDataModal";
import { compressImage, cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, updateUser, isLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Modals state
  const [activeModal, setActiveModal] = useState<
    "password" | "passkey" | "delete" | "inline_confirm" | null
  >(null);
  const [deleteDataModalOpen, setDeleteDataModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<"username" | "email" | null>(
    null
  );
  const [formError, setFormError] = useState("");
  const [errorShake, setErrorShake] = useState(false);

  // Form states
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasskey, setNewPasskey] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [otp, setOtp] = useState("");

  // Visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  React.useEffect(() => {
    if (user) {
      setNewUsername(user.username);
      setNewEmail(user.email);
    }
  }, [user]);

  const closeModal = () => {
    setActiveModal(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setNewPasskey("");
    setOtp("");
    setCodeSent(false);
    setFormError("");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // Compress the image
    let imageToUpload: Blob = file;
    try {
      imageToUpload = await compressImage(file);
    } catch (error) {
      // console.warn("Image compression failed, using original file");
    }

    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    if (imageToUpload.size > MAX_FILE_SIZE) {
      setIsUploading(false);
      showToast({
        title: "File Too Large",
        description:
          "Profile picture must be less than 2MB even after compression.",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", imageToUpload);

      const uploadRes = await axios.post("/api/v1/upload", formData);
      const imageUrl = uploadRes.data.url;
      const updateRes = await axios.post("/api/v1/auth/profile/update", {
        profilePicture: imageUrl,
      });
      updateUser(updateRes.data.user);
      showToast({ title: "Success", description: "Profile picture updated!" });
    } catch (error) {
      showToast({
        title: "Upload Failed",
        description: "Failed to upload image to Cloudinary.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendCode = async () => {
    setIsSendingCode(true);
    try {
      const payload = { newEmail }; // Using newEmail just as dummy if needed
      await axios.post("/api/v1/auth/send-verification", payload);
      setCodeSent(true);
      showToast({
        title: "Verification Code Sent",
        description: "Please check your email.",
      });
    } catch (err) {
      showToast({
        title: "Error",
        description: "Failed to send verification code.",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setFormError("");
    if (user?.hasPassword && !currentPassword) {
      setFormError("Please enter your current password.");
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
      return;
    }

    if (activeModal === "password" && newPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
      return;
    }

    if (activeModal === "delete") {
      if (otp.length !== 6) {
        setFormError("Please enter the 6-digit verification code.");
        setErrorShake(true);
        setTimeout(() => setErrorShake(false), 500);
        return;
      }
    }

    setIsSaving(true);
    try {
      if (activeModal === "inline_confirm") {
        const payload: Record<string, string> = { currentPassword };
        if (editingField === "username") payload.username = newUsername;
        if (editingField === "email") payload.email = newEmail;

        const updateRes = await axios.post(
          "/api/v1/auth/profile/update",
          payload
        );
        updateUser(updateRes.data.user);

        showToast({
          title: "Success",
          description: `${editingField === "username" ? "Username" : "Email"} updated successfully!`,
        });
        closeModal();
        setEditingField(null);
        return;
      }

      if (activeModal === "delete") {
        await axios.post("/api/v1/auth/delete-account", {
          currentPassword,
          otp,
        });
        showToast({
          title: "Account Deleted",
          description: "Your account has been permanently deleted.",
        });
        window.location.href = "/sign-up";
        return;
      }

      const payload: Record<string, string> = { currentPassword };
      if (activeModal === "password") payload.password = newPassword;
      if (activeModal === "passkey") payload.passkey = newPasskey;

      const updateRes = await axios.post(
        "/api/v1/auth/profile/update",
        payload
      );

      const updatedUser = updateRes.data.user;

      updateUser(updatedUser);

      showToast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      closeModal();
    } catch (err: any) {
      setFormError(err?.response?.data?.error || "Failed to update.");
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-start justify-center bg-slate-50 px-4 pt-6 pb-32 sm:min-h-[calc(100vh-60px)] sm:pt-10 sm:pb-36 dark:bg-[#0a0e1a]">
        <div className="w-full max-w-2xl space-y-6">
          <div className="h-8 w-48 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
          <div className="glass flex flex-col items-center justify-center gap-4 rounded-2xl p-6 sm:p-8">
            <div className="h-24 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-48 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="glass overflow-hidden rounded-2xl">
            <div className="bg-slate-50/50 px-6 py-4 dark:bg-slate-900/50">
              <div className="h-6 w-32 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              <div className="px-6 py-4">
                <div className="h-10 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="px-6 py-4">
                <div className="h-10 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderCurrentPasswordInput = () => {
    if (!user.hasPassword) return null;

    return (
      <div className="space-y-1.5 pt-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Current Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Input
            type={showCurrentPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className={`h-11 border-slate-200 bg-white/60 pr-10 text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 ${
              formError ? "border-red-500 focus:border-red-500" : ""
            }`}
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute top-1/2 right-3 -translate-y-1/2 p-0.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
          >
            {showCurrentPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderOtpInput = () => (
    <div className="pt-4 text-center">
      {!codeSent ? (
        <div>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            For security, we need to verify it's you. A 6-digit code will be
            sent to <strong>{user?.email}</strong>.
          </p>
          <Button
            onClick={handleSendCode}
            disabled={isSendingCode}
            variant="outline"
            className="w-full"
            type="button"
          >
            {isSendingCode ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Send Verification Code
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <label className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            Enter 6-Digit Verification Code
          </label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={otp}
              onChange={(value) => setOtp(value)}
              onComplete={() => {
                setTimeout(() => {
                  document.getElementById("modal-submit-btn")?.click();
                }, 150);
              }}
              autoFocus
            >
              <InputOTPGroup className="gap-1 sm:gap-2">
                {[...Array(6)].map((_, i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="h-9 w-9 rounded-md border-slate-200 bg-white/60 text-base sm:h-12 sm:w-12 sm:text-lg dark:border-white/10 dark:bg-white/5"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <button
            type="button"
            onClick={handleSendCode}
            disabled={isSendingCode}
            className="mt-4 text-sm text-emerald-600 hover:underline disabled:no-underline disabled:opacity-50 dark:text-emerald-500"
          >
            {isSendingCode ? "Sending..." : "Resend Code"}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative min-h-[calc(100vh-56px)] overflow-hidden bg-slate-50 px-4 py-8 sm:py-12 dark:bg-[#0a0e1a]">
      {/* Background glow effects */}
      <div className="animate-glow-pulse absolute top-1/4 left-1/4 h-48 w-48 rounded-full bg-emerald-500/10 blur-[80px] sm:h-72 sm:w-72 dark:bg-emerald-500/[0.06]" />
      <div className="animate-glow-pulse absolute right-1/4 bottom-1/4 h-48 w-48 rounded-full bg-teal-500/10 blur-[80px] sm:h-72 sm:w-72 dark:bg-teal-500/[0.05]" />

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center justify-center space-y-6 pt-6 pb-32 sm:pt-10 sm:pb-36">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Profile Settings
        </h1>

        {/* Avatar Section */}
        <div className="animate-fade-in-up glass group relative flex w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-[2rem] border border-white/20 p-6 shadow-xl backdrop-blur-xl transition-all duration-500 hover:shadow-2xl sm:p-8 dark:border-white/5 dark:shadow-emerald-900/20">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div
              className={cn(
                "group relative h-28 w-28 overflow-hidden rounded-full shadow-lg ring-4",
                user.isPremium
                  ? "shadow-[0_0_20px_rgba(251,191,36,0.5)] ring-amber-400 dark:shadow-[0_0_20px_rgba(245,158,11,0.4)] dark:ring-amber-500"
                  : "ring-emerald-500/20"
              )}
            >
              {user.profilePicture ? (
                <Image
                  src={user.profilePicture}
                  alt="Profile"
                  fill
                  sizes="96px"
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                  <Shield className="h-10 w-10" />
                </div>
              )}
              <div
                className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Click the image to upload a new avatar
            </p>
          </div>
        </div>

        {/* Profile Details Card */}
        <div className="animate-fade-in-up stagger-1 glass group relative w-full overflow-hidden rounded-[2rem] border border-white/20 shadow-xl backdrop-blur-xl transition-all duration-500 hover:shadow-2xl dark:border-white/5 dark:shadow-emerald-900/20">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10" />
          <div className="relative z-10">
            <div className="border-b border-white/20 bg-white/40 px-6 py-5 dark:border-white/5 dark:bg-white/5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Profile Details
              </h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              <div className="flex items-center justify-between gap-4 px-6 py-4 transition-all">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Username
                  </p>
                  {editingField === "username" ? (
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="h-9 w-full max-w-[200px]"
                        autoFocus
                        disabled={isSaving}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            setActiveModal("inline_confirm");
                          if (e.key === "Escape") setEditingField(null);
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
                        onClick={() => setActiveModal("inline_confirm")}
                        disabled={isSaving}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-400"
                        onClick={() => setEditingField(null)}
                        disabled={isSaving}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center gap-2">
                      <p
                        className="flex items-center gap-2 truncate text-base font-medium text-slate-900 dark:text-white"
                        title={user.username}
                      >
                        {user.username}
                        {user.isPremium && (
                          <Crown className="h-4 w-4 text-amber-500 drop-shadow-sm" />
                        )}
                      </p>
                      <button
                        onClick={() => setEditingField("username")}
                        className="p-1 text-slate-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 px-6 py-4 transition-all">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Email Address
                  </p>
                  {editingField === "email" ? (
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="h-9 w-full max-w-[240px]"
                        autoFocus
                        disabled={isSaving}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            setActiveModal("inline_confirm");
                          if (e.key === "Escape") setEditingField(null);
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
                        onClick={() => setActiveModal("inline_confirm")}
                        disabled={isSaving}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-400"
                        onClick={() => setEditingField(null)}
                        disabled={isSaving}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center gap-2">
                      <p
                        className="truncate text-base font-medium text-slate-900 dark:text-white"
                        title={user.email}
                      >
                        {user.email}
                      </p>
                      <button
                        onClick={() => setEditingField("email")}
                        className="p-1 text-slate-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="animate-fade-in-up stagger-2 glass group relative w-full overflow-hidden rounded-[2rem] border border-white/20 shadow-xl backdrop-blur-xl transition-all duration-500 hover:shadow-2xl dark:border-white/5 dark:shadow-emerald-900/20">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10" />
            <div className="relative z-10">
              <div className="border-b border-white/20 bg-white/40 px-6 py-5 dark:border-white/5 dark:bg-white/5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Security
                </h2>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                <div className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Password
                    </p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                      {user.hasPassword
                        ? "Update your account password"
                        : "You haven't set a password yet"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveModal("password")}
                    className={
                      !user.hasPassword
                        ? "border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                        : ""
                    }
                  >
                    {user.hasPassword ? "Change Password" : "Set Password"}
                  </Button>
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Passkey PIN
                    </p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                      {user.hasPasskey
                        ? "Update your 6-digit passkey"
                        : "Set up a 6-digit passkey"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveModal("passkey")}
                  >
                    {user.hasPasskey ? "Update Passkey" : "Setup Passkey"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone Card */}
        <div className="animate-fade-in-up stagger-3 glass group relative w-full overflow-hidden rounded-[2rem] border border-red-200/50 shadow-xl backdrop-blur-xl transition-all duration-500 hover:shadow-2xl dark:border-red-900/50 dark:shadow-red-900/20">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-500/5 via-orange-500/5 to-red-500/5 dark:from-red-500/10 dark:via-orange-500/10 dark:to-red-500/10" />
          <div className="relative z-10">
            <div className="border-b border-red-200/50 bg-red-50/50 px-6 py-5 dark:border-red-900/50 dark:bg-red-950/20">
              <h2 className="text-xl font-bold text-red-600 dark:text-red-500">
                Danger Zone
              </h2>
            </div>
            <div className="divide-y divide-red-100 dark:divide-red-950/50">
              <div className="flex flex-col justify-between gap-4 px-6 py-6 sm:flex-row sm:items-center">
                <div>
                  <p className="font-medium text-red-600 dark:text-red-500">
                    Delete All Data
                  </p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    Erase all your saved passwords, cards, and secure notes
                    without deleting your account.
                  </p>
                </div>
                <Button
                  onClick={() => setDeleteDataModalOpen(true)}
                  variant="outline"
                  className="shrink-0 border-red-200 font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-500 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete All Data
                </Button>
              </div>

              <div className="flex flex-col justify-between gap-4 px-6 py-6 sm:flex-row sm:items-center">
                <div>
                  <p className="font-medium text-red-600 dark:text-red-500">
                    Delete Account
                  </p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    Permanently delete your account and all associated data.
                  </p>
                </div>
                <Button
                  onClick={() => setActiveModal("delete")}
                  variant="destructive"
                  className="shrink-0 font-semibold"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Modal Rendering */}
      <Dialog
        open={activeModal !== null}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent className="rounded-2xl bg-white sm:max-w-md dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle
              className={
                activeModal === "delete"
                  ? "text-red-600 dark:text-red-500"
                  : "text-slate-900 dark:text-white"
              }
            >
              {activeModal === "password" &&
                (user.hasPassword ? "Change Password" : "Set Password")}
              {activeModal === "passkey" &&
                (user.hasPasskey ? "Update Passkey" : "Setup Passkey")}
              {activeModal === "delete" && "Delete Account"}
              {activeModal === "inline_confirm" && "Confirm Changes"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              {activeModal === "delete"
                ? "Are you absolutely sure? This action is irreversible."
                : activeModal === "inline_confirm"
                  ? "Enter your current password to save changes."
                  : "Enter your new details below."}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleUpdate}
            className={`space-y-4 py-2 ${errorShake ? "animate-shake" : ""}`}
          >
            {activeModal === "password" && (
              <>
                <div className="relative">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    New Password
                  </label>
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 bottom-3 text-slate-400"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="relative">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Confirm New Password
                  </label>
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 bottom-3 text-slate-400"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </>
            )}

            {activeModal === "passkey" && (
              <div className="flex flex-col items-center pt-2">
                <label className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  New 6-Digit Passkey
                  <button
                    type="button"
                    onClick={() => setShowPasskey(!showPasskey)}
                    className="ml-2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasskey ? (
                      <EyeOff className="inline h-4 w-4" />
                    ) : (
                      <Eye className="inline h-4 w-4" />
                    )}
                  </button>
                </label>
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={newPasskey}
                  onChange={setNewPasskey}
                >
                  <InputOTPGroup className="gap-1 sm:gap-2">
                    {[...Array(6)].map((_, i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        showChar={showPasskey}
                        className="h-9 w-9 border-slate-200 text-base sm:h-12 sm:w-12 sm:text-lg dark:border-white/10 dark:bg-white/5"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            )}

            {renderCurrentPasswordInput()}

            {activeModal === "delete" && renderOtpInput()}

            {formError && (
              <p className="mt-1 text-xs text-red-500">{formError}</p>
            )}

            <DialogFooter className="flex-col gap-2 pt-4 sm:flex-row sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full sm:h-10 sm:w-auto"
                onClick={closeModal}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                id="modal-submit-btn"
                type="submit"
                disabled={
                  isSaving ||
                  (user.hasPassword && !currentPassword) ||
                  (activeModal === "delete" &&
                    (!codeSent || otp.length !== 6)) ||
                  (activeModal === "passkey" && newPasskey.length !== 6) ||
                  (activeModal === "password" &&
                    (!newPassword || newPassword !== confirmPassword))
                }
                variant={activeModal === "delete" ? "destructive" : "default"}
                className={`h-11 w-full sm:h-10 sm:w-auto ${
                  activeModal !== "delete"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500"
                    : ""
                }`}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {activeModal === "delete" ? "Confirm Deletion" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteDataModal
        isOpen={deleteDataModalOpen}
        onClose={() => setDeleteDataModalOpen(false)}
      />
    </div>
  );
}
