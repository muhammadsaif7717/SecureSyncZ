"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff, Key, CreditCard, RefreshCw } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { CardsData, PasswordsData } from "@/types";
import axios from "axios";
import getURL from "@/lib/getURL";
import { showToast } from "@/lib/toast";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, "");
  const truncated = digits.substring(0, 4);
  if (truncated.length === 3) {
    return `${truncated.substring(0, 1)}/${truncated.substring(1, 3)}`;
  } else if (truncated.length === 4) {
    return `${truncated.substring(0, 2)}/${truncated.substring(2, 4)}`;
  }
  return truncated;
};

export default function PostPage() {
  const { user, isLoading } = useAuth();

  const [newPassword, setNewPassword] = useState<PasswordsData>({
    user: {
      email: user?.email || "",
      username: user?.username || "",
    },
    createdAt: new Date().toISOString(),
    website: "",
    username: "",
    password: "",
    note: "",
  });

  const [newCard, setNewCard] = useState<CardsData>({
    user: {
      email: user?.email || "",
      username: user?.username || "",
    },
    createdAt: new Date().toISOString(),
    name: "",
    serviceName: "",
    cardType: "Visa",
    cardNumber: "",
    expiry: "",
    cvv: "",
    note: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const generatePassword = () => {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let password = "";
    for (let i = 0, n = charset.length; i < 16; ++i) {
      password += charset.charAt(Math.floor(Math.random() * n));
    }
    setNewPassword({ ...newPassword, password });
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length > 7) strength += 1;
    if (password.length > 12) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength; // 0 to 5
  };

  const strength = getPasswordStrength(newPassword.password);
  const getStrengthColor = () => {
    if (newPassword.password.length === 0) return "bg-transparent";
    if (strength <= 2) return "bg-red-500";
    if (strength <= 4) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  // Update states once user is loaded
  React.useEffect(() => {
    if (user) {
      setNewPassword((prev) => ({
        ...prev,
        user: { email: user.email, username: user.username },
      }));
      setNewCard((prev) => ({
        ...prev,
        user: { email: user.email, username: user.username },
      }));
    }
  }, [user]);

  if (isLoading)
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Loading...
      </div>
    );
  if (!user)
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Sign in to view this page
      </div>
    );

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = await getURL();

    // Ensure user credentials are explicitly set
    const passwordPayload = {
      ...newPassword,
      user: {
        email: user.email,
        username: user.username,
      },
    };

    try {
      await axios.post(`${url}/passwords/post`, passwordPayload);
      showToast({
        title: "Password Saved Successfully",
        description: "Your password has been stored securely.",
      });
    } catch (error) {
      console.error("Error saving password:", error);
      showToast({
        title: "Error Saving Password",
        description: "Please try again.",
      });
    }

    setNewPassword({
      user: {
        email: user.email,
        username: user.username,
      },
      createdAt: new Date().toISOString(),
      website: "",
      username: "",
      password: "",
      note: "",
    });
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = await getURL();

    // Ensure user credentials are explicitly set
    const cardPayload = {
      ...newCard,
      user: {
        email: user.email,
        username: user.username,
      },
    };

    try {
      await axios.post(`${url}/cards/post`, cardPayload);
      showToast({
        title: "Card Saved Successfully",
        description: "Your card info has been stored securely.",
      });
    } catch (error) {
      console.error("Error saving card:", error);
      showToast({
        title: "Error Saving Card",
        description: "Please try again.",
      });
    }

    setNewCard({
      user: {
        email: user.email,
        username: user.username,
      },
      createdAt: new Date().toISOString(),
      name: "",
      serviceName: "",
      cardType: "Visa",
      cardNumber: "",
      expiry: "",
      cvv: "",
      note: "",
    });
  };

  const inputClasses =
    "h-11 sm:h-10 text-sm border-slate-200 bg-white/60 transition-colors focus:border-emerald-300 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:placeholder-slate-500 dark:focus:border-emerald-500/30 dark:focus:bg-white/[0.07]";

  const textareaClasses =
    "min-h-[80px] text-sm border-slate-200 bg-white/60 transition-colors focus:border-emerald-300 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:placeholder-slate-500 dark:focus:border-emerald-500/30 dark:focus:bg-white/[0.07]";

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-start justify-center bg-slate-50 px-4 py-6 sm:min-h-[calc(100vh-60px)] sm:py-10 dark:bg-[#0a0e1a]">
      <div className="glass w-full max-w-xl overflow-hidden rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20">
        {/* Top accent bar */}
        <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        <div className="p-4 sm:p-6">
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="mb-5 grid w-full grid-cols-2 rounded-xl bg-slate-100 p-1 sm:mb-6 dark:bg-white/5">
              <TabsTrigger
                value="password"
                className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm sm:py-2 sm:text-sm dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-emerald-400"
              >
                <Key className="h-3.5 w-3.5" />
                Passwords
              </TabsTrigger>
              <TabsTrigger
                value="card"
                className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm sm:py-2 sm:text-sm dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-emerald-400"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Credit Cards
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password">
              <Card className="border-0 bg-transparent shadow-none">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
                    Add Secure Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5 px-0 pb-0 sm:space-y-4">
                  <form
                    onSubmit={handlePasswordSubmit}
                    className="space-y-3.5 sm:space-y-4"
                  >
                    <Input
                      placeholder="Website URL (e.g. https://github.com)"
                      value={newPassword.website}
                      onChange={(e) =>
                        setNewPassword({
                          ...newPassword,
                          website: e.target.value,
                        })
                      }
                      required
                      className={inputClasses}
                    />

                    <Input
                      placeholder="Username / Email"
                      value={newPassword.username}
                      onChange={(e) =>
                        setNewPassword({
                          ...newPassword,
                          username: e.target.value,
                        })
                      }
                      required
                      className={inputClasses}
                    />
                    <div className="space-y-1.5">
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Secure Password"
                          value={newPassword.password}
                          onChange={(e) =>
                            setNewPassword({
                              ...newPassword,
                              password: e.target.value,
                            })
                          }
                          required
                          className={`${inputClasses} pr-20`}
                        />
                        <button
                          type="button"
                          className="absolute top-1/2 right-10 -translate-y-1/2 p-0.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="absolute top-1/2 right-2 -translate-y-1/2 p-0.5 text-slate-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                          onClick={generatePassword}
                          title="Generate Password"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Password Strength Meter */}
                      {newPassword.password && (
                        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                          <div
                            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                            style={{ width: `${(strength / 5) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <Textarea
                      placeholder="Add a secret note... (optional)"
                      value={newPassword.note}
                      onChange={(e) =>
                        setNewPassword({
                          ...newPassword,
                          note: e.target.value,
                        })
                      }
                      className={textareaClasses}
                    />
                    <Button
                      type="submit"
                      className="h-11 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.99] sm:h-10 dark:from-emerald-500 dark:to-teal-500"
                    >
                      Save Secure Password
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="card">
              <Card className="border-0 bg-transparent shadow-none">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
                    Add Credit Card Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5 px-0 pb-0 sm:space-y-4">
                  <form
                    onSubmit={handleCardSubmit}
                    className="space-y-3.5 sm:space-y-4"
                  >
                    <Input
                      placeholder="Cardholder Name"
                      value={newCard.name}
                      onChange={(e) =>
                        setNewCard({ ...newCard, name: e.target.value })
                      }
                      required
                      className={inputClasses}
                    />
                    <Input
                      placeholder="Service / Bank Name (e.g. Chase, Discover)"
                      value={newCard.serviceName}
                      onChange={(e) =>
                        setNewCard({ ...newCard, serviceName: e.target.value })
                      }
                      required
                      className={inputClasses}
                    />
                    <select
                      value={newCard.cardType || "Visa"}
                      onChange={(e) =>
                        setNewCard({ ...newCard, cardType: e.target.value })
                      }
                      required
                      className={`${inputClasses} flex w-full items-center justify-between rounded-[10px] border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="Debit/Credit">Debit/Credit</option>
                      <option value="Others">Others</option>
                    </select>
                    <Input
                      placeholder="Card Number (no spaces)"
                      value={newCard.cardNumber}
                      onChange={(e) =>
                        setNewCard({
                          ...newCard,
                          cardNumber: e.target.value,
                        })
                      }
                      required
                      className={inputClasses}
                    />
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <Input
                        placeholder="Expiry (MM/YY)"
                        value={newCard.expiry}
                        onChange={(e) =>
                          setNewCard({
                            ...newCard,
                            expiry: formatExpiry(e.target.value),
                          })
                        }
                        required
                        maxLength={5}
                        className={inputClasses}
                      />
                      <Input
                        placeholder="CVV"
                        value={newCard.cvv}
                        onChange={(e) =>
                          setNewCard({ ...newCard, cvv: e.target.value })
                        }
                        required
                        className={inputClasses}
                      />
                    </div>
                    <Textarea
                      placeholder="Add a secret card note... (optional)"
                      value={newCard.note}
                      onChange={(e) =>
                        setNewCard({ ...newCard, note: e.target.value })
                      }
                      className={textareaClasses}
                    />
                    <Button
                      type="submit"
                      className="h-11 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.99] sm:h-10 dark:from-emerald-500 dark:to-teal-500"
                    >
                      Save Secure Card
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
