from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.enricher import enrich_item

router = APIRouter()


class EnrichRequest(BaseModel):
    item_id: str
    title: str | None = None
    body: str | None = None


class EnrichResponse(BaseModel):
    item_id: str
    category: str | None
    intent: str | None
    score: float
    location: str | None
    price: float | None
    metadata: dict


@router.post("/enrich", response_model=EnrichResponse)
async def enrich(req: EnrichRequest) -> EnrichResponse:
    try:
        result = await enrich_item(req.item_id, req.title, req.body)
        return EnrichResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
