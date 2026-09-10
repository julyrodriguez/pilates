import Link from "next/link";
import { CalendarCheck2, LockKeyhole, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 selection:bg-indigo-600 selection:text-white">
      <section className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Visual Badge */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-indigo-600/10 dark:bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shadow-inner">
              <span className="text-4xl sm:text-5xl font-black text-indigo-600 dark:text-indigo-400">
                404
              </span>
            </div>
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
          </div>
        </div>

        {/* Text Header */}
        <header className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Página no encontrada
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            El enlace al que intentas acceder no existe o fue movido. Elige una de las siguientes opciones:
          </p>
        </header>

        {/* Navigation Action Buttons - ONLY the 2 requested */}
        <nav aria-label="Navegación de recuperación" className="space-y-3 pt-2">
          {/* 1. Sacar Turno (para clientas) */}
          <Link
            href="/reservar"
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm transition-all shadow-md shadow-indigo-600/20"
          >
            <CalendarCheck2 className="w-4 h-4 text-indigo-200" />
            <span>Sacar turno (Clientas)</span>
          </Link>

          {/* 2. Login de Administrador */}
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm transition-all border border-slate-200 dark:border-slate-700/80 active:scale-[0.99]"
          >
            <LockKeyhole className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Login de administrador</span>
          </Link>
        </nav>

        {/* Footer brand label */}
        <footer className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Selene Pilates Studio • Sistema de Gestión y Reservas
          </p>
        </footer>
      </section>
    </main>
  );
}
