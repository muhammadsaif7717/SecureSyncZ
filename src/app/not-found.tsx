import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-slate-50 px-4 sm:min-h-[calc(100vh-60px)] dark:bg-[#0a0e1a]">
      <div className="glass flex w-full max-w-md flex-col items-center rounded-2xl p-8 text-center shadow-xl dark:shadow-black/20">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5">
          <ShieldAlert className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="mb-2 text-3xl font-extrabold text-slate-900 dark:text-white">
          404
        </h2>
        <h3 className="mb-4 text-lg font-medium text-slate-700 dark:text-slate-300">
          Vault Sector Not Found
        </h3>
        <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
          The page you are looking for does not exist or you do not have
          clearance to access it.
        </p>
        <Link href="/">
          <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white transition-all hover:shadow-lg dark:from-emerald-500 dark:to-teal-500">
            <ArrowLeft className="h-4 w-4" />
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
