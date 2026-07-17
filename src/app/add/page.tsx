"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  Key,
  CreditCard,
  RefreshCw,
  FileText,
  KeyRound,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useEncryption } from "@/providers/EncryptionProvider";
import { encryptData } from "@/lib/clientCrypto";
import { CardsData, PasswordsData, NotesData } from "@/types";
import axios from "axios";
import getURL from "@/lib/getURL";
import { showToast } from "@/lib/toast";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

import { ChevronLeft } from "lucide-react";
import VerifyPasskey from "@/components/VerifyPasskey";

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
  const { isUnlocked, cryptoKey } = useEncryption();

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
    tags: [],
  });

  const [newCard, setNewCard] = useState<CardsData>({
    user: {
      email: user?.email || "",
      username: user?.username || "",
    },
    createdAt: new Date().toISOString(),
    name: "",
    serviceName: "",
    website: "",
    cardType: "Visa",
    cardNumber: "",
    expiry: "",
    cvv: "",
    note: "",
    tags: [],
  });

  const [newNote, setNewNote] = useState<NotesData>({
    user: {
      email: user?.email || "",
      username: user?.username || "",
    },
    createdAt: new Date().toISOString(),
    title: "",
    content: "",
    tags: [],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    "none" | "password" | "card" | "note"
  >("none");

  React.useEffect(() => {
    const savedCat = localStorage.getItem("addPageActiveCategory") as any;
    if (savedCat && ["none", "password", "card", "note"].includes(savedCat)) {
      setSelectedCategory(savedCat);
    }
  }, []);

  const handleCategoryChange = (val: "none" | "password" | "card" | "note") => {
    setSelectedCategory(val);
    localStorage.setItem("addPageActiveCategory", val);
  };

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
      setNewNote((prev) => ({
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
  if (!user) return null;
  if (!isUnlocked) {
    return (
      <VerifyPasskey reasonText="Please enter your 6-digit passkey to add items." />
    );
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = await getURL();

    // Encrypt sensitive fields locally
    const encryptedPassword = await encryptData(
      newPassword.password,
      cryptoKey!
    );
    const encryptedNote = newPassword.note
      ? await encryptData(newPassword.note, cryptoKey!)
      : "";

    const passwordPayload = {
      ...newPassword,
      password: encryptedPassword,
      note: encryptedNote,
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
      // console.error("Error saving password:", error);
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
      tags: [],
    });
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = await getURL();

    // Encrypt sensitive card fields locally
    const encryptedCardNumber = await encryptData(
      newCard.cardNumber,
      cryptoKey!
    );
    const encryptedExpiry = await encryptData(newCard.expiry, cryptoKey!);
    const encryptedCvv = await encryptData(newCard.cvv, cryptoKey!);
    const encryptedNote = newCard.note
      ? await encryptData(newCard.note, cryptoKey!)
      : "";

    const cardPayload = {
      ...newCard,
      cardNumber: encryptedCardNumber,
      expiry: encryptedExpiry,
      cvv: encryptedCvv,
      note: encryptedNote,
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
      // console.error("Error saving card:", error);
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
      website: "",
      cardType: "Visa",
      cardNumber: "",
      expiry: "",
      cvv: "",
      note: "",
      tags: [],
    });
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = await getURL();

    const encryptedContent = await encryptData(newNote.content, cryptoKey!);

    const notePayload = {
      ...newNote,
      content: encryptedContent,
      user: {
        email: user.email,
        username: user.username,
      },
    };

    try {
      await axios.post(`${url}/notes/post`, notePayload);
      showToast({
        title: "Note Saved Successfully",
        description: "Your secure note has been stored.",
      });
    } catch (error) {
      // console.error("Error saving note:", error);
      showToast({
        title: "Error Saving Note",
        description: "Please try again.",
      });
    }

    setNewNote({
      user: {
        email: user.email,
        username: user.username,
      },
      createdAt: new Date().toISOString(),
      title: "",
      content: "",
      tags: [],
    });
  };

  const inputClasses =
    "h-12 sm:h-12 rounded-xl text-sm border-slate-200 bg-slate-50 transition-colors focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white dark:border-white/10 dark:bg-black/20 dark:placeholder-slate-500 dark:focus:border-emerald-500/50 dark:focus:ring-emerald-500/20 dark:focus:bg-black/40";

  const textareaClasses =
    "min-h-[120px] rounded-xl text-sm border-slate-200 bg-slate-50 transition-colors focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white dark:border-white/10 dark:bg-black/20 dark:placeholder-slate-500 dark:focus:border-emerald-500/50 dark:focus:ring-emerald-500/20 dark:focus:bg-black/40";

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50 px-4 pt-6 pb-32 sm:min-h-[calc(100vh-60px)] sm:px-6 sm:pt-12 sm:pb-36 dark:bg-[#0a0e1a]">
      {selectedCategory === "none" ? (
        <div className="animate-in fade-in zoom-in-95 mx-auto max-w-4xl duration-500">
          <div className="mb-10 text-center sm:mb-16">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
              What would you like to add?
            </h1>
            <p className="mt-4 text-base text-slate-500 sm:text-lg dark:text-slate-400">
              Select a category below to securely store your data in your
              encrypted vault.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
            <button
              onClick={() => handleCategoryChange("password")}
              className="group relative flex flex-col items-center justify-center gap-5 overflow-hidden rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/20 dark:bg-[#131b2f] dark:shadow-none dark:hover:shadow-emerald-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 dark:bg-emerald-500/20 dark:text-emerald-400">
                <Key className="h-10 w-10" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  Password
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Store website login credentials securely.
                </p>
              </div>
            </button>

            <button
              onClick={() => handleCategoryChange("card")}
              className="group relative flex flex-col items-center justify-center gap-5 overflow-hidden rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 dark:bg-[#131b2f] dark:shadow-none dark:hover:shadow-blue-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 dark:bg-blue-500/20 dark:text-blue-400">
                <CreditCard className="h-10 w-10" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  Credit Card
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Keep your card info safe for online payments.
                </p>
              </div>
            </button>

            <button
              onClick={() => handleCategoryChange("note")}
              className="group relative flex flex-col items-center justify-center gap-5 overflow-hidden rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 dark:bg-[#131b2f] dark:shadow-none dark:hover:shadow-purple-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 dark:bg-purple-500/20 dark:text-purple-400">
                <FileText className="h-10 w-10" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  Secure Note
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Write down secrets, recovery phrases, or private ideas.
                </p>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-4 fade-in mx-auto w-full max-w-xl duration-500">
          <button
            onClick={() => handleCategoryChange("none")}
            className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Options
          </button>

          <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-black/5 dark:bg-[#131b2f] dark:shadow-black/20">
            {selectedCategory === "password" && (
              <>
                <div className="bg-emerald-50 p-6 sm:p-8 dark:bg-emerald-500/10">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                      <Key className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        New Password
                      </h2>
                      <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                        Securely store your login credentials.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 sm:p-8">
                  <form onSubmit={handlePasswordSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Website URL
                      </Label>
                      <Input
                        placeholder="e.g. https://github.com"
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
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Username / Email
                      </Label>
                      <Input
                        placeholder="john@example.com"
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
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your secure password"
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
                          className="absolute top-1/2 right-10 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                          onClick={generatePassword}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>

                      {newPassword.password && (
                        <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-black/40">
                          <div
                            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                            style={{ width: `${(strength / 5) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Tags (Optional)
                      </Label>
                      <Input
                        placeholder="e.g. Work, Personal"
                        value={newPassword.tags?.join(", ") || ""}
                        onChange={(e) =>
                          setNewPassword({
                            ...newPassword,
                            tags: e.target.value
                              .split(",")
                              .map((t) => t.trimStart()),
                          })
                        }
                        className={inputClasses}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Secure Note (Optional)
                      </Label>
                      <Textarea
                        placeholder="Add a secret note..."
                        value={newPassword.note}
                        onChange={(e) =>
                          setNewPassword({
                            ...newPassword,
                            note: e.target.value,
                          })
                        }
                        className={textareaClasses}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="mt-4 h-12 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.99] dark:from-emerald-500 dark:to-teal-500"
                    >
                      Save Password
                    </Button>
                  </form>
                </div>
              </>
            )}

            {selectedCategory === "card" && (
              <>
                <div className="bg-blue-50 p-6 sm:p-8 dark:bg-blue-500/10">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        New Credit Card
                      </h2>
                      <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                        Store your card details securely.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 sm:p-8">
                  <form onSubmit={handleCardSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Cardholder Name
                      </Label>
                      <Input
                        placeholder="John Doe"
                        value={newCard.name}
                        onChange={(e) =>
                          setNewCard({ ...newCard, name: e.target.value })
                        }
                        required
                        className={inputClasses}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Service / Bank Name
                      </Label>
                      <Input
                        placeholder="e.g. Chase, Discover"
                        value={newCard.serviceName}
                        onChange={(e) =>
                          setNewCard({
                            ...newCard,
                            serviceName: e.target.value,
                          })
                        }
                        required
                        className={inputClasses}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Bank URL (Optional)
                      </Label>
                      <Input
                        placeholder="e.g. https://chase.com"
                        value={newCard.website || ""}
                        onChange={(e) =>
                          setNewCard({ ...newCard, website: e.target.value })
                        }
                        className={inputClasses}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Card Type
                      </Label>
                      <select
                        value={newCard.cardType || "Visa"}
                        onChange={(e) =>
                          setNewCard({ ...newCard, cardType: e.target.value })
                        }
                        required
                        className={`${inputClasses} flex w-full appearance-none items-center justify-between px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        <option value="Visa">Visa</option>
                        <option value="Mastercard">Mastercard</option>
                        <option value="Debit/Credit">Debit/Credit</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Card Number
                      </Label>
                      <Input
                        placeholder="XXXX XXXX XXXX XXXX"
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
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Expiry
                        </Label>
                        <Input
                          placeholder="MM/YY"
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
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          CVV
                        </Label>
                        <Input
                          placeholder="123"
                          value={newCard.cvv}
                          onChange={(e) =>
                            setNewCard({ ...newCard, cvv: e.target.value })
                          }
                          required
                          className={inputClasses}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Tags (Optional)
                      </Label>
                      <Input
                        placeholder="e.g. Finance, Shopping"
                        value={newCard.tags?.join(", ") || ""}
                        onChange={(e) =>
                          setNewCard({
                            ...newCard,
                            tags: e.target.value
                              .split(",")
                              .map((t) => t.trimStart()),
                          })
                        }
                        className={inputClasses}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Secure Note (Optional)
                      </Label>
                      <Textarea
                        placeholder="Add a secret card note..."
                        value={newCard.note}
                        onChange={(e) =>
                          setNewCard({ ...newCard, note: e.target.value })
                        }
                        className={textareaClasses}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="mt-4 h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.99] dark:from-blue-500 dark:to-indigo-500"
                    >
                      Save Card
                    </Button>
                  </form>
                </div>
              </>
            )}

            {selectedCategory === "note" && (
              <>
                <div className="bg-purple-50 p-6 sm:p-8 dark:bg-purple-500/10">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        New Secure Note
                      </h2>
                      <p className="text-sm text-purple-600/80 dark:text-purple-400/80">
                        Write down your private thoughts.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 sm:p-8">
                  <form onSubmit={handleNoteSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Note Title
                      </Label>
                      <Input
                        placeholder="Enter title"
                        value={newNote.title}
                        onChange={(e) =>
                          setNewNote({ ...newNote, title: e.target.value })
                        }
                        required
                        className={inputClasses}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Content
                      </Label>
                      <Textarea
                        placeholder="Type your secure note here..."
                        value={newNote.content}
                        onChange={(e) =>
                          setNewNote({ ...newNote, content: e.target.value })
                        }
                        required
                        className={textareaClasses}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Tags (Optional)
                      </Label>
                      <Input
                        placeholder="e.g. Work, Ideas"
                        value={newNote.tags?.join(", ") || ""}
                        onChange={(e) =>
                          setNewNote({
                            ...newNote,
                            tags: e.target.value
                              .split(",")
                              .map((t) => t.trimStart()),
                          })
                        }
                        className={inputClasses}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="mt-4 h-12 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-purple-500/30 active:scale-[0.99] dark:from-purple-500 dark:to-pink-500"
                    >
                      Save Note
                    </Button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
