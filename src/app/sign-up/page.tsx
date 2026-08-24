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
import {
  Eye,
  EyeOff,
  Shield,
  Mail,
  User,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { showToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ModeToggle } from "@/components/mode-toggle";
import { GoogleLogin } from "@react-oauth/google";
import { useTheme } from "next-themes";

export default function SignUpPage() {
  const userAuth = useAuth();
  const { signup, isLoading } = userAuth;
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [errorShake, setErrorShake] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setFormError("");
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
      return;
    }

    setIsSubmitting(true);
    try {
      // Create user without validation string (it will be set during Passkey setup)
      await signup(username, email, password);

      // Redirect to passwords page where Passkey and Secret Key setup will happen
      router.push("/passwords");
    } catch (error: any) {
      setFormError(error?.response?.data?.error || "Registration failed");
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
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-cyan-500/10" />
        <div className="relative z-10">
          <CardHeader className="space-y-2 px-5 pt-6 text-center sm:px-6 sm:pt-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-inner dark:shadow-none">
              <Image
                src="/brand-logo.png"
                alt="Logo"
                width={64}
                height={64}
                className="rounded-2xl drop-shadow-md"
                style={{ width: "auto", height: "auto" }}
              />
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
                    onChange={(e) => {
                      setUsername(e.target.value);
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
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setFormError("");
                  }}
                  required
                  className={`h-11 bg-white/60 text-sm transition-colors focus:bg-white sm:h-10 dark:bg-white/5 dark:focus:bg-white/[0.07] ${
                    formError
                      ? "border-red-500 focus:border-red-500"
                      : "border-slate-200 focus:border-emerald-300 dark:border-white/10 dark:focus:border-emerald-500/30"
                  } ${errorShake ? "animate-shake" : ""}`}
                  disabled={isLoading || isSubmitting}
                />
              </div>
              {formError && (
                <p className="animate-fade-in-up mt-1 text-xs text-red-500">
                  {formError}
                </p>
              )}

              <Button
                type="submit"
                className="mt-2 flex h-11 w-full items-center justify-center bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.99] sm:h-10 dark:from-emerald-500 dark:to-teal-500"
                disabled={isLoading || isSubmitting}
              >
                {isLoading || isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
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
                        await userAuth.googleLogin(
                          credentialResponse.credential
                        );
                        router.push("/passwords");
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
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                Sign In
              </Link>
            </p>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
