"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { deriveKey, generateSecretKey } from "@/lib/clientCrypto";
import { showToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { EmergencyKitModal } from "@/components/EmergencyKitModal";

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
  const [showEmergencyKit, setShowEmergencyKit] = useState(false);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState("");
  const router = useRouter();

  // Auto-generate secret key on mount if missing
  useEffect(() => {
    if (typeof window !== "undefined") {
      let secretKeyHex = localStorage.getItem("secureSyncZ_secretKey");
      if (!secretKeyHex) {
        secretKeyHex = generateSecretKey();
        localStorage.setItem("secureSyncZ_secretKey", secretKeyHex);
        setNewlyGeneratedKey(secretKeyHex);
        setShowEmergencyKit(true);
      }
    }
  }, []);

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
      <EmergencyKitModal
        isOpen={showEmergencyKit}
        secretKey={newlyGeneratedKey}
        onConfirm={() => setShowEmergencyKit(false)}
      />
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
