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
import { Eye, EyeOff, Shield, Mail, User } from "lucide-react";
import { showToast } from "@/lib/toast";
import { generateSecretKey } from "@/lib/clientCrypto";
import { EmergencyKitModal } from "@/components/EmergencyKitModal";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const { signup, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [showEmergencyKit, setShowEmergencyKit] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (password !== confirmPassword) {
      showToast({
        title: "Validation Error",
        description: "Passwords do not match.",
      });
      return;
    }

    if (password.length < 6) {
      showToast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create user
      await signup(username, email, password);

      // Immediately generate Secret Key
      const newSecretKey = generateSecretKey();

      // Save it securely to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("secureSyncZ_secretKey", newSecretKey);
      }

      setSecretKey(newSecretKey);
      setShowEmergencyKit(true);

      // Note: We no longer automatically redirect to /passwords here.
      // We wait for the user to confirm the Emergency Kit modal.
    } catch (error) {
      // Error is handled and toasted by AuthProvider
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmergencyKitConfirm = () => {
    setShowEmergencyKit(false);
    router.push("/passwords");
  };

  return (
    <div className="relative flex min-h-[calc(100vh-56px)] items-center justify-center bg-slate-50 px-4 py-8 sm:min-h-[calc(100vh-60px)] sm:py-12 dark:bg-[#0a0e1a]">
      {/* Background glow effects */}
      <div className="animate-glow-pulse absolute top-1/4 left-1/4 h-48 w-48 rounded-full bg-emerald-500/10 blur-[80px] sm:h-72 sm:w-72 dark:bg-emerald-500/[0.06]" />
      <div className="animate-glow-pulse absolute right-1/4 bottom-1/4 h-48 w-48 rounded-full bg-teal-500/10 blur-[80px] sm:h-72 sm:w-72 dark:bg-teal-500/[0.05]" />

      <Card className="animate-fade-in-up glass relative w-full max-w-[420px] shadow-xl shadow-black/5 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/5 dark:shadow-black/20">
        <CardHeader className="space-y-2 px-5 pt-6 text-center sm:px-6 sm:pt-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Shield className="h-6 w-6" />
          </div>
          <CardTitle className="gradient-text text-2xl font-extrabold tracking-tight sm:text-3xl">
            Create Account
          </CardTitle>
          <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
            Securely manage all your credentials in one place
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label
                htmlFor="username"
                className="text-xs font-medium text-slate-700 sm:text-sm dark:text-slate-300"
              >
                Username
              </Label>
              <div className="relative">
                <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="john_doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-11 border-slate-200 bg-white/60 pl-10 text-sm transition-colors focus:border-emerald-300 focus:bg-white sm:h-10 dark:border-white/10 dark:bg-white/5 dark:focus:border-emerald-500/30 dark:focus:bg-white/[0.07]"
                  disabled={isLoading || isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
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

            <div className="space-y-1.5 sm:space-y-2">
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

            <div className="space-y-1.5 sm:space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-xs font-medium text-slate-700 sm:text-sm dark:text-slate-300"
              >
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-11 border-slate-200 bg-white/60 text-sm transition-colors focus:border-emerald-300 focus:bg-white sm:h-10 dark:border-white/10 dark:bg-white/5 dark:focus:border-emerald-500/30 dark:focus:bg-white/[0.07]"
                disabled={isLoading || isSubmitting}
              />
            </div>

            <Button
              type="submit"
              className="mt-2 h-11 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.99] sm:h-10 dark:from-emerald-500 dark:to-teal-500"
              disabled={isLoading || isSubmitting}
            >
              {isLoading || isSubmitting
                ? "Creating Account..."
                : "Create Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center border-t border-slate-100 px-5 py-4 sm:px-6 dark:border-white/[0.06]">
          <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>

      {/* Zero Knowledge Emergency Kit Modal */}
      <EmergencyKitModal
        isOpen={showEmergencyKit}
        secretKey={secretKey}
        onConfirm={handleEmergencyKitConfirm}
      />
    </div>
  );
}
