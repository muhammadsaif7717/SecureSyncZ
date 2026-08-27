"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  PlusCircle,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export default function GeneratorPage() {
  const router = useRouter();

  const [length, setLength] = useState<number>(16);
  const [useUpper, setUseUpper] = useState<boolean>(true);
  const [useLower, setUseLower] = useState<boolean>(true);
  const [useNumbers, setUseNumbers] = useState<boolean>(true);
  const [useSymbols, setUseSymbols] = useState<boolean>(true);
  const [generatedPassword, setGeneratedPassword] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isRotating, setIsRotating] = useState<boolean>(false);

  const generate = useCallback(() => {
    let charset = "";
    if (useUpper) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (useLower) charset += "abcdefghijklmnopqrstuvwxyz";
    if (useNumbers) charset += "0123456789";
    if (useSymbols) charset += "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    if (charset === "") {
      charset = "abcdefghijklmnopqrstuvwxyz";
      setUseLower(true);
    }

    let result = "";
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charset.length];
    }
    setGeneratedPassword(result);
  }, [length, useUpper, useLower, useNumbers, useSymbols]);

  useEffect(() => {
    generate();
  }, [generate]);

  const handleRefresh = () => {
    setIsRotating(true);
    generate();
    setTimeout(() => setIsRotating(false), 350);
  };

  const copyToClipboard = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setIsCopied(true);
    showToast({
      title: "Password Copied",
      description: "Password copied to clipboard",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getStrength = () => {
    if (length < 8) return { label: "Weak", color: "bg-red-500", percent: 25 };
    if (length < 12) return { label: "Medium", color: "bg-orange-500", percent: 50 };
    if (length < 16) return { label: "Strong", color: "bg-yellow-500", percent: 75 };
    return { label: "Very Strong", color: "bg-emerald-500", percent: 100 };
  };

  const strength = getStrength();

  return (
    <div className="relative flex min-h-[calc(100vh-56px)] justify-center overflow-hidden bg-slate-50 px-4 py-8 sm:min-h-[calc(100vh-60px)] sm:px-6 sm:py-12 dark:bg-[#0a0e1a]">
      {/* Background glow effects */}
      <div className="animate-glow-pulse absolute top-1/4 left-1/4 h-48 w-48 rounded-full bg-emerald-500/10 blur-[80px] sm:h-72 sm:w-72 dark:bg-emerald-500/[0.06]" />
      <div className="animate-glow-pulse absolute right-1/4 bottom-1/4 h-48 w-48 rounded-full bg-teal-500/10 blur-[80px] sm:h-72 sm:w-72 dark:bg-teal-500/[0.05]" />

      <div className="relative z-10 w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 p-3 text-white shadow-lg shadow-emerald-500/20">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Password Generator
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Create strong, secure, and custom passwords instantly.
          </p>
        </div>

        {/* Generator Card */}
        <Card className="glass border-white/20 bg-white/70 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
          <CardContent className="space-y-6 p-5 sm:p-7">
            {/* Password Display Box */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black/30">
              <span className="mr-2 font-mono text-base font-semibold tracking-wider break-all text-slate-900 sm:text-lg dark:text-white">
                {generatedPassword || "Generating..."}
              </span>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  title="Generate New"
                  className="h-8 w-8 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
                >
                  <RefreshCw
                    className={cn(
                      "h-4 w-4 transition-transform duration-300",
                      isRotating && "rotate-180"
                    )}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyToClipboard}
                  title="Copy to Clipboard"
                  className="h-8 w-8 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Strength Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                  Strength
                </span>
                <span className="text-slate-700 font-semibold dark:text-slate-300">
                  {strength.label}
                </span>
              </div>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  className={cn("h-full transition-all duration-300", strength.color)}
                  style={{ width: `${strength.percent}%` }}
                />
              </div>
            </div>

            {/* Length Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Length: <span className="font-bold text-emerald-600 dark:text-emerald-400">{length}</span>
                </label>
              </div>
              <input
                type="range"
                min="4"
                max="32"
                value={length}
                onChange={(e) => {
                  setLength(Number(e.target.value));
                  setTimeout(generate, 0);
                }}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-emerald-600 dark:bg-slate-700 dark:accent-emerald-400"
              />
              <div className="flex justify-between text-[11px] font-medium text-slate-400">
                <span>4</span>
                <span>16</span>
                <span>32</span>
              </div>
            </div>

            {/* Character Set Checkboxes */}
            <div className="space-y-2.5 pt-1">
              <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Include Characters
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-white/50 p-2.5 text-sm text-slate-700 transition-colors hover:border-emerald-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-emerald-500/30">
                  <input
                    type="checkbox"
                    checked={useUpper}
                    onChange={(e) => {
                      setUseUpper(e.target.checked);
                      setTimeout(generate, 0);
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 dark:border-white/20 dark:bg-white/5"
                  />
                  Uppercase (A-Z)
                </label>

                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-white/50 p-2.5 text-sm text-slate-700 transition-colors hover:border-emerald-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-emerald-500/30">
                  <input
                    type="checkbox"
                    checked={useLower}
                    onChange={(e) => {
                      setUseLower(e.target.checked);
                      setTimeout(generate, 0);
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 dark:border-white/20 dark:bg-white/5"
                  />
                  Lowercase (a-z)
                </label>

                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-white/50 p-2.5 text-sm text-slate-700 transition-colors hover:border-emerald-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-emerald-500/30">
                  <input
                    type="checkbox"
                    checked={useNumbers}
                    onChange={(e) => {
                      setUseNumbers(e.target.checked);
                      setTimeout(generate, 0);
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 dark:border-white/20 dark:bg-white/5"
                  />
                  Numbers (0-9)
                </label>

                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-white/50 p-2.5 text-sm text-slate-700 transition-colors hover:border-emerald-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-emerald-500/30">
                  <input
                    type="checkbox"
                    checked={useSymbols}
                    onChange={(e) => {
                      setUseSymbols(e.target.checked);
                      setTimeout(generate, 0);
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 dark:border-white/20 dark:bg-white/5"
                  />
                  Symbols (!@#$)
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5 pt-2 sm:flex-row">
              <Button
                onClick={copyToClipboard}
                className="flex-1 gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 dark:from-emerald-500 dark:to-teal-500"
              >
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {isCopied ? "Copied!" : "Copy Password"}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/add?password=${encodeURIComponent(generatedPassword)}`)}
                className="gap-2 rounded-xl border-slate-200 bg-white/60 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-emerald-500/30 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <PlusCircle className="h-4 w-4 text-emerald-500" />
                Save to Vault
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
