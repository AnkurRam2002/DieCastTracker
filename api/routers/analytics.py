from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.session import get_db
from services.analytics_service import AnalyticsService
from services.preorder_service import PreorderService

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("")
async def get_analytics(db: Session = Depends(get_db)):
    # Get deep collection intelligence
    collection_intelligence = AnalyticsService.get_collection_intelligence(db)
    
    # Get preorder statistics
    preorder_stats = PreorderService.get_statistics(db)
    
    return {
        "success": True,
        "analytics": collection_intelligence,
        "preorders": preorder_stats
    }
