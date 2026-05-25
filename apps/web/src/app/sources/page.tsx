"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Plus, Radio, Play, CheckCircle2, XCircle, Clock } from "lucide-react";

interface Source {
  id: string;
  name: string;
  type: string;
  url: string | null;
  vertical: string | null;
  status: string;
  lastCheckedAt: string | null;
}

const verticalLabels: Record<string, string> = {
  autos: "Autos",
  real_estate: "Bienes raíces",
  smartphones: "Smartphones",
  laptops: "Laptops",
};

const typeLabels: Record<string, string> = {
  rss: "RSS",
  api: "API",
  scraper: "Scraper",
  webhook: "Webhook",
};

function StatusBadge({ status }: { status: string }) {
  if (status === "active")
    return (
      <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" /> Activa
      </span>
    );
  if (status === "error")
    return (
      <span className="badge bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3 h-3" /> Error
      </span>
    );
  return (
    <span className="badge bg-slate-100 text-slate-500 border border-slate-200">
      <Clock className="w-3 h-3" /> {status}
    </span>
  );
}

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", type: "rss", url: "", vertical: "autos" });
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  function showToast(msg: string, type: "ok" | "err" = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function loadSources() {
    try {
      const data = await apiFetch<Source[]>("/sources");
      setSources(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSources(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await apiFetch("/sources", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", type: "rss", url: "", vertical: "autos" });
      await loadSources();
      showToast("Fuente creada correctamente.");
    } catch {
      showToast("Error al crear la fuente.", "err");
    } finally {
      setCreating(false);
    }
  }

  async function handleCollect(id: string) {
    setCollecting(id);
    try {
      await apiFetch(`/sources/${id}/collect`, { method: "POST" });
      showToast("Colección iniciada — los ítems aparecerán en el dashboard en segundos.");
    } catch {
      showToast("Error al iniciar la colección.", "err");
    } finally {
      setCollecting(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Fuentes</h1>
          <p className="text-sm text-slate-500 mt-0.5">Configura las fuentes de datos para recolección</p>
        </div>
      </div>

      {/* Create form */}
      <div className="card p-6">
        <h2 className="section-title flex items-center gap-2">
          <Plus className="w-4 h-4 text-slate-400" />
          Agregar fuente
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Facebook Marketplace Autos HN"
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">URL del feed</label>
            <input
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://example.com/feed.xml"
              className="input"
            />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="input"
            >
              <option value="rss">RSS</option>
              <option value="api">API</option>
              <option value="scraper">Scraper</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>
          <div>
            <label className="label">Vertical</label>
            <select
              value={form.vertical}
              onChange={(e) => setForm((f) => ({ ...f, vertical: e.target.value }))}
              className="input"
            >
              <option value="autos">Autos</option>
              <option value="real_estate">Bienes raíces</option>
              <option value="smartphones">Smartphones</option>
              <option value="laptops">Laptops</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={creating} className="btn-primary">
              <Plus className="w-4 h-4" />
              {creating ? "Creando..." : "Crear fuente"}
            </button>
          </div>
        </form>
      </div>

      {/* Sources table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="skeleton h-4 w-40" />
                <div className="skeleton h-4 w-20" />
                <div className="skeleton h-5 w-16 rounded-full" />
                <div className="skeleton h-4 w-28" />
              </div>
            ))}
          </div>
        ) : sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Radio className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700 mb-1">Sin fuentes configuradas</h3>
            <p className="text-sm text-slate-400">Agrega una fuente arriba para comenzar a recolectar señales.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200/60">
              <tr>
                <th className="table-header">Nombre</th>
                <th className="table-header">Tipo</th>
                <th className="table-header">Vertical</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Última revisión</th>
                <th className="table-header" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sources.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="table-cell">
                    <div className="font-medium text-slate-900">{s.name}</div>
                    {s.url && <div className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{s.url}</div>}
                  </td>
                  <td className="table-cell">
                    <span className="badge bg-slate-100 text-slate-600 border border-slate-200">
                      {typeLabels[s.type] ?? s.type}
                    </span>
                  </td>
                  <td className="table-cell text-slate-600">
                    {s.vertical ? verticalLabels[s.vertical] ?? s.vertical : "—"}
                  </td>
                  <td className="table-cell">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="table-cell text-slate-500 text-xs">
                    {s.lastCheckedAt
                      ? new Date(s.lastCheckedAt).toLocaleString("es-HN")
                      : "Nunca"}
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => handleCollect(s.id)}
                      disabled={collecting === s.id}
                      className="btn-ghost"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {collecting === s.id ? "Iniciando..." : "Recolectar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm text-white transition-all z-50 ${
            toast.type === "err" ? "bg-rose-600" : "bg-slate-900"
          }`}
        >
          {toast.type === "err"
            ? <XCircle className="w-4 h-4 shrink-0" />
            : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
