from fastapi import APIRouter
from api.routers import auth, cars, preorders, series, analytics

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(cars.router)
api_router.include_router(preorders.router)
api_router.include_router(series.router)
api_router.include_router(analytics.router)
