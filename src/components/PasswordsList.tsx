"use client";

import React from "react";
import { ChevronRight, Key, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import getPasswords from "@/lib/getPasswords";
import { useQuery } from "@tanstack/react-query";
import { PasswordsData } from "@/types";
import { useCLG } from "@/lib/useCLG";
import { extractRootDomain } from "@/lib/utils";
import { useEncryption } from "@/providers/EncryptionProvider";

const loadPasswordsData = async (cryptoKey: CryptoKey | null) => {
  const data = await getPasswords(cryptoKey);
  return data;
};

const PasswordsList = () => {
  const router = useRouter();
  const { cryptoKey } = useEncryption();

  const { data = [], isLoading } = useQuery<PasswordsData[]>({
    queryKey: ["passwords", !!cryptoKey],
    queryFn: () => loadPasswordsData(cryptoKey),
  });
  const fetchedPasswordsData = data ?? [];
  useCLG("fetchedPasswordsData", fetchedPasswordsData);

  const [searchQuery, setSearchQuery] = React.useState("");

  if (isLoading) {
    return (
      <div className="mt-10 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
        Loading...
      </div>
    );
  }

  const handleClick = (website: string) => {
    router.push(
      `/passwords/${encodeURIComponent(website.toLowerCase().replace(/\s+/g, "-"))}`
    );
  };

  const groups = new Map<
    string,
    {
      count: number;
      item: PasswordsData;
      matchesSearch: boolean;
      hasFavorite: boolean;
    }
  >();

  fetchedPasswordsData.forEach((item) => {
    const rootDomain = extractRootDomain(item.website);
    const key = rootDomain.toLowerCase();
    const matches =
      rootDomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.note &&
        item.note.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!groups.has(key)) {
      groups.set(key, {
        count: 1,
        item: { ...item, website: rootDomain },
        matchesSearch: !!matches,
        hasFavorite: !!item.isFavorite,
      });
    } else {
      const existing = groups.get(key)!;
      existing.count += 1;
      if (matches) existing.matchesSearch = true;
      if (item.isFavorite) existing.hasFavorite = true;
    }
  });

  const displayGroups = Array.from(groups.values())
    .filter((g) => g.matchesSearch)
    .sort((a, b) => {
      if (a.hasFavorite && !b.hasFavorite) return -1;
      if (!a.hasFavorite && b.hasFavorite) return 1;
      return a.item.website.localeCompare(b.item.website);
    });

  return (
    <div className="glass mx-auto w-full max-w-2xl overflow-hidden rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20">
      {/* Emerald top accent */}
      <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

      <div className="p-4 sm:p-5 lg:p-6">
        <h2 className="mb-4 flex items-center justify-center gap-2 text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
          <Key className="h-5 w-5 text-emerald-500" />
          Saved Passwords
        </h2>

        <div className="relative mb-5 sm:mb-6">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search websites, usernames, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 border-slate-200 bg-white/60 pl-9 text-sm transition-colors focus:border-emerald-300 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:placeholder-slate-500 dark:focus:border-emerald-500/30 dark:focus:bg-white/[0.07]"
          />
        </div>

        {displayGroups.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No passwords found.
          </p>
        ) : (
          <Table>
            <TableBody>
              {displayGroups.map(({ item, count, hasFavorite }) => (
                <TableRow
                  onClick={() => handleClick(item.website)}
                  key={item._id}
                  className="group cursor-pointer border-b border-slate-100 transition-all hover:bg-emerald-50/50 dark:border-white/[0.04] dark:hover:bg-emerald-500/10"
                >
                  <TableCell className="max-w-[150px] py-3.5 text-sm font-semibold text-slate-800 sm:max-w-[300px] sm:py-3 dark:text-slate-200">
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${item.website}&sz=64`}
                        alt={`${item.website} icon`}
                        className="h-6 w-6 shrink-0 rounded-md bg-white p-0.5 shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate">{item.website}</span>
                        {hasFavorite && (
                          <svg
                            className="h-3.5 w-3.5 fill-current text-yellow-500"
                            viewBox="0 0 24 24"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        )}
                      </div>
                      {count > 0 && (
                        <span className="ml-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                          {count} saved
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm text-slate-500 sm:table-cell dark:text-slate-400">
                    {item.username}
                  </TableCell>
                  <TableCell className="text-right">
                    <ChevronRight className="ml-auto h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-500 dark:text-slate-500" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default PasswordsList;
