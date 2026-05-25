"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface SavedSearch {
  id: string;
  name: string;
  keywords: string[];
  filters: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}

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
      const keywords = form.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
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
      <h1 className="text-2xl font-bold text-gray-900">Búsquedas guardadas</h1>

      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Nueva búsqueda</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Busco Toyota Hilux SPS"
              className="w-full border rounded-md px-2 py-1.5 text-sm"
              required
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-600 mb-1">
              Keywords (separadas por coma)
            </label>
            <input
              value={form.keywords}
              onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
              placeholder="Toyota, Hilux, 2020"
              className="w-full border rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Categoría (opcional)</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full border rounded-md px-2 py-1.5 text-sm"
            >
              <option value="">Todas</option>
              <option value="autos">Autos</option>
              <option value="real_estate">Bienes raíces</option>
              <option value="smartphones">Smartphones</option>
              <option value="laptops">Laptops</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Intención (opcional)</label>
            <select
              value={form.intent}
              onChange={(e) => setForm((f) => ({ ...f, intent: e.target.value }))}
              className="w-full border rounded-md px-2 py-1.5 text-sm"
            >
              <option value="">Todas</option>
              <option value="buy">Busca comprar</option>
              <option value="sell">Vende</option>
              <option value="rent">Busca rentar</option>
            </select>
          </div>
          <div className="col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition disabled:opacity-60"
            >
              {creating ? "Guardando..." : "Guardar búsqueda"}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-gray-400">Cargando...</div>
        ) : searches.length === 0 ? (
          <div className="text-gray-400">No hay búsquedas guardadas.</div>
        ) : (
          searches.map((ss) => (
            <div key={ss.id} className="bg-white rounded-lg shadow p-4 flex items-start justify-between gap-4">
              <div>
                <div className="font-medium text-gray-900">{ss.name}</div>
                {ss.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ss.keywords.map((kw) => (
                      <span key={kw} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  {JSON.stringify(ss.filters) !== "{}" ? JSON.stringify(ss.filters) : "Sin filtros extra"}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(ss.id, ss.isActive)}
                  className={`text-xs px-3 py-1.5 rounded-md transition ${
                    ss.isActive
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {ss.isActive ? "Activa" : "Pausada"}
                </button>
                <button
                  onClick={() => handleDelete(ss.id)}
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
