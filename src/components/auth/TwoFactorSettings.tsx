"use client";

import React, { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, QrCode, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/lib/toast";
import axios from "axios";

export function TwoFactorSettings() {
  const { user, updateUser } = useAuth();

  const [showEnableWarning, setShowEnableWarning] = useState(false);
  const [showTOTPSetup, setShowTOTPSetup] = useState(false);
  const [totpSecret, setTotpSecret] = useState("");
  const [totpQrCode, setTotpQrCode] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const handleSetupTOTP = async () => {
    setShowEnableWarning(false);
    setIsSubmitting(true);
    setError("");
    try {
      const res = await axios.post("/api/v1/auth/2fa/totp/setup");
      setTotpSecret(res.data.secret);
      setTotpQrCode(res.data.qrCode);
      setShowTOTPSetup(true);
    } catch (err: any) {
      showToast({
        title: "Error",
        description: err.response?.data?.error || "Failed to setup TOTP",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyTOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6) return;

    setIsSubmitting(true);
    setError("");
    try {
      await axios.post("/api/v1/auth/2fa/totp/verify", { code: totpCode });

      // Update user context
      updateUser({ ...user, twoFactorEnabled: true } as any);

      showToast({
        title: "Success",
        description: "Authenticator App enabled successfully.",
      });
      setShowTOTPSetup(false);
      setTotpCode("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid authenticator code");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in-up stagger-2 glass group relative mb-8 w-full overflow-hidden rounded-[2rem] border border-emerald-200/50 shadow-xl backdrop-blur-xl transition-all duration-500 hover:shadow-2xl dark:border-emerald-900/50 dark:shadow-emerald-900/20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-emerald-500/5 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-emerald-500/10" />
      <div className="relative z-10">
        <div className="border-b border-emerald-200/50 bg-emerald-50/50 px-6 py-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <h2 className="flex items-center text-xl font-bold text-emerald-800 dark:text-emerald-400">
            <ShieldCheck className="mr-2 h-5 w-5" />
            Two-Factor Authentication (2FA)
          </h2>
        </div>

        <div className="divide-y divide-emerald-100 dark:divide-emerald-950/50">
          {/* Authenticator App */}
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                <QrCode className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                Authenticator App
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {user.twoFactorEnabled
                  ? "Authenticator App is enabled for your account."
                  : "Use an app like Google Authenticator or Authy to get verification codes."}
              </p>
            </div>
            <Button
              variant={user.twoFactorEnabled ? "outline" : "default"}
              size="sm"
              onClick={() =>
                user.twoFactorEnabled ? undefined : setShowEnableWarning(true)
              }
              disabled={user.twoFactorEnabled || isSubmitting}
              className={
                !user.twoFactorEnabled
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "cursor-default border-emerald-500 text-emerald-600 opacity-100 dark:text-emerald-400"
              }
            >
              {isSubmitting && !user.twoFactorEnabled ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {user.twoFactorEnabled ? "Enabled" : "Enable"}
            </Button>
          </div>
        </div>
      </div>

      {/* Enable 2FA Warning Modal */}
      <Dialog open={showEnableWarning} onOpenChange={setShowEnableWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-amber-600 dark:text-amber-500">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Important Warning
            </DialogTitle>
            <DialogDescription className="pt-3 text-slate-600 dark:text-slate-300">
              Are you sure you want to enable Two-Factor Authentication?
              <br />
              <br />
              <strong className="text-slate-900 dark:text-white">
                Once enabled, you will NOT be able to disable it later.
              </strong>{" "}
              This is a permanent security upgrade for your account. You must
              always have access to your authenticator app to log in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowEnableWarning(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSetupTOTP}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              I Understand, Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TOTP Setup Modal */}
      <Dialog open={showTOTPSetup} onOpenChange={setShowTOTPSetup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Setup Authenticator App</DialogTitle>
            <DialogDescription>
              Scan the QR code below with your authenticator app, then enter the
              6-digit code to verify.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-4 pt-4">
            {totpQrCode && (
              <div className="rounded-xl border bg-white p-2">
                <img
                  src={totpQrCode}
                  alt="TOTP QR Code"
                  className="h-48 w-48"
                />
              </div>
            )}

            <div className="w-full text-center">
              <p className="mb-1 text-xs text-slate-500">
                Manual Entry Secret:
              </p>
              <code className="rounded bg-slate-100 px-3 py-1 font-mono text-sm select-all dark:bg-slate-800">
                {totpSecret}
              </code>
            </div>

            <form onSubmit={handleVerifyTOTP} className="mt-4 w-full space-y-4">
              <div className="space-y-2">
                <Label htmlFor="setupTotpCode">Verification Code</Label>
                <Input
                  id="setupTotpCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={totpCode}
                  onChange={(e) =>
                    setTotpCode(e.target.value.replace(/[^0-9]/g, ""))
                  }
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
                  disabled={totpCode.length !== 6 || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isSubmitting ? "Verifying..." : "Verify & Enable"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
