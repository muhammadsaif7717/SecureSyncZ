import React, { useState, useEffect } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useEncryption } from "@/providers/EncryptionProvider";
import { showToast } from "@/lib/toast";

interface VerifyPasskeyProps {
  reasonText: React.ReactNode;
}

export default function VerifyPasskey({ reasonText }: VerifyPasskeyProps) {
  const { unlockVault } = useEncryption();
  const [passkey, setPasskey] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passkey.length !== 6) return;

    setIsVerifying(true);
    const result = await unlockVault(passkey);
    if (result.success) {
      // Access granted (no toast needed)
    } else {
      showToast({
        title: "Error",
        description: result.error || "Invalid passkey. Try again.",
      });
      setPasskey("");
    }
    setIsVerifying(false);
  };

  useEffect(() => {
    if (passkey.length === 6 && !isVerifying) {
      handleVerify();
    }
  }, [passkey]);

  return (
    <section className="relative flex min-h-[calc(100vh-56px)] flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 py-6 sm:min-h-[calc(100vh-60px)] dark:bg-[#0a0e1a]">
      {/* Background glow effects */}
      <div className="animate-glow-pulse absolute top-1/4 left-1/4 h-48 w-48 rounded-full bg-emerald-500/10 blur-[80px] sm:h-72 sm:w-72 dark:bg-emerald-500/[0.06]" />
      <div className="animate-glow-pulse absolute right-1/4 bottom-1/4 h-48 w-48 rounded-full bg-teal-500/10 blur-[80px] sm:h-72 sm:w-72 dark:bg-teal-500/[0.05]" />

      <div className="relative z-10 w-full max-w-md">
        <Card className="glass relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/70 p-0 shadow-2xl backdrop-blur-xl dark:border-white/5 dark:bg-black/20 dark:shadow-emerald-900/20">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-cyan-500/10" />
          <div className="relative z-10 flex flex-col items-center p-6 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <KeyRound className="h-6 w-6" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
              Verify Passkey
            </h2>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              {reasonText}
            </p>

            <form
              onSubmit={handleVerify}
              className="flex w-full flex-col items-center space-y-6"
            >
              <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                value={passkey}
                onChange={(value) => setPasskey(value)}
                autoFocus
              >
                <InputOTPGroup className="gap-2">
                  {[...Array(6)].map((_, i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="h-10 w-10 rounded-md border-slate-200 bg-white/60 text-base sm:h-14 sm:w-14 sm:text-xl dark:border-white/10 dark:bg-white/5"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              <Button
                type="submit"
                disabled={passkey.length !== 6 || isVerifying}
                className="h-11 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.99] dark:from-emerald-500 dark:to-teal-500"
              >
                {isVerifying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Verify Access
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </section>
  );
}
