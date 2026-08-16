"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import axios from "axios";

interface TwoFactorPromptProps {
  isOpen: boolean;
  onClose: () => void;
  methods: string[];
  onSuccess: (user: any) => void;
}

export function TwoFactorPrompt({
  isOpen,
  onClose,
  onSuccess,
}: TwoFactorPromptProps) {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleVerifyTOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setIsSubmitting(true);
    setError("");
    try {
      const res = await axios.post("/api/v1/auth/login/verify-2fa", {
        type: "totp",
        code,
      });
      onSuccess(res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid 2FA code");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Additional security verification is required to sign in to your
            account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <form onSubmit={handleVerifyTOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totpCode">Authenticator Code</Label>
              <Input
                id="totpCode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                required
                className="text-center font-mono text-lg tracking-widest"
                disabled={isSubmitting}
              />
            </div>
            {error && (
              <p className="text-sm font-medium text-red-500">{error}</p>
            )}
            <DialogFooter>
              <Button
                type="submit"
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={code.length !== 6 || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isSubmitting ? "Verifying..." : "Verify Code"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
