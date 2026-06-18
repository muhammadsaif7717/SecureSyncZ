"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Key, CreditCard, ArrowRight, Clipboard } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

export default function Home() {
  const { user } = useAuth();

  const features = [
    {
      icon: <Key className="h-5 w-5 text-emerald-500 sm:h-6 sm:w-6" />,
      title: "Password Manager",
      description:
        "Store, organize, and copy your passwords securely with automatic clipboard integration.",
    },
    {
      icon: <CreditCard className="h-5 w-5 text-teal-500 sm:h-6 sm:w-6" />,
      title: "Credit Card Vault",
      description:
        "Manage your credit cards, expiry dates, and CVVs in a clean and safe digital environment.",
    },
    {
      icon: <Shield className="h-5 w-5 text-cyan-500 sm:h-6 sm:w-6" />,
      title: "Advanced Passkeys",
      description:
        "Skip the traditional passwords and use secure 6-digit passkeys for instant and safe vault access.",
    },
    {
      icon: <Clipboard className="h-5 w-5 text-green-500 sm:h-6 sm:w-6" />,
      title: "Profile Personalization",
      description:
        "Customize your vault experience with fast profile picture uploads and dynamic user settings.",
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-56px)] overflow-hidden bg-slate-50 sm:min-h-[calc(100vh-60px)] dark:bg-[#0a0e1a]">
      {/* Background glow orbs */}
      <div className="animate-glow-pulse absolute top-[-100px] left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[100px] sm:h-[450px] sm:w-[450px] dark:bg-emerald-500/[0.07]" />
      <div className="animate-glow-pulse absolute top-1/3 right-0 h-[200px] w-[200px] rounded-full bg-teal-500/10 blur-[80px] sm:right-1/4 sm:h-[300px] sm:w-[300px] dark:bg-teal-500/[0.05]" />
      <div className="animate-float absolute bottom-1/4 left-0 h-[150px] w-[150px] rounded-full bg-cyan-500/10 blur-[60px] sm:left-1/6 sm:h-[200px] sm:w-[200px] dark:bg-cyan-500/[0.04]" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 text-center sm:px-6 sm:py-20">
        {/* Banner badge */}
        <div className="animate-fade-in-up mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50/60 px-3 py-1 text-xs font-semibold text-emerald-700 sm:mb-6 sm:px-4 sm:py-1.5 sm:text-sm dark:border-emerald-500/20 dark:bg-emerald-950/30 dark:text-emerald-400">
          <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Secure Vault Database</span>
        </div>

        {/* Title */}
        <h1 className="animate-fade-in-up mx-auto max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          <span className="block text-slate-900 dark:text-white">
            Securely Manage Your
          </span>
          <span className="gradient-text mt-1 block sm:mt-2">
            Passwords & Credit Cards
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up stagger-1 mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:mt-6 sm:max-w-2xl sm:text-base md:text-lg dark:text-slate-400">
          SecureSyncZ provides a premium, client-side verified vault to store
          and access your sensitive data securely. Protected by custom JWT
          authentication and modern 6-digit Passkeys for lightning-fast access.
        </p>

        {/* Buttons */}
        <div className="animate-fade-in-up stagger-2 mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4">
          {user ? (
            <Link href="/passwords" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30 sm:w-auto dark:from-emerald-500 dark:to-teal-500"
              >
                Enter Vault <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-up" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98] sm:w-auto dark:from-emerald-500 dark:to-teal-500"
                >
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="glass w-full border-slate-200 text-slate-700 transition-all hover:border-emerald-300 hover:text-emerald-700 sm:w-auto dark:border-white/10 dark:text-slate-300 dark:hover:border-emerald-500/30 dark:hover:text-emerald-400"
                >
                  Access Vault
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Features Section */}
        <div className="animate-fade-in-up stagger-3 mx-auto mt-16 max-w-5xl sm:mt-24">
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="glass group relative rounded-2xl p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/5 sm:p-6"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 transition-transform group-hover:scale-110 sm:mb-4 dark:bg-white/5">
                  {feature.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 sm:text-lg dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500 sm:mt-2 sm:text-sm dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
