#!/usr/bin/env python3
"""
Startup script for DieCast Tracker Web Application
"""

import uvicorn
from app import app

if __name__ == "__main__":
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        reload_dirs=[".", "pages", "static"]
    )