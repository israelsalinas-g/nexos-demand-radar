import json
from openai import AsyncOpenAI
from app.config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key)

SYSTEM_PROMPT = """Eres un extractor de señales de demanda e intención de compra para Honduras.
Dado el título y cuerpo de una publicación, extrae la siguiente información en JSON válido:

{
  "category": "autos" | "real_estate" | "smartphones" | "laptops" | null,
  "intent": "buy" | "sell" | "rent" | "unknown",
  "score": <float entre 0.0 y 1.0 indicando certeza de la intención>,
  "location": "<ciudad o zona mencionada, null si no hay>",
  "price": <número si se menciona precio, null si no hay>,
  "metadata": {
    "brand": "<marca si aplica>",
    "model": "<modelo si aplica>",
    "year": <año si aplica>,
    "condition": "new" | "used" | null,
    "bedrooms": <número si aplica para bienes raíces>
  }
}

Reglas:
- score alto (≥0.8) = intención muy clara ("Busco", "Compro", "Necesito")
- score medio (0.4-0.79) = intención probable pero ambigua
- score bajo (<0.4) = publicación irrelevante o ambigua
- Responde SOLO con JSON válido, sin markdown ni explicaciones adicionales."""


async def enrich_item(
    item_id: str,
    title: str | None,
    body: str | None,
) -> dict:
    text = f"Título: {title or ''}\nCuerpo: {body or ''}"

    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": text},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=512,
        )

        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)
    except (json.JSONDecodeError, Exception):
        parsed = {}

    return {
        "item_id": item_id,
        "category": parsed.get("category"),
        "intent": parsed.get("intent", "unknown"),
        "score": float(parsed.get("score", 0.0)),
        "location": parsed.get("location"),
        "price": _parse_price(parsed.get("price")),
        "metadata": parsed.get("metadata") or {},
    }


def _parse_price(value: object) -> float | None:
    if value is None:
        return None
    try:
        return float(str(value).replace(",", "").replace("L.", "").strip())
    except (ValueError, AttributeError):
        return None
