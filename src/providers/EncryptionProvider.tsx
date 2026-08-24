"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { deriveKey, decryptData } from "@/lib/clientCrypto";
import axios from "axios";
import { showToast } from "@/lib/toast";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { RestoreVaultModal } from "@/components/RestoreVaultModal";

interface EncryptionContextType {
  cryptoKey: CryptoKey | null;
  isUnlocked: boolean;
  unlockVault: (pin: string) => Promise<{ success: boolean; error?: string }>;
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

  // Inside the component:
  const protectedPaths = [
    "/passwords",
    "/cards",
    "/post",
    "/profile",
    "/add",
    "/health",
    "/",
  ];

  const isProtectedPath = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  const existingKey =
    typeof window !== "undefined"
      ? localStorage.getItem("secureSyncZ_secretKey")
      : null;
  const needsSecretKey = !existingKey || !/^[0-9a-fA-F]{64}$/.test(existingKey);

  const showRestoreVaultModal =
    !isLoading &&
    !!user &&
    isProtectedPath &&
    !cryptoKey &&
    !!user.encryptedValidationStr &&
    needsSecretKey;

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

  const unlockVault = async (
    pin: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      let secretKeyHex = localStorage.getItem("secureSyncZ_secretKey");

      if (!secretKeyHex) {
        return { success: false, error: "Missing secret key." };
      }

      const derivedKey = await deriveKey(pin, secretKeyHex);

      if (user?.encryptedValidationStr) {
        try {
          const decrypted = await decryptData(
            user.encryptedValidationStr,
            derivedKey
          );
          if (decrypted !== "VALID-KEY") {
            // Secret key or Passkey is wrong
            return {
              success: false,
              error: "Invalid Secret Key or Passkey.",
            };
          }
        } catch (error) {
          return {
            success: false,
            error: "Invalid Secret Key or Passkey.",
          };
        }
      }

      setCryptoKey(derivedKey);
      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to unlock vault." };
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
      {showRestoreVaultModal && (
        <RestoreVaultModal isOpen={showRestoreVaultModal} />
      )}
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
