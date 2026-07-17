"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Loader2, KeyRound } from "lucide-react";
import axios from "axios";
import { showToast } from "@/lib/toast";
import { REGEXP_ONLY_DIGITS } from "input-otp";

const protectedPaths = ["/passwords", "/cards", "/post", "/edit-profile"];

export default function PasskeyModal() {
  const { user, updateUser, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (user && !user.hasPasskey) {
      const isProtected = protectedPaths.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
      );

      if (isProtected) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    } else {
      setIsOpen(false);
    }
  }, [user, pathname, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passkey.length !== 6 || !/^\d+$/.test(passkey)) {
      showToast({
        title: "Validation Error",
        description: "Passkey must be exactly 6 digits.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await axios.post("/api/v1/auth/passkey/setup", {
        passkey,
      });

      if (response.data && response.data.user) {
        updateUser(response.data.user);
        setIsOpen(false);
        showToast({
          title: "Success",
          description: "Passkey set successfully!",
        });
      }
    } catch (error: any) {
      // console.error("Failed to set passkey:", error);
      const errorMessage =
        error.response?.data?.error ||
        "Failed to set passkey. Please try again.";
      showToast({
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-md rounded-2xl bg-white sm:w-full dark:bg-slate-900"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <KeyRound className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl text-slate-900 dark:text-white">
            Set Your Passkey
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-slate-500 dark:text-slate-400">
            For enhanced security, please set a 6-digit passkey. You will need
            this to access your passwords and cards.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="mt-4 flex flex-col items-center space-y-6"
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
                  showChar={true}
                  className="h-10 w-10 rounded-md border-slate-200 bg-white/60 text-base sm:h-14 sm:w-14 sm:text-xl dark:border-white/10 dark:bg-white/5"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <Button
            type="submit"
            disabled={passkey.length !== 6 || isSaving}
            className="h-11 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:from-emerald-500 dark:to-teal-500"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Set Passkey
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
