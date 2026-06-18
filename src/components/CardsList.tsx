"use client";

import React from "react";
import { ChevronRight, CreditCard, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import getCards from "@/lib/getCards";
import { CardsData } from "@/types";

const loadCardsData = async () => {
  const data = await getCards();
  return data;
};

const CardsList = () => {
  const router = useRouter();

  const { data = [], isLoading } = useQuery<CardsData[]>({
    queryKey: ["cards"],
    queryFn: loadCardsData,
  });
  const fetchedCardsData = data ?? [];

  const [searchQuery, setSearchQuery] = React.useState("");

  if (isLoading) {
    return (
      <div className="mt-10 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
        Loading...
      </div>
    );
  }

  const handleClick = (name: string) => {
    router.push(`/cards/${name.toLowerCase()}`);
  };

  const groups = new Map<
    string,
    {
      count: number;
      item: CardsData;
      groupName: string;
      matchesSearch: boolean;
      hasFavorite: boolean;
    }
  >();

  fetchedCardsData.forEach((item) => {
    const groupName = item.serviceName || item.name;
    const key = groupName.toLowerCase();

    const matches =
      searchQuery === "" ||
      groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cardNumber.includes(searchQuery) ||
      (item.cardType &&
        item.cardType.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!groups.has(key)) {
      groups.set(key, {
        count: 1,
        item,
        groupName,
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
      return a.groupName.localeCompare(b.groupName);
    });

  return (
    <div className="glass mx-auto w-full max-w-2xl overflow-hidden rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20">
      {/* Emerald top accent */}
      <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

      <div className="p-4 sm:p-5 lg:p-6">
        <h2 className="mb-4 flex items-center justify-center gap-2 text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
          <CreditCard className="h-5 w-5 text-teal-500" />
          Saved Cards
        </h2>

        <div className="relative mb-5 sm:mb-6">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search cards by name, number, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 border-slate-200 bg-white/60 pl-9 text-sm transition-colors focus:border-emerald-300 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:placeholder-slate-500 dark:focus:border-emerald-500/30 dark:focus:bg-white/[0.07]"
          />
        </div>

        {displayGroups.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No cards found.
          </p>
        ) : (
          <Table>
            <TableBody>
              {displayGroups.map(({ item, count, groupName, hasFavorite }) => (
                <TableRow
                  onClick={() => handleClick(groupName)}
                  key={item._id}
                  className="group cursor-pointer border-b border-slate-100 transition-all hover:bg-emerald-50/50 dark:border-white/[0.04] dark:hover:bg-emerald-500/10"
                >
                  <TableCell className="py-3.5 text-sm font-semibold text-slate-800 sm:py-3 dark:text-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="capitalize">{groupName}</span>
                        {hasFavorite && (
                          <svg
                            className="h-3.5 w-3.5 fill-current text-yellow-500"
                            viewBox="0 0 24 24"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden font-mono text-sm text-slate-500 sm:table-cell dark:text-slate-400">
                    •••• •••• •••• {item.cardNumber.slice(-4)}
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

export default CardsList;
