export interface SignalData {
  intent: string | null;
  score: unknown;
  location: string | null;
  price: unknown;
  currency: string | null;
  category: string | null;
  metadata: unknown;
  item: { title: string | null; url: string | null } | null;
}

export interface AlertData {
  name: string;
  channel: string;
}

export function buildEmailHtml(signal: SignalData, alert: AlertData): string {
  const intentLabel: Record<string, string> = {
    buy: "Busca comprar",
    sell: "Vende",
    rent: "Busca rentar",
    unknown: "Desconocida",
  };
  const meta = (signal.metadata ?? {}) as Record<string, unknown>;
  const metaLines = Object.entries(meta)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`)
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><style>
  body { font-family: sans-serif; color: #1a1a1a; max-width: 600px; margin: auto; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; }
  .buy { background: #d1fae5; color: #065f46; }
  .sell { background: #fee2e2; color: #991b1b; }
  .rent { background: #dbeafe; color: #1e40af; }
  .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-top: 16px; }
</style></head>
<body>
  <h2>🔔 ${alert.name}</h2>
  <div class="card">
    <p><strong>Título:</strong> ${signal.item?.title ?? "Sin título"}</p>
    <p>
      <span class="badge ${signal.intent ?? "unknown"}">
        ${intentLabel[signal.intent ?? "unknown"] ?? "Desconocida"}
      </span>
      &nbsp; Puntaje: <strong>${Number(signal.score).toFixed(2)}</strong>
    </p>
    ${signal.category ? `<p><strong>Categoría:</strong> ${signal.category}</p>` : ""}
    ${signal.location ? `<p>📍 <strong>Ubicación:</strong> ${signal.location}</p>` : ""}
    ${signal.price ? `<p>💰 <strong>Precio:</strong> ${signal.currency ?? "HNL"} ${Number(signal.price).toLocaleString("es-HN")}</p>` : ""}
    ${metaLines ? `<ul>${metaLines}</ul>` : ""}
    ${signal.item?.url ? `<p><a href="${signal.item.url}" style="color:#2563eb">Ver publicación original →</a></p>` : ""}
  </div>
  <p style="color:#9ca3af;font-size:12px;margin-top:24px">
    Demand Radar — demandradar.hn
  </p>
</body>
</html>`.trim();
}

export function buildTelegramMessage(signal: SignalData, alert: AlertData): string {
  const intentLabel: Record<string, string> = {
    buy: "🛒 Busca comprar",
    sell: "💼 Vende",
    rent: "🏠 Busca rentar",
    unknown: "❓ Desconocida",
  };

  const lines = [
    `🔔 <b>${alert.name}</b>`,
    `📌 ${signal.item?.title ?? "Sin título"}`,
    `${intentLabel[signal.intent ?? "unknown"] ?? "Desconocida"} | Puntaje: <b>${Number(signal.score).toFixed(2)}</b>`,
  ];

  if (signal.location) lines.push(`📍 ${signal.location}`);
  if (signal.price)
    lines.push(`💰 ${signal.currency ?? "HNL"} ${Number(signal.price).toLocaleString("es-HN")}`);
  if (signal.item?.url) lines.push(`🔗 ${signal.item.url}`);

  return lines.join("\n");
}
