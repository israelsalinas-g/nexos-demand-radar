"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Plus, Search, Pause, Play, Trash2 } from "lucide-react";

interface SavedSearch {
  id: string;
  name: string;
  keywords: string[];
  filters: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}

const categoryLabel: Record<string, string> = {
  autos: "Autos",
  real_estate: "Bienes raíces",
  smartphones: "Smartphones",
  laptops: "Laptops",
};

const intentLabel: Record<string, string> = {
  buy: "Comprador",
  sell: "Vendedor",
  rent: "Renta",
};

export default function SavedSearchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", keywords: "", category: "", intent: "" });
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      const data = await apiFetch<SavedSearch[]>("/saved-searches");
      setSearches(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const keywords = form.keywords.split(",").map((k) => k.trim()).filter(Boolean);
      const filters: Record<string, string> = {};
      if (form.category) filters["category"] = form.category;
      if (form.intent) filters["intent"] = form.intent;
      await apiFetch("/saved-searches", {
        method: "POST",
        body: JSON.stringify({ name: form.name, keywords, filters }),
      });
      setForm({ name: "", keywords: "", category: "", intent: "" });
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    await apiFetch(`/saved-searches/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !isActive }),
    });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta búsqueda guardada?")) return;
    await apiFetch(`/saved-searches/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Búsquedas guardadas</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monitorea señales con palabras clave específicas</p>
        </div>
      </div>

      {/* Create form */}
      <div className="card p-6">
        <h2 className="section-title flex items-center gap-2">
          <Plus className="w-4 h-4 text-slate-400" />
          Nueva búsqueda
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Busco Toyota Hilux SPS"
              className="input"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Keywords <span className="text-slate-400 font-normal">(separadas por coma)</span></label>
            <input
              value={form.keywords}
              onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
              placeholder="Toyota, Hilux, 2020, SPS"
              className="input"
            />
          </div>
          <div>
            <label className="label">Categoría <span className="text-slate-400 font-normal">(opcional)</span></label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="input"
            >
              <option value="">Todas las categorías</option>
              <option value="autos">Autos</option>
              <option value="real_estate">Bienes raíces</option>
              <option value="smartphones">Smartphones</option>
              <option value="laptops">Laptops</option>
            </select>
          </div>
          <div>
            <label className="label">Intención <span className="text-slate-400 font-normal">(opcional)</span></label>
            <select
              value={form.intent}
              onChange={(e) => setForm((f) => ({ ...f, intent: e.target.value }))}
              className="input"
            >
              <option value="">Todas</option>
              <option value="buy">Comprador</option>
              <option value="sell">Vendedor</option>
              <option value="rent">Renta</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={creating} className="btn-primary">
              <Plus className="w-4 h-4" />
              {creating ? "Guardando..." : "Guardar búsqueda"}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse flex gap-4">
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-40" />
                  <div className="flex gap-2">
                    <div className="skeleton h-5 w-14 rounded-full" />
                    <div className="skeleton h-5 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : searches.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700 mb-1">Sin búsquedas guardadas</h3>
            <p className="text-sm text-slate-400">Crea una búsqueda arriba para monitorear señales específicas.</p>
          </div>
        ) : (
          searches.map((ss) => {
            const extraFilters = Object.entries(ss.filters).filter(([, v]) => v);
            return (
              <div key={ss.id} className="card p-5 flex items-start justify-between gap-4 hover:shadow-card-hover transition-shadow">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-slate-900">{ss.name}</span>
                    <span className={`badge text-xs ${ss.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                      {ss.isActive ? "Activa" : "Pausada"}
                    </span>
                  </div>
                  {ss.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {ss.keywords.map((kw) => (
                        <span key={kw} className="badge bg-blue-50 text-blue-700 border border-blue-200">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                  {extraFilters.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {extraFilters.map(([k, v]) => (
                        <span key={k} className="badge bg-slate-100 text-slate-500 border border-slate-200">
                          {k === "category" ? categoryLabel[v as string] ?? String(v) : intentLabel[v as string] ?? String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(ss.id, ss.isActive)}
                    className="btn-ghost"
                    title={ss.isActive ? "Pausar" : "Activar"}
                  >
                    {ss.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {ss.isActive ? "Pausar" : "Activar"}
                  </button>
                  <button
                    onClick={() => handleDelete(ss.id)}
                    className="btn-danger"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
