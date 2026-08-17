"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { GlobalVerificationModal } from "@/components/GlobalVerificationModal";
import { useQueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  username: string;
  profilePicture?: string;
  hasPasskey?: boolean;
  hasPassword?: boolean;
  isVerified?: boolean;
  encryptedValidationStr?: string;
  isPremium?: boolean;
  twoFactorEnabled?: boolean;
  webAuthnCredentials?: any[];
  hasUsedTrial?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  googleLogin: (credential: string) => Promise<any>;
  signup: (
    username: string,
    email: string,
    password: string,
    encryptedValidationStr?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user profile on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const response = await axios.get("/api/v1/auth/me");
        if (response.data && response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          // Expected: user is simply not logged in
        } else {
          // console.error("Auth check failed:", error);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();

    // Polling interval to keep checking user status (e.g. verification)
    const intervalId = setInterval(() => {
      loadUser();
    }, 60 * 1000); // 60 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Auto-lock inactivity timer (5 minutes)
  useEffect(() => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout;

    const lockVault = () => {
      showToast({
        title: "Vault Locked",
        description: "Your session was locked due to inactivity.",
      });
      logout();
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(lockVault, 3 * 60 * 1000); // 3 minutes
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
  }, [user]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/v1/auth/login", {
        email,
        password,
      });

      if (response.data?.require2FA) {
        return response.data;
      }

      if (response.data && response.data.user) {
        setUser(response.data.user);
        showToast({
          title: "Logged In Successfully",
          description: `Welcome back, ${response.data.user.username}!`,
        });
        return { success: true, user: response.data.user };
      }
    } catch (error) {
      let errorMsg = "Login failed. Please check credentials.";
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.error || errorMsg;
      }
      showToast({
        title: "Login Failed",
        description: errorMsg,
      });
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (credential: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/v1/auth/google", { credential });

      if (response.data?.require2FA) {
        return response.data;
      }

      if (response.data && response.data.user) {
        setUser(response.data.user);
        showToast({
          title: "Logged In Successfully",
          description: `Welcome, ${response.data.user.username}!`,
        });
        return { success: true, user: response.data.user };
      }
    } catch (error) {
      let errorMsg = "Google Login failed.";
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.error || errorMsg;
      }
      showToast({
        title: "Login Failed",
        description: errorMsg,
      });
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    username: string,
    email: string,
    password: string,
    encryptedValidationStr?: string
  ) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/v1/auth/signup", {
        username,
        email,
        password,
        encryptedValidationStr,
      });
      if (response.data && response.data.user) {
        setUser(response.data.user);
        showToast({
          title: "Registration Successful",
          description: `Welcome to SecureSyncZ, ${response.data.user.username}!`,
        });
        // Redirect is handled by the caller (SignUpPage) after EmergencyKitModal
      }
    } catch (error) {
      let errorMsg = "Registration failed. Please try again.";
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.error || errorMsg;
      }
      showToast({
        title: "Registration Failed",
        description: errorMsg,
      });
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const queryClient = useQueryClient();

  const logout = async () => {
    setIsLoading(true);
    try {
      await axios.post("/api/v1/auth/logout");
      setUser(null);
      // Clear React Query cache so no stale data remains in memory
      queryClient.clear();
      // Clear local storage (except theme, secret key, and onboarding tour flag)
      const theme = localStorage.getItem("theme");
      const secretKey = localStorage.getItem("secureSyncZ_secretKey");
      const hasSeenTour = localStorage.getItem("secureSyncZ_hasSeenTour");
      localStorage.clear();
      if (theme) localStorage.setItem("theme", theme);
      if (secretKey) localStorage.setItem("secureSyncZ_secretKey", secretKey);
      if (hasSeenTour)
        localStorage.setItem("secureSyncZ_hasSeenTour", hasSeenTour);

      showToast({
        title: "Logged Out",
        description: "You have been logged out of your session.",
      });
      router.push("/sign-in");
    } catch (error) {
      // console.error("Logout error:", error);
      showToast({
        title: "Logout Error",
        description: "Failed to log out correctly.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (newUser: User) => {
    setUser(newUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        googleLogin,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
      <GlobalVerificationModal />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
