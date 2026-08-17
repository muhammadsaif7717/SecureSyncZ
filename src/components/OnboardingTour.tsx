"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Key,
  FileText,
  Settings,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("secureSyncZ_hasSeenTour");
    if (!hasSeenTour) {
      setIsOpen(true);
    }
  }, []);

  const completeTour = () => {
    localStorage.setItem("secureSyncZ_hasSeenTour", "true");
    setIsOpen(false);
  };

  const nextStep = () => {
    if (step === tourSteps.length - 1) {
      completeTour();
    } else {
      setStep(step + 1);
    }
  };

  const tourSteps = [
    {
      title: "Welcome to SecureSyncZ! 🎉",
      description:
        "Your ultra-secure, client-side encrypted vault. Let's take a quick look at the new features we've added.",
      icon: <Shield className="h-10 w-10 text-emerald-500" />,
    },
    {
      title: "The New Dashboard",
      description:
        "We've replaced the old passwords view with a comprehensive dashboard. See your total items and get instant health alerts for weak or reused passwords.",
      icon: <FileText className="h-10 w-10 text-teal-500" />,
    },
    {
      title: "Advanced Password Generator",
      description:
        "Creating strong passwords is now easier than ever. Customize length and character types right from the add or edit screens.",
      icon: <Key className="h-10 w-10 text-cyan-500" />,
    },
    {
      title: "Smart Tagging System",
      description:
        "Organize your life with tags instead of rigid folders. Add multiple tags to passwords, cards, and notes for quick filtering.",
      icon: <Settings className="h-10 w-10 text-cyan-500" />,
    },
    {
      title: "You're All Set!",
      description:
        "Enjoy the darker OLED theme, enhanced glassmorphism, and lightning-fast passkey access. Stay secure!",
      icon: <CheckCircle2 className="h-10 w-10 text-green-500" />,
    },
  ];

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) completeTour();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-slate-100 p-4 dark:bg-white/5">
              {tourSteps[step].icon}
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {tourSteps[step].title}
          </DialogTitle>
          <DialogDescription className="pt-2 text-center text-base">
            {tourSteps[step].description}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 flex justify-center gap-1">
          {tourSteps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-emerald-500" : "w-1.5 bg-slate-200 dark:bg-slate-700"}`}
            />
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="ghost"
            onClick={completeTour}
            className="text-slate-500"
          >
            Skip
          </Button>
          <Button
            onClick={nextStep}
            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {step === tourSteps.length - 1 ? "Get Started" : "Next"}
            {step !== tourSteps.length - 1 && (
              <ArrowRight className="h-4 w-4" />
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
