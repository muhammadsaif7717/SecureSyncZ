"use client";

import { Crown, Lock, ShieldCheck, CreditCard, KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useGooglePlayBilling } from "@/hooks/useGooglePlayBilling";

interface PremiumPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
}

export default function PremiumPaywallModal({
  isOpen,
  onClose,
  featureName,
}: PremiumPaywallModalProps) {
  const { initiatePurchase, isProcessing } = useGooglePlayBilling();

  const handleStartTrial = () => {
    initiatePurchase("premium_subscription");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background/95 overflow-hidden border-none p-0 backdrop-blur-md sm:max-w-md">
        <div className="from-primary/20 via-primary/5 to-background bg-gradient-to-br p-6">
          <div className="mt-4 mb-6 flex justify-center">
            <div className="relative">
              <div className="bg-primary/20 absolute inset-0 rounded-full blur-xl"></div>
              <div className="from-primary to-primary/60 border-primary/20 relative z-10 flex h-20 w-20 items-center justify-center rounded-full border bg-gradient-to-br shadow-lg">
                <Crown className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>

          <DialogHeader className="mb-6 text-center">
            <DialogTitle className="text-foreground text-2xl font-bold">
              Unlock Premium
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              <span className="text-foreground font-semibold">
                {featureName}
              </span>{" "}
              is a premium feature. Upgrade to get full access to all advanced
              security tools.
            </DialogDescription>
          </DialogHeader>

          <div className="mb-8 space-y-4">
            <div className="text-foreground/80 flex items-center gap-3 text-sm">
              <ShieldCheck className="text-primary h-5 w-5 shrink-0" />
              <span>Advanced Password Security Analysis</span>
            </div>
            <div className="text-foreground/80 flex items-center gap-3 text-sm">
              <Lock className="text-primary h-5 w-5 shrink-0" />
              <span>Secure Notes & Identity Storage</span>
            </div>
            <div className="text-foreground/80 flex items-center gap-3 text-sm">
              <CreditCard className="text-primary h-5 w-5 shrink-0" />
              <span>Encrypted Bank Cards Vault</span>
            </div>
            <div className="text-foreground/80 flex items-center gap-3 text-sm">
              <KeyRound className="text-primary h-5 w-5 shrink-0" />
              <span>Passkey & Emergency Kit</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleStartTrial}
              disabled={isProcessing}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex w-full items-center justify-center rounded-lg px-4 py-3 font-medium shadow-md transition-all disabled:opacity-70"
            >
              {isProcessing ? "Processing..." : "Start 7-Day Free Trial"}
            </button>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground w-full px-4 py-2 text-sm transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
