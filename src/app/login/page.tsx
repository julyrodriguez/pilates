"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { loginWithEmail, loginWithGoogle, loginAsDemoAdmin } = useAuth();
  const router = useRouter();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginWithEmail(email.trim(), password);
      router.push("/");
    } catch (err: any) {
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Usuario o contraseña incorrectos.");
      } else {
        setError(err.message || "Error al iniciar sesión.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push("/");
    } catch (err: any) {
      setError(err.message || "No se pudo iniciar sesión con Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    loginAsDemoAdmin();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-8 relative">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              L&apos;Harmonie Pilates
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
              Studio Manager
            </p>
          </div>
        </Link>

        <ThemeToggle />
      </header>

      {/* Main Login Box */}
      <main className="w-full max-w-md mx-auto my-auto py-6">
        <div className="glass-card p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Iniciar Sesión
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Accede al panel de administración y control de turnos
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@lharmoniepilates.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Ingresar con Correo</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access & Google */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center gap-2 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Acceso Rápido Administrador (Demo)</span>
            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
            >
              <span>Continuar con Google</span>
            </button>
          </div>

          {/* Public Booking Link for Clients */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              ¿Eres alumno y buscas reservar una clase?
            </p>
            <Link
              href="/reservar"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>Ir al Portal Público de Reservas (Sin login)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 dark:text-slate-500 pt-6">
        L&apos;Harmonie Pilates Studio • Panel Administrativo con Firebase Auth
      </footer>
    </div>
  );
}
