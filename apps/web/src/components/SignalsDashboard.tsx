"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { BarChart3, ExternalLink, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";

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
  buy: "Comprador",
  sell: "Vendedor",
  rent: "Renta",
  unknown: "Desconocida",
};

const intentStyles: Record<string, string> = {
  buy: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  sell: "bg-rose-50 text-rose-700 border border-rose-200",
  rent: "bg-blue-50 text-blue-700 border border-blue-200",
  unknown: "bg-slate-100 text-slate-500 border border-slate-200",
};

const scoreStyle = (score: number) => {
  if (score >= 0.8) return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (score >= 0.4) return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-slate-100 text-slate-500 border border-slate-200";
};

const verticals = [
  { value: "", label: "Todos los verticales" },
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

function SkeletonRow() {
  return (
    <tr>
      <td className="table-cell"><div className="skeleton h-4 w-48" /></td>
      <td className="table-cell"><div className="skeleton h-5 w-20 rounded-full" /></td>
      <td className="table-cell"><div className="skeleton h-5 w-12 rounded-full" /></td>
      <td className="table-cell"><div className="skeleton h-4 w-24" /></td>
      <td className="table-cell"><div className="skeleton h-4 w-20" /></td>
    </tr>
  );
}

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
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Señales de intención de compra detectadas</p>
        </div>
        <span className="badge bg-slate-100 text-slate-600 border border-slate-200 text-sm px-3 py-1">
          {total} señales
        </span>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtros</span>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">Vertical</label>
            <select
              value={filters.category}
              onChange={(e) => setFilter("category", e.target.value)}
              className="input w-44"
            >
              {verticals.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Intención</label>
            <select
              value={filters.intent}
              onChange={(e) => setFilter("intent", e.target.value)}
              className="input w-40"
            >
              <option value="">Todas</option>
              <option value="buy">Comprador</option>
              <option value="sell">Vendedor</option>
              <option value="rent">Renta</option>
            </select>
          </div>

          <div>
            <label className="label">Score mínimo: <span className="text-blue-600 font-semibold">{filters.minScore.toFixed(1)}</span></label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={filters.minScore}
              onChange={(e) => setFilter("minScore", Number(e.target.value))}
              className="w-32 accent-blue-600"
            />
          </div>

          <div>
            <label className="label">Período</label>
            <select
              value={filters.period}
              onChange={(e) => setFilter("period", e.target.value)}
              className="input w-40"
            >
              {periods.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200/60">
              <tr>
                <th className="table-header">Publicación</th>
                <th className="table-header">Intención</th>
                <th className="table-header">Score</th>
                <th className="table-header">Ubicación</th>
                <th className="table-header">Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        ) : signals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700 mb-1">Sin señales aún</h3>
            <p className="text-sm text-slate-400 max-w-xs">
              Configura una fuente de datos y ejecuta la recolección para ver señales aquí.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200/60">
              <tr>
                <th className="table-header">Publicación</th>
                <th className="table-header">Intención</th>
                <th className="table-header">Score</th>
                <th className="table-header">Ubicación</th>
                <th className="table-header">Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {signals.map((s) => {
                const score = Number(s.score);
                const intent = s.intent ?? "unknown";
                return (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="table-cell max-w-xs">
                      {s.item?.url ? (
                        <a
                          href={s.item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-start gap-1.5 text-blue-600 hover:text-blue-700 hover:underline line-clamp-2 group"
                        >
                          <span className="line-clamp-2">{s.item.title ?? s.item.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ) : (
                        <span className="text-slate-500 line-clamp-2">{s.item?.title ?? "—"}</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${intentStyles[intent] ?? intentStyles["unknown"]}`}>
                        {intentLabel[intent] ?? "Desconocida"}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge font-mono ${scoreStyle(score)}`}>
                        {score.toFixed(2)}
                      </span>
                    </td>
                    <td className="table-cell text-slate-600">{s.location ?? "—"}</td>
                    <td className="table-cell text-slate-600">
                      {s.price
                        ? `${s.currency ?? "HNL"} ${Number(s.price).toLocaleString("es-HN")}`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total} señales
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0 || loading}
              className="btn-secondary py-1.5 px-3 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * PAGE_SIZE >= total || loading}
              className="btn-secondary py-1.5 px-3 disabled:opacity-40"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
