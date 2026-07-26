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
} from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { showToast } from "@/lib/toast";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { DeleteDataModal } from "@/components/DeleteDataModal";
import { compressImage } from "@/lib/utils";

export default function ProfilePage() {
  const { user, updateUser, isLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Modals state
  const [activeModal, setActiveModal] = useState<
    "username" | "email" | "password" | "passkey" | "delete" | null
  >(null);
  const [deleteDataModalOpen, setDeleteDataModalOpen] = useState(false);

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
    if (user) {
      setNewUsername(user.username);
      setNewEmail(user.email);
    }
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

    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    if (!apiKey) {
      setIsUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("image", imageToUpload, file.name);
      const imgbbRes = await axios.post(
        `https://api.imgbb.com/1/upload?key=${apiKey}`,
        formData
      );
      const imageUrl = imgbbRes.data.data.url;
      const updateRes = await axios.post("/api/v1/auth/profile/update", {
        profilePicture: imageUrl,
      });
      updateUser(updateRes.data.user);
      showToast({ title: "Success", description: "Profile picture updated!" });
    } catch (error) {
      showToast({
        title: "Upload Failed",
        description: "Failed to upload image.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendCode = async () => {
    setIsSendingCode(true);
    try {
      const payload = activeModal === "email" ? { newEmail } : {};
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

    if (!currentPassword) {
      showToast({
        title: "Error",
        description: "Please enter your current password.",
      });
      return;
    }

    if (activeModal === "password" && newPassword !== confirmPassword) {
      showToast({ title: "Error", description: "Passwords do not match." });
      return;
    }

    if (activeModal === "delete") {
      if (otp.length !== 6) {
        showToast({
          title: "Error",
          description: "Please enter the 6-digit verification code.",
        });
        return;
      }
    }

    setIsSaving(true);
    try {
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
      if (activeModal === "username") payload.username = newUsername;
      if (activeModal === "email") {
        payload.email = newEmail;
      }
      if (activeModal === "password") payload.password = newPassword;
      if (activeModal === "passkey") payload.passkey = newPasskey;

      const updateRes = await axios.post(
        "/api/v1/auth/profile/update",
        payload
      );

      const updatedUser = updateRes.data.user;

      if (activeModal === "email") {
        updateUser({ ...updatedUser, isVerified: true });
        setTimeout(() => {
          updateUser(updatedUser);
        }, 1000);
      } else {
        updateUser(updatedUser);
      }

      showToast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      closeModal();
    } catch (err) {
      showToast({
        title: "Error",
        description: axios.isAxiosError(err)
          ? err.response?.data?.error || "Failed to update."
          : "Failed to update.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Loading profile...
      </div>
    );
  }

  const renderCurrentPasswordInput = () => (
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
          className="h-11 border-slate-200 bg-white/60 pr-10 text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
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

  const renderOtpInput = () => (
    <div className="pt-4 text-center">
      {!codeSent ? (
        <div>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            For security, we need to verify it's you. A 6-digit code will be
            sent to{" "}
            <strong>{activeModal === "email" ? newEmail : user?.email}</strong>.
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
    <div className="flex min-h-[calc(100vh-56px)] items-start justify-center bg-slate-50 px-4 pt-6 pb-32 sm:min-h-[calc(100vh-60px)] sm:pt-10 sm:pb-36 dark:bg-[#0a0e1a]">
      <div className="w-full max-w-2xl space-y-6">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Profile Settings
        </h1>

        {/* Avatar Section */}
        <div className="glass flex flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl p-6 shadow-sm sm:p-8 dark:shadow-black/20">
          <div className="group relative h-24 w-24 overflow-hidden rounded-full shadow-lg ring-4 ring-emerald-500/20">
            {user.profilePicture ? (
              <Image
                src={user.profilePicture}
                alt="Profile"
                fill
                sizes="96px"
                priority
                unoptimized
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

        {/* Profile Details Card */}
        <div className="glass overflow-hidden rounded-2xl shadow-sm dark:shadow-black/20">
          <div className="border-b border-slate-200/50 bg-slate-50/50 px-6 py-4 dark:border-white/5 dark:bg-slate-900/50">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Profile Details
            </h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Username
                </p>
                <p
                  className="mt-1 truncate text-base font-medium text-slate-900 dark:text-white"
                  title={user.username}
                >
                  {user.username}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setActiveModal("username")}
              >
                <Edit2 className="mr-2 h-4 w-4" /> Edit
              </Button>
            </div>
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Email Address
                </p>
                <p
                  className="mt-1 truncate text-base font-medium text-slate-900 dark:text-white"
                  title={user.email}
                >
                  {user.email}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setActiveModal("email")}
              >
                <Edit2 className="mr-2 h-4 w-4" /> Edit
              </Button>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="glass overflow-hidden rounded-2xl shadow-sm dark:shadow-black/20">
          <div className="border-b border-slate-200/50 bg-slate-50/50 px-6 py-4 dark:border-white/5 dark:bg-slate-900/50">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
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
                  Update your account password
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModal("password")}
              >
                Change Password
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

        {/* Danger Zone Card */}
        <div className="glass overflow-hidden rounded-2xl border border-red-200/50 shadow-sm dark:border-red-900/50 dark:shadow-black/20">
          <div className="bg-red-50/50 px-6 py-4 dark:bg-red-950/20">
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-500">
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
              {activeModal === "username" && "Update Username"}
              {activeModal === "email" && "Update Email Address"}
              {activeModal === "password" && "Change Password"}
              {activeModal === "passkey" &&
                (user.hasPasskey ? "Update Passkey" : "Setup Passkey")}
              {activeModal === "delete" && "Delete Account"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              {activeModal === "delete"
                ? "Are you absolutely sure? This action is irreversible."
                : "Enter your new details below."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4 py-2">
            {activeModal === "username" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  New Username
                </label>
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
            )}

            {activeModal === "email" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  New Email Address
                </label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
            )}

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
                type="submit"
                disabled={
                  isSaving ||
                  !currentPassword ||
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
