"use client";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { Radar, Mail, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Left: branding panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 to-slate-950 border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Radar className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-semibold text-lg">Demand Radar</span>
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-white tracking-tight leading-snug">
            Detecta señales de intención de compra en tiempo real
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            Monitorea fuentes públicas, clasifica señales con IA y recibe alertas cuando alguien en tu mercado esté listo para comprar.
          </p>
          <div className="flex flex-col gap-3 pt-4">
            {["Señales clasificadas con IA", "Alertas por email y Telegram", "Dashboard en tiempo real"].map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-600">© 2025 Demand Radar · Honduras</p>
      </div>

      {/* Right: form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        {sent ? (
          <div className="w-full max-w-sm text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Revisa tu correo</h2>
              <p className="text-slate-400 text-sm mt-2">
                Enviamos un enlace de acceso a <span className="text-white font-medium">{email}</span>.
              </p>
            </div>
            <button
              onClick={() => setSent(false)}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Usar otro correo
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-8">
            {/* Mobile brand */}
            <div className="lg:hidden flex items-center gap-2.5 justify-center">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                <Radar className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-semibold">Demand Radar</span>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Iniciar sesión</h1>
              <p className="text-slate-400 text-sm mt-1">
                Te enviaremos un enlace mágico a tu correo.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="tu@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-colors"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Enviando..." : (
                  <>
                    Ingresar con Magic Link
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
