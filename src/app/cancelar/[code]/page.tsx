"use client";

import React, { use } from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { CancellationCard } from "@/components/cancel/CancellationCard";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function CancelarWithCodePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const code = decodeURIComponent(resolvedParams.code || "");

  return (
    <div className="min-h-screen bg-[#fdfbf7] dark:bg-[#110712] text-slate-800 dark:text-rose-100 bg-pattern flex flex-col justify-between p-4 sm:p-8">
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-rose-200/50 dark:border-rose-900/30">
        <Link href="/reservar" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-800 dark:text-rose-100">
              L&apos;Harmonie Pilates
            </h1>
            <p className="text-[10px] text-rose-600 dark:text-rose-300 font-semibold">
              Cancelación Directa
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/reservar"
            className="text-xs font-semibold text-rose-600 dark:text-rose-300 hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Estudio</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="py-8 my-auto">
        <CancellationCard initialCode={code} />
      </main>

      <footer className="text-center text-xs text-slate-400 dark:text-rose-300/60 pt-6">
        L&apos;Harmonie Pilates Studio • Sistema de cancelación automática
      </footer>
    </div>
  );
}
