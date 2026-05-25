"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Plus, Bell, Mail, Send, Pause, Play, Trash2, Link as LinkIcon } from "lucide-react";

interface SavedSearch { id: string; name: string }
interface Alert {
  id: string;
  name: string;
  channel: string;
  channelConfig: Record<string, string>;
  isActive: boolean;
  savedSearch: { id: string; name: string } | null;
  createdAt: string;
}

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === "email") return <Mail className="w-4 h-4 text-blue-500" />;
  if (channel === "telegram") return <Send className="w-4 h-4 text-sky-500" />;
  return <LinkIcon className="w-4 h-4 text-slate-400" />;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    savedSearchId: "",
    channel: "email",
    email: "",
    chatId: "",
  });
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      const [al, ss] = await Promise.all([
        apiFetch<Alert[]>("/alerts"),
        apiFetch<SavedSearch[]>("/saved-searches"),
      ]);
      setAlerts(al);
      setSavedSearches(ss);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const channelConfig: Record<string, string> = {};
      if (form.channel === "email" && form.email) channelConfig["email"] = form.email;
      if (form.channel === "telegram" && form.chatId) channelConfig["chatId"] = form.chatId;
      await apiFetch("/alerts", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          savedSearchId: form.savedSearchId || undefined,
          channel: form.channel,
          channelConfig,
        }),
      });
      setForm({ name: "", savedSearchId: "", channel: "email", email: "", chatId: "" });
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    await apiFetch(`/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !isActive }),
    });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta alerta?")) return;
    await apiFetch(`/alerts/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Alertas</h1>
          <p className="text-sm text-slate-500 mt-0.5">Recibe notificaciones cuando se detecten señales</p>
        </div>
      </div>

      {/* Create form */}
      <div className="card p-6">
        <h2 className="section-title flex items-center gap-2">
          <Plus className="w-4 h-4 text-slate-400" />
          Nueva alerta
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Alerta Toyota Hilux"
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Búsqueda vinculada <span className="text-slate-400 font-normal">(opcional)</span></label>
            <select
              value={form.savedSearchId}
              onChange={(e) => setForm((f) => ({ ...f, savedSearchId: e.target.value }))}
              className="input"
            >
              <option value="">Sin búsqueda vinculada</option>
              {savedSearches.map((ss) => (
                <option key={ss.id} value={ss.id}>{ss.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Canal</label>
            <select
              value={form.channel}
              onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
              className="input"
            >
              <option value="email">Email</option>
              <option value="telegram">Telegram</option>
            </select>
          </div>
          {form.channel === "email" && (
            <div>
              <label className="label">Email destino</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="tu@empresa.com"
                className="input"
              />
            </div>
          )}
          {form.channel === "telegram" && (
            <div>
              <label className="label">Telegram Chat ID</label>
              <input
                value={form.chatId}
                onChange={(e) => setForm((f) => ({ ...f, chatId: e.target.value }))}
                placeholder="-100123456789"
                className="input"
              />
            </div>
          )}
          <div className="md:col-span-2">
            <button type="submit" disabled={creating} className="btn-primary">
              <Plus className="w-4 h-4" />
              {creating ? "Creando..." : "Crear alerta"}
            </button>
          </div>
        </form>
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse flex gap-4">
                <div className="skeleton w-8 h-8 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-36" />
                  <div className="skeleton h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700 mb-1">Sin alertas configuradas</h3>
            <p className="text-sm text-slate-400">Crea una alerta para recibir notificaciones de señales.</p>
          </div>
        ) : (
          alerts.map((a) => (
            <div key={a.id} className="card p-5 flex items-center justify-between gap-4 hover:shadow-card-hover transition-shadow">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <ChannelIcon channel={a.channel} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-slate-900 truncate">{a.name}</span>
                    <span className={`badge text-xs ${a.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                      {a.isActive ? "Activa" : "Pausada"}
                    </span>
                  </div>
                  {a.savedSearch && (
                    <div className="text-xs text-slate-500">
                      Búsqueda: <span className="text-slate-700">{a.savedSearch.name}</span>
                    </div>
                  )}
                  <div className="text-xs text-slate-400">
                    {a.channel === "email" && a.channelConfig["email"]}
                    {a.channel === "telegram" && `Chat ID: ${a.channelConfig["chatId"]}`}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(a.id, a.isActive)}
                  className="btn-ghost"
                  title={a.isActive ? "Pausar" : "Activar"}
                >
                  {a.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {a.isActive ? "Pausar" : "Activar"}
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="btn-danger"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
