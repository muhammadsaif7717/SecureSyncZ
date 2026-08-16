"use client";

import React, { useState, useEffect } from "react";
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
import { Eye, EyeOff, Shield, Mail, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import { deriveKey, decryptData } from "@/lib/clientCrypto";
import { TwoFactorPrompt } from "@/components/auth/TwoFactorPrompt";
import { GoogleLogin } from "@react-oauth/google";
import { useTheme } from "next-themes";

export default function SignInPage() {
  const userAuth = useAuth();
  const { user, login, isLoading } = userAuth;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [errorShake, setErrorShake] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const [showTwoFactorPrompt, setShowTwoFactorPrompt] = useState(false);
  const [twoFactorMethods, setTwoFactorMethods] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setFormError("");
    setIsSubmitting(true);
    try {
      const result = await login(email, password);

      if (result?.require2FA) {
        setTwoFactorMethods(result.methods || []);
        setShowTwoFactorPrompt(true);
      } else {
        // login was successful!
        userAuth.updateUser(result.user);
        router.push("/passwords");
      }
    } catch (error: any) {
      setFormError(error?.message || "Invalid credentials");
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
      // Error is handled and toasted by AuthProvider
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4 py-8 sm:py-12 dark:bg-[#0a0e1a]">
      {/* Background glow effects */}
      <div className="animate-glow-pulse absolute top-1/4 left-1/4 h-48 w-48 rounded-full bg-emerald-500/10 blur-[80px] sm:h-72 sm:w-72 dark:bg-emerald-500/[0.06]" />
      <div className="animate-glow-pulse absolute right-1/4 bottom-1/4 h-48 w-48 rounded-full bg-teal-500/10 blur-[80px] sm:h-72 sm:w-72 dark:bg-teal-500/[0.05]" />

      <Card className="animate-fade-in-up glass relative w-full max-w-[420px] overflow-hidden rounded-[2rem] border border-white/20 shadow-2xl backdrop-blur-xl transition-all duration-500 dark:border-white/5 dark:shadow-emerald-900/20">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10" />
        <div className="relative z-10">
          <CardHeader className="space-y-2 px-5 pt-6 text-center sm:px-6 sm:pt-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-inner dark:shadow-none">
              <Image
                src="/logo.png"
                alt="Logo"
                width={64}
                height={64}
                className="rounded-2xl drop-shadow-md"
              />
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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFormError("");
                    }}
                    required
                    className={`h-11 bg-white/60 pl-10 text-sm transition-colors focus:bg-white sm:h-10 sm:pl-10 dark:bg-white/5 dark:focus:bg-white/[0.07] ${
                      formError
                        ? "border-red-500 focus:border-red-500"
                        : "border-slate-200 focus:border-emerald-300 dark:border-white/10 dark:focus:border-emerald-500/30"
                    } ${errorShake ? "animate-shake" : ""}`}
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
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFormError("");
                    }}
                    required
                    className={`h-11 bg-white/60 pr-10 text-sm transition-colors focus:bg-white sm:h-10 sm:pr-10 dark:bg-white/5 dark:focus:bg-white/[0.07] ${
                      formError
                        ? "border-red-500 focus:border-red-500"
                        : "border-slate-200 focus:border-emerald-300 dark:border-white/10 dark:focus:border-emerald-500/30"
                    } ${errorShake ? "animate-shake" : ""}`}
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
                {formError && (
                  <p className="animate-fade-in-up mt-1 text-xs text-red-500">
                    {formError}
                  </p>
                )}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="mt-2 flex h-11 w-full items-center justify-center bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.99] sm:h-10 dark:from-emerald-500 dark:to-teal-500"
                disabled={isLoading || isSubmitting}
              >
                {isLoading || isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200 dark:border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-50 px-2 text-slate-500 dark:bg-slate-900/80 dark:text-slate-400">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    if (credentialResponse.credential) {
                      setIsSubmitting(true);
                      try {
                        const result = await userAuth.googleLogin(
                          credentialResponse.credential
                        );

                        if (result?.require2FA) {
                          setTwoFactorMethods(result.methods || []);
                          setShowTwoFactorPrompt(true);
                        } else {
                          // login was successful!
                          userAuth.updateUser(result.user);
                          router.push("/passwords");
                        }
                      } catch (error) {
                        // Error handled by provider
                      } finally {
                        setIsSubmitting(false);
                      }
                    }
                  }}
                  onError={() => {
                    showToast({
                      title: "Google Login Failed",
                      description: "Could not authenticate with Google.",
                    });
                  }}
                  theme={
                    mounted && resolvedTheme === "dark"
                      ? "filled_black"
                      : "outline"
                  }
                  size="large"
                  width="100%"
                  text="continue_with"
                  shape="rectangular"
                />
              </div>
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
        </div>
      </Card>

      <TwoFactorPrompt
        isOpen={showTwoFactorPrompt}
        onClose={() => setShowTwoFactorPrompt(false)}
        methods={twoFactorMethods}
        onSuccess={(user) => {
          setShowTwoFactorPrompt(false);
          userAuth.updateUser(user);
          router.push("/passwords");
        }}
      />

      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
    </div>
  );
}
