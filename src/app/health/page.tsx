"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import getPasswords from "@/lib/getPasswords";
import { PasswordsData } from "@/types";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Key,
  KeyRound,
  Loader2,
  Flame,
} from "lucide-react";
import { extractRootDomain } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEncryption } from "@/providers/EncryptionProvider";
import { checkPwnedPassword } from "@/lib/hibp";
import { Card } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

import PremiumPaywallModal from "@/components/PremiumPaywallModal";
import VerifyPasskey from "@/components/VerifyPasskey";

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

export default function HealthDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { isUnlocked, cryptoKey } = useEncryption();

  const { data: passwords = [], isLoading: pLoading } = useQuery<
    PasswordsData[]
  >({
    queryKey: ["passwords", !!cryptoKey],
    queryFn: () => getPasswords(cryptoKey),
    enabled: !!user && !!cryptoKey,
  });

  const [compromisedPasswords, setCompromisedPasswords] = useState<
    PasswordsData[]
  >([]);
  const [isCheckingPwned, setIsCheckingPwned] = useState(false);

  React.useEffect(() => {
    if (!passwords.length || !isUnlocked || (user && !user.isPremium)) return;

    let isMounted = true;

    const checkPwned = async () => {
      setIsCheckingPwned(true);
      const compromised: PasswordsData[] = [];
      const checkedCache = new Map<string, boolean>();

      for (const p of passwords) {
        if (!isMounted) break;
        if (checkedCache.has(p.password)) {
          if (checkedCache.get(p.password)) {
            compromised.push(p);
          }
          continue;
        }

        const isCompromised = await checkPwnedPassword(p.password);
        checkedCache.set(p.password, isCompromised);
        if (isCompromised) {
          compromised.push(p);
        }
      }

      if (isMounted) {
        setCompromisedPasswords(compromised);
        setIsCheckingPwned(false);
      }
    };

    checkPwned();

    return () => {
      isMounted = false;
    };
  }, [passwords, isUnlocked, user]);

  const isLoading = authLoading || pLoading;

  const { weakPasswords, reusedPasswords, oldPasswords, totalScore } =
    useMemo(() => {
      if (!passwords.length)
        return {
          weakPasswords: [],
          reusedPasswords: [],
          oldPasswords: [],
          totalScore: 100,
        };

      const weak: PasswordsData[] = [];
      const old: PasswordsData[] = [];
      const passwordCounts = new Map<string, PasswordsData[]>();

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      passwords.forEach((p) => {
        // Weak Check
        if (getPasswordStrength(p.password) <= 2) {
          weak.push(p);
        }

        // Old Check
        if (new Date(p.createdAt) < sixMonthsAgo) {
          old.push(p);
        }

        // Reused Check
        if (!passwordCounts.has(p.password)) {
          passwordCounts.set(p.password, []);
        }
        passwordCounts.get(p.password)!.push(p);
      });

      const reused: PasswordsData[][] = Array.from(
        passwordCounts.values()
      ).filter((group) => group.length > 1);

      // Calculate score (out of 100)
      // -20 for each reused group, -10 for each weak password, -5 for each old password, -30 for compromised
      let penalty =
        reused.length * 20 +
        weak.length * 10 +
        old.length * 5 +
        compromisedPasswords.length * 30;
      const score = Math.max(0, 100 - penalty);

      return {
        weakPasswords: weak,
        reusedPasswords: reused,
        oldPasswords: old,
        totalScore: score,
      };
    }, [passwords, compromisedPasswords]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center text-sm text-slate-500">
        Loading Health Dashboard...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center text-sm text-slate-500">
        Sign in to view your password health.
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <VerifyPasskey reasonText="Please enter your 6-digit passkey to view your vault health." />
    );
  }

  if (user && !user.isPremium) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center p-4">
        <PremiumPaywallModal
          isOpen={true}
          onClose={() => window.history.back()}
          featureName="Security Dashboard"
        />
      </div>
    );
  }

  if (passwords.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center space-y-4 px-4 text-center text-sm text-slate-500">
        <ShieldCheck className="h-16 w-16 text-slate-200 dark:text-slate-800" />
        <p>
          No passwords found. Start adding passwords to see your health score.
        </p>
        <Link href="/add">
          <Button variant="outline">Add Password</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50 px-4 py-6 pb-32 sm:px-6 sm:py-10 sm:pb-36 dark:bg-[#0a0e1a]">
      <div className="mx-auto max-w-5xl space-y-8 sm:space-y-10">
        {/* Header / Score Card */}
        <div className="glass animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden rounded-[2rem] border border-white/20 p-8 shadow-2xl backdrop-blur-xl duration-700 dark:border-white/5 dark:shadow-emerald-900/20">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 dark:from-emerald-500/20 dark:via-teal-500/10 dark:to-cyan-500/20" />

          <div className="relative flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div className="mb-8 sm:mr-8 sm:mb-0">
              <h1 className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl lg:text-5xl dark:from-white dark:to-slate-300">
                Security Dashboard
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500 sm:text-base dark:text-slate-400">
                {totalScore >= 80
                  ? "Your vault is in pristine condition. Excellent security hygiene!"
                  : totalScore >= 50
                    ? "Your vault has some vulnerabilities. Consider updating weak or reused passwords to boost your score."
                    : "Critical security risks detected. Immediate action is required to secure your accounts."}
              </p>
            </div>

            <div className="group relative flex cursor-default flex-col items-center justify-center sm:items-end">
              <div
                className={`absolute top-1/2 right-0 -mt-16 h-40 w-40 rounded-full opacity-20 blur-3xl transition-all duration-700 group-hover:opacity-40 ${
                  totalScore >= 80
                    ? "bg-emerald-500"
                    : totalScore >= 50
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              />
              <div className="relative z-10 flex items-center gap-4 sm:gap-6">
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-[1.5rem] shadow-xl backdrop-blur-md transition-transform duration-500 group-hover:scale-105 sm:h-24 sm:w-24 ${
                    totalScore >= 80
                      ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                      : totalScore >= 50
                        ? "border border-yellow-500/20 bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400"
                        : "border border-red-500/20 bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                  }`}
                >
                  {totalScore >= 80 ? (
                    <ShieldCheck className="h-10 w-10 sm:h-12 sm:w-12" />
                  ) : totalScore >= 50 ? (
                    <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12" />
                  ) : (
                    <ShieldAlert className="h-10 w-10 sm:h-12 sm:w-12" />
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span
                    className={`text-5xl font-black tracking-tighter drop-shadow-sm sm:text-6xl ${
                      totalScore >= 80
                        ? "text-emerald-600 dark:text-emerald-400"
                        : totalScore >= 50
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {totalScore}
                  </span>
                  <div
                    className={`mt-1 flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-extrabold tracking-widest uppercase sm:text-xs ${
                      totalScore >= 80
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                        : totalScore >= 50
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300"
                          : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                    }`}
                  >
                    {totalScore >= 80
                      ? "Excellent"
                      : totalScore >= 50
                        ? "Fair"
                        : "Critical"}
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-6 w-full max-w-[280px] sm:w-[280px]">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/60 shadow-inner dark:bg-black/40">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      totalScore >= 80
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] dark:from-emerald-500 dark:to-emerald-400"
                        : totalScore >= 50
                          ? "bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.8)] dark:from-yellow-500 dark:to-yellow-400"
                          : "bg-gradient-to-r from-red-400 to-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] dark:from-red-500 dark:to-red-400"
                    }`}
                    style={{ width: `${totalScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {/* Compromised Passwords */}
          <div className="glass animate-in fade-in slide-in-from-bottom-4 fill-mode-both group relative min-w-0 overflow-hidden rounded-3xl border border-white/20 p-6 shadow-xl shadow-black/5 delay-100 duration-700 dark:border-white/5 dark:shadow-black/30">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-red-500/10 blur-3xl transition-transform duration-700 group-hover:scale-150" />
            <div className="relative z-10 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-100 to-red-50 text-red-600 shadow-inner dark:from-red-500/20 dark:to-red-500/5 dark:text-red-400">
                  <Flame className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Compromised
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {isCheckingPwned
                        ? "Scanning vaults..."
                        : `${compromisedPasswords.length} Found`}
                    </p>
                    {isCheckingPwned && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600 dark:text-red-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {!isCheckingPwned && compromisedPasswords.length > 0 ? (
              <div className="custom-scrollbar relative z-10 max-h-[60vh] space-y-3 overflow-auto pr-2 pb-24 sm:max-h-[400px] sm:pb-0">
                {compromisedPasswords.map((p) => (
                  <Link
                    key={p._id}
                    href={`/passwords/${encodeURIComponent(extractRootDomain(p.website).toLowerCase())}?search=${encodeURIComponent(p.username)}`}
                    className="glass flex items-center justify-between rounded-xl border border-white/20 bg-white/40 p-3 text-sm shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/60 hover:shadow-md dark:border-white/10 dark:bg-black/20 dark:hover:bg-red-500/20"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white p-1 shadow-sm">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${extractRootDomain(p.website)}&sz=64`}
                          alt={`${extractRootDomain(p.website)}`}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                      <span className="truncate font-semibold text-slate-700 dark:text-slate-200">
                        {extractRootDomain(p.website)}
                      </span>
                    </div>
                    <span className="shrink-0 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/20 dark:text-red-400">
                      Fix Now
                    </span>
                  </Link>
                ))}
              </div>
            ) : !isCheckingPwned ? (
              <div className="glass flex h-24 items-center justify-center rounded-xl border border-dashed border-white/40 bg-white/20 backdrop-blur-md dark:border-white/10 dark:bg-black/20">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Zero breaches found. Super secure!
                </p>
              </div>
            ) : (
              <div className="glass flex h-24 items-center justify-center rounded-xl border border-dashed border-red-300/50 bg-red-50/30 backdrop-blur-md dark:border-red-500/20 dark:bg-red-900/20">
                <p className="animate-pulse text-sm font-medium text-red-700 dark:text-red-300">
                  Analyzing against global data breaches...
                </p>
              </div>
            )}
          </div>

          {/* Weak Passwords */}
          <div className="glass animate-in fade-in slide-in-from-bottom-4 fill-mode-both group relative min-w-0 overflow-hidden rounded-3xl border border-white/20 p-6 shadow-xl shadow-black/5 delay-200 duration-700 dark:border-white/5 dark:shadow-black/30">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-red-500/10 blur-3xl transition-transform duration-700 group-hover:scale-150" />
            <div className="relative z-10 mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-100 to-red-50 text-red-600 shadow-inner dark:from-red-500/20 dark:to-red-500/5 dark:text-red-400">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Weak Passwords
                </h3>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {weakPasswords.length} Found
                </p>
              </div>
            </div>

            {weakPasswords.length > 0 ? (
              <div className="custom-scrollbar relative z-10 max-h-[60vh] space-y-3 overflow-auto pr-2 pb-24 sm:max-h-[400px] sm:pb-0">
                {weakPasswords.map((p) => (
                  <Link
                    key={p._id}
                    href={`/passwords/${encodeURIComponent(extractRootDomain(p.website).toLowerCase())}?search=${encodeURIComponent(p.username)}`}
                    className="glass flex items-center justify-between rounded-xl border border-white/20 bg-white/40 p-3 text-sm shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/60 hover:shadow-md dark:border-white/10 dark:bg-black/20 dark:hover:bg-red-500/20"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white p-1 shadow-sm">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${extractRootDomain(p.website)}&sz=64`}
                          alt={`${extractRootDomain(p.website)}`}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                      <span className="truncate font-semibold text-slate-700 dark:text-slate-200">
                        {extractRootDomain(p.website)}
                      </span>
                    </div>
                    <span className="shrink-0 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/20 dark:text-red-400">
                      Update
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="glass flex h-24 items-center justify-center rounded-xl border border-dashed border-white/40 bg-white/20 backdrop-blur-md dark:border-white/10 dark:bg-black/20">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No weak passwords. Great job!
                </p>
              </div>
            )}
          </div>

          {/* Reused Passwords */}
          <div className="glass animate-in fade-in slide-in-from-bottom-4 fill-mode-both group relative min-w-0 overflow-hidden rounded-3xl border border-white/20 p-6 shadow-xl shadow-black/5 delay-300 duration-700 dark:border-white/5 dark:shadow-black/30">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-yellow-500/10 blur-3xl transition-transform duration-700 group-hover:scale-150" />
            <div className="relative z-10 mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-100 to-yellow-50 text-yellow-600 shadow-inner dark:from-yellow-500/20 dark:to-yellow-500/5 dark:text-yellow-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Reused Passwords
                </h3>
                <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                  {reusedPasswords.length} Groups Found
                </p>
              </div>
            </div>
            {reusedPasswords.length > 0 ? (
              <div className="custom-scrollbar relative z-10 max-h-[60vh] space-y-5 overflow-auto pr-2 pb-24 sm:max-h-[400px] sm:pb-0">
                {reusedPasswords.map((group, idx) => (
                  <div
                    key={idx}
                    className="glass space-y-2 rounded-xl border border-white/20 bg-white/40 p-4 backdrop-blur-md dark:border-white/10 dark:bg-black/20"
                  >
                    <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                      Group {idx + 1}{" "}
                      <span className="lowercase opacity-80">
                        ({group.length} sites)
                      </span>
                    </p>
                    {group.map((p) => (
                      <Link
                        key={p._id}
                        href={`/passwords/${encodeURIComponent(extractRootDomain(p.website).toLowerCase())}?search=${encodeURIComponent(p.username)}`}
                        className="glass flex min-w-max items-center justify-between gap-4 rounded-lg border border-white/20 bg-white/50 p-2.5 text-sm shadow-sm backdrop-blur-md transition-all hover:bg-white/70 dark:border-white/10 dark:bg-black/40 dark:hover:bg-yellow-500/20"
                      >
                        <div className="flex items-center gap-3 whitespace-nowrap">
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${extractRootDomain(p.website)}&sz=64`}
                            alt={`${extractRootDomain(p.website)} icon`}
                            className="h-5 w-5 shrink-0 rounded bg-white p-0.5"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {extractRootDomain(p.website)}
                          </span>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-yellow-600 dark:text-yellow-500">
                          Change
                        </span>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass flex h-24 items-center justify-center rounded-xl border border-dashed border-white/40 bg-white/20 backdrop-blur-md dark:border-white/10 dark:bg-black/20">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No reused passwords. Excellent!
                </p>
              </div>
            )}
          </div>

          {/* Old Passwords */}
          <div className="glass animate-in fade-in slide-in-from-bottom-4 fill-mode-both group relative min-w-0 overflow-hidden rounded-3xl border border-white/20 p-6 shadow-xl shadow-black/5 delay-500 duration-700 dark:border-white/5 dark:shadow-black/30">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl transition-transform duration-700 group-hover:scale-150" />
            <div className="relative z-10 mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 shadow-inner dark:from-blue-500/20 dark:to-blue-500/5 dark:text-blue-400">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Old Passwords
                </h3>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {oldPasswords.length} Found
                </p>
              </div>
            </div>
            {oldPasswords.length > 0 ? (
              <div className="custom-scrollbar relative z-10 max-h-[60vh] space-y-3 overflow-auto pr-2 pb-24 sm:max-h-[400px] sm:pb-0">
                {oldPasswords.map((p) => (
                  <Link
                    key={p._id}
                    href={`/passwords/${encodeURIComponent(extractRootDomain(p.website).toLowerCase())}?search=${encodeURIComponent(p.username)}`}
                    className="glass flex min-w-max items-center justify-between gap-4 rounded-xl border border-white/20 bg-white/40 p-3 text-sm shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/60 hover:shadow-md dark:border-white/10 dark:bg-black/20 dark:hover:bg-blue-500/20"
                  >
                    <div className="flex items-center gap-3 whitespace-nowrap">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white p-1 shadow-sm">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${extractRootDomain(p.website)}&sz=64`}
                          alt={`${extractRootDomain(p.website)} icon`}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {extractRootDomain(p.website)}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">
                          {new Date(p.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                      Rotate
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="glass flex h-24 items-center justify-center rounded-xl border border-dashed border-white/40 bg-white/20 backdrop-blur-md dark:border-white/10 dark:bg-black/20">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  All passwords are fresh and updated!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
