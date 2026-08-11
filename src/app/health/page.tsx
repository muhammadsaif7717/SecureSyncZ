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
import VerifyPasskey from "@/components/VerifyPasskey";
import PremiumPaywallModal from "@/components/PremiumPaywallModal";

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
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/10 dark:to-pink-500/20" />

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

            <div className="group relative flex cursor-default items-center justify-center">
              <div
                className={`absolute inset-0 rounded-full opacity-20 blur-2xl transition-all duration-700 group-hover:opacity-40 ${
                  totalScore >= 80
                    ? "bg-emerald-500"
                    : totalScore >= 50
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              />
              <svg
                className="h-40 w-40 -rotate-90 transform drop-shadow-xl sm:h-48 sm:w-48"
                viewBox="0 0 100 100"
              >
                <circle
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="42"
                  cx="50"
                  cy="50"
                />
                <circle
                  className={`${
                    totalScore >= 80
                      ? "text-emerald-500"
                      : totalScore >= 50
                        ? "text-yellow-500"
                        : "text-red-500"
                  } transition-all duration-1000 ease-out`}
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={
                    2 * Math.PI * 42 - (totalScore / 100) * (2 * Math.PI * 42)
                  }
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="42"
                  cx="50"
                  cy="50"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={`text-4xl font-black tracking-tighter sm:text-5xl ${
                    totalScore >= 80
                      ? "text-emerald-600 dark:text-emerald-400"
                      : totalScore >= 50
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {totalScore}
                </span>
                <span className="mt-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase sm:text-xs">
                  Health
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {/* Compromised Passwords */}
          <div className="glass animate-in fade-in slide-in-from-bottom-4 fill-mode-both group relative min-w-0 overflow-hidden rounded-3xl border border-white/20 p-6 shadow-xl shadow-black/5 delay-100 duration-700 dark:border-white/5 dark:shadow-black/30">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl transition-transform duration-700 group-hover:scale-150" />
            <div className="relative z-10 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600 shadow-inner dark:from-purple-500/20 dark:to-purple-500/5 dark:text-purple-400">
                  <Flame className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Compromised
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                      {isCheckingPwned
                        ? "Scanning vaults..."
                        : `${compromisedPasswords.length} Found`}
                    </p>
                    {isCheckingPwned && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600 dark:text-purple-400" />
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
                    className="flex items-center justify-between rounded-xl bg-white/60 p-3 text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:bg-purple-50 hover:shadow-md dark:bg-white/5 dark:hover:bg-purple-500/20"
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
                    <span className="shrink-0 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                      Fix Now
                    </span>
                  </Link>
                ))}
              </div>
            ) : !isCheckingPwned ? (
              <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Zero breaches found. Super secure!
                </p>
              </div>
            ) : (
              <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-purple-200 bg-purple-50/50 dark:border-purple-900/30 dark:bg-purple-900/10">
                <p className="animate-pulse text-sm font-medium text-purple-600 dark:text-purple-400">
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
                    className="flex items-center justify-between rounded-xl bg-white/60 p-3 text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-md dark:bg-white/5 dark:hover:bg-red-500/20"
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
              <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
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
                    className="space-y-2 rounded-xl bg-slate-50/50 p-4 dark:bg-slate-900/30"
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
                        className="flex min-w-max items-center justify-between gap-4 rounded-lg bg-white p-2.5 text-sm shadow-sm transition-all hover:bg-yellow-50 dark:bg-white/5 dark:hover:bg-yellow-500/20"
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
              <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
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
                    className="flex min-w-max items-center justify-between gap-4 rounded-xl bg-white/60 p-3 text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md dark:bg-white/5 dark:hover:bg-blue-500/20"
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
              <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
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
