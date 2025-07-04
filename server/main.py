"""
FastAPI KPI Server for Operations Analytics
Serves comprehensive logistics and transportation KPIs
"""

import os
import sys
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from pydantic import BaseModel
from dotenv import load_dotenv

# Add the current directory to Python path
sys.path.append(os.path.dirname(__file__))

from config.database import db
from data_extractor.operations_kpi_extractor import OperationsKPIExtractor
from data_extractor.safety_kpi_extractor import SafetyKPIExtractor
from data_extractor.combined_kpi_extractor import CombinedKPIExtractor
from chatbot.kpi_chatbot import KPIChatbot
from ai_insights.insights_generator import AIInsightsGenerator

# Load environment variables from the correct path
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Initialize FastAPI app
app = FastAPI(
    title="Driver Safety KPI Server",
    description="Comprehensive operations, safety, and combined KPIs for logistics efficiency, route productivity, transporter performance, driver behavior analysis, and overall logistics health",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://16.170.98.127:3000",  # Frontend React app
        "http://localhost:3000",      # Local development frontend
        "http://127.0.0.1:3000",      # Alternative localhost
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize KPI extractors
operations_kpi_extractor = OperationsKPIExtractor()
safety_kpi_extractor = SafetyKPIExtractor()
combined_kpi_extractor = CombinedKPIExtractor()

# Initialize AI Insights Generator
ai_insights_generator = AIInsightsGenerator()

# Initialize KPI Chatbot
kpi_chatbot = KPIChatbot()

# Chart storage directory
CHARTS_DIR = Path("charts")
CHARTS_DIR.mkdir(exist_ok=True)

def get_chart_file_path(chart_id: str) -> Path:
    """Get the file path for a chart configuration"""
    return CHARTS_DIR / f"{chart_id}.json"

def save_chart_to_file(chart_id: str, chart_data: dict) -> None:
    """Save chart configuration to file"""
    file_path = get_chart_file_path(chart_id)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(chart_data, f, indent=2, ensure_ascii=False)

def load_chart_from_file(chart_id: str) -> Optional[dict]:
    """Load chart configuration from file"""
    file_path = get_chart_file_path(chart_id)
    if not file_path.exists():
        return None

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return None

def delete_chart_file(chart_id: str) -> bool:
    """Delete chart configuration file"""
    file_path = get_chart_file_path(chart_id)
    if file_path.exists():
        try:
            file_path.unlink()
            return True
        except OSError:
            return False
    return False

def list_all_charts() -> List[dict]:
    """List all saved chart configurations"""
    charts = []
    for file_path in CHARTS_DIR.glob("*.json"):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                chart_data = json.load(f)
                charts.append(chart_data)
        except (json.JSONDecodeError, IOError):
            continue

    # Sort by created_at timestamp (newest first)
    charts.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return charts

# Pydantic models for request/response
class KPIRequest(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class KPIResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    message: str
    extraction_timestamp: str

# Chatbot models
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    success: bool
    response: str
    session_id: Optional[str] = None
    timestamp: str
    error: Optional[str] = None
    chart_config: Optional[Dict[str, Any]] = None

class ChartSaveRequest(BaseModel):
    chart_config: Dict[str, Any]
    title: str
    description: Optional[str] = None

# AI Insights models
class AIInsight(BaseModel):
    id: int
    title: str
    description: str
    category: str
    priority: str
    timestamp: str

class AIInsightsDataSources(BaseModel):
    operations_kpis: int
    safety_kpis: int
    combined_kpis: int

class AIInsightsMetadata(BaseModel):
    model: str
    tokens_used: int
    timestamp: Optional[str] = None

class AIInsightsDateRange(BaseModel):
    start: str
    end: str

class AIInsightsResponse(BaseModel):
    success: bool
    insights: List[AIInsight]
    generation_timestamp: str
    date_range: AIInsightsDateRange
    data_sources: AIInsightsDataSources
    ai_metadata: AIInsightsMetadata
    fallback_mode: Optional[bool] = None
    message: Optional[str] = None
    error: Optional[str] = None

class ChartUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    chart_config: Optional[Dict[str, Any]] = None

class ChartResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    chart_config: Dict[str, Any]
    created_at: str
    updated_at: str

class ChartListResponse(BaseModel):
    charts: List[ChartResponse]
    total: int

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Driver Safety KPI Server",
        "version": "1.0.0",
        "description": "Comprehensive operations, safety, and combined KPIs for logistics efficiency, route productivity, transporter performance, driver behavior analysis, and overall logistics health",
        "endpoints": {
            "operations_kpis": "/api/operations-kpis",
            "safety_kpis": "/api/safety-kpis",
            "combined_kpis": "/api/combined-kpis",
            "ai_insights": "/api/ai-insights",
            "health": "/health",
            "chatbot": "/api/chat",
            "chatbot_session": "/api/chat/session"
        },
        "operations_kpis_included": [
            "Turnaround Time (TAT) at plant, warehouse, delivery point",
            "Trip Count per Vehicle per Day",
            "Trip Distance vs Planned Distance",
            "Vehicle Utilization Rate (active driving time vs idle)",
            "On-time Arrival Rate",
            "Trip Delays (%) – beyond scheduled departure/arrival",
            "Transporter-wise Performance Score",
            "Missed Delivery",
            "Geo-deviation Events (off-route movement)",
            "Loading/Unloading Time per Stop",
            "Planned vs Actual Delivery Volume",
            "Maintenance Downtime (hrs/vehicle/month)"
        ],
        "safety_kpis_included": [
            "Driving Safety Score",
            "Phone Usage During Trip (incidence rate)",
            "Overspeeding Events per 100 km",
            "Harsh Braking / Acceleration / Cornering Events per Trip",
            "Non-compliance with Rest Time (fatigue risk)",
            "High-Risk Trips (based on composite score thresholds)",
            "Incident Heatmaps (location-based trends)",
            "Repeat Offenders (driver-level behavior history)",
            "Checklist Compliance Rate (e.g., daily inspection, onboarding)",
            "Accident/Near-Miss Flags (manual reporting or system detection)",
            "Fatigue Scoring"
        ],
        "combined_kpis_included": [
            "Safe On-Time Delivery Rate (trips that are both safe and on-time)",
            "Driver Risk vs TAT Heatmap (correlation between speed and safety)",
            "Top 10 Routes by Risk-Weighted Efficiency",
            "R&R Eligible Trips (meets combined criteria across ops and safety)",
            "Driver Engagement Index (training content, checklist use, driving score)",
            "Transporter Composite Score (combining safety and operational metrics)",
            "Fatigue Risk by Route Length and Time of Day",
            "Driver Performance Index (Ops + Safety blend) – Composite driver score factoring delivery metrics and driving behaviour"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        db_status = db.test_connection()
        return {
            "status": "healthy" if db_status else "unhealthy",
            "database": "connected" if db_status else "disconnected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )

@app.get("/api/operations-kpis", response_model=KPIResponse)
async def get_operations_kpis(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD), defaults to 1 year ago"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD), defaults to today")
):
    """
    Get comprehensive Operations KPIs for logistics efficiency analysis

    Returns all 12 operations KPIs:
    - Turnaround Time (TAT) at plant, warehouse, delivery point
    - Trip Count per Vehicle per Day
    - Trip Distance vs Planned Distance
    - Vehicle Utilization Rate (active driving time vs idle)
    - On-time Arrival Rate
    - Trip Delays (%) – beyond scheduled departure/arrival
    - Transporter-wise Performance Score
    - Missed Delivery
    - Geo-deviation Events (off-route movement)
    - Loading/Unloading Time per Stop
    - Planned vs Actual Delivery Volume
    - Maintenance Downtime (hrs/vehicle/month)
    """
    try:
        # Set default dates if not provided
        if not start_date:
            start_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')

        # Extract all operations KPIs
        kpis = operations_kpi_extractor.extract_all_kpis(start_date, end_date)

        return KPIResponse(
            success=True,
            data=kpis,
            message=f"All 12 Operations KPIs extracted successfully for period {start_date} to {end_date} (default: 1 year)",
            extraction_timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting Operations KPIs: {str(e)}")

@app.get("/api/safety-kpis", response_model=KPIResponse)
async def get_safety_kpis(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD), defaults to 1 year ago"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD), defaults to today")
):
    """
    Get comprehensive Safety KPIs for driver behavior and risk evaluation

    Returns all 11 safety KPIs:
    - Driving Safety Score
    - Phone Usage During Trip (incidence rate)
    - Overspeeding Events per 100 km
    - Harsh Braking / Acceleration / Cornering Events per Trip
    - Non-compliance with Rest Time (fatigue risk)
    - High-Risk Trips (based on composite score thresholds)
    - Incident Heatmaps (location-based trends)
    - Repeat Offenders (driver-level behavior history)
    - Checklist Compliance Rate (e.g., daily inspection, onboarding)
    - Accident/Near-Miss Flags (manual reporting or system detection)
    - Fatigue Scoring
    """
    try:
        # Set default dates if not provided
        if not start_date:
            start_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')

        # Extract all safety KPIs
        kpis = safety_kpi_extractor.extract_all_kpis(start_date, end_date)

        return KPIResponse(
            success=True,
            data=kpis,
            message=f"All 11 Safety KPIs extracted successfully for period {start_date} to {end_date} (default: 1 year)",
            extraction_timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting Safety KPIs: {str(e)}")

@app.get("/api/combined-kpis", response_model=KPIResponse)
async def get_combined_kpis(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD), defaults to 1 year ago"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD), defaults to today")
):
    """
    Get comprehensive Combined Operational + Safety KPIs for overall logistics health analysis

    Returns all 8 combined KPIs that merge operational efficiency with safety metrics:
    - Safe On-Time Delivery Rate (trips that are both safe and on-time)
    - Driver Risk vs TAT Heatmap (correlation between speed and safety)
    - Top 10 Routes by Risk-Weighted Efficiency
    - R&R Eligible Trips (meets combined criteria across ops and safety)
    - Driver Engagement Index (training content, checklist use, driving score)
    - Transporter Composite Score (combining safety and operational metrics)
    - Fatigue Risk by Route Length and Time of Day
    - Driver Performance Index (Ops + Safety blend) – Composite driver score factoring delivery metrics and driving behaviour
    """
    try:
        # Set default dates if not provided
        if not start_date:
            start_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')

        # Extract all combined KPIs
        kpis = combined_kpi_extractor.extract_all_kpis(start_date, end_date)

        return KPIResponse(
            success=True,
            data=kpis,
            message=f"All 8 Combined KPIs extracted successfully for period {start_date} to {end_date} (default: 1 year)",
            extraction_timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting Combined KPIs: {str(e)}")

@app.get("/api/ai-insights", response_model=AIInsightsResponse)
async def get_ai_insights(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD), defaults to 1 year ago"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD), defaults to today"),
    more_insights: Optional[bool] = Query(False, description="Generate additional diverse insights")
):
    """
    Generate 10 AI-powered insights from combined operations and safety KPI data

    This endpoint combines all operations, safety, and combined KPIs and sends them to AI
    to generate 10 actionable insights for logistics management. The insights cover:

    - Operational Performance (3-4 insights)
    - Safety Performance (3-4 insights)
    - Combined Efficiency & Risk (2-3 insights)

    Each insight includes:
    - Specific data-driven findings
    - Relevant metrics and percentages
    - Actionable next steps
    - Priority level and category
    """
    try:
        # Set default dates if not provided
        if not start_date:
            start_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')

        # Generate AI insights
        insights_result = ai_insights_generator.generate_insights(start_date, end_date, more_insights)

        if not insights_result.get('success', False):
            raise HTTPException(
                status_code=500,
                detail=f"Error generating AI insights: {insights_result.get('error', 'Unknown error')}"
            )

        return AIInsightsResponse(
            success=insights_result['success'],
            insights=insights_result['insights'],
            generation_timestamp=insights_result['generation_timestamp'],
            date_range=AIInsightsDateRange(
                start=insights_result['date_range']['start'],
                end=insights_result['date_range']['end']
            ),
            data_sources=AIInsightsDataSources(
                operations_kpis=insights_result['data_sources']['operations_kpis'],
                safety_kpis=insights_result['data_sources']['safety_kpis'],
                combined_kpis=insights_result['data_sources']['combined_kpis']
            ),
            ai_metadata=AIInsightsMetadata(
                model=insights_result['ai_metadata']['model'],
                tokens_used=insights_result['ai_metadata']['tokens_used'],
                timestamp=insights_result['ai_metadata']['timestamp']
            ),
            fallback_mode=insights_result.get('fallback_mode'),
            message=insights_result.get('message')
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating AI insights: {str(e)}")

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_kpi_bot(request: ChatRequest):
    """
    Chat with KPI Bot about analytics data

    Send questions about KPI data and get intelligent responses powered by Azure OpenAI.
    The bot has access to all operations, safety, and combined KPI metrics.

    Example questions:
    - "What's the average safety score?"
    - "Which drivers have the most incidents?"
    - "Show me transporter performance"
    - "What are the main operational bottlenecks?"
    """
    try:
        # Start session if not provided
        if request.session_id:
            # Check if session exists, if not start new one
            if not kpi_chatbot.session_id or kpi_chatbot.session_id != request.session_id:
                kpi_chatbot.start_session(request.session_id)
        else:
            # Start new session
            session_info = kpi_chatbot.start_session()
            request.session_id = session_info["session_id"]

        # Process chat message
        response = kpi_chatbot.chat(request.message)

        return ChatResponse(
            success=response.get("success", True),
            response=response.get("response", ""),
            session_id=response.get("session_id"),
            timestamp=response.get("timestamp", datetime.now().isoformat()),
            error=response.get("error"),
            chart_config=response.get("chart_config")
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in chat: {str(e)}")

@app.get("/api/chat/session")
async def get_chat_session_info():
    """Get current chat session information"""
    try:
        session_info = kpi_chatbot.get_session_info()
        return {
            "success": True,
            "data": session_info,
            "message": "Session information retrieved successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting session info: {str(e)}")

@app.post("/api/chat/session/start")
async def start_chat_session(session_id: Optional[str] = None):
    """Start a new chat session"""
    try:
        session_info = kpi_chatbot.start_session(session_id)
        return {
            "success": True,
            "data": session_info,
            "message": "Chat session started successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting session: {str(e)}")

@app.post("/api/chat/session/end")
async def end_chat_session():
    """End current chat session"""
    try:
        session_summary = kpi_chatbot.end_session()
        return {
            "success": True,
            "data": session_summary,
            "message": "Chat session ended successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ending session: {str(e)}")

@app.post("/api/chat/refresh-data")
async def refresh_kpi_data():
    """Refresh KPI data for chatbot"""
    try:
        refresh_result = kpi_chatbot.refresh_kpi_data()
        return refresh_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error refreshing KPI data: {str(e)}")

@app.get("/api/chat/kpi-categories")
async def get_kpi_categories():
    """Get available KPI categories"""
    try:
        categories = kpi_chatbot.get_kpi_categories()
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting KPI categories: {str(e)}")

# Chart Storage Endpoints

@app.post("/api/charts", response_model=ChartResponse)
async def save_chart(request: ChartSaveRequest):
    """Save a new chart configuration"""
    try:
        chart_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()

        chart_data = {
            "id": chart_id,
            "title": request.title,
            "description": request.description,
            "chart_config": request.chart_config,
            "created_at": timestamp,
            "updated_at": timestamp
        }

        save_chart_to_file(chart_id, chart_data)

        return ChartResponse(**chart_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving chart: {str(e)}")

@app.get("/api/charts", response_model=ChartListResponse)
async def get_all_charts():
    """Get all saved chart configurations"""
    try:
        charts = list_all_charts()
        chart_responses = [ChartResponse(**chart) for chart in charts]

        return ChartListResponse(
            charts=chart_responses,
            total=len(chart_responses)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading charts: {str(e)}")

@app.get("/api/charts/{chart_id}", response_model=ChartResponse)
async def get_chart(chart_id: str):
    """Get a specific chart configuration"""
    try:
        chart_data = load_chart_from_file(chart_id)
        if not chart_data:
            raise HTTPException(status_code=404, detail="Chart not found")

        return ChartResponse(**chart_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading chart: {str(e)}")

@app.put("/api/charts/{chart_id}", response_model=ChartResponse)
async def update_chart(chart_id: str, request: ChartUpdateRequest):
    """Update an existing chart configuration"""
    try:
        chart_data = load_chart_from_file(chart_id)
        if not chart_data:
            raise HTTPException(status_code=404, detail="Chart not found")

        # Update fields if provided
        if request.title is not None:
            chart_data["title"] = request.title
        if request.description is not None:
            chart_data["description"] = request.description
        if request.chart_config is not None:
            chart_data["chart_config"] = request.chart_config

        chart_data["updated_at"] = datetime.now().isoformat()

        save_chart_to_file(chart_id, chart_data)

        return ChartResponse(**chart_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating chart: {str(e)}")

@app.delete("/api/charts/{chart_id}")
async def delete_chart(chart_id: str):
    """Delete a chart configuration"""
    try:
        chart_data = load_chart_from_file(chart_id)
        if not chart_data:
            raise HTTPException(status_code=404, detail="Chart not found")

        success = delete_chart_file(chart_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete chart file")

        return {"success": True, "message": "Chart deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting chart: {str(e)}")

if __name__ == "__main__":
    # Get configuration from environment
    host = os.getenv("SERVER_HOST", "0.0.0.0")
    port = int(os.getenv("SERVER_PORT", 8000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    print(f"🚀 Starting Driver Safety KPI Server on {host}:{port}")
    print(f"📊 Debug mode: {debug}")
    print(f"📖 API Documentation: http://{host}:{port}/docs")
    print(f"🔧 Operations KPIs: http://{host}:{port}/api/operations-kpis")
    print(f"🛡️ Safety KPIs: http://{host}:{port}/api/safety-kpis")
    print(f"🎯 Combined KPIs: http://{host}:{port}/api/combined-kpis")
    print(f"🤖 KPI Chatbot: http://{host}:{port}/api/chat")
    print(f"💬 Chat Session: http://{host}:{port}/api/chat/session")
    print(f"📊 Chart Storage: http://{host}:{port}/api/charts")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info" if debug else "warning"
    )
