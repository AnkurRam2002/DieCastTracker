import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "DieCast Tracker"
    PROJECT_VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: str = os.environ.get("DATABASE_URL")
    if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    if not DATABASE_URL:
        DATABASE_URL = "sqlite:///./data/diecast_tracker.db"
        
    # Security
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "your-secret-key-for-development-only")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Paths
    EXCEL_FILE_PATH: str = os.path.join("data", "HW_list.xlsx")
    
settings = Settings()
