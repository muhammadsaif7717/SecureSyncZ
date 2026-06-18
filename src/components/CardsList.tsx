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
      groups.set(key, { count: 1, item, groupName, matchesSearch: !!matches });
    } else {
      const existing = groups.get(key)!;
      existing.count += 1;
      if (matches) existing.matchesSearch = true;
    }
  });

  const displayGroups = Array.from(groups.values()).filter(
    (g) => g.matchesSearch
  );

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
              {displayGroups.map(({ item, count, groupName }) => (
                <TableRow
                  onClick={() => handleClick(groupName)}
                  key={item._id}
                  className="group cursor-pointer border-b border-slate-100 transition-all hover:bg-emerald-50/50 dark:border-white/[0.04] dark:hover:bg-emerald-500/10"
                >
                  <TableCell className="py-3.5 text-sm font-semibold text-slate-800 capitalize sm:py-3 dark:text-slate-200">
                    {groupName}
                    {count > 0 && (
                      <span className="ml-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                        {count} saved
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-sm text-slate-500 sm:table-cell dark:text-slate-400">
                    •••• {item.cardNumber.slice(-4)}
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
