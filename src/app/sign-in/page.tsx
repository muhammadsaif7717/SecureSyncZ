"use client";

import React, { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Shield, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ModeToggle } from "@/components/mode-toggle";

export default function SignInPage() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSecretKeyModal, setShowSecretKeyModal] = useState(false);
  const [secretKeyInput, setSecretKeyInput] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await login(email, password);
      // login was successful!
      const existingKey = localStorage.getItem("secureSyncZ_secretKey");
      if (existingKey && /^[0-9a-fA-F]{64}$/.test(existingKey)) {
        router.push("/passwords");
      } else {
        setShowSecretKeyModal(true);
      }
    } catch (error) {
      // Error is handled and toasted by AuthProvider
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSecretKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const key = secretKeyInput.trim();
    if (/^[0-9a-fA-F]{64}$/.test(key)) {
      localStorage.setItem("secureSyncZ_secretKey", key);
      setShowSecretKeyModal(false);
      router.push("/passwords");
      showToast({
        title: "Key Restored",
        description: "Your secret key was successfully restored.",
      });
    } else {
      showToast({
        title: "Invalid Key",
        description: "Please enter a valid 64-character hex Secret Key.",
      });
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4 py-8 sm:py-12 dark:bg-[#0a0e1a]">
      {/* Background glow effects */}
      <div className="animate-glow-pulse absolute top-1/4 left-1/4 h-48 w-48 rounded-full bg-emerald-500/10 blur-[80px] sm:h-72 sm:w-72 dark:bg-emerald-500/[0.06]" />
      <div className="animate-glow-pulse absolute right-1/4 bottom-1/4 h-48 w-48 rounded-full bg-teal-500/10 blur-[80px] sm:h-72 sm:w-72 dark:bg-teal-500/[0.05]" />

      <Card className="animate-fade-in-up glass relative w-full max-w-[420px] shadow-xl shadow-black/5 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/5 dark:shadow-black/20">
        <CardHeader className="space-y-2 px-5 pt-6 text-center sm:px-6 sm:pt-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Shield className="h-6 w-6" />
          </div>
          <CardTitle className="gradient-text text-2xl font-extrabold tracking-tight sm:text-3xl">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
            Sign in to access your secure credential vault
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-medium text-slate-700 sm:text-sm dark:text-slate-300"
              >
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 border-slate-200 bg-white/60 pl-10 text-sm transition-colors focus:border-emerald-300 focus:bg-white sm:h-10 dark:border-white/10 dark:bg-white/5 dark:focus:border-emerald-500/30 dark:focus:bg-white/[0.07]"
                  disabled={isLoading || isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs font-medium text-slate-700 sm:text-sm dark:text-slate-300"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 border-slate-200 bg-white/60 pr-10 text-sm transition-colors focus:border-emerald-300 focus:bg-white sm:h-10 dark:border-white/10 dark:bg-white/5 dark:focus:border-emerald-500/30 dark:focus:bg-white/[0.07]"
                  disabled={isLoading || isSubmitting}
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

            <Button
              type="submit"
              className="mt-2 h-11 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.99] sm:h-10 dark:from-emerald-500 dark:to-teal-500"
              disabled={isLoading || isSubmitting}
            >
              {isLoading || isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center border-t border-slate-100 px-5 py-4 sm:px-6 dark:border-white/[0.06]">
          <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>

      {/* Secret Key Modal */}
      <Dialog open={showSecretKeyModal} onOpenChange={setShowSecretKeyModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Your Secret Key</DialogTitle>
            <DialogDescription>
              We detected you are logging in from a new device or your secure
              storage was cleared. Please provide your 64-character Secret Key
              to unlock your vault.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSecretKeySubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key</Label>
              <Input
                id="secretKey"
                type="text"
                placeholder="Paste your 64-character hex key..."
                value={secretKeyInput}
                onChange={(e) => setSecretKeyInput(e.target.value)}
                required
                className="font-mono text-sm"
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Restore Key & Continue
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
