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
} from "lucide-react";
import { extractRootDomain } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEncryption } from "@/providers/EncryptionProvider";
import { Card } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
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
      // -20 for each reused group, -10 for each weak password, -5 for each old password
      let penalty = reused.length * 20 + weak.length * 10 + old.length * 5;
      const score = Math.max(0, 100 - penalty);

      return {
        weakPasswords: weak,
        reusedPasswords: reused,
        oldPasswords: old,
        totalScore: score,
      };
    }, [passwords]);

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
      <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
        {/* Header / Score Card */}
        <div className="glass overflow-hidden rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20">
          <div className="h-[2px] w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="flex flex-col items-center p-6 text-center sm:p-10">
            <div
              className={`mb-4 flex h-24 w-24 items-center justify-center rounded-full text-4xl font-bold shadow-inner ${
                totalScore >= 80
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                  : totalScore >= 50
                    ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400"
                    : "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
              }`}
            >
              {totalScore}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
              Vault Health Score
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base dark:text-slate-400">
              {totalScore >= 80
                ? "Your vault is in great shape! Keep it up."
                : totalScore >= 50
                  ? "Your vault has some vulnerabilities. Consider updating weak or reused passwords."
                  : "Critical security risks found. Please update your passwords immediately."}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          {/* Weak Passwords */}
          <div className="glass min-w-0 rounded-2xl p-5 shadow-lg shadow-black/5 dark:shadow-black/20">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Weak Passwords
                </h3>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {weakPasswords.length} Found
                </p>
              </div>
            </div>
            {weakPasswords.length > 0 ? (
              <div className="custom-scrollbar max-h-[60vh] space-y-2 overflow-auto pr-2 pb-24 sm:max-h-[500px] sm:pb-0">
                {weakPasswords.map((p) => (
                  <Link
                    key={p._id}
                    href={`/passwords/${encodeURIComponent(extractRootDomain(p.website).toLowerCase())}`}
                    className="flex items-center justify-between rounded-lg bg-white/50 p-2.5 text-sm transition-colors hover:bg-red-50 dark:bg-white/5 dark:hover:bg-red-500/10"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${extractRootDomain(p.website)}&sz=64`}
                        alt={`${extractRootDomain(p.website)} icon`}
                        className="h-5 w-5 shrink-0 rounded bg-white p-0.5 shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                        {extractRootDomain(p.website)}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-red-500">
                      Update
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No weak passwords. Great job!
              </p>
            )}
          </div>

          {/* Reused Passwords */}
          <div className="glass min-w-0 rounded-2xl p-5 shadow-lg shadow-black/5 dark:shadow-black/20">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Reused Passwords
                </h3>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  {reusedPasswords.length} Groups Found
                </p>
              </div>
            </div>
            {reusedPasswords.length > 0 ? (
              <div className="custom-scrollbar max-h-[60vh] space-y-4 overflow-auto pr-2 pb-24 sm:max-h-[500px] sm:pb-0">
                {reusedPasswords.map((group, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500">
                      Group {idx + 1} ({group.length} sites)
                    </p>
                    {group.map((p) => (
                      <Link
                        key={p._id}
                        href={`/passwords/${encodeURIComponent(extractRootDomain(p.website).toLowerCase())}`}
                        className="flex min-w-max items-center justify-between gap-4 rounded-lg bg-white/50 p-2.5 text-sm transition-colors hover:bg-yellow-50 dark:bg-white/5 dark:hover:bg-yellow-500/10"
                      >
                        <div className="flex items-center gap-2.5 whitespace-nowrap">
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${extractRootDomain(p.website)}&sz=64`}
                            alt={`${extractRootDomain(p.website)} icon`}
                            className="h-5 w-5 shrink-0 rounded bg-white p-0.5 shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {extractRootDomain(p.website)}
                          </span>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-yellow-500">
                          Update
                        </span>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No reused passwords. Excellent!
              </p>
            )}
          </div>

          {/* Old Passwords */}
          <div className="glass min-w-0 rounded-2xl p-5 shadow-lg shadow-black/5 dark:shadow-black/20">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Old Passwords
                </h3>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {oldPasswords.length} Found
                </p>
              </div>
            </div>
            {oldPasswords.length > 0 ? (
              <div className="custom-scrollbar max-h-[60vh] space-y-2 overflow-auto pr-2 pb-24 sm:max-h-[500px] sm:pb-0">
                {oldPasswords.map((p) => (
                  <Link
                    key={p._id}
                    href={`/passwords/${encodeURIComponent(extractRootDomain(p.website).toLowerCase())}`}
                    className="flex min-w-max items-center justify-between gap-4 rounded-lg bg-white/50 p-2.5 text-sm transition-colors hover:bg-blue-50 dark:bg-white/5 dark:hover:bg-blue-500/10"
                  >
                    <div className="flex items-center gap-2.5 whitespace-nowrap">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${extractRootDomain(p.website)}&sz=64`}
                        alt={`${extractRootDomain(p.website)} icon`}
                        className="h-5 w-5 shrink-0 rounded bg-white p-0.5 shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {extractRootDomain(p.website)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-blue-500">
                      Update
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                All passwords are fresh.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
