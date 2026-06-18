"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

interface User {
  id: string;
  email: string;
  username: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
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
        console.warn("Not authenticated on mount:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/v1/auth/login", {
        email,
        password,
      });
      if (response.data && response.data.user) {
        setUser(response.data.user);
        showToast({
          title: "Logged In Successfully",
          description: `Welcome back, ${response.data.user.username}!`,
        });
        router.push("/passwords");
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

  const signup = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/v1/auth/signup", {
        username,
        email,
        password,
      });
      if (response.data && response.data.user) {
        setUser(response.data.user);
        showToast({
          title: "Registration Successful",
          description: `Welcome to SecureSyncZ, ${response.data.user.username}!`,
        });
        router.push("/passwords");
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

  const logout = async () => {
    setIsLoading(true);
    try {
      await axios.post("/api/v1/auth/logout");
      setUser(null);
      showToast({
        title: "Logged Out",
        description: "You have been logged out of your session.",
      });
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
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
      value={{ user, isLoading, login, signup, logout, updateUser }}
    >
      {children}
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
