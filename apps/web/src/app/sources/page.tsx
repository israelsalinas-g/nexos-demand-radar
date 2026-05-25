"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

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

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "rss",
    url: "",
    vertical: "autos",
  });
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
      await apiFetch("/sources", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ name: "", type: "rss", url: "", vertical: "autos" });
      await loadSources();
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
      <h1 className="text-2xl font-bold text-gray-900">Fuentes</h1>

      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Agregar fuente</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Facebook Marketplace Autos HN"
              className="w-full border rounded-md px-2 py-1.5 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">URL del feed</label>
            <input
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://example.com/feed.xml"
              className="w-full border rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full border rounded-md px-2 py-1.5 text-sm"
            >
              <option value="rss">RSS</option>
              <option value="api">API</option>
              <option value="scraper">Scraper</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Vertical</label>
            <select
              value={form.vertical}
              onChange={(e) => setForm((f) => ({ ...f, vertical: e.target.value }))}
              className="w-full border rounded-md px-2 py-1.5 text-sm"
            >
              <option value="autos">Autos</option>
              <option value="real_estate">Bienes raíces</option>
              <option value="smartphones">Smartphones</option>
              <option value="laptops">Laptops</option>
            </select>
          </div>
          <div className="col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition disabled:opacity-60"
            >
              {creating ? "Creando..." : "Crear fuente"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-400">Cargando...</div>
        ) : sources.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No hay fuentes. Crea una arriba.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Vertical</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Última revisión</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sources.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-gray-400">{s.url}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.vertical ? verticalLabels[s.vertical] ?? s.vertical : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                        s.status === "active"
                          ? "bg-green-100 text-green-700"
                          : s.status === "error"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {s.lastCheckedAt
                      ? new Date(s.lastCheckedAt).toLocaleString("es-HN")
                      : "Nunca"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleCollect(s.id)}
                      disabled={collecting === s.id}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md transition disabled:opacity-60"
                    >
                      {collecting === s.id ? "Iniciando..." : "Collect ahora"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {toast && (
        <div
          className={`fixed bottom-5 right-5 px-4 py-3 rounded-lg shadow-lg text-sm text-white transition-all ${
            toast.type === "err" ? "bg-red-600" : "bg-gray-900"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
