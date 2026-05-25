"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

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

  const channelIcon: Record<string, string> = { email: "📧", telegram: "✈️", webhook: "🔗" };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>

      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Nueva alerta</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Alerta Toyota Hilux"
              className="w-full border rounded-md px-2 py-1.5 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Búsqueda guardada</label>
            <select
              value={form.savedSearchId}
              onChange={(e) => setForm((f) => ({ ...f, savedSearchId: e.target.value }))}
              className="w-full border rounded-md px-2 py-1.5 text-sm"
            >
              <option value="">Sin búsqueda vinculada</option>
              {savedSearches.map((ss) => (
                <option key={ss.id} value={ss.id}>{ss.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Canal</label>
            <select
              value={form.channel}
              onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
              className="w-full border rounded-md px-2 py-1.5 text-sm"
            >
              <option value="email">Email</option>
              <option value="telegram">Telegram</option>
            </select>
          </div>
          {form.channel === "email" && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">Email destino</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="tu@empresa.com"
                className="w-full border rounded-md px-2 py-1.5 text-sm"
              />
            </div>
          )}
          {form.channel === "telegram" && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">Telegram Chat ID</label>
              <input
                value={form.chatId}
                onChange={(e) => setForm((f) => ({ ...f, chatId: e.target.value }))}
                placeholder="-100123456789"
                className="w-full border rounded-md px-2 py-1.5 text-sm"
              />
            </div>
          )}
          <div className="col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition disabled:opacity-60"
            >
              {creating ? "Creando..." : "Crear alerta"}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-gray-400">Cargando...</div>
        ) : alerts.length === 0 ? (
          <div className="text-gray-400">No hay alertas. Crea una arriba.</div>
        ) : (
          alerts.map((a) => (
            <div key={a.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-gray-900">
                  {channelIcon[a.channel] ?? "📢"} {a.name}
                </div>
                {a.savedSearch && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    Búsqueda: {a.savedSearch.name}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-0.5">
                  {a.channel === "email" && a.channelConfig["email"]}
                  {a.channel === "telegram" && `Chat: ${a.channelConfig["chatId"]}`}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(a.id, a.isActive)}
                  className={`text-xs px-3 py-1.5 rounded-md transition ${
                    a.isActive
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {a.isActive ? "Activa" : "Pausada"}
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-md transition"
                >
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
