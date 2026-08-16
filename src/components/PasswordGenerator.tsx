import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Copy, Check } from "lucide-react";
import { showToast } from "@/lib/toast";

interface PasswordGeneratorProps {
  onGenerate: (password: string) => void;
}

export function PasswordGenerator({ onGenerate }: PasswordGeneratorProps) {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const generate = () => {
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
    onGenerate(result);
  };

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    setIsCopied(true);
    showToast({ title: "Copied", description: "Password copied to clipboard" });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getStrengthColor = () => {
    if (length < 8) return "bg-red-500";
    if (length < 12) return "bg-orange-500";
    if (length < 16) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-black/20">
        <span className="mr-2 font-mono text-lg tracking-wider break-all text-slate-900 dark:text-white">
          {generatedPassword}
        </span>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={generate}
            className="h-8 w-8 text-slate-500 hover:text-emerald-500"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyToClipboard}
            className="h-8 w-8 text-slate-500 hover:text-emerald-500"
          >
            {isCopied ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="mb-4 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className={`h-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: `${(length / 32) * 100}%` }}
        />
      </div>

      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Length: {length}
          </label>
          <input
            type="range"
            min="4"
            max="32"
            value={length}
            onChange={(e) => {
              setLength(Number(e.target.value));
              setTimeout(generate, 0);
            }}
            className="w-2/3 accent-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={useUpper}
            onChange={(e) => {
              setUseUpper(e.target.checked);
              setTimeout(generate, 0);
            }}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 dark:border-white/20 dark:bg-white/5"
          />
          Uppercase
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={useLower}
            onChange={(e) => {
              setUseLower(e.target.checked);
              setTimeout(generate, 0);
            }}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 dark:border-white/20 dark:bg-white/5"
          />
          Lowercase
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={useNumbers}
            onChange={(e) => {
              setUseNumbers(e.target.checked);
              setTimeout(generate, 0);
            }}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 dark:border-white/20 dark:bg-white/5"
          />
          Numbers
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={useSymbols}
            onChange={(e) => {
              setUseSymbols(e.target.checked);
              setTimeout(generate, 0);
            }}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 dark:border-white/20 dark:bg-white/5"
          />
          Symbols
        </label>
      </div>
    </div>
  );
}
