"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Key, CreditCard, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import getPasswords from "@/lib/getPasswords";
import getCards from "@/lib/getCards";
import { useAuth } from "@/providers/AuthProvider";
import { extractRootDomain } from "@/lib/utils";

export function GlobalSearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (user) {
          setOpen((open) => !open);
        }
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [user]);

  const { data: passwords = [], isLoading: pLoading } = useQuery({
    queryKey: ["passwords"],
    queryFn: getPasswords,
    enabled: open && !!user,
  });

  const { data: cards = [], isLoading: cLoading } = useQuery({
    queryKey: ["cards"],
    queryFn: getCards,
    enabled: open && !!user,
  });

  const isLoading = pLoading || cLoading;

  const filteredPasswords = passwords.filter(
    (p: any) =>
      p.website.toLowerCase().includes(query.toLowerCase()) ||
      p.username.toLowerCase().includes(query.toLowerCase()) ||
      (p.note && p.note.toLowerCase().includes(query.toLowerCase()))
  );

  const filteredCards = cards.filter(
    (c: any) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.serviceName.toLowerCase().includes(query.toLowerCase()) ||
      c.cardNumber.includes(query) ||
      (c.note && c.note.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelectPassword = (website: string) => {
    setOpen(false);
    router.push(
      `/passwords/${encodeURIComponent(extractRootDomain(website).toLowerCase())}`
    );
  };

  const handleSelectCard = (name: string) => {
    setOpen(false);
    router.push(`/cards/${encodeURIComponent(name.toLowerCase())}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="glass mx-4 max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl p-0 sm:mx-auto sm:max-w-xl">
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        <DialogDescription className="sr-only">
          Search across all your passwords and credit cards
        </DialogDescription>
        <div className="flex items-center border-b border-slate-100 px-3 dark:border-white/[0.04]">
          <Search className="h-5 w-5 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search passwords and cards..."
            className="h-14 border-0 bg-transparent px-3 text-base shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
          ) : query === "" ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Type to start searching your vault...
            </div>
          ) : filteredPasswords.length === 0 && filteredCards.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No results found for "{query}"
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              {filteredPasswords.length > 0 && (
                <div>
                  <h3 className="px-3 py-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    Passwords
                  </h3>
                  {filteredPasswords.map((p: any) => (
                    <button
                      key={p._id}
                      onClick={() => handleSelectPassword(p.website)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <Key className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {p.website}
                        </span>
                        <span className="truncate text-xs text-slate-500">
                          {p.username}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {filteredCards.length > 0 && (
                <div>
                  <h3 className="px-3 py-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    Credit Cards
                  </h3>
                  {filteredCards.map((c: any) => (
                    <button
                      key={c._id}
                      onClick={() => handleSelectCard(c.name)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {c.name}
                        </span>
                        <span className="truncate text-xs text-slate-500">
                          •••• •••• •••• {c.cardNumber.slice(-4)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
