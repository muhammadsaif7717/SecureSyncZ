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

import { ChevronLeft, ChevronDown } from "lucide-react";
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
    "password" | "card" | "note"
  >("password");

  React.useEffect(() => {
    const savedCat = localStorage.getItem("addPageActiveCategory") as any;
    if (savedCat && ["password", "card", "note"].includes(savedCat)) {
      setSelectedCategory(savedCat);
    }
  }, []);

  const handleCategoryChange = (val: "password" | "card" | "note") => {
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

  const rowClasses =
    "flex flex-col sm:flex-row sm:items-center px-4 sm:px-5 lg:px-6 py-3 sm:py-4 lg:py-5 border-b border-slate-100 dark:border-white/5 last:border-0";
  const labelClasses =
    "w-full sm:w-1/3 text-xs sm:text-sm lg:text-base font-medium text-slate-500 sm:text-slate-700 dark:text-slate-400 sm:dark:text-slate-300 mb-1 sm:mb-0";
  const inputWrapperClasses = "flex-1 w-full flex items-center";
  const borderlessInputClasses =
    "flex-1 h-auto py-3 sm:py-2 lg:py-2.5 min-h-[48px] sm:min-h-0 border-0 bg-transparent px-3 text-sm sm:text-base lg:text-lg shadow-none focus-visible:ring-0 placeholder:text-slate-400/70 dark:placeholder:text-slate-500";
  const borderlessTextareaClasses =
    "flex-1 w-full h-auto py-3 sm:py-2 lg:py-2.5 border-0 bg-transparent px-3 text-sm sm:text-base lg:text-lg shadow-none focus-visible:ring-0 placeholder:text-slate-400/70 dark:placeholder:text-slate-500 resize-none";
  const cardContainerClasses =
    "glass rounded-2xl shadow-sm overflow-hidden mb-6";

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50/50 px-4 pt-6 pb-32 sm:min-h-[calc(100vh-60px)] sm:px-6 sm:pt-10 sm:pb-36 dark:bg-[#0a0e1a]">
      <div className="animate-in fade-in zoom-in-95 mx-auto w-full max-w-2xl duration-500">
        {/* Toggle Switch */}
        <div className="mx-auto mb-8 flex w-full max-w-sm rounded-xl bg-slate-200/50 p-1 lg:max-w-md dark:bg-slate-800/50">
          <button
            onClick={() => handleCategoryChange("password")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all sm:text-base lg:py-2.5 lg:text-lg ${selectedCategory === "password" ? "bg-white text-emerald-600 shadow-sm dark:bg-[#0a0e1a] dark:text-emerald-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
          >
            Passwords
          </button>
          <button
            onClick={() => handleCategoryChange("card")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all sm:text-base lg:py-2.5 lg:text-lg ${selectedCategory === "card" ? "bg-white text-emerald-600 shadow-sm dark:bg-[#0a0e1a] dark:text-emerald-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
          >
            Cards
          </button>
          <button
            onClick={() => handleCategoryChange("note")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all sm:text-base lg:py-2.5 lg:text-lg ${selectedCategory === "note" ? "bg-white text-emerald-600 shadow-sm dark:bg-[#0a0e1a] dark:text-emerald-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
          >
            Notes
          </button>
        </div>

        {selectedCategory === "password" && (
          <div className="animate-in slide-in-from-right-4 fade-in duration-300">
            <h2 className="mb-4 ml-2 text-xl font-bold text-slate-900 dark:text-white">
              New Password
            </h2>
            <form onSubmit={handlePasswordSubmit}>
              <div className={cardContainerClasses}>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Website URL</Label>
                  <div className={inputWrapperClasses}>
                    <Input
                      placeholder="https://github.com"
                      value={newPassword.website}
                      onChange={(e) =>
                        setNewPassword({
                          ...newPassword,
                          website: e.target.value,
                        })
                      }
                      required
                      className={borderlessInputClasses}
                    />
                  </div>
                </div>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Username / Email</Label>
                  <div className={inputWrapperClasses}>
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
                      className={borderlessInputClasses}
                    />
                  </div>
                </div>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Password</Label>
                  <div className={inputWrapperClasses}>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword.password}
                      onChange={(e) =>
                        setNewPassword({
                          ...newPassword,
                          password: e.target.value,
                        })
                      }
                      required
                      className={borderlessInputClasses}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="p-2 text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                      title="Generate strong password"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center px-4 pb-3">
                  <div className="w-full sm:w-1/3"></div>
                  <div className="mt-1 flex flex-1 gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${i <= strength ? getStrengthColor() : "bg-slate-200 dark:bg-slate-800"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className={cardContainerClasses}>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Tags</Label>
                  <div className={inputWrapperClasses}>
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
                      className={borderlessInputClasses}
                    />
                  </div>
                </div>
                <div className={rowClasses + " items-start"}>
                  <Label className={labelClasses + " mt-2"}>Secure Note</Label>
                  <div className={inputWrapperClasses}>
                    <Textarea
                      placeholder="Optional details..."
                      value={newPassword.note}
                      onChange={(e) =>
                        setNewPassword({ ...newPassword, note: e.target.value })
                      }
                      className={"min-h-[80px] " + borderlessTextareaClasses}
                    />
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-emerald-600 text-base text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 sm:h-14 sm:text-lg"
              >
                Save Password
              </Button>
            </form>
          </div>
        )}

        {selectedCategory === "card" && (
          <div className="animate-in slide-in-from-right-4 fade-in duration-300">
            <h2 className="mb-4 ml-2 text-xl font-bold text-slate-900 dark:text-white">
              New Credit Card
            </h2>
            <form onSubmit={handleCardSubmit}>
              <div className={cardContainerClasses}>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Card Title</Label>
                  <div className={inputWrapperClasses}>
                    <Input
                      placeholder="e.g. My Chase Sapphire"
                      value={newCard.name}
                      onChange={(e) =>
                        setNewCard({ ...newCard, name: e.target.value })
                      }
                      required
                      className={borderlessInputClasses}
                    />
                  </div>
                </div>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Card Type</Label>
                  <div className={inputWrapperClasses + " relative"}>
                    <select
                      value={newCard.cardType || "Visa"}
                      onChange={(e) =>
                        setNewCard({ ...newCard, cardType: e.target.value })
                      }
                      required
                      className={
                        borderlessInputClasses +
                        " w-full appearance-none pr-8 text-slate-700 outline-none dark:bg-transparent dark:text-slate-200"
                      }
                    >
                      <option className="dark:bg-slate-900" value="Visa">
                        Visa
                      </option>
                      <option className="dark:bg-slate-900" value="Mastercard">
                        Mastercard
                      </option>
                      <option
                        className="dark:bg-slate-900"
                        value="Debit/Credit"
                      >
                        Debit/Credit
                      </option>
                      <option className="dark:bg-slate-900" value="Others">
                        Others
                      </option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Card Number</Label>
                  <div className={inputWrapperClasses}>
                    <Input
                      placeholder="XXXX XXXX XXXX XXXX"
                      value={newCard.cardNumber}
                      onChange={(e) =>
                        setNewCard({
                          ...newCard,
                          cardNumber: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 16),
                        })
                      }
                      required
                      className={borderlessInputClasses}
                    />
                  </div>
                </div>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Expiry (MM/YY)</Label>
                  <div className={inputWrapperClasses}>
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
                      className={borderlessInputClasses}
                    />
                  </div>
                </div>
                <div className={rowClasses}>
                  <Label className={labelClasses}>CVV</Label>
                  <div className={inputWrapperClasses}>
                    <Input
                      placeholder="123"
                      value={newCard.cvv}
                      onChange={(e) =>
                        setNewCard({
                          ...newCard,
                          cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                        })
                      }
                      required
                      className={borderlessInputClasses}
                    />
                  </div>
                </div>
              </div>

              <div className={cardContainerClasses}>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Cardholder Name</Label>
                  <div className={inputWrapperClasses}>
                    <Input
                      placeholder="Optional"
                      value={newCard.serviceName}
                      onChange={(e) =>
                        setNewCard({ ...newCard, serviceName: e.target.value })
                      }
                      className={borderlessInputClasses}
                    />
                  </div>
                </div>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Bank / Website</Label>
                  <div className={inputWrapperClasses}>
                    <Input
                      placeholder="Optional"
                      value={newCard.website}
                      onChange={(e) =>
                        setNewCard({ ...newCard, website: e.target.value })
                      }
                      className={borderlessInputClasses}
                    />
                  </div>
                </div>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Tags</Label>
                  <div className={inputWrapperClasses}>
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
                      className={borderlessInputClasses}
                    />
                  </div>
                </div>
                <div className={rowClasses + " items-start"}>
                  <Label className={labelClasses + " mt-2"}>Secure Note</Label>
                  <div className={inputWrapperClasses}>
                    <Textarea
                      placeholder="Optional details..."
                      value={newCard.note}
                      onChange={(e) =>
                        setNewCard({ ...newCard, note: e.target.value })
                      }
                      className={"min-h-[80px] " + borderlessTextareaClasses}
                    />
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-emerald-600 text-base text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 sm:h-14 sm:text-lg"
              >
                Save Card
              </Button>
            </form>
          </div>
        )}

        {selectedCategory === "note" && (
          <div className="animate-in slide-in-from-right-4 fade-in duration-300">
            <h2 className="mb-4 ml-2 text-xl font-bold text-slate-900 dark:text-white">
              New Secure Note
            </h2>
            <form onSubmit={handleNoteSubmit}>
              <div className={cardContainerClasses}>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Title</Label>
                  <div className={inputWrapperClasses}>
                    <Input
                      placeholder="e.g. Recovery Phrase"
                      value={newNote.title}
                      onChange={(e) =>
                        setNewNote({ ...newNote, title: e.target.value })
                      }
                      required
                      className={borderlessInputClasses}
                    />
                  </div>
                </div>
                <div className={rowClasses + " items-start"}>
                  <Label className={labelClasses + " mt-2"}>Note Content</Label>
                  <div className={inputWrapperClasses}>
                    <Textarea
                      placeholder="Write your secret..."
                      value={newNote.content}
                      onChange={(e) =>
                        setNewNote({ ...newNote, content: e.target.value })
                      }
                      required
                      className={"min-h-[250px] " + borderlessTextareaClasses}
                    />
                  </div>
                </div>
              </div>

              <div className={cardContainerClasses}>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Tags</Label>
                  <div className={inputWrapperClasses}>
                    <Input
                      placeholder="e.g. Crypto, Backup"
                      value={newNote.tags?.join(", ") || ""}
                      onChange={(e) =>
                        setNewNote({
                          ...newNote,
                          tags: e.target.value
                            .split(",")
                            .map((t) => t.trimStart()),
                        })
                      }
                      className={borderlessInputClasses}
                    />
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-emerald-600 text-base text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 sm:h-14 sm:text-lg"
              >
                Save Note
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
