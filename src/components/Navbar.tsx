"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";

import {
  Menu,
  LogOut,
  Shield,
  Key,
  CreditCard,
  PlusCircle,
  User as UserIcon,
  Sun,
  Moon,
  Download,
  Upload,
  Search,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { GlobalSearchModal } from "@/components/GlobalSearchModal";
import { BackupModal } from "@/components/BackupModal";
import { useState } from "react";

const navLinks = [
  { href: "/cards", label: "Cards", icon: CreditCard },
  { href: "/passwords", label: "Passwords", icon: Key },
  { href: "/add", label: "Add", icon: PlusCircle },
  { href: "/health", label: "Health", icon: ShieldCheck },
];

export default function Navbar() {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const { user, logout, isLoading } = useAuth();
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [backupType, setBackupType] = useState<"passwords" | "cards">(
    "passwords"
  );
  const [backupAction, setBackupAction] = useState<"export" | "import">(
    "export"
  );

  const openBackupModal = (
    type: "passwords" | "cards",
    action: "export" | "import"
  ) => {
    setBackupType(type);
    setBackupAction(action);
    setBackupModalOpen(true);
  };

  return (
    <>
      <BackupModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
        type={backupType}
        action={backupAction}
      />
      <header className="sticky top-0 z-50 w-full border-b border-black/[0.06] bg-white/70 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#0a0e1a]/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-[60px] sm:px-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900 sm:text-lg dark:text-white"
          >
            <Image
              src="/logo.png"
              alt="SecureSyncZ Logo"
              width={28}
              height={28}
              className="rounded-lg shadow-md shadow-emerald-500/20"
            />
            <span>SecureSyncZ</span>
          </Link>

          {/* Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {!user && !isLoading && <ModeToggle />}

            {!isLoading && user ? (
              <div className="flex items-center gap-2">
                {/* Search Trigger Button */}
                <button
                  onClick={() =>
                    document.dispatchEvent(
                      new KeyboardEvent("keydown", { key: "k", metaKey: true })
                    )
                  }
                  className="hidden h-9 w-40 items-center justify-between rounded-lg border border-slate-200 bg-white/50 px-3 text-sm text-slate-500 transition-colors hover:border-emerald-300 hover:bg-white sm:flex dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:border-emerald-500/30 dark:hover:bg-white/10"
                >
                  <span className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Search...
                  </span>
                  <kbd className="hidden rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 sm:inline-block dark:bg-slate-800 dark:text-slate-400">
                    ⌘K
                  </kbd>
                </button>
                <button
                  onClick={() =>
                    document.dispatchEvent(
                      new KeyboardEvent("keydown", { key: "k", metaKey: true })
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 sm:hidden dark:text-slate-300"
                >
                  <Search className="h-5 w-5" />
                </button>

                <GlobalSearchModal />

                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-700 dark:text-slate-300"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="flex w-[300px] flex-col border-l border-white/10 bg-white/80 p-0 backdrop-blur-2xl sm:w-[350px] dark:bg-[#0a0e1a]/90"
                  >
                    <div className="flex flex-col border-b border-black/5 bg-slate-50/50 p-6 dark:border-white/5 dark:bg-slate-900/30">
                      <SheetTitle className="mb-4 text-left text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                        My Account
                      </SheetTitle>
                      <SheetDescription className="sr-only">
                        Account navigation menu
                      </SheetDescription>

                      <div className="flex items-center gap-4">
                        {user.profilePicture ? (
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-emerald-500/20 ring-offset-2 ring-offset-slate-50 dark:ring-offset-[#0d1224]">
                            <Image
                              src={user.profilePicture}
                              alt={user.username}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md ring-2 ring-emerald-500/20 ring-offset-2 ring-offset-slate-50 dark:ring-offset-[#0d1224]">
                            <Shield className="h-7 w-7" />
                          </div>
                        )}
                        <div className="flex min-w-0 flex-col">
                          <p className="truncate text-base font-semibold text-slate-900 capitalize dark:text-white">
                            {user.username}
                          </p>
                          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col px-4 py-6">
                      <div className="space-y-1">
                        <div className="px-2 pb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                          Settings
                        </div>
                        <SheetClose asChild>
                          <Link
                            href="/edit-profile"
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                              <UserIcon className="h-4 w-4" />
                            </div>
                            Edit Profile
                          </Link>
                        </SheetClose>

                        <button
                          onClick={() =>
                            setTheme(theme === "dark" ? "light" : "dark")
                          }
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                            <Sun className="hidden h-4 w-4 dark:block" />
                            <Moon className="block h-4 w-4 dark:hidden" />
                          </div>
                          Theme: {theme === "dark" ? "Dark" : "Light"}
                        </button>

                        <div className="my-2 border-t border-slate-200 dark:border-slate-800"></div>
                        <div className="px-2 py-2 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                          Data Management
                        </div>

                        <button
                          onClick={() => openBackupModal("passwords", "export")}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                            <Download className="h-4 w-4" />
                          </div>
                          Export Passwords
                        </button>

                        <button
                          onClick={() => openBackupModal("passwords", "import")}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                            <Upload className="h-4 w-4" />
                          </div>
                          Import Passwords
                        </button>

                        <button
                          onClick={() => openBackupModal("cards", "export")}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                            <Download className="h-4 w-4" />
                          </div>
                          Export Cards
                        </button>

                        <button
                          onClick={() => openBackupModal("cards", "import")}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                            <Upload className="h-4 w-4" />
                          </div>
                          Import Cards
                        </button>
                      </div>

                      <div className="mt-auto pt-4">
                        <SheetClose asChild>
                          <Button
                            variant="ghost"
                            onClick={logout}
                            className="w-full justify-start gap-3 rounded-xl px-3 py-6 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                              <LogOut className="h-4 w-4" />
                            </div>
                            Log out securely
                          </Button>
                        </SheetClose>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            ) : (
              !isLoading && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link href="/sign-in">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2.5 text-xs text-slate-700 sm:px-3 sm:text-sm dark:text-slate-300"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button
                      size="sm"
                      className="h-8 bg-gradient-to-r from-emerald-600 to-teal-600 px-3 text-xs text-white shadow-md shadow-emerald-500/20 transition-all hover:shadow-lg hover:shadow-emerald-500/30 sm:px-4 sm:text-sm dark:from-emerald-500 dark:to-teal-500"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </header>

      {/* Floating Bottom Nav (Only shown when logged in) */}
      {user && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center justify-center rounded-full border border-black/5 bg-white/80 px-2 py-2 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0e1a]/80">
          <nav className="flex gap-2 sm:gap-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group relative flex w-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-medium transition-all duration-300 ease-out hover:scale-105 active:scale-95 sm:w-20 sm:text-xs",
                    isActive
                      ? "bg-emerald-50/50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "text-slate-500 hover:bg-slate-50/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "mb-0.5 transition-all duration-300",
                      isActive
                        ? "h-6 w-6 scale-110"
                        : "h-5 w-5 group-hover:scale-110"
                    )}
                  />
                  <span className="tracking-wide">{link.label}</span>
                  {isActive && (
                    <span className="animate-fade-in-up absolute -bottom-2 h-1 w-8 rounded-full bg-emerald-500 shadow-[0_0_8px_0_rgba(16,185,129,0.5)]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
