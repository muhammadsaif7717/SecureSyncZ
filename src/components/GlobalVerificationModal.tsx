"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useAuth } from "@/providers/AuthProvider";

export function GlobalVerificationModal() {
  const { user, updateUser } = useAuth();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  // Track if we have already sent the code for the current session to prevent spam
  const hasSentCodeRef = useRef(false);

  const isOpen = !!user && user.isVerified === false;

  useEffect(() => {
    if (isOpen && !hasSentCodeRef.current) {
      handleSendCode();
      hasSentCodeRef.current = true;
    }
  }, [isOpen]);

  // Reset the ref if user becomes null (logged out) or verified
  useEffect(() => {
    if (!user || user.isVerified) {
      hasSentCodeRef.current = false;
      setOtp(""); // Reset OTP input
    }
  }, [user]);

  const handleSendCode = async () => {
    setIsSendingCode(true);
    try {
      const res = await fetch("/api/v1/auth/send-verification", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          // Rate limited, don't show error as toast if it's auto-sent, just quietly fail
          // or show a warning. But if they clicked resend, show it.
          toast.info(
            "A verification code was already sent recently. Please check your email."
          );
          return;
        }
        throw new Error(data.error || "Failed to send verification code");
      }

      toast.success("Verification code sent to your email.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to verify email");

      toast.success("Email verified successfully!");
      if (data.user) {
        updateUser(data.user);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent closing the modal
  const handleOpenChange = (open: boolean) => {
    // Force it to remain open if user is not verified
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {/* Hide close button and disable outside interaction by default in Shadcn by not providing a way to close */}
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Verify Your Email</DialogTitle>
          <DialogDescription>
            For security reasons, you must verify your email address. We have
            sent a 6-digit code to <strong>{user?.email}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4">
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <MailCheck className="h-6 w-6" />
              </div>
              <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                value={otp}
                onChange={(value) => setOtp(value)}
                autoFocus
              >
                <InputOTPGroup className="gap-1 sm:gap-2">
                  {[...Array(6)].map((_, i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="h-9 w-9 text-base sm:h-12 sm:w-12 sm:text-lg"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={otp.length !== 6 || isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Verify Email
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isSendingCode}
                className="text-sm text-emerald-600 hover:underline disabled:no-underline disabled:opacity-50"
              >
                {isSendingCode ? "Sending..." : "Resend Code"}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
