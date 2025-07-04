# Operations KPI Server

A comprehensive FastAPI server for extracting and serving logistics operations KPIs focused on efficiency, route productivity, and transporter performance.

## 🎯 Features

### Single API Endpoint
- **`/api/operations-kpis`** - Returns all 12 operations KPIs in one call

### 12 Operations KPIs Included

1. **Turnaround Time (TAT)** - At plant, warehouse, delivery point
2. **Trip Count per Vehicle per Day** - Vehicle productivity metrics
3. **Trip Distance vs Planned Distance** - Route efficiency variance
4. **Vehicle Utilization Rate** - Active driving time vs idle time
5. **On-time Arrival Rate** - Punctuality performance
6. **Trip Delays (%)** - Beyond scheduled departure/arrival
7. **Transporter-wise Performance Score** - Comprehensive scoring
8. **Missed Delivery** - Delivery failure tracking
9. **Geo-deviation Events** - Off-route movement detection
10. **Loading/Unloading Time per Stop** - Bottleneck identification
11. **Planned vs Actual Delivery Volume** - Fulfillment efficiency
12. **Maintenance Downtime** - Vehicle availability tracking

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd server
pip install -r requirements.txt
```

### 2. Configure Database
Copy and edit the environment configuration:
```bash
cp config/env_example.txt .env
# Edit .env with your database credentials
```

### 3. Start the Server
```bash
python run_server.py
```

Or manually:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 📡 API Usage

### Get All Operations KPIs
```bash
# Get KPIs for last 30 days (default)
GET http://localhost:8000/api/operations-kpis

# Get KPIs for specific date range
GET http://localhost:8000/api/operations-kpis?start_date=2024-01-01&end_date=2024-01-31
```

### Response Format
```json
{
  "success": true,
  "data": {
    "extraction_timestamp": "2025-07-01T10:30:00",
    "date_range": {
      "start": "2024-06-01",
      "end": "2024-07-01"
    },
    "turnaround_time": {
      "overall_avg_tat_hours": 4.5,
      "by_location_type": {...},
      "top_bottleneck_locations": [...]
    },
    "trip_count_per_vehicle": {
      "avg_trips_per_vehicle_per_day": 3.2,
      "vehicle_performance": [...]
    },
    "distance_variance": {
      "avg_distance_variance_pct": 5.8,
      "worst_variance_trips": [...]
    },
    "vehicle_utilization": {
      "avg_utilization_pct": 65.4,
      "underutilized_vehicles": [...]
    },
    "on_time_arrival": {
      "on_time_rate_pct": 87.3,
      "by_transporter": [...]
    },
    "trip_delays": {
      "departure_delay_pct": 12.5,
      "arrival_delay_pct": 15.2
    },
    "transporter_performance": {
      "avg_performance_score": 78.9,
      "top_performers": [...]
    },
    "missed_deliveries": {
      "missed_delivery_rate_pct": 2.1,
      "by_reason": {...}
    },
    "geo_deviation_events": {
      "geo_deviation_rate_pct": 3.4,
      "events": [...]
    },
    "loading_unloading_time": {
      "avg_loading_time_min": 25.3,
      "avg_unloading_time_min": 18.7,
      "bottleneck_locations": {...}
    },
    "delivery_volume_variance": {
      "avg_fulfillment_pct": 94.2,
      "worst_underperformers": [...]
    },
    "maintenance_downtime": {
      "avg_maintenance_downtime_hrs_per_month": 12.5,
      "vehicles_needing_maintenance": 3
    }
  },
  "message": "All 12 Operations KPIs extracted successfully",
  "extraction_timestamp": "2025-07-01T10:30:00"
}
```

## 🔧 Configuration

### Environment Variables
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=driver_safety
DB_USER=postgres
DB_PASSWORD=your_password

# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
DEBUG=True
```

## 📊 API Documentation

Once the server is running, visit:
- **Interactive API Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 🏗️ Architecture

```
server/
├── main.py                           # FastAPI application
├── run_server.py                     # Startup script
├── requirements.txt                  # Dependencies
├── config/
│   ├── database.py                   # Database configuration
│   └── env_example.txt              # Environment template
└── data_extractor/
    └── operations_kpi_extractor.py  # KPI extraction logic
```

## 🔍 Key Features

- **Single Endpoint**: All KPIs in one API call
- **Date Range Support**: Flexible date filtering
- **Comprehensive Metrics**: 12 detailed operations KPIs
- **FastAPI Framework**: Modern, fast, and well-documented
- **Database Connection Pooling**: Efficient database handling
- **Error Handling**: Robust error management
- **Health Monitoring**: Built-in health check endpoint

## 📈 KPI Details

Each KPI provides detailed breakdowns including:
- Overall metrics and averages
- Performance by vehicle, transporter, location
- Top/bottom performers identification
- Trend analysis and variance tracking
- Bottleneck identification
- Historical comparisons

Perfect for logistics operations teams to monitor efficiency, identify bottlenecks, and optimize transportation performance.
