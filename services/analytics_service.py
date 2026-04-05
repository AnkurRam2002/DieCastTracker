from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from db.models import Car, Series, Subseries
from core.config import settings

class AnalyticsService:
    @staticmethod
    def get_collection_intelligence(db: Session):
        # 1. Total Models
        total_models = db.query(Car).count()
        
        # 2. Main Series Breakdown
        series_counts = db.query(Series.name, func.count(Car.serial_number)).\
            join(Subseries, Series.id == Subseries.series_id).\
            join(Car, Subseries.id == Car.subseries_id).\
            group_by(Series.name).all()
        main_series_breakdown = {name: count for name, count in series_counts}
        
        # 3. Collection Goals
        # Assuming a target milestone of 500 or 1000. 
        # In a real app, this might be configurable.
        target_milestone = 500 if total_models < 500 else 1000
        progress_percentage = (total_models / target_milestone) * 100 if target_milestone > 0 else 0
        
        collection_goals = {
            "target": target_milestone,
            "current": total_models,
            "progress_percentage": progress_percentage
        }
        
        # 4. Collection Insights
        # Top 5 Subseries
        top_subseries_data = db.query(Subseries.name, func.count(Car.serial_number)).\
            join(Car, Subseries.id == Car.subseries_id).\
            group_by(Subseries.name).\
            order_by(desc(func.count(Car.serial_number))).\
            limit(5).all()
        top_subseries = {name: count for name, count in top_subseries_data}
        
        # Diversity Score: (Unique Subseries / Total Potential Subseries in DB)
        total_subseries_defined = db.query(Subseries).count()
        unique_subseries_owned = db.query(Car.subseries_id).distinct().count()
        diversity_score = (unique_subseries_owned / total_subseries_defined * 100) if total_subseries_defined > 0 else 0
        
        collection_insights = {
            "top_subseries": top_subseries,
            "diversity_score": round(diversity_score, 1)
        }
        
        # 5. Recent Additions
        recent_cars = db.query(Car).join(Subseries).join(Series).\
            order_by(desc(Car.serial_number)).limit(10).all()
            
        recent_additions = []
        for car in recent_cars:
            recent_additions.append({
                "S.No": car.serial_number,
                "Model Name": car.model_name,
                "Series": car.subseries.name if car.subseries else "Unknown",
                "Main Series": car.subseries.series.name if car.subseries and car.subseries.series else "Unknown"
            })
            
        return {
            "total_models": total_models,
            "main_series_breakdown": main_series_breakdown,
            "collection_goals": collection_goals,
            "collection_insights": collection_insights,
            "recent_additions": recent_additions
        }
