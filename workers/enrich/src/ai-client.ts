import axios from "axios";

const AI_WORKER_URL = process.env.AI_WORKER_URL ?? "http://localhost:8000";

export interface EnrichRequest {
  item_id: string;
  title?: string | null;
  body?: string | null;
}

export interface EnrichResponse {
  item_id: string;
  category: string | null;
  intent: string | null;
  score: number;
  location: string | null;
  price: number | null;
  metadata: Record<string, unknown>;
}

export async function callEnrich(req: EnrichRequest): Promise<EnrichResponse> {
  const { data } = await axios.post<EnrichResponse>(
    `${AI_WORKER_URL}/signals/enrich`,
    req,
    { timeout: 30_000 },
  );
  return data;
}
