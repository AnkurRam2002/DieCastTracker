#!/usr/bin/env python3
"""
DieCastTracker - FastAPI Web Application
Hot Wheels Collection Management System - Modular Backend
"""

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uvicorn

from core.config import settings
from db.session import init_db
from core.exceptions import AppException, app_exception_handler, generic_exception_handler
from api.api import api_router

# Initialize database
init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Hot Wheels Collection Management System - Web Interface"
)

# CORS configuration for React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Include Modular API Routers
app.include_router(api_router, prefix="/api")

# Mount static files for React frontend assets
if os.path.exists("frontend/dist/assets"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

@app.get("/{full_path:path}")
async def serve_react_app(request: Request, full_path: str):
    """Serve the React app for any configuration or non-API routes"""
    # Exclude API routes from catch-all
    if full_path.startswith("api/"):
        return JSONResponse(status_code=404, content={"success": False, "error": "API Route Not Found"})
    
    # Check if built React app exists
    index_file = os.path.join("frontend", "dist", "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "message": "Frontend not found. Please build the React app with 'npm run build' inside the frontend directory."
        }
    )

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)