"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface SignalItem {
  id: string;
  intent: string | null;
  score: string;
  category: string | null;
  location: string | null;
  price: string | null;
  currency: string | null;
  extractedAt: string;
  item: { title: string | null; url: string | null; publishedAt: string | null } | null;
}

const intentLabel: Record<string, string> = {
  buy: "Busca comprar",
  sell: "Vende",
  rent: "Busca rentar",
  unknown: "Desconocida",
};

const intentColor: Record<string, string> = {
  buy: "bg-green-100 text-green-800",
  sell: "bg-red-100 text-red-800",
  rent: "bg-blue-100 text-blue-800",
  unknown: "bg-gray-100 text-gray-600",
};

const verticals = [
  { value: "", label: "Todos" },
  { value: "autos", label: "Autos" },
  { value: "real_estate", label: "Bienes raíces" },
  { value: "smartphones", label: "Smartphones" },
  { value: "laptops", label: "Laptops" },
];

const periods = [
  { value: "", label: "Siempre" },
  { value: "24h", label: "Últimas 24h" },
  { value: "7d", label: "Últimos 7 días" },
  { value: "30d", label: "Últimos 30 días" },
];

export default function SignalsDashboard() {
  const PAGE_SIZE = 20;
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    category: "",
    intent: "",
    minScore: 0,
    period: "",
  });

  function setFilter<K extends keyof typeof filters>(key: K, value: typeof filters[K]) {
    setPage(0);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.category) params.set("category", filters.category);
        if (filters.intent) params.set("intent", filters.intent);
        if (filters.minScore > 0) params.set("minScore", String(filters.minScore));
        if (filters.period) params.set("period", filters.period);
        params.set("limit", String(PAGE_SIZE));
        params.set("offset", String(page * PAGE_SIZE));

        const data = await apiFetch<{ signals: SignalItem[]; total: number }>(
          `/signals?${params}`,
        );
        setSignals(data.signals);
        setTotal(data.total);
      } catch {
        setSignals([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filters, page]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <span className="text-sm text-gray-500">{total} señales</span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Vertical</label>
          <select
            value={filters.category}
            onChange={(e) => setFilter("category", e.target.value)}
            className="border rounded-md px-2 py-1.5 text-sm"
          >
            {verticals.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Intención</label>
          <select
            value={filters.intent}
            onChange={(e) => setFilter("intent", e.target.value)}
            className="border rounded-md px-2 py-1.5 text-sm"
          >
            <option value="">Todas</option>
            <option value="buy">Busca comprar</option>
            <option value="sell">Vende</option>
            <option value="rent">Busca rentar</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Score mín: {filters.minScore.toFixed(1)}
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={filters.minScore}
            onChange={(e) => setFilter("minScore", Number(e.target.value))}
            className="w-28"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Período</label>
          <select
            value={filters.period}
            onChange={(e) => setFilter("period", e.target.value)}
            className="border rounded-md px-2 py-1.5 text-sm"
          >
            {periods.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Signals table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando señales...</div>
        ) : signals.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No hay señales. Configura una fuente y ejecuta la recolección.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Publicación</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Intención</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ubicación</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {signals.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 max-w-xs">
                    {s.item?.url ? (
                      <a
                        href={s.item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline line-clamp-2"
                      >
                        {s.item.title ?? s.item.url}
                      </a>
                    ) : (
                      <span className="text-gray-500 line-clamp-2">{s.item?.title ?? "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${intentColor[s.intent ?? "unknown"] ?? intentColor["unknown"]}`}
                    >
                      {intentLabel[s.intent ?? "unknown"] ?? "Desconocida"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {Number(s.score).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.location ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.price
                      ? `${s.currency ?? "HNL"} ${Number(s.price).toLocaleString("es-HN")}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0 || loading}
              className="px-3 py-1.5 border rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * PAGE_SIZE >= total || loading}
              className="px-3 py-1.5 border rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
