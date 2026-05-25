from fastapi import FastAPI
from app.routers import signals

app = FastAPI(title="Demand Radar AI Worker", version="0.1.0")

app.include_router(signals.router, prefix="/signals", tags=["signals"])


@app.get("/health")
def health():
    return {"status": "ok"}
