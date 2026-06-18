"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Camera, Loader2, Save, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { showToast } from "@/lib/toast";

export default function ProfilePage() {
  const { user, updateUser, isLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
    ? username !== user.username || email !== user.email || password.length > 0
    : false;

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      showToast({
        title: "Validation Error",
        description: "Passwords do not match.",
      });
      return;
    }
    setIsSaving(true);

    try {
      const payload: Record<string, string> = { username, email };
      if (password) payload.password = password;

      const updateRes = await axios.post(
        "/api/v1/auth/profile/update",
        payload
      );
      updateUser(updateRes.data.user);
      setPassword(""); // Clear password fields
      setConfirmPassword("");
      showToast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error("Profile update failed", error);
      showToast({
        title: "Update Failed",
        description: "Could not update profile details.",
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

            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSaving || !hasChanges}
                className="h-11 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:from-emerald-500 dark:to-teal-500"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
