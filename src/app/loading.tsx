import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function Loading() {
  return (
    <div className="relative flex min-h-[calc(100vh-56px)] items-center justify-center overflow-hidden bg-slate-50 sm:min-h-[calc(100vh-60px)] dark:bg-[#0a0e1a]">
      {/* Background glow orbs */}
      <div className="animate-glow-pulse absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-emerald-500/10 blur-[100px] dark:bg-emerald-500/[0.07]" />
      <div className="animate-glow-pulse absolute right-1/4 bottom-1/4 h-[250px] w-[250px] rounded-full bg-teal-500/10 blur-[80px] dark:bg-teal-500/[0.05]" />

      <div className="glass relative z-10 flex flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-white/20 bg-white/70 p-10 shadow-2xl backdrop-blur-xl dark:border-white/5 dark:bg-black/20 dark:shadow-emerald-900/20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-cyan-500/10" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-[1.5rem] shadow-lg dark:shadow-none">
            <Image
              src="/brand-logo.png"
              alt="Logo"
              width={96}
              height={96}
              className="animate-pulse rounded-[1.5rem] drop-shadow-md"
              style={{ width: "auto", height: "auto" }}
            />
            <div className="absolute inset-0 animate-ping rounded-[1.5rem] bg-emerald-400 opacity-20" />
          </div>

          <div className="flex flex-col items-center gap-2">
            <h2 className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-xl font-bold tracking-tight text-transparent dark:from-white dark:to-slate-300">
              SecureSyncZ
            </h2>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
              <p className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400">
                Decrypting Vault...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
