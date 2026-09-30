import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import PROJECT_NAME, API_V1_STR, CORS_ORIGINS
from app.database.session import init_db
from app.ml.classifier import ISLClassifier
from app.api.predict import router as predict_router
from app.api.dataset import router as dataset_router
from app.api.model_mgmt import router as model_router
from app.api.translations import router as translation_router
from app.api.analytics import router as analytics_router
from app.api.websocket import router as websocket_router

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ISLBridgeApp")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing ISLBridge database and ML model pipeline...")
    init_db()
    # Preload and initialize model singleton
    ISLClassifier.get_instance()
    logger.info("ISLBridge backend ready!")
    yield
    logger.info("Shutting down ISLBridge backend...")

app = FastAPI(
    title=PROJECT_NAME,
    description="Real-Time Indian Sign Language (ISL) Recognition and Multilingual Translation Engine API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(predict_router, prefix=API_V1_STR)
app.include_router(dataset_router, prefix=API_V1_STR)
app.include_router(model_router, prefix=API_V1_STR)
app.include_router(translation_router, prefix=API_V1_STR)
app.include_router(analytics_router, prefix=API_V1_STR)
app.include_router(websocket_router)  # root /ws/translate

@app.get("/health", tags=["System"])
def health_check():
    classifier = ISLClassifier.get_instance()
    return {
        "status": "healthy",
        "service": PROJECT_NAME,
        "model_loaded": classifier.pipeline is not None,
        "classes_count": len(classifier.classes)
    }

@app.get("/", tags=["System"])
def root():
    return {
        "message": "Welcome to ISLBridge AI API",
        "docs_url": "/docs",
        "health_url": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
