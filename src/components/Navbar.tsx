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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const navLinks = [
  { href: "/cards", label: "Cards", icon: CreditCard },
  { href: "/passwords", label: "Passwords", icon: Key },
  { href: "/add", label: "Add", icon: PlusCircle },
];

export default function Navbar() {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const { user, logout, isLoading } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-black/[0.06] bg-white/70 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#0a0e1a]/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-[60px] sm:px-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900 sm:text-lg dark:text-white"
          >
            <Image
              src="/logo.png"
              alt="LockifyZ Logo"
              width={28}
              height={28}
              className="rounded-lg shadow-md shadow-emerald-500/20"
            />
            <span>LockifyZ</span>
          </Link>

          {/* Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {!user && !isLoading && <ModeToggle />}

            {!isLoading && user ? (
              <div className="flex items-center">
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
                    className="glass w-[280px] border-l border-black/[0.06] dark:border-white/[0.06]"
                  >
                    <SheetTitle className="text-left text-lg font-bold text-slate-900 dark:text-white">
                      Account
                    </SheetTitle>

                    <div className="mt-6 flex flex-col gap-4">
                      {/* User display */}
                      <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
                        {user.profilePicture ? (
                          <div className="relative h-14 w-14 overflow-hidden rounded-full shadow-md">
                            <Image
                              src={user.profilePicture}
                              alt={user.username}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md">
                            <Shield className="h-6 w-6" />
                          </div>
                        )}
                        <div className="w-full text-center">
                          <p className="truncate text-base font-semibold text-slate-900 capitalize dark:text-white">
                            {user.username}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <SheetClose asChild>
                          <Button
                            variant="outline"
                            onClick={() =>
                              setTheme(theme === "dark" ? "light" : "dark")
                            }
                            className="w-full gap-2 font-medium"
                          >
                            <Sun className="hidden h-4 w-4 dark:block" />
                            <Moon className="block h-4 w-4 dark:hidden" />
                            Toggle Theme
                          </Button>
                        </SheetClose>

                        <SheetClose asChild>
                          <Link href="/edit-profile" className="w-full">
                            <Button
                              variant="outline"
                              className="w-full gap-2 font-medium"
                            >
                              <UserIcon className="h-4 w-4" />
                              Edit Profile
                            </Button>
                          </Link>
                        </SheetClose>

                        <SheetClose asChild>
                          <Button
                            variant="destructive"
                            onClick={logout}
                            className="w-full gap-2 font-medium"
                          >
                            <LogOut className="h-4 w-4" />
                            Logout
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
