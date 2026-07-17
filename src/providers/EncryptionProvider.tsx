"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { deriveKey } from "@/lib/clientCrypto";
import { showToast } from "@/lib/toast";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

interface EncryptionContextType {
  cryptoKey: CryptoKey | null;
  isUnlocked: boolean;
  unlockVault: (pin: string) => Promise<boolean>;
  lockVault: () => void;
}

const EncryptionContext = createContext<EncryptionContextType | undefined>(
  undefined
);

export function EncryptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();

  // Check if secret key is missing or tampered
  useEffect(() => {
    if (typeof window !== "undefined" && !isLoading && user) {
      const secretKeyHex = localStorage.getItem("secureSyncZ_secretKey");
      const isValidKey = secretKeyHex && /^[0-9a-fA-F]{64}$/.test(secretKeyHex);

      if (!isValidKey && pathname !== "/sign-in" && pathname !== "/sign-up") {
        logout();
        showToast({
          title: "Session Terminated",
          description: "Missing or invalid security key. Please log in again.",
        });
      }
    }
  }, [user, isLoading, logout, pathname]);

  // Auto-lock inactivity timer (3 minutes)
  useEffect(() => {
    if (!cryptoKey) return;

    let timeoutId: NodeJS.Timeout;

    const autoLock = () => {
      setCryptoKey(null);
      showToast({
        title: "Vault Locked",
        description: "Your session was locked due to inactivity.",
      });
      router.push("/passkey");
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(autoLock, 3 * 60 * 1000); // 3 minutes
    };

    resetTimer();

    const events = [
      "mousemove",
      "mousedown",
      "keypress",
      "touchmove",
      "scroll",
    ];
    const handleActivity = () => resetTimer();

    events.forEach((event) => window.addEventListener(event, handleActivity));

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
    };
  }, [cryptoKey, router]);

  const unlockVault = async (pin: string): Promise<boolean> => {
    try {
      let secretKeyHex = localStorage.getItem("secureSyncZ_secretKey");

      if (!secretKeyHex) {
        console.error("Missing secret key even after mount generation.");
        return false;
      }

      const derivedKey = await deriveKey(pin, secretKeyHex);
      setCryptoKey(derivedKey);
      return true;
    } catch (error) {
      console.error("Failed to unlock vault:", error);
      return false;
    }
  };

  const lockVault = () => {
    setCryptoKey(null);
  };

  return (
    <EncryptionContext.Provider
      value={{ cryptoKey, isUnlocked: !!cryptoKey, unlockVault, lockVault }}
    >
      {children}
    </EncryptionContext.Provider>
  );
}

export function useEncryption() {
  const context = useContext(EncryptionContext);
  if (context === undefined) {
    throw new Error("useEncryption must be used within an EncryptionProvider");
  }
  return context;
}
