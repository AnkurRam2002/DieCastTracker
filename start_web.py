#!/usr/bin/env python3
"""
Startup script for DieCast Tracker Web Application
"""

import uvicorn
from app import app

if __name__ == "__main__":
    print("🚗 Starting DieCast Tracker Web Application...")
    print("📍 Access the application at: http://localhost:8000")
    print("📊 API Documentation at: http://localhost:8000/docs")
    print("🛑 Press Ctrl+C to stop the server")
    print("=" * 60)
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        reload_dirs=[".", "templates", "static"]
    )