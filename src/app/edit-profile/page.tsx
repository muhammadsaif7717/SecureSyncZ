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
import { Shield, Camera, Loader2, Save, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { showToast } from "@/lib/toast";
import { REGEXP_ONLY_DIGITS } from "input-otp";

export default function ProfilePage() {
  const { user, updateUser, isLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [showPasskey, setShowPasskey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Confirmation Modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // Sync state when user loads
  React.useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Loading profile...
      </div>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 2MB to ensure fast loading
    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      showToast({
        title: "File Too Large",
        description:
          "Profile picture must be less than 2MB for faster loading.",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    if (!apiKey) {
      showToast({
        title: "Error",
        description: "IMGBB API Key is missing from .env",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const imgbbRes = await axios.post(
        `https://api.imgbb.com/1/upload?key=${apiKey}`,
        formData
      );
      const imageUrl = imgbbRes.data.data.url;

      // Update user in DB
      const updateRes = await axios.post("/api/v1/auth/profile/update", {
        profilePicture: imageUrl,
      });

      updateUser(updateRes.data.user);
      showToast({ title: "Success", description: "Profile picture updated!" });
    } catch (error) {
      console.error("Image upload failed", error);
      showToast({
        title: "Upload Failed",
        description: "Failed to upload image. Check API key.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const hasChanges = user
    ? username !== user.username ||
      email !== user.email ||
      password.length > 0 ||
      passkey.length === 6
    : false;

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges) {
      showToast({ title: "Info", description: "No changes to save." });
      return;
    }

    if (password && password !== confirmPassword) {
      showToast({ title: "Error", description: "Passwords do not match." });
      return;
    }

    // Instead of calling the API right away, open the modal to get current password
    setIsConfirmModalOpen(true);
  };

  const confirmAndSubmitUpdate = async () => {
    if (!currentPassword) {
      showToast({
        title: "Error",
        description: "Please enter your current password.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload: Record<string, string> = {
        username,
        email,
        currentPassword,
      };
      if (password) payload.password = password;
      if (passkey.length === 6) payload.passkey = passkey;

      const updateRes = await axios.post(
        "/api/v1/auth/profile/update",
        payload
      );
      updateUser(updateRes.data.user);
      setPassword(""); // Clear password fields
      setConfirmPassword("");
      setCurrentPassword("");
      setPasskey("");
      setIsConfirmModalOpen(false);
      showToast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (err) {
      showToast({
        title: err instanceof Error ? err.message : "Error",
        description: axios.isAxiosError(err)
          ? err.response?.data?.error || "Failed to update profile."
          : "Failed to update profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-start justify-center bg-slate-50 px-4 py-6 sm:min-h-[calc(100vh-60px)] sm:py-10 dark:bg-[#0a0e1a]">
      <div className="glass w-full max-w-xl overflow-hidden rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20">
        <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        <div className="p-6 sm:p-8">
          <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Profile Settings
          </h1>

          {/* Avatar Section */}
          <div className="mb-8 flex flex-col items-center justify-center gap-4">
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

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Username
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/5"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/5"
              />
            </div>

            <div className="pt-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                New Password (Optional)
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Leave blank to keep current password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-slate-200 bg-white/60 pr-10 dark:border-white/10 dark:bg-white/5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 p-0.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {password && (
              <div className="pt-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 border-slate-200 bg-white/60 pr-10 dark:border-white/10 dark:bg-white/5"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 p-0.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2">
              <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300">
                <span>New 6-Digit Passkey (Optional)</span>
                <button
                  type="button"
                  onClick={() => setShowPasskey(!showPasskey)}
                  className="p-0.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showPasskey ? "Hide passkey" : "Show passkey"}
                >
                  {showPasskey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </label>
              <div className="flex justify-center pt-2">
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={passkey}
                  onChange={(value) => setPasskey(value)}
                >
                  <InputOTPGroup className="gap-2">
                    {[...Array(6)].map((_, i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        showChar={showPasskey}
                        className="h-10 w-10 rounded-md border-slate-200 bg-white/60 text-base sm:h-12 sm:w-12 sm:text-lg dark:border-white/10 dark:bg-white/5"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Must be exactly 6 digits.
              </p>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={!hasChanges}
                className="h-11 w-full bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.99] disabled:opacity-50 dark:from-emerald-500 dark:to-teal-500"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="glass mx-4 max-w-[calc(100vw-2rem)] rounded-2xl sm:mx-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">
              Confirm Changes
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Please enter your current password to apply these updates to your
              profile.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Current Password
              </label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && currentPassword && !isSaving) {
                      e.preventDefault();
                      confirmAndSubmitUpdate();
                    }
                  }}
                  className="h-11 border-slate-200 bg-white/60 pr-10 text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  autoFocus
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
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:space-x-2">
            <Button
              variant="outline"
              className="h-11 text-sm sm:h-10"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAndSubmitUpdate}
              disabled={!currentPassword || isSaving}
              className="h-11 bg-gradient-to-r from-emerald-600 to-teal-600 text-sm text-white sm:h-10 dark:from-emerald-500 dark:to-teal-500"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirm Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
