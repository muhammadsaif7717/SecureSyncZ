"use client";

import React, { useState, useEffect } from "react";
import {
  Key,
  CreditCard,
  FileText,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { useEncryption } from "@/providers/EncryptionProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import getPasswords from "@/lib/getPasswords";
import getCards from "@/lib/getCards";
import getNotes from "@/lib/getNotes";
import VerifyPasskey from "@/components/VerifyPasskey";
import { OnboardingTour } from "@/components/OnboardingTour";
import { checkPwnedPassword } from "@/lib/hibp";
import { PasswordsData } from "@/types";

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

export function DashboardClient() {
  const { cryptoKey, isUnlocked } = useEncryption();
  const { user } = useAuth();

  const { data: passwords = [], isLoading: isLoadingPasswords } = useQuery<
    PasswordsData[]
  >({
    queryKey: ["passwords", !!cryptoKey],
    queryFn: () => getPasswords(cryptoKey),
  });

  const { data: cards = [], isLoading: isLoadingCards } = useQuery({
    queryKey: ["cards", !!cryptoKey],
    queryFn: () => getCards(cryptoKey),
  });

  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ["notes", !!cryptoKey],
    queryFn: () => getNotes(cryptoKey),
  });

  const isLoading = isLoadingPasswords || isLoadingCards || isLoadingNotes;

  const [compromisedPasswords, setCompromisedPasswords] = useState<
    PasswordsData[]
  >([]);
  const [isCheckingPwned, setIsCheckingPwned] = useState(false);

  useEffect(() => {
    if (!passwords.length || !isUnlocked || (user && !user.isPremium)) return;

    let isMounted = true;
    const checkPwned = async () => {
      setIsCheckingPwned(true);
      const compromised: PasswordsData[] = [];
      const checkedCache = new Map<string, boolean>();

      for (const p of passwords) {
        if (!isMounted) break;
        if (checkedCache.has(p.password)) {
          if (checkedCache.get(p.password)) compromised.push(p);
          continue;
        }

        const isCompromised = await checkPwnedPassword(p.password);
        checkedCache.set(p.password, isCompromised);
        if (isCompromised) compromised.push(p);
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

  if (!isUnlocked) {
    return (
      <VerifyPasskey reasonText="Please enter your passkey to view your dashboard." />
    );
  }

  // Calculate vault health (weak, reused, or old passwords)
  let weakPasswords = 0;
  let reusedPasswords = 0;
  let oldPasswords = 0;

  if (isUnlocked && passwords.length > 0) {
    const pwdMap = new Map<string, number>();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    passwords.forEach((p) => {
      if (getPasswordStrength(p.password) <= 2) weakPasswords++;
      if (new Date(p.createdAt) < sixMonthsAgo) oldPasswords++;
      const count = pwdMap.get(p.password) || 0;
      pwdMap.set(p.password, count + 1);
    });

    pwdMap.forEach((count) => {
      if (count > 1) reusedPasswords += count - 1;
    });
  }

  const hasIssues =
    weakPasswords > 0 ||
    reusedPasswords > 0 ||
    compromisedPasswords.length > 0 ||
    oldPasswords > 0;

  return (
    <div className="relative min-h-[calc(100vh-56px)] overflow-hidden bg-slate-50 sm:min-h-[calc(100vh-60px)] dark:bg-[#0a0e1a]">
      {/* Background glow effects */}
      <div className="animate-glow-pulse absolute top-1/4 left-1/4 h-48 w-48 rounded-full bg-emerald-500/10 blur-[80px] sm:h-72 sm:w-72 dark:bg-emerald-500/[0.06]" />
      <div className="animate-glow-pulse absolute right-1/4 bottom-1/4 h-48 w-48 rounded-full bg-teal-500/10 blur-[80px] sm:h-72 sm:w-72 dark:bg-teal-500/[0.05]" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
          Vault Dashboard
        </h1>
        <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
          Overview of your securely encrypted data.
        </p>

        {isLoading ? (
          <div className="mt-10 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Loading vault data...
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            <div className="glass flex flex-col items-center rounded-2xl border border-white/20 p-3 text-center shadow-xl backdrop-blur-xl sm:p-6 dark:border-white/5">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 sm:mb-4 sm:h-12 sm:w-12 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Key className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 sm:text-3xl dark:text-white">
                {passwords.length}
              </h2>
              <p className="mt-1 text-[10px] leading-tight font-medium text-slate-500 sm:text-sm dark:text-slate-400">
                Passwords
              </p>
            </div>

            <div className="glass flex flex-col items-center rounded-2xl border border-white/20 p-3 text-center shadow-xl backdrop-blur-xl sm:p-6 dark:border-white/5">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600 sm:mb-4 sm:h-12 sm:w-12 dark:bg-teal-900/30 dark:text-teal-400">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 sm:text-3xl dark:text-white">
                {cards.length}
              </h2>
              <p className="mt-1 text-[10px] leading-tight font-medium text-slate-500 sm:text-sm dark:text-slate-400">
                Cards
              </p>
            </div>

            <div className="glass flex flex-col items-center rounded-2xl border border-white/20 p-3 text-center shadow-xl backdrop-blur-xl sm:p-6 dark:border-white/5">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 sm:mb-4 sm:h-12 sm:w-12 dark:bg-purple-900/30 dark:text-purple-400">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 sm:text-3xl dark:text-white">
                {notes.length}
              </h2>
              <p className="mt-1 text-[10px] leading-tight font-medium text-slate-500 sm:text-sm dark:text-slate-400">
                Notes
              </p>
            </div>

            <div className="col-span-full mt-4">
              <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
                Vault Health
              </h2>
              <div className="glass flex items-center gap-4 rounded-2xl border border-white/20 p-6 shadow-lg dark:border-white/5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${hasIssues ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"}`}
                >
                  {hasIssues ? (
                    <ShieldAlert className="h-6 w-6" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {hasIssues ? "Action Recommended" : "Looking Good!"}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {isCheckingPwned
                      ? "Checking passwords against known breaches..."
                      : hasIssues
                        ? `You have ${compromisedPasswords.length} compromised, ${weakPasswords} weak, ${reusedPasswords} reused, and ${oldPasswords} old passwords. Check the Health page.`
                        : "Your vault is secure. No compromised, weak, reused, or old passwords detected."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isUnlocked && <OnboardingTour />}
    </div>
  );
}
