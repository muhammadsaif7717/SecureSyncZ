"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Sliders,
  History,
  Trash2,
  PlusCircle,
  Hash,
  Type,
  BookOpen,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

// Curated dictionary for memorable passphrases
const PASSPHRASE_WORDS = [
  "amber",
  "anchor",
  "beacon",
  "breeze",
  "cactus",
  "canyon",
  "castle",
  "cedar",
  "clover",
  "comet",
  "crater",
  "crystal",
  "desert",
  "dolphin",
  "dragon",
  "eagle",
  "echo",
  "ember",
  "falcon",
  "feather",
  "forest",
  "galaxy",
  "glacier",
  "harbor",
  "horizon",
  "island",
  "jungle",
  "jupiter",
  "knight",
  "lagoon",
  "lantern",
  "legend",
  "leopard",
  "lotus",
  "matrix",
  "meadow",
  "meteor",
  "mirage",
  "monarch",
  "moon",
  "nebula",
  "oasis",
  "ocean",
  "orbit",
  "panther",
  "pebble",
  "phoenix",
  "planet",
  "prairie",
  "prism",
  "pulsar",
  "pyramid",
  "quantum",
  "quarry",
  "radar",
  "rainbow",
  "raven",
  "reef",
  "ridge",
  "ripple",
  "river",
  "rocket",
  "ruby",
  "safari",
  "sailor",
  "sapphire",
  "saturn",
  "shadow",
  "shield",
  "sierra",
  "silver",
  "solar",
  "spark",
  "sphere",
  "summit",
  "sunburst",
  "sunset",
  "thunder",
  "tiger",
  "timber",
  "topaz",
  "tornado",
  "treasure",
  "tsunami",
  "tulip",
  "valiant",
  "valley",
  "vapor",
  "velvet",
  "venture",
  "vessel",
  "vortex",
  "voyage",
  "walnut",
  "wave",
  "whisper",
  "willow",
  "winter",
  "wizard",
  "zenith",
  "zephyr",
  "zigzag",
];

type GeneratorMode = "password" | "passphrase" | "pin";

interface HistoryItem {
  id: string;
  value: string;
  type: GeneratorMode;
  createdAt: string;
}

export default function GeneratorPage() {
  const router = useRouter();

  // Generator Mode
  const [mode, setMode] = useState<GeneratorMode>("password");

  // Random Password Options
  const [length, setLength] = useState<number>(18);
  const [useUpper, setUseUpper] = useState<boolean>(true);
  const [useLower, setUseLower] = useState<boolean>(true);
  const [useNumbers, setUseNumbers] = useState<boolean>(true);
  const [useSymbols, setUseSymbols] = useState<boolean>(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState<boolean>(false);
  const [noRepeating, setNoRepeating] = useState<boolean>(false);

  // Passphrase Options
  const [wordCount, setWordCount] = useState<number>(4);
  const [separator, setSeparator] = useState<string>("-");
  const [capitalizeWords, setCapitalizeWords] = useState<boolean>(true);
  const [includeNumberInPassphrase, setIncludeNumberInPassphrase] =
    useState<boolean>(true);

  // PIN Options
  const [pinLength, setPinLength] = useState<number>(6);

  // State
  const [generatedPassword, setGeneratedPassword] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Generate logic
  const generate = useCallback(() => {
    let result = "";

    if (mode === "pin") {
      const digits = "0123456789";
      const array = new Uint32Array(pinLength);
      window.crypto.getRandomValues(array);
      for (let i = 0; i < pinLength; i++) {
        result += digits[array[i] % digits.length];
      }
    } else if (mode === "passphrase") {
      const array = new Uint32Array(wordCount);
      window.crypto.getRandomValues(array);
      const chosenWords: string[] = [];

      for (let i = 0; i < wordCount; i++) {
        let w = PASSPHRASE_WORDS[array[i] % PASSPHRASE_WORDS.length];
        if (capitalizeWords) {
          w = w.charAt(0).toUpperCase() + w.slice(1);
        }
        chosenWords.push(w);
      }

      if (includeNumberInPassphrase) {
        const numArr = new Uint32Array(1);
        window.crypto.getRandomValues(numArr);
        const randomNum = ((numArr[0] % 90) + 10).toString();
        const randIndex = numArr[0] % wordCount;
        chosenWords[randIndex] = chosenWords[randIndex] + randomNum;
      }

      result = chosenWords.join(separator);
    } else {
      // Random Password
      let upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let lowerChars = "abcdefghijklmnopqrstuvwxyz";
      let numberChars = "0123456789";
      let symbolChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

      if (avoidAmbiguous) {
        upperChars = upperChars.replace(/[IO]/g, "");
        lowerChars = lowerChars.replace(/[lo]/g, "");
        numberChars = numberChars.replace(/[01]/g, "");
        symbolChars = symbolChars.replace(/[|]/g, "");
      }

      let charset = "";
      const mandatoryChars: string[] = [];

      if (useUpper) {
        charset += upperChars;
        const arr = new Uint32Array(1);
        window.crypto.getRandomValues(arr);
        mandatoryChars.push(upperChars[arr[0] % upperChars.length]);
      }
      if (useLower) {
        charset += lowerChars;
        const arr = new Uint32Array(1);
        window.crypto.getRandomValues(arr);
        mandatoryChars.push(lowerChars[arr[0] % lowerChars.length]);
      }
      if (useNumbers) {
        charset += numberChars;
        const arr = new Uint32Array(1);
        window.crypto.getRandomValues(arr);
        mandatoryChars.push(numberChars[arr[0] % numberChars.length]);
      }
      if (useSymbols) {
        charset += symbolChars;
        const arr = new Uint32Array(1);
        window.crypto.getRandomValues(arr);
        mandatoryChars.push(symbolChars[arr[0] % symbolChars.length]);
      }

      if (charset === "") {
        charset = lowerChars;
        setUseLower(true);
      }

      const generatedChars: string[] = [...mandatoryChars];
      const remainingLength = Math.max(0, length - mandatoryChars.length);
      const array = new Uint32Array(remainingLength * 3);
      window.crypto.getRandomValues(array);

      let arrayIdx = 0;
      while (generatedChars.length < length) {
        if (arrayIdx >= array.length) {
          window.crypto.getRandomValues(array);
          arrayIdx = 0;
        }
        const candidate = charset[array[arrayIdx++] % charset.length];
        if (
          noRepeating &&
          generatedChars.includes(candidate) &&
          charset.length > length
        ) {
          continue;
        }
        generatedChars.push(candidate);
      }

      // Shuffle array using Fisher-Yates
      for (let i = generatedChars.length - 1; i > 0; i--) {
        const rnd = new Uint32Array(1);
        window.crypto.getRandomValues(rnd);
        const j = rnd[0] % (i + 1);
        [generatedChars[i], generatedChars[j]] = [
          generatedChars[j],
          generatedChars[i],
        ];
      }

      result = generatedChars.join("");
    }

    setGeneratedPassword(result);

    // Append to history (max 10 items)
    setHistory((prev) => {
      if (prev.length > 0 && prev[0].value === result) return prev;
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        value: result,
        type: mode,
        createdAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };
      return [newItem, ...prev.filter((i) => i.value !== result)].slice(0, 10);
    });
  }, [
    mode,
    length,
    useUpper,
    useLower,
    useNumbers,
    useSymbols,
    avoidAmbiguous,
    noRepeating,
    wordCount,
    separator,
    capitalizeWords,
    includeNumberInPassphrase,
    pinLength,
  ]);

  // Generate on initial mount or mode switch
  useEffect(() => {
    generate();
  }, [mode, generate]);

  const handleRefresh = () => {
    setIsRotating(true);
    generate();
    setTimeout(() => setIsRotating(false), 400);
  };

  const copyToClipboard = (textToCopy?: string) => {
    const val = textToCopy || generatedPassword;
    if (!val) return;
    navigator.clipboard.writeText(val);
    setIsCopied(true);
    showToast({
      title: "Password Copied",
      description: "Secure password has been copied to your clipboard.",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveToVault = (passValue?: string) => {
    const val = passValue || generatedPassword;
    router.push(`/add?password=${encodeURIComponent(val)}`);
  };

  // Password Security Strength Calculation
  const calculateStrength = () => {
    if (!generatedPassword)
      return {
        score: 0,
        label: "Empty",
        color: "bg-slate-300",
        crackTime: "Instantly",
        entropy: 0,
      };

    let poolSize = 0;
    if (mode === "pin") {
      poolSize = 10;
    } else if (mode === "passphrase") {
      poolSize = PASSPHRASE_WORDS.length;
      const entropy = Math.round(wordCount * Math.log2(poolSize));
      let crackTime = "Decades";
      if (wordCount <= 3) crackTime = "Few months";
      else if (wordCount === 4) crackTime = "1,000+ years";
      else crackTime = "Billions of years";

      return {
        score: Math.min(100, (wordCount / 6) * 100),
        label:
          wordCount >= 5
            ? "Very Strong"
            : wordCount >= 4
              ? "Strong"
              : "Moderate",
        color:
          wordCount >= 5
            ? "bg-emerald-500"
            : wordCount >= 4
              ? "bg-teal-500"
              : "bg-yellow-500",
        crackTime,
        entropy,
      };
    } else {
      if (/[a-z]/.test(generatedPassword)) poolSize += 26;
      if (/[A-Z]/.test(generatedPassword)) poolSize += 26;
      if (/[0-9]/.test(generatedPassword)) poolSize += 10;
      if (/[^a-zA-Z0-9]/.test(generatedPassword)) poolSize += 32;
    }

    const entropy = Math.round(
      generatedPassword.length * Math.log2(Math.max(2, poolSize))
    );

    let score = 0;
    let label = "Very Weak";
    let color = "bg-red-500";
    let crackTime = "Instantly";

    if (entropy < 30) {
      score = 20;
      label = "Very Weak";
      color = "bg-red-500";
      crackTime = "Few seconds";
    } else if (entropy < 50) {
      score = 45;
      label = "Moderate";
      color = "bg-orange-500";
      crackTime = "A few days";
    } else if (entropy < 70) {
      score = 75;
      label = "Strong";
      color = "bg-teal-500";
      crackTime = "10,000+ years";
    } else {
      score = 100;
      label = "Military Grade";
      color = "bg-emerald-500";
      crackTime = "Trillions of years";
    }

    return { score, label, color, crackTime, entropy };
  };

  const strength = calculateStrength();

  // Apply Quick Presets
  const applyPreset = (preset: "standard" | "max" | "passphrase" | "pin") => {
    if (preset === "standard") {
      setMode("password");
      setLength(16);
      setUseUpper(true);
      setUseLower(true);
      setUseNumbers(true);
      setUseSymbols(true);
      setAvoidAmbiguous(false);
      setNoRepeating(false);
    } else if (preset === "max") {
      setMode("password");
      setLength(32);
      setUseUpper(true);
      setUseLower(true);
      setUseNumbers(true);
      setUseSymbols(true);
      setAvoidAmbiguous(false);
      setNoRepeating(false);
    } else if (preset === "passphrase") {
      setMode("passphrase");
      setWordCount(5);
      setSeparator("-");
      setCapitalizeWords(true);
      setIncludeNumberInPassphrase(true);
    } else if (preset === "pin") {
      setMode("pin");
      setPinLength(6);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-56px)] justify-center overflow-hidden bg-slate-50 px-4 py-8 sm:min-h-[calc(100vh-60px)] sm:px-6 sm:py-12 dark:bg-[#0a0e1a]">
      {/* Background glow effects */}
      <div className="animate-glow-pulse absolute top-1/6 left-1/4 h-56 w-56 rounded-full bg-emerald-500/10 blur-[90px] sm:h-80 sm:w-80 dark:bg-emerald-500/[0.07]" />
      <div className="animate-glow-pulse absolute right-1/4 bottom-1/4 h-56 w-56 rounded-full bg-teal-500/10 blur-[90px] sm:h-80 sm:w-80 dark:bg-teal-500/[0.06]" />

      <div className="relative z-10 w-full max-w-2xl space-y-6 pb-20 sm:pb-12">
        {/* Header Badge & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Cryptographic Key Generator</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Password Generator
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Generate high-entropy, cryptographically secure passwords and
            passphrases.
          </p>
        </div>

        {/* Main Display Box */}
        <Card className="glass relative overflow-hidden border-white/20 bg-white/70 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
          {/* Top subtle highlight */}
          <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

          <CardContent className="p-5 sm:p-7">
            {/* Generated String Display */}
            <div className="group relative mb-5 flex min-h-[72px] items-center justify-between rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-inner dark:border-white/10 dark:bg-black/30">
              <div className="mr-3 font-mono text-base font-medium tracking-wider break-all text-slate-900 sm:text-lg dark:text-white">
                {generatedPassword ? (
                  generatedPassword.split("").map((char, index) => {
                    let colorClass = "text-slate-900 dark:text-white";
                    if (/[0-9]/.test(char))
                      colorClass =
                        "text-amber-600 dark:text-amber-400 font-semibold";
                    else if (/[^a-zA-Z0-9]/.test(char))
                      colorClass =
                        "text-emerald-600 dark:text-emerald-400 font-bold";
                    else if (/[A-Z]/.test(char))
                      colorClass = "text-sky-600 dark:text-sky-400";
                    return (
                      <span key={index} className={colorClass}>
                        {char}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-slate-400">Generating...</span>
                )}
              </div>

              {/* Action Buttons inside display box */}
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  title="Generate New"
                  className="h-9 w-9 rounded-xl text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
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
                  onClick={() => copyToClipboard()}
                  title="Copy to Clipboard"
                  className="h-9 w-9 rounded-xl text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Strength Meter Bar & Stats */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Security Strength:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {strength.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <span>
                    Crack time:{" "}
                    <strong className="text-slate-700 dark:text-slate-200">
                      {strength.crackTime}
                    </strong>
                  </span>
                  <span className="hidden sm:inline">
                    • {strength.entropy} bits entropy
                  </span>
                </div>
              </div>

              {/* Progress bar with segment indicators */}
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  className={cn(
                    "h-full transition-all duration-500 ease-out",
                    strength.color
                  )}
                  style={{ width: `${strength.score}%` }}
                />
              </div>
            </div>

            {/* Action Buttons: Copy & Save */}
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <Button
                onClick={() => copyToClipboard()}
                className="flex-1 gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 dark:from-emerald-500 dark:to-teal-500"
              >
                {isCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {isCopied ? "Copied to Clipboard!" : "Copy Password"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSaveToVault()}
                className="gap-2 rounded-xl border-slate-200 bg-white/60 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-emerald-500/30 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <PlusCircle className="h-4 w-4 text-emerald-500" />
                <span>Save to Vault</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generator Controls Card */}
        <Card className="glass border-white/20 bg-white/70 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
          <CardContent className="space-y-6 p-5 sm:p-7">
            {/* Mode Selection Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-black/30">
              <button
                onClick={() => setMode("password")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all sm:text-sm",
                  mode === "password"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                <KeyRound className="h-3.5 w-3.5 text-emerald-500" />
                Random Password
              </button>
              <button
                onClick={() => setMode("passphrase")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all sm:text-sm",
                  mode === "passphrase"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                Memorable Words
              </button>
              <button
                onClick={() => setMode("pin")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all sm:text-sm",
                  mode === "pin"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                <Hash className="h-3.5 w-3.5 text-emerald-500" />
                PIN Code
              </button>
            </div>

            {/* Mode: Random Password Controls */}
            {mode === "password" && (
              <div className="space-y-5">
                {/* Length Slider */}
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      Password Length
                    </span>
                    <span className="rounded-lg bg-emerald-50 px-2.5 py-0.5 font-mono text-sm font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                      {length} characters
                    </span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="64"
                    value={length}
                    onChange={(e) => {
                      setLength(Number(e.target.value));
                      setTimeout(generate, 0);
                    }}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-emerald-600 dark:bg-slate-700 dark:accent-emerald-400"
                  />
                  <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-400">
                    <span>6 min</span>
                    <span>16 standard</span>
                    <span>32 maximum</span>
                    <span>64 ultra</span>
                  </div>
                </div>

                {/* Character Toggles */}
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                    Character Types
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white/50 p-3 transition-colors hover:border-emerald-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-500/30">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Uppercase (A-Z)
                      </span>
                      <input
                        type="checkbox"
                        checked={useUpper}
                        onChange={(e) => {
                          setUseUpper(e.target.checked);
                          setTimeout(generate, 0);
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-white/20 dark:bg-slate-800"
                      />
                    </label>

                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white/50 p-3 transition-colors hover:border-emerald-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-500/30">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Lowercase (a-z)
                      </span>
                      <input
                        type="checkbox"
                        checked={useLower}
                        onChange={(e) => {
                          setUseLower(e.target.checked);
                          setTimeout(generate, 0);
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-white/20 dark:bg-slate-800"
                      />
                    </label>

                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white/50 p-3 transition-colors hover:border-emerald-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-500/30">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Numbers (0-9)
                      </span>
                      <input
                        type="checkbox"
                        checked={useNumbers}
                        onChange={(e) => {
                          setUseNumbers(e.target.checked);
                          setTimeout(generate, 0);
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-white/20 dark:bg-slate-800"
                      />
                    </label>

                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white/50 p-3 transition-colors hover:border-emerald-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-500/30">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Special Symbols (!@#$%)
                      </span>
                      <input
                        type="checkbox"
                        checked={useSymbols}
                        onChange={(e) => {
                          setUseSymbols(e.target.checked);
                          setTimeout(generate, 0);
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-white/20 dark:bg-slate-800"
                      />
                    </label>
                  </div>
                </div>

                {/* Advanced Options */}
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                    Advanced Rules
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white/50 p-3 transition-colors hover:border-emerald-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-500/30">
                      <div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Avoid Ambiguous
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Excludes 1, l, I, 0, O, o
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={avoidAmbiguous}
                        onChange={(e) => {
                          setAvoidAmbiguous(e.target.checked);
                          setTimeout(generate, 0);
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-white/20 dark:bg-slate-800"
                      />
                    </label>

                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white/50 p-3 transition-colors hover:border-emerald-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-500/30">
                      <div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          No Repeating
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Unique characters only
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={noRepeating}
                        onChange={(e) => {
                          setNoRepeating(e.target.checked);
                          setTimeout(generate, 0);
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-white/20 dark:bg-slate-800"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Mode: Memorable Passphrase Controls */}
            {mode === "passphrase" && (
              <div className="space-y-5">
                {/* Word Count */}
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      Number of Words
                    </span>
                    <span className="rounded-lg bg-emerald-50 px-2.5 py-0.5 font-mono text-sm font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                      {wordCount} words
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="8"
                    value={wordCount}
                    onChange={(e) => {
                      setWordCount(Number(e.target.value));
                      setTimeout(generate, 0);
                    }}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-emerald-600 dark:bg-slate-700 dark:accent-emerald-400"
                  />
                  <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-400">
                    <span>3 words</span>
                    <span>4 standard</span>
                    <span>6 secure</span>
                    <span>8 ultra</span>
                  </div>
                </div>

                {/* Separator & Capitalization */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white/50 p-3 dark:border-white/10 dark:bg-white/5">
                    <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                      Word Separator
                    </label>
                    <div className="flex gap-2">
                      {["-", ".", "_", " "].map((sep) => (
                        <button
                          key={sep}
                          onClick={() => {
                            setSeparator(sep);
                            setTimeout(generate, 0);
                          }}
                          className={cn(
                            "flex-1 rounded-lg py-1.5 font-mono text-sm font-semibold transition-all",
                            separator === sep
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                          )}
                        >
                          {sep === " " ? "space" : sep}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-center space-y-2 rounded-xl border border-slate-200 bg-white/50 p-3 dark:border-white/10 dark:bg-white/5">
                    <label className="flex cursor-pointer items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Capitalize Words
                      </span>
                      <input
                        type="checkbox"
                        checked={capitalizeWords}
                        onChange={(e) => {
                          setCapitalizeWords(e.target.checked);
                          setTimeout(generate, 0);
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-white/20 dark:bg-slate-800"
                      />
                    </label>
                    <label className="flex cursor-pointer items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Include Number
                      </span>
                      <input
                        type="checkbox"
                        checked={includeNumberInPassphrase}
                        onChange={(e) => {
                          setIncludeNumberInPassphrase(e.target.checked);
                          setTimeout(generate, 0);
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-white/20 dark:bg-slate-800"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Mode: PIN Code Controls */}
            {mode === "pin" && (
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      PIN Digits
                    </span>
                    <span className="rounded-lg bg-emerald-50 px-2.5 py-0.5 font-mono text-sm font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                      {pinLength} digits
                    </span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="12"
                    value={pinLength}
                    onChange={(e) => {
                      setPinLength(Number(e.target.value));
                      setTimeout(generate, 0);
                    }}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-emerald-600 dark:bg-slate-700 dark:accent-emerald-400"
                  />
                  <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-400">
                    <span>4 (Card/ATM)</span>
                    <span>6 (Standard)</span>
                    <span>8 (Bank)</span>
                    <span>12 (Master)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Presets Section */}
            <div className="border-t border-slate-200/80 pt-5 dark:border-white/10">
              <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span>Quick Security Presets</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  onClick={() => applyPreset("standard")}
                  className="rounded-xl border border-slate-200 bg-white/40 p-2.5 text-left transition-all hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-white/5 dark:bg-white/5 dark:hover:border-emerald-500/40 dark:hover:bg-white/10"
                >
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Standard
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    16 chars mixed
                  </div>
                </button>
                <button
                  onClick={() => applyPreset("max")}
                  className="rounded-xl border border-slate-200 bg-white/40 p-2.5 text-left transition-all hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-white/5 dark:bg-white/5 dark:hover:border-emerald-500/40 dark:hover:bg-white/10"
                >
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Max Shield
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    32 chars ultra
                  </div>
                </button>
                <button
                  onClick={() => applyPreset("passphrase")}
                  className="rounded-xl border border-slate-200 bg-white/40 p-2.5 text-left transition-all hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-white/5 dark:bg-white/5 dark:hover:border-emerald-500/40 dark:hover:bg-white/10"
                >
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Passphrase
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    5 memorable words
                  </div>
                </button>
                <button
                  onClick={() => applyPreset("pin")}
                  className="rounded-xl border border-slate-200 bg-white/40 p-2.5 text-left transition-all hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-white/5 dark:bg-white/5 dark:hover:border-emerald-500/40 dark:hover:bg-white/10"
                >
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    PIN Code
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    6 digits num
                  </div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History Card (Session Only) */}
        {history.length > 1 && (
          <Card className="glass border-white/20 bg-white/70 shadow-md backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  <History className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Recent Passwords (This Session)</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistory([])}
                  className="h-7 gap-1 px-2 text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </Button>
              </div>

              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white/60 dark:divide-white/5 dark:border-white/10 dark:bg-black/20">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 transition-colors hover:bg-emerald-50/40 dark:hover:bg-white/5"
                  >
                    <div className="mr-2 min-w-0 flex-1">
                      <div className="font-mono text-xs font-medium tracking-wide break-all text-slate-800 dark:text-slate-200">
                        {item.value}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="capitalize">{item.type}</span>
                        <span>•</span>
                        <span>{item.createdAt}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(item.value)}
                        className="h-7 w-7 rounded-lg text-slate-500 hover:bg-emerald-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-300"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSaveToVault(item.value)}
                        title="Save to Vault"
                        className="h-7 w-7 rounded-lg text-slate-500 hover:bg-emerald-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-300"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
