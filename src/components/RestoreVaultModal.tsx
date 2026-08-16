"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, Loader2, Shield, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useEncryption } from "@/providers/EncryptionProvider";
import { useAuth } from "@/providers/AuthProvider";
import { showToast } from "@/lib/toast";

export function RestoreVaultModal({ isOpen }: { isOpen: boolean }) {
  const { unlockVault } = useEncryption();
  const { logout } = useAuth();

  const [passkey, setPasskey] = useState("");
  const [secretKeyInput, setSecretKeyInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    if (passkey.length !== 6) return;
    if (!/^[0-9a-fA-F]{64}$/.test(secretKeyInput.trim())) {
      setErrorMessage("Please enter a valid 64-character Secret Key.");
      return;
    }

    setIsVerifying(true);
    localStorage.setItem("secureSyncZ_secretKey", secretKeyInput.trim());

    const result = await unlockVault(passkey);

    if (result.success) {
      // Access granted!
      window.location.reload(); // Reload to mount everything normally
    } else {
      setErrorMessage("Invalid secret key or passkey");
      setPasskey("");
      localStorage.removeItem("secureSyncZ_secretKey");
    }
    setIsVerifying(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="w-[calc(100vw-2rem)] overflow-hidden p-0 sm:w-full [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10" />

        <div className="relative z-10 flex flex-col items-center p-6 sm:p-8">
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="flex gap-2 text-slate-500 hover:text-red-500"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>

          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Shield className="h-7 w-7" />
          </div>

          <DialogHeader className="mb-6">
            <DialogTitle className="text-center text-xl font-bold text-slate-900 dark:text-white">
              Restore Your Vault
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-slate-500 dark:text-slate-400">
              Please enter your 6-digit passkey and your 64-character Secret Key
              to restore access on this device.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleVerify}
            className="flex w-full flex-col items-center space-y-6"
          >
            <div className="w-full space-y-2">
              <Label
                htmlFor="secretKey"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Secret Key
              </Label>
              <Input
                id="secretKey"
                type="text"
                placeholder="Paste your 64-character hex key..."
                value={secretKeyInput}
                onChange={(e) => setSecretKeyInput(e.target.value)}
                className="h-11 bg-white/60 font-mono text-sm dark:bg-white/5"
                required
              />
            </div>

            <div className="flex w-full flex-col items-center space-y-2">
              <Label className="self-start text-sm font-medium text-slate-700 dark:text-slate-300">
                Passkey
              </Label>
              <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                value={passkey}
                onChange={(value) => setPasskey(value)}
              >
                <InputOTPGroup className="gap-2">
                  {[...Array(6)].map((_, i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="h-10 w-10 rounded-md border-slate-200 bg-white/60 text-base sm:h-12 sm:w-12 sm:text-lg dark:border-white/10 dark:bg-white/5"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {errorMessage && (
              <p className="text-sm font-medium text-red-500 dark:text-red-400">
                {errorMessage}
              </p>
            )}

            <Button
              type="submit"
              disabled={
                passkey.length !== 6 ||
                isVerifying ||
                secretKeyInput.length !== 64
              }
              className="h-11 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.99] disabled:opacity-50 dark:from-emerald-500 dark:to-teal-500"
            >
              {isVerifying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Unlock Vault
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
