from fastapi import APIRouter
from api.routers import cars, preorders, series, analytics

api_router = APIRouter()

api_router.include_router(cars.router)
api_router.include_router(preorders.router)
api_router.include_router(series.router)
api_router.include_router(analytics.router)
