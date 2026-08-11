"use client";

import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import getNotes from "@/lib/getNotes";
import { useEncryption } from "@/providers/EncryptionProvider";
import { NotesData } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, FileText, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

const loadNotesData = async (cryptoKey: CryptoKey | null) => {
  const data = await getNotes(cryptoKey);
  return data;
};

const NotesList = () => {
  const router = useRouter();
  const { cryptoKey } = useEncryption();

  const { data = [], isLoading } = useQuery<NotesData[]>({
    queryKey: ["notes", !!cryptoKey],
    queryFn: () => loadNotesData(cryptoKey),
  });
  const fetchedNotesData = data ?? [];

  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = React.useState(initialSearch);

  React.useEffect(() => {
    const q = searchParams.get("search");
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="animate-fade-in-up glass group relative mx-auto w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/20 shadow-xl backdrop-blur-xl transition-all duration-500 dark:border-white/5 dark:shadow-emerald-900/20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10" />
        <div className="relative z-10">
          <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <div className="space-y-6 p-4 sm:p-5 lg:p-6">
            <div className="mx-auto h-6 w-44 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-white/[0.04]"
                >
                  <div className="h-4 w-40 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
                  <div className="hidden h-4 w-24 animate-pulse rounded-md bg-slate-200 sm:block dark:bg-slate-800" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleClick = (title: string) => {
    router.push(
      `/notes/${encodeURIComponent(title.toLowerCase().replace(/\s+/g, "-"))}`
    );
  };

  const filteredNotes = fetchedNotesData
    .filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.title.localeCompare(b.title);
    });

  return (
    <div className="animate-fade-in-up glass group relative mx-auto w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/20 shadow-xl backdrop-blur-xl transition-all duration-500 hover:shadow-2xl dark:border-white/5 dark:shadow-emerald-900/20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10" />
      <div className="relative z-10">
        {/* Emerald top accent */}
        <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        <div className="p-4 sm:p-5 lg:p-6">
          <h2 className="mb-4 flex items-center justify-center gap-2 text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
            <FileText className="h-5 w-5 text-emerald-500" />
            Secure Notes
          </h2>

          <div className="relative mb-5 sm:mb-6">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 border-slate-200 bg-white/60 pl-9 text-sm transition-colors focus:border-emerald-300 focus:bg-white sm:pl-10 dark:border-white/10 dark:bg-white/5 dark:placeholder-slate-500 dark:focus:border-emerald-500/30 dark:focus:bg-white/[0.07]"
            />
          </div>

          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-4 px-4 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-500/10">
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                No notes found
              </h3>
              <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">
                You haven't saved any secure notes here yet. Add your first note
                to keep your private text safe.
              </p>
            </div>
          ) : (
            <Table>
              <TableBody>
                {filteredNotes.map((item) => (
                  <TableRow
                    onClick={() => handleClick(item.title)}
                    key={item._id}
                    className="group cursor-pointer border-b border-slate-100 transition-all hover:bg-emerald-50/50 dark:border-white/[0.04] dark:hover:bg-emerald-500/10"
                  >
                    <TableCell className="max-w-[150px] py-3.5 text-sm font-semibold text-slate-800 sm:max-w-[300px] sm:py-3 dark:text-slate-200">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate">{item.title}</span>
                          {item.isFavorite && (
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
                    <TableCell className="hidden text-sm text-slate-500 sm:table-cell dark:text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
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
    </div>
  );
};

export default NotesList;
