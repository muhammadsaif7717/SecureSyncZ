"use client";

import { useState, useEffect } from "react";
import {
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useQuery } from "@tanstack/react-query";
import { CardsData } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { showToast } from "@/lib/toast";
import getURL from "@/lib/getURL";
import axios from "axios";
import getCards from "@/lib/getCards";
import { REGEXP_ONLY_DIGITS } from "input-otp";

const loadCardsData = async (): Promise<CardsData[]> => {
  const res = await getCards();
  return res;
};

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

export default function CardPageClient({ name }: { name: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editableData, setEditableData] = useState<CardsData | null>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  const [isVerified, setIsVerified] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const toggleVisibility = (id: string) => {
    setVisible((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    data = [],
    isLoading,
    refetch,
  } = useQuery<CardsData[]>({
    queryKey: ["cards"],
    queryFn: loadCardsData,
  });

  const fetchedPasswordsData = data ?? [];

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passkey.length !== 6) return;

    setIsVerifying(true);
    try {
      const response = await axios.post("/api/v1/auth/passkey/verify", {
        passkey,
      });
      if (response.data.success) {
        setIsVerified(true);
        showToast({ title: "Success", description: "Passkey verified!" });
      }
    } catch (err) {
      showToast({ title: "Error", description: "Invalid passkey. Try again." });
      setPasskey("");
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (passkey.length === 6 && !isVerifying) {
      handleVerify();
    }
  }, [passkey]);

  if (isLoading) {
    return (
      <div className="mt-10 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
        Loading...
      </div>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast({
      title: "✅ Copied to clipboard",
      description: "Card info has been copied successfully.",
    });
  };

  const filteredPassData = fetchedPasswordsData.filter((item) => {
    const groupName = item.serviceName || item.name;
    return groupName.toLowerCase() === name.toLowerCase();
  });

  const displayCards = filteredPassData.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cardNumber?.includes(searchQuery) ||
      item.note?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editableData) return;

    const updatedCardData = {
      name: editableData.name,
      serviceName: editableData.serviceName,
      cardType: editableData.cardType || "Others",
      cardNumber: editableData.cardNumber,
      expiry: editableData.expiry,
      cvv: editableData.cvv,
      note: editableData.note,
      website: editableData.website,
    };

    try {
      const url = await getURL();
      const response = await axios.put(
        `${url}/cards/update/${editableData._id}`,
        updatedCardData
      );

      if (!response.data) {
        throw new Error("Failed to update card");
      }

      showToast({
        title: "✅ Card updated successfully",
        description: "Your card has been updated.",
      });

      setIsDialogOpen(false);
      await refetch(); // Refresh the data after update
    } catch (err) {
      showToast({
        title: err instanceof Error ? err.message : "Error",
        description: "Failed to update card.",
      });
    }
  };

  const handleToggleFavorite = async (item: CardsData) => {
    try {
      const url = await getURL();
      await axios.put(`${url}/cards/update/${item._id}`, {
        name: item.name,
        serviceName: item.serviceName,
        cardType: item.cardType || "Others",
        cardNumber: item.cardNumber,
        expiry: item.expiry,
        cvv: item.cvv,
        note: item.note,
        website: item.website,
        isFavorite: !item.isFavorite,
        tags: item.tags,
      });
      await refetch();
    } catch (err) {
      showToast({
        title: "Error",
        description: "Failed to toggle favorite status.",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    const url = await getURL();
    try {
      const response = await axios.delete(`${url}/cards/delete/${deleteId}`);
      if (!response.data) throw new Error("Failed to delete card");

      showToast({
        title: "✅ Card deleted successfully",
        description: "Your card has been deleted.",
      });

      setIsDeleteDialogOpen(false);
      setDeleteId(null);
      await refetch();
    } catch (err) {
      showToast({
        title: err instanceof Error ? err.message : "Error",
        description: "Failed to delete card.",
      });
    }
  };

  if (filteredPassData.length === 0) {
    return (
      <div className="mt-10 text-center text-sm font-medium text-red-500 dark:text-red-400">
        No card data found.
      </div>
    );
  }

  if (!isVerified) {
    return (
      <section className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center bg-slate-50 px-4 py-6 sm:min-h-[calc(100vh-60px)] dark:bg-[#0a0e1a]">
        <div className="w-full max-w-md">
          <div className="glass overflow-hidden rounded-2xl border border-emerald-500/20 p-6 shadow-xl dark:shadow-emerald-500/5">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
                Verify Passkey
              </h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                Please enter your 6-digit passkey to access cards for{" "}
                <span className="font-semibold capitalize">{name}</span>.
              </p>

              <form
                onSubmit={handleVerify}
                className="flex w-full flex-col items-center space-y-6"
              >
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={passkey}
                  onChange={(value) => setPasskey(value)}
                  autoFocus
                >
                  <InputOTPGroup className="gap-2">
                    {[...Array(6)].map((_, i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="h-12 w-12 rounded-md border-slate-200 bg-white/60 text-lg sm:h-14 sm:w-14 sm:text-xl dark:border-white/10 dark:bg-white/5"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>

                <Button
                  type="submit"
                  disabled={passkey.length !== 6 || isVerifying}
                  className="h-11 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.99] dark:from-emerald-500 dark:to-teal-500"
                >
                  {isVerifying ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Verify Access
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-[calc(100vh-56px)] flex-col items-center bg-slate-50 px-4 py-6 sm:min-h-[calc(100vh-60px)] sm:py-10 dark:bg-[#0a0e1a]">
      <div className="w-full max-w-md">
        <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-900 sm:mb-6 sm:text-2xl dark:text-white">
          <CreditCard className="h-5 w-5 text-teal-500 sm:h-6 sm:w-6" />
          <span className="capitalize">{name}</span>&apos;s Cards
        </h2>

        <div className="relative mb-5 sm:mb-6">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search cards by name, number, or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 border-slate-200 bg-white/60 pl-9 text-sm transition-colors focus:border-emerald-300 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:placeholder-slate-500 dark:focus:border-emerald-500/30 dark:focus:bg-white/[0.07]"
          />
        </div>

        {displayCards.length === 0 && searchQuery !== "" ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No cards found matching "{searchQuery}".
          </p>
        ) : (
          displayCards.map((card) => {
            const isVisa = card.cardType?.toLowerCase() === "visa";
            const isMastercard = card.cardType?.toLowerCase() === "mastercard";
            const badgeColors = isVisa
              ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300"
              : isMastercard
                ? "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300"
                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300";

            return (
              <div
                key={card._id}
                className="glass group mb-5 overflow-hidden rounded-2xl shadow-lg shadow-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 sm:mb-6 dark:shadow-black/20"
              >
                {/* Gradient top accent */}
                <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

                <div className="space-y-4 p-4 sm:p-6">
                  {/* Card name & date */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 sm:text-lg dark:text-white">
                        {card.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        {card.cardType && (
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${badgeColors}`}
                          >
                            {card.cardType}
                          </span>
                        )}
                        {card.website && (
                          <a
                            href={
                              card.website.startsWith("http")
                                ? card.website
                                : `https://${card.website}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-emerald-600 transition-colors hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
                            title="Visit Bank Website"
                          >
                            <Globe className="h-3.5 w-3.5" />
                            Website
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(card.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleToggleFavorite(card)}
                          className="rounded-full p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Toggle Favorite"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill={card.isFavorite ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`h-4 w-4 ${card.isFavorite ? "text-yellow-500" : "text-slate-400"}`}
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </button>
                      </div>
                      {card.tags && card.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {card.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card number */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Card Number
                    </Label>
                    <div className="relative flex items-center gap-2">
                      <Input
                        type="text"
                        value={
                          visible[card._id as string]
                            ? card.cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ")
                            : `•••• •••• •••• ${card.cardNumber.slice(-4)}`
                        }
                        readOnly
                        className="h-10 flex-1 border-slate-200 bg-white/50 pr-20 font-mono text-sm tracking-widest text-slate-800 dark:border-white/[0.08] dark:bg-white/5 dark:text-slate-200"
                      />
                      <button
                        type="button"
                        aria-label={
                          visible[card._id as string]
                            ? "Hide card number"
                            : "Show card number"
                        }
                        onClick={() => toggleVisibility(card._id as string)}
                        className="absolute top-1/2 right-10 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        {visible[card._id as string] ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                      <button
                        type="button"
                        aria-label="Copy card number"
                        onClick={() => copyToClipboard(card.cardNumber)}
                        className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Expiry + CVV row */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Expiry
                      </Label>
                      <div className="rounded-lg border border-slate-200 bg-white/50 px-3 py-2 text-sm text-slate-800 dark:border-white/[0.08] dark:bg-white/5 dark:text-slate-200">
                        {card.expiry}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        CVV
                      </Label>
                      <div className="relative">
                        <Input
                          type={
                            visible[`${card._id}-cvv`] ? "text" : "password"
                          }
                          value={card.cvv}
                          readOnly
                          className="h-10 border-slate-200 bg-white/50 pr-20 font-mono text-sm text-slate-800 dark:border-white/[0.08] dark:bg-white/5 dark:text-slate-200"
                        />
                        <button
                          type="button"
                          aria-label={
                            visible[`${card._id}-cvv`] ? "Hide CVV" : "Show CVV"
                          }
                          onClick={() => toggleVisibility(`${card._id}-cvv`)}
                          className="absolute top-1/2 right-10 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                          {visible[`${card._id}-cvv`] ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                        <button
                          type="button"
                          aria-label="Copy CVV"
                          onClick={() => copyToClipboard(card.cvv)}
                          className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Note */}
                  {card.note && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Note
                      </Label>
                      <p className="rounded-lg border border-slate-200 bg-white/50 px-3 py-2 text-sm text-slate-700 dark:border-white/[0.08] dark:bg-white/5 dark:text-slate-300">
                        {card.note}
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2 sm:justify-end sm:gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 flex-1 border-emerald-200 text-sm text-emerald-700 transition-all hover:bg-emerald-50 sm:flex-none dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                      onClick={() => {
                        setEditableData(card);
                        setIsDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-10 flex-1 text-sm sm:flex-none"
                      onClick={() => {
                        setDeleteId(card._id as string);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass mx-4 max-w-[calc(100vw-2rem)] rounded-2xl sm:mx-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">
              Edit Card
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Update your card details below.
            </DialogDescription>
          </DialogHeader>

          {editableData && (
            <form onSubmit={handleEdit} className="space-y-3.5 sm:space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="serviceName" className="text-xs sm:text-sm">
                  Service / Bank Name
                </Label>
                <Input
                  id="serviceName"
                  value={editableData.serviceName || ""}
                  onChange={(e) =>
                    setEditableData({
                      ...editableData,
                      serviceName: e.target.value,
                    })
                  }
                  className="h-11 text-sm sm:h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="website" className="text-xs sm:text-sm">
                  Bank URL / Website
                </Label>
                <Input
                  id="website"
                  value={editableData.website || ""}
                  onChange={(e) =>
                    setEditableData({
                      ...editableData,
                      website: e.target.value,
                    })
                  }
                  className="h-11 text-sm sm:h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs sm:text-sm">
                  Cardholder Name
                </Label>
                <Input
                  id="name"
                  value={editableData.name}
                  onChange={(e) =>
                    setEditableData({
                      ...editableData,
                      name: e.target.value,
                    })
                  }
                  className="h-11 text-sm sm:h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cardType" className="text-xs sm:text-sm">
                  Card Type
                </Label>
                <select
                  id="cardType"
                  value={editableData.cardType || "Visa"}
                  onChange={(e) =>
                    setEditableData({
                      ...editableData,
                      cardType: e.target.value,
                    })
                  }
                  className="flex h-11 w-full items-center justify-between rounded-[10px] border border-slate-200 bg-transparent px-3 py-2 text-sm sm:h-10 dark:border-white/10 dark:bg-white/5"
                >
                  <option className="dark:bg-slate-800" value="Visa">
                    Visa
                  </option>
                  <option className="dark:bg-slate-800" value="Mastercard">
                    Mastercard
                  </option>
                  <option className="dark:bg-slate-800" value="Debit/Credit">
                    Debit/Credit
                  </option>
                  <option className="dark:bg-slate-800" value="Others">
                    Others
                  </option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cardNumber" className="text-xs sm:text-sm">
                  Card Number
                </Label>
                <Input
                  id="cardNumber"
                  value={editableData.cardNumber}
                  onChange={(e) =>
                    setEditableData({
                      ...editableData,
                      cardNumber: e.target.value,
                    })
                  }
                  className="h-11 text-sm sm:h-10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="expiry" className="text-xs sm:text-sm">
                    Expiry
                  </Label>
                  <Input
                    id="expiry"
                    value={editableData.expiry}
                    onChange={(e) =>
                      setEditableData({
                        ...editableData,
                        expiry: formatExpiry(e.target.value),
                      })
                    }
                    maxLength={5}
                    className="h-11 text-sm sm:h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cvv" className="text-xs sm:text-sm">
                    CVV
                  </Label>
                  <Input
                    id="cvv"
                    value={editableData.cvv}
                    onChange={(e) =>
                      setEditableData({
                        ...editableData,
                        cvv: e.target.value,
                      })
                    }
                    className="h-11 text-sm sm:h-10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note" className="text-xs sm:text-sm">
                  Note
                </Label>
                <Input
                  id="note"
                  value={editableData.note || ""}
                  onChange={(e) =>
                    setEditableData({
                      ...editableData,
                      note: e.target.value,
                    })
                  }
                  className="h-11 text-sm sm:h-10"
                />
              </div>
              <DialogFooter className="pt-3 sm:pt-4">
                <Button
                  type="submit"
                  className="h-11 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-sm text-white sm:h-10 sm:w-auto dark:from-emerald-500 dark:to-teal-500"
                >
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="glass mx-4 max-w-[calc(100vw-2rem)] rounded-2xl sm:mx-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to delete this card? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:space-x-2">
            <Button
              variant="outline"
              className="h-11 text-sm sm:h-10"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="h-11 text-sm sm:h-10"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
