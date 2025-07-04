"""
Operations KPI Extractor
Focus: Logistics efficiency, route productivity, and transporter performance

This module extracts comprehensive operations KPIs including:
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

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from config.database import db
import pandas as pd
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Optional, Tuple
import json
import math

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def safe_float(value, default=0.0):
    """
    Safely convert a value to float, handling inf, -inf, and NaN values
    Returns default value for invalid float values that can't be JSON serialized
    """
    try:
        if pd.isna(value) or math.isinf(value) or math.isnan(value):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default

def safe_int(value, default=0):
    """
    Safely convert a value to int, handling inf, -inf, and NaN values
    Returns default value for invalid values
    """
    try:
        if pd.isna(value) or math.isinf(value) or math.isnan(value):
            return default
        return int(value)
    except (TypeError, ValueError):
        return default

def clean_data_for_json(data):
    """
    Recursively clean data structure to ensure all float values are JSON serializable
    Replaces inf, -inf, and NaN values with safe defaults
    """
    if isinstance(data, dict):
        return {key: clean_data_for_json(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [clean_data_for_json(item) for item in data]
    elif isinstance(data, float):
        return safe_float(data)
    elif isinstance(data, (int, str, bool, type(None))):
        return data
    else:
        # For pandas Series, numpy arrays, etc.
        try:
            if hasattr(data, 'to_dict'):
                return clean_data_for_json(data.to_dict())
            elif hasattr(data, 'tolist'):
                return clean_data_for_json(data.tolist())
            else:
                return safe_float(data) if isinstance(data, (int, float)) else str(data)
        except:
            return str(data)

class OperationsKPIExtractor:
    """Extract comprehensive operations KPIs for logistics efficiency analysis"""
    
    def __init__(self):
        self.db = db
        
    def extract_all_kpis(self, start_date: str = None, end_date: str = None) -> Dict:
        """
        Extract all operations KPIs for the specified date range
        
        Args:
            start_date: Start date in YYYY-MM-DD format (default: 30 days ago)
            end_date: End date in YYYY-MM-DD format (default: today)
            
        Returns:
            Dictionary containing all KPI metrics
        """
        if not start_date:
            start_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
            
        logger.info(f"Extracting Operations KPIs from {start_date} to {end_date}")
        
        kpis = {
            'extraction_timestamp': datetime.now().isoformat(),
            'date_range': {'start': start_date, 'end': end_date},
            'turnaround_time': self.get_turnaround_time_kpi(start_date, end_date),
            'trip_count_per_vehicle': self.get_trip_count_per_vehicle_kpi(start_date, end_date),
            'distance_variance': self.get_distance_variance_kpi(start_date, end_date),
            'vehicle_utilization': self.get_vehicle_utilization_kpi(start_date, end_date),
            'on_time_arrival': self.get_on_time_arrival_kpi(start_date, end_date),
            'trip_delays': self.get_trip_delays_kpi(start_date, end_date),
            'transporter_performance': self.get_transporter_performance_kpi(start_date, end_date),
            'missed_deliveries': self.get_missed_deliveries_kpi(start_date, end_date),
            'geo_deviation_events': self.get_geo_deviation_events_kpi(start_date, end_date),
            'loading_unloading_time': self.get_loading_unloading_time_kpi(start_date, end_date),
            'delivery_volume_variance': self.get_delivery_volume_variance_kpi(start_date, end_date),
            'maintenance_downtime': self.get_maintenance_downtime_kpi(start_date, end_date)
        }

        # Clean data to ensure JSON serialization compatibility
        kpis = clean_data_for_json(kpis)

        logger.info("Operations KPI extraction completed successfully")
        return kpis
    
    def get_turnaround_time_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate Turnaround Time (TAT) at different location types"""
        query = """
        SELECT
            l.type as location_type,
            l.name as location_name,
            AVG(EXTRACT(EPOCH FROM (t.actual_arrival_time - t.actual_departure_time))/3600) as avg_tat_hours,
            MIN(EXTRACT(EPOCH FROM (t.actual_arrival_time - t.actual_departure_time))/3600) as min_tat_hours,
            MAX(EXTRACT(EPOCH FROM (t.actual_arrival_time - t.actual_departure_time))/3600) as max_tat_hours,
            COUNT(*) as trip_count
        FROM trips t
        JOIN locations l ON (t.start_location_id = l.location_id OR t.end_location_id = l.location_id)
        WHERE t.actual_departure_time >= %(start_date)s
        AND t.actual_arrival_time <= %(end_date)s
        AND t.status = 'Completed'
        AND t.actual_departure_time IS NOT NULL
        AND t.actual_arrival_time IS NOT NULL
        GROUP BY l.type, l.name
        ORDER BY avg_tat_hours DESC
        """
        
        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {
                    'overall_avg_tat_hours': 0,
                    'by_location_type': {},
                    'top_bottleneck_locations': []
                }

            # Convert numeric columns to proper types
            df['avg_tat_hours'] = pd.to_numeric(df['avg_tat_hours'], errors='coerce')
            df['trip_count'] = pd.to_numeric(df['trip_count'], errors='coerce')

            # Remove rows with NaN values
            df = df.dropna(subset=['avg_tat_hours'])

            return {
                'overall_avg_tat_hours': safe_float(df['avg_tat_hours'].mean()) if not df.empty else 0,
                'by_location_type': df.groupby('location_type').agg({
                    'avg_tat_hours': 'mean',
                    'trip_count': 'sum'
                }).round(2).to_dict('index'),
                'top_bottleneck_locations': df.nlargest(10, 'avg_tat_hours')[
                    ['location_name', 'location_type', 'avg_tat_hours', 'trip_count']
                ].to_dict('records') if len(df) > 0 else []
            }
        except Exception as e:
            logger.error(f"Error calculating turnaround time KPI: {e}")
            return {'error': str(e)}
    
    def get_trip_count_per_vehicle_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate Trip Count per Vehicle per Day"""
        query = """
        SELECT
            v.plate_number,
            v.type as vehicle_type,
            DATE(t.actual_departure_time) as trip_date,
            COUNT(*) as daily_trip_count
        FROM trips t
        JOIN vehicles v ON t.vehicle_id = v.vehicle_id
        WHERE t.actual_departure_time >= %(start_date)s
        AND t.actual_departure_time <= %(end_date)s
        AND t.status IN ('Completed', 'In Progress')
        GROUP BY v.vehicle_id, v.plate_number, v.type, DATE(t.actual_departure_time)
        ORDER BY daily_trip_count DESC
        """
        
        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})
                
            if df.empty:
                return {'avg_trips_per_vehicle_per_day': 0, 'vehicle_performance': []}
                
            vehicle_stats = df.groupby(['plate_number', 'vehicle_type']).agg({
                'daily_trip_count': ['mean', 'max', 'sum']
            }).round(2)
            
            vehicle_stats.columns = ['avg_daily_trips', 'max_daily_trips', 'total_trips']
            vehicle_stats = vehicle_stats.reset_index()
            
            return {
                'avg_trips_per_vehicle_per_day': safe_float(df['daily_trip_count'].mean()),
                'max_trips_per_vehicle_per_day': safe_int(df['daily_trip_count'].max()),
                'vehicle_performance': vehicle_stats.to_dict('records'),
                'by_vehicle_type': df.groupby('vehicle_type')['daily_trip_count'].mean().round(2).to_dict()
            }
        except Exception as e:
            logger.error(f"Error calculating trip count per vehicle KPI: {e}")
            return {'error': str(e)}
    
    def get_distance_variance_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate Trip Distance vs Planned Distance variance"""
        query = """
        SELECT 
            t.trip_id,
            t.planned_distance_km,
            t.actual_distance_km,
            (t.actual_distance_km - t.planned_distance_km) as distance_variance_km,
            ((t.actual_distance_km - t.planned_distance_km) / NULLIF(t.planned_distance_km, 0) * 100) as distance_variance_pct,
            v.plate_number,
            tr.name as transporter_name
        FROM trips t
        JOIN vehicles v ON t.vehicle_id = v.vehicle_id
        JOIN transporters tr ON t.transporter_id = tr.transporter_id
        WHERE t.actual_departure_time >= %(start_date)s
        AND t.actual_departure_time <= %(end_date)s
        AND t.status = 'Completed'
        AND t.planned_distance_km IS NOT NULL 
        AND t.actual_distance_km IS NOT NULL
        AND t.planned_distance_km > 0
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'avg_distance_variance_pct': 0, 'analysis': {}}
                
            return {
                'avg_distance_variance_pct': safe_float(df['distance_variance_pct'].mean()),
                'avg_distance_variance_km': safe_float(df['distance_variance_km'].mean()),
                'trips_over_planned': len(df[df['distance_variance_pct'] > 0]),
                'trips_under_planned': len(df[df['distance_variance_pct'] < 0]),
                'worst_variance_trips': df.nlargest(10, 'distance_variance_pct')[
                    ['plate_number', 'transporter_name', 'planned_distance_km',
                     'actual_distance_km', 'distance_variance_pct']
                ].to_dict('records'),
                'by_transporter': df.groupby('transporter_name')['distance_variance_pct'].mean().round(2).to_dict()
            }
        except Exception as e:
            logger.error(f"Error calculating distance variance KPI: {e}")
            return {'error': str(e)}

    def get_vehicle_utilization_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate Vehicle Utilization Rate (active driving time vs idle)"""
        query = """
        WITH trip_durations AS (
            SELECT
                v.vehicle_id,
                v.plate_number,
                v.type as vehicle_type,
                t.trip_id,
                EXTRACT(EPOCH FROM (t.actual_arrival_time - t.actual_departure_time))/3600 as trip_duration_hours,
                DATE(t.actual_departure_time) as trip_date
            FROM trips t
            JOIN vehicles v ON t.vehicle_id = v.vehicle_id
            WHERE t.actual_departure_time >= %(start_date)s
            AND t.actual_departure_time <= %(end_date)s
            AND t.status = 'Completed'
            AND t.actual_departure_time IS NOT NULL
            AND t.actual_arrival_time IS NOT NULL
        ),
        daily_utilization AS (
            SELECT
                vehicle_id,
                plate_number,
                vehicle_type,
                trip_date,
                SUM(trip_duration_hours) as daily_active_hours,
                COUNT(*) as daily_trips,
                24 as total_hours_in_day,
                (SUM(trip_duration_hours) / 24 * 100) as utilization_pct
            FROM trip_durations
            GROUP BY vehicle_id, plate_number, vehicle_type, trip_date
        )
        SELECT
            plate_number,
            vehicle_type,
            AVG(daily_active_hours) as avg_daily_active_hours,
            AVG(utilization_pct) as avg_utilization_pct,
            MAX(utilization_pct) as max_utilization_pct,
            AVG(daily_trips) as avg_daily_trips,
            COUNT(*) as active_days
        FROM daily_utilization
        GROUP BY vehicle_id, plate_number, vehicle_type
        ORDER BY avg_utilization_pct DESC
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'avg_utilization_pct': 0, 'vehicle_utilization': []}

            return {
                'avg_utilization_pct': safe_float(df['avg_utilization_pct'].mean()),
                'max_utilization_pct': safe_float(df['max_utilization_pct'].max()),
                'vehicle_utilization': df.round(2).to_dict('records'),
                'by_vehicle_type': df.groupby('vehicle_type')['avg_utilization_pct'].mean().round(2).to_dict(),
                'underutilized_vehicles': df[df['avg_utilization_pct'] < 30].to_dict('records'),
                'highly_utilized_vehicles': df[df['avg_utilization_pct'] > 80].to_dict('records')
            }
        except Exception as e:
            logger.error(f"Error calculating vehicle utilization KPI: {e}")
            return {'error': str(e)}

    def get_on_time_arrival_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate On-time Arrival Rate"""
        query = """
        SELECT
            t.is_on_time,
            v.plate_number,
            v.type as vehicle_type,
            tr.name as transporter_name,
            d.name as driver_name,
            COUNT(*) as trip_count,
            CASE
                WHEN t.actual_arrival_time <= t.planned_arrival_time THEN 'On Time'
                ELSE 'Delayed'
            END as arrival_status
        FROM trips t
        JOIN vehicles v ON t.vehicle_id = v.vehicle_id
        JOIN transporters tr ON t.transporter_id = tr.transporter_id
        JOIN drivers d ON t.driver_id = d.driver_id
        WHERE t.actual_departure_time >= %(start_date)s
        AND t.actual_departure_time <= %(end_date)s
        AND t.status = 'Completed'
        AND t.planned_arrival_time IS NOT NULL
        AND t.actual_arrival_time IS NOT NULL
        GROUP BY t.is_on_time, v.plate_number, v.type, tr.name, d.name, arrival_status
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'on_time_rate_pct': 0, 'performance_analysis': {}}

            total_trips = df['trip_count'].sum()
            on_time_trips = df[df['arrival_status'] == 'On Time']['trip_count'].sum()
            on_time_rate = (on_time_trips / total_trips * 100) if total_trips > 0 else 0

            # Performance by transporter
            transporter_performance = df.groupby('transporter_name').agg({
                'trip_count': 'sum'
            }).reset_index()

            on_time_by_transporter = df[df['arrival_status'] == 'On Time'].groupby('transporter_name').agg({
                'trip_count': 'sum'
            }).reset_index()

            transporter_performance = transporter_performance.merge(
                on_time_by_transporter, on='transporter_name', how='left', suffixes=('_total', '_on_time')
            )
            transporter_performance['on_time_rate_pct'] = (
                transporter_performance['trip_count_on_time'].fillna(0) /
                transporter_performance['trip_count_total'] * 100
            ).round(2)

            return {
                'on_time_rate_pct': safe_float(on_time_rate, 0),
                'total_trips': safe_int(total_trips),
                'on_time_trips': safe_int(on_time_trips),
                'delayed_trips': safe_int(total_trips - on_time_trips),
                'by_transporter': transporter_performance.to_dict('records'),
                'by_vehicle_type': df.groupby('vehicle_type').agg({
                    'trip_count': 'sum'
                }).to_dict('index')
            }
        except Exception as e:
            logger.error(f"Error calculating on-time arrival KPI: {e}")
            return {'error': str(e)}

    def get_trip_delays_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate Trip Delays (%) – beyond scheduled departure/arrival"""
        query = """
        SELECT
            t.trip_id,
            v.plate_number,
            tr.name as transporter_name,
            EXTRACT(EPOCH FROM (t.actual_departure_time - t.planned_departure_time))/60 as departure_delay_min,
            EXTRACT(EPOCH FROM (t.actual_arrival_time - t.planned_arrival_time))/60 as arrival_delay_min,
            CASE
                WHEN t.actual_departure_time > t.planned_departure_time THEN 'Delayed Departure'
                ELSE 'On Time Departure'
            END as departure_status,
            CASE
                WHEN t.actual_arrival_time > t.planned_arrival_time THEN 'Delayed Arrival'
                ELSE 'On Time Arrival'
            END as arrival_status
        FROM trips t
        JOIN vehicles v ON t.vehicle_id = v.vehicle_id
        JOIN transporters tr ON t.transporter_id = tr.transporter_id
        WHERE t.actual_departure_time >= %(start_date)s
        AND t.actual_departure_time <= %(end_date)s
        AND t.status = 'Completed'
        AND t.planned_departure_time IS NOT NULL
        AND t.actual_departure_time IS NOT NULL
        AND t.planned_arrival_time IS NOT NULL
        AND t.actual_arrival_time IS NOT NULL
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'departure_delay_pct': 0, 'arrival_delay_pct': 0}

            total_trips = len(df)
            delayed_departures = len(df[df['departure_status'] == 'Delayed Departure'])
            delayed_arrivals = len(df[df['arrival_status'] == 'Delayed Arrival'])

            departure_delay_pct = (delayed_departures / total_trips * 100) if total_trips > 0 else 0
            arrival_delay_pct = (delayed_arrivals / total_trips * 100) if total_trips > 0 else 0

            return {
                'departure_delay_pct': round(departure_delay_pct, 2),
                'arrival_delay_pct': round(arrival_delay_pct, 2),
                'avg_departure_delay_min': float(df[df['departure_delay_min'] > 0]['departure_delay_min'].mean()) if len(df[df['departure_delay_min'] > 0]) > 0 else 0,
                'avg_arrival_delay_min': float(df[df['arrival_delay_min'] > 0]['arrival_delay_min'].mean()) if len(df[df['arrival_delay_min'] > 0]) > 0 else 0,
                'max_departure_delay_min': float(df['departure_delay_min'].max()),
                'max_arrival_delay_min': float(df['arrival_delay_min'].max()),
                'worst_delayed_trips': df.nlargest(10, 'arrival_delay_min')[
                    ['plate_number', 'transporter_name', 'departure_delay_min', 'arrival_delay_min']
                ].to_dict('records'),
                'by_transporter': df.groupby('transporter_name').agg({
                    'departure_delay_min': 'mean',
                    'arrival_delay_min': 'mean'
                }).round(2).to_dict('index')
            }
        except Exception as e:
            logger.error(f"Error calculating trip delays KPI: {e}")
            return {'error': str(e)}

    def get_transporter_performance_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate Transporter-wise Performance Score"""
        query = """
        SELECT
            tr.transporter_id,
            tr.name as transporter_name,
            tr.composite_score,
            COUNT(t.trip_id) as total_trips,
            AVG(CASE WHEN t.is_on_time THEN 1 ELSE 0 END) * 100 as on_time_rate_pct,
            AVG(t.actual_distance_km / NULLIF(t.planned_distance_km, 0)) as distance_efficiency_ratio,
            AVG((t.delivery_volume_actual / NULLIF(t.delivery_volume_planned, 0)) * 100) as volume_fulfillment_pct,
            COUNT(md.id) as missed_deliveries_count,
            AVG(EXTRACT(EPOCH FROM (t.actual_arrival_time - t.actual_departure_time))/3600) as avg_trip_duration_hours
        FROM transporters tr
        LEFT JOIN trips t ON tr.transporter_id = t.transporter_id
            AND t.actual_departure_time >= %(start_date)s
            AND t.actual_departure_time <= %(end_date)s
            AND t.status = 'Completed'
        LEFT JOIN missed_deliveries md ON t.trip_id = md.trip_id
        GROUP BY tr.transporter_id, tr.name, tr.composite_score
        HAVING COUNT(t.trip_id) > 0
        ORDER BY on_time_rate_pct DESC, volume_fulfillment_pct DESC
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'transporter_performance': []}

            # Calculate performance score based on multiple factors
            df['calculated_performance_score'] = (
                (df['on_time_rate_pct'] * 0.4) +  # 40% weight for on-time performance
                (df['volume_fulfillment_pct'] * 0.3) +  # 30% weight for volume fulfillment
                ((100 - df['missed_deliveries_count'] / df['total_trips'] * 100) * 0.2) +  # 20% weight for delivery success
                (df['distance_efficiency_ratio'].apply(lambda x: 100 if x <= 1.1 else max(0, 100 - (x-1)*100)) * 0.1)  # 10% weight for distance efficiency
            ).round(2)

            return {
                'avg_performance_score': safe_float(df['calculated_performance_score'].mean()),
                'transporter_performance': df[[
                    'transporter_name', 'composite_score', 'calculated_performance_score',
                    'total_trips', 'on_time_rate_pct', 'volume_fulfillment_pct',
                    'missed_deliveries_count', 'avg_trip_duration_hours'
                ]].round(2).to_dict('records'),
                'top_performers': df.nlargest(5, 'calculated_performance_score')[
                    ['transporter_name', 'calculated_performance_score', 'on_time_rate_pct']
                ].to_dict('records'),
                'bottom_performers': df.nsmallest(5, 'calculated_performance_score')[
                    ['transporter_name', 'calculated_performance_score', 'on_time_rate_pct']
                ].to_dict('records')
            }
        except Exception as e:
            logger.error(f"Error calculating transporter performance KPI: {e}")
            return {'error': str(e)}

    def get_missed_deliveries_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate Missed Delivery metrics"""
        query = """
        SELECT
            md.reason,
            md.timestamp,
            t.trip_id,
            v.plate_number,
            tr.name as transporter_name,
            d.name as driver_name,
            COUNT(*) OVER() as total_missed_deliveries,
            COUNT(t.trip_id) OVER() as total_trips_in_period
        FROM missed_deliveries md
        JOIN trips t ON md.trip_id = t.trip_id
        JOIN vehicles v ON t.vehicle_id = v.vehicle_id
        JOIN transporters tr ON t.transporter_id = tr.transporter_id
        JOIN drivers d ON t.driver_id = d.driver_id
        WHERE md.timestamp >= %(start_date)s
        AND md.timestamp <= %(end_date)s
        ORDER BY md.timestamp DESC
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'missed_delivery_rate_pct': 0, 'missed_deliveries': []}

            total_missed = df['total_missed_deliveries'].iloc[0] if not df.empty else 0

            # Get total trips for the period
            total_trips_query = """
            SELECT COUNT(*) as total_trips
            FROM trips
            WHERE actual_departure_time >= %(start_date)s
            AND actual_departure_time <= %(end_date)s
            """

            engine = self.db.get_engine()
            total_trips_df = pd.read_sql_query(total_trips_query, engine, params={'start_date': start_date, 'end_date': end_date})
            total_trips = total_trips_df['total_trips'].iloc[0] if not total_trips_df.empty else 1

            missed_delivery_rate = (total_missed / total_trips * 100) if total_trips > 0 else 0

            return {
                'missed_delivery_rate_pct': round(missed_delivery_rate, 2),
                'total_missed_deliveries': int(total_missed),
                'total_trips': int(total_trips),
                'missed_deliveries': df[[
                    'reason', 'timestamp', 'plate_number', 'transporter_name', 'driver_name'
                ]].to_dict('records'),
                'by_reason': df['reason'].value_counts().to_dict(),
                'by_transporter': df['transporter_name'].value_counts().to_dict()
            }
        except Exception as e:
            logger.error(f"Error calculating missed deliveries KPI: {e}")
            return {'error': str(e)}

    def get_geo_deviation_events_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate Geo-deviation Events (off-route movement)"""
        query = """
        SELECT
            te.trip_id,
            te.type,
            te.event_time,
            te.latitude,
            te.longitude,
            te.severity,
            te.notes,
            v.plate_number,
            tr.name as transporter_name,
            COUNT(*) OVER() as total_geo_events
        FROM trip_events te
        JOIN trips t ON te.trip_id = t.trip_id
        JOIN vehicles v ON t.vehicle_id = v.vehicle_id
        JOIN transporters tr ON t.transporter_id = tr.transporter_id
        WHERE te.event_time >= %(start_date)s
        AND te.event_time <= %(end_date)s
        AND te.type IN ('geo_deviation', 'off_route', 'route_violation')
        ORDER BY te.event_time DESC
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'geo_deviation_events': 0, 'events': []}

            total_events = len(df)

            # Get total trips for rate calculation
            total_trips_query = """
            SELECT COUNT(*) as total_trips
            FROM trips
            WHERE actual_departure_time >= %(start_date)s
            AND actual_departure_time <= %(end_date)s
            """

            total_trips_df = pd.read_sql_query(total_trips_query, engine, params={'start_date': start_date, 'end_date': end_date})
            total_trips = total_trips_df['total_trips'].iloc[0] if not total_trips_df.empty else 1

            deviation_rate = (total_events / total_trips * 100) if total_trips > 0 else 0

            return {
                'geo_deviation_rate_pct': round(deviation_rate, 2),
                'total_geo_deviation_events': int(total_events),
                'total_trips': int(total_trips),
                'events': df[[
                    'trip_id', 'type', 'event_time', 'severity', 'plate_number', 'transporter_name'
                ]].to_dict('records'),
                'by_severity': df['severity'].value_counts().to_dict(),
                'by_transporter': df['transporter_name'].value_counts().to_dict(),
                'by_event_type': df['type'].value_counts().to_dict()
            }
        except Exception as e:
            logger.error(f"Error calculating geo-deviation events KPI: {e}")
            return {'error': str(e)}

    def get_loading_unloading_time_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate Loading/Unloading Time per Stop (Average time spent per location)"""
        query = """
        SELECT
            t.trip_id,
            t.loading_time_min,
            t.unloading_time_min,
            (t.loading_time_min + t.unloading_time_min) as total_stop_time_min,
            v.plate_number,
            v.type as vehicle_type,
            tr.name as transporter_name,
            sl.name as start_location_name,
            sl.type as start_location_type,
            el.name as end_location_name,
            el.type as end_location_type
        FROM trips t
        JOIN vehicles v ON t.vehicle_id = v.vehicle_id
        JOIN transporters tr ON t.transporter_id = tr.transporter_id
        JOIN locations sl ON t.start_location_id = sl.location_id
        JOIN locations el ON t.end_location_id = el.location_id
        WHERE t.actual_departure_time >= %(start_date)s
        AND t.actual_departure_time <= %(end_date)s
        AND t.status = 'Completed'
        AND t.loading_time_min IS NOT NULL
        AND t.unloading_time_min IS NOT NULL
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'avg_loading_time_min': 0, 'avg_unloading_time_min': 0}

            return {
                'avg_loading_time_min': float(df['loading_time_min'].mean()),
                'avg_unloading_time_min': float(df['unloading_time_min'].mean()),
                'avg_total_stop_time_min': float(df['total_stop_time_min'].mean()),
                'max_loading_time_min': float(df['loading_time_min'].max()),
                'max_unloading_time_min': float(df['unloading_time_min'].max()),
                'by_location_type': {
                    'start_locations': df.groupby('start_location_type')['loading_time_min'].mean().round(2).to_dict(),
                    'end_locations': df.groupby('end_location_type')['unloading_time_min'].mean().round(2).to_dict()
                },
                'bottleneck_locations': {
                    'loading': df.nlargest(10, 'loading_time_min')[
                        ['start_location_name', 'start_location_type', 'loading_time_min', 'plate_number']
                    ].to_dict('records'),
                    'unloading': df.nlargest(10, 'unloading_time_min')[
                        ['end_location_name', 'end_location_type', 'unloading_time_min', 'plate_number']
                    ].to_dict('records')
                },
                'by_transporter': df.groupby('transporter_name').agg({
                    'loading_time_min': 'mean',
                    'unloading_time_min': 'mean',
                    'total_stop_time_min': 'mean'
                }).round(2).to_dict('index')
            }
        except Exception as e:
            logger.error(f"Error calculating loading/unloading time KPI: {e}")
            return {'error': str(e)}

    def get_delivery_volume_variance_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate Planned vs Actual Delivery Volume (fulfillment efficiency)"""
        query = """
        SELECT
            t.trip_id,
            t.delivery_volume_planned,
            t.delivery_volume_actual,
            (t.delivery_volume_actual - t.delivery_volume_planned) as volume_variance,
            ((t.delivery_volume_actual - t.delivery_volume_planned) / NULLIF(t.delivery_volume_planned, 0) * 100) as volume_variance_pct,
            (t.delivery_volume_actual / NULLIF(t.delivery_volume_planned, 0) * 100) as fulfillment_pct,
            v.plate_number,
            v.type as vehicle_type,
            tr.name as transporter_name
        FROM trips t
        JOIN vehicles v ON t.vehicle_id = v.vehicle_id
        JOIN transporters tr ON t.transporter_id = tr.transporter_id
        WHERE t.actual_departure_time >= %(start_date)s
        AND t.actual_departure_time <= %(end_date)s
        AND t.status = 'Completed'
        AND t.delivery_volume_planned IS NOT NULL
        AND t.delivery_volume_actual IS NOT NULL
        AND t.delivery_volume_planned > 0
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'avg_fulfillment_pct': 0, 'volume_analysis': {}}

            return {
                'avg_fulfillment_pct': safe_float(df['fulfillment_pct'].mean()),
                'avg_volume_variance_pct': safe_float(df['volume_variance_pct'].mean()),
                'total_planned_volume': safe_float(df['delivery_volume_planned'].sum()),
                'total_actual_volume': safe_float(df['delivery_volume_actual'].sum()),
                'over_delivered_trips': len(df[df['volume_variance_pct'] > 0]),
                'under_delivered_trips': len(df[df['volume_variance_pct'] < 0]),
                'perfect_delivery_trips': len(df[df['volume_variance_pct'] == 0]),
                'worst_underperformers': df.nsmallest(10, 'fulfillment_pct')[
                    ['plate_number', 'transporter_name', 'delivery_volume_planned',
                     'delivery_volume_actual', 'fulfillment_pct']
                ].to_dict('records'),
                'by_transporter': df.groupby('transporter_name').agg({
                    'fulfillment_pct': 'mean',
                    'volume_variance_pct': 'mean'
                }).round(2).to_dict('index'),
                'by_vehicle_type': df.groupby('vehicle_type').agg({
                    'fulfillment_pct': 'mean',
                    'volume_variance_pct': 'mean'
                }).round(2).to_dict('index')
            }
        except Exception as e:
            logger.error(f"Error calculating delivery volume variance KPI: {e}")
            return {'error': str(e)}

    def get_maintenance_downtime_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate Maintenance Downtime (hrs/vehicle/month)"""
        query = """
        SELECT
            v.vehicle_id,
            v.plate_number,
            v.type as vehicle_type,
            v.last_maintenance_date,
            v.maintenance_downtime_hrs,
            EXTRACT(EPOCH FROM (CURRENT_DATE::timestamp - v.last_maintenance_date::timestamp))/86400 as days_since_maintenance
        FROM vehicles v
        WHERE v.maintenance_downtime_hrs IS NOT NULL
        AND v.last_maintenance_date IS NOT NULL
        ORDER BY v.maintenance_downtime_hrs DESC
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine)

            if df.empty:
                return {'avg_maintenance_downtime_hrs_per_month': 0, 'maintenance_details': []}

            # Convert numeric columns to proper types
            df['maintenance_downtime_hrs'] = pd.to_numeric(df['maintenance_downtime_hrs'], errors='coerce')
            df['days_since_maintenance'] = pd.to_numeric(df['days_since_maintenance'], errors='coerce')

            # Remove rows with NaN values
            df = df.dropna(subset=['maintenance_downtime_hrs'])

            if df.empty:
                return {'avg_maintenance_downtime_hrs_per_month': 0, 'maintenance_details': []}

            avg_maintenance_downtime = float(df['maintenance_downtime_hrs'].mean())
            max_maintenance_downtime = float(df['maintenance_downtime_hrs'].max())

            # Vehicles needing maintenance (>30 days since last maintenance)
            needs_maintenance = df[df['days_since_maintenance'] > 30]

            return {
                'avg_maintenance_downtime_hrs_per_month': round(avg_maintenance_downtime, 2),
                'max_maintenance_downtime_hrs': round(max_maintenance_downtime, 2),
                'vehicles_needing_maintenance': len(needs_maintenance),
                'maintenance_details': df[[
                    'plate_number', 'vehicle_type', 'maintenance_downtime_hrs',
                    'last_maintenance_date', 'days_since_maintenance'
                ]].round(2).to_dict('records'),
                'by_vehicle_type': df.groupby('vehicle_type')['maintenance_downtime_hrs'].mean().round(2).to_dict()
            }
        except Exception as e:
            logger.error(f"Error calculating maintenance downtime KPI: {e}")
            return {'error': str(e)}

    def export_kpis_to_json(self, kpis: Dict, filename: str = None) -> str:
        """Export KPIs to JSON file"""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"operations_kpis_{timestamp}.json"

        filepath = os.path.join(os.path.dirname(__file__), '..', filename)

        try:
            with open(filepath, 'w') as f:
                json.dump(kpis, f, indent=2, default=str)
            logger.info(f"KPIs exported to {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Error exporting KPIs to JSON: {e}")
            return None

# Example usage and testing
if __name__ == "__main__":
    extractor = OperationsKPIExtractor()

    # Test database connection
    if extractor.db.test_connection():
        print("✅ Database connection successful")

        # Extract all KPIs for the last 30 days
        kpis = extractor.extract_all_kpis()

        # Export to JSON
        export_path = extractor.export_kpis_to_json(kpis)

        print(f"📊 Operations KPIs extracted successfully")
        print(f"📁 Exported to: {export_path}")

        # Print summary
        print("\n📈 KPI Summary:")
        print(f"- Turnaround Time: {kpis.get('turnaround_time', {}).get('overall_avg_tat_hours', 0):.2f} hours")
        print(f"- Vehicle Utilization: {kpis.get('vehicle_utilization', {}).get('avg_utilization_pct', 0):.2f}%")
        print(f"- On-time Arrival Rate: {kpis.get('on_time_arrival', {}).get('on_time_rate_pct', 0):.2f}%")
        print(f"- Missed Delivery Rate: {kpis.get('missed_deliveries', {}).get('missed_delivery_rate_pct', 0):.2f}%")

    else:
        print("❌ Database connection failed")

    def get_maintenance_downtime_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate Maintenance Downtime (hrs/vehicle/month)"""
        query = """
        SELECT
            v.vehicle_id,
            v.plate_number,
            v.type as vehicle_type,
            v.last_maintenance_date,
            v.maintenance_downtime_hrs,
            EXTRACT(EPOCH FROM (CURRENT_DATE - v.last_maintenance_date))/86400 as days_since_maintenance
        FROM vehicles v
        WHERE v.maintenance_downtime_hrs IS NOT NULL
        AND v.last_maintenance_date IS NOT NULL
        ORDER BY v.maintenance_downtime_hrs DESC
        """

        # Also get trip-based availability analysis
        availability_query = """
        WITH vehicle_activity AS (
            SELECT
                v.vehicle_id,
                v.plate_number,
                v.type as vehicle_type,
                DATE(t.actual_departure_time) as activity_date,
                COUNT(t.trip_id) as daily_trips,
                SUM(EXTRACT(EPOCH FROM (t.actual_arrival_time - t.actual_departure_time))/3600) as daily_active_hours
            FROM vehicles v
            LEFT JOIN trips t ON v.vehicle_id = t.vehicle_id
                AND t.actual_departure_time >= %s
                AND t.actual_departure_time <= %s
                AND t.status = 'Completed'
            GROUP BY v.vehicle_id, v.plate_number, v.type, DATE(t.actual_departure_time)
        ),
        vehicle_availability AS (
            SELECT
                vehicle_id,
                plate_number,
                vehicle_type,
                COUNT(CASE WHEN daily_trips > 0 THEN 1 END) as active_days,
                COUNT(*) as total_days_in_period,
                (COUNT(CASE WHEN daily_trips > 0 THEN 1 END)::float / COUNT(*) * 100) as availability_pct
            FROM vehicle_activity
            GROUP BY vehicle_id, plate_number, vehicle_type
        )
        SELECT * FROM vehicle_availability
        ORDER BY availability_pct ASC
        """

        try:
            with self.db.get_connection() as conn:
                maintenance_df = pd.read_sql_query(query, conn)
                availability_df = pd.read_sql_query(availability_query, conn, params=[start_date, end_date])

            # Calculate monthly maintenance downtime
            if not maintenance_df.empty:
                avg_maintenance_downtime = float(maintenance_df['maintenance_downtime_hrs'].mean())
                max_maintenance_downtime = float(maintenance_df['maintenance_downtime_hrs'].max())

                # Vehicles needing maintenance (>30 days since last maintenance)
                needs_maintenance = maintenance_df[maintenance_df['days_since_maintenance'] > 30]
            else:
                avg_maintenance_downtime = 0
                max_maintenance_downtime = 0
                needs_maintenance = pd.DataFrame()

            return {
                'avg_maintenance_downtime_hrs_per_month': round(avg_maintenance_downtime, 2),
                'max_maintenance_downtime_hrs': round(max_maintenance_downtime, 2),
                'vehicles_needing_maintenance': len(needs_maintenance),
                'maintenance_details': maintenance_df[[
                    'plate_number', 'vehicle_type', 'maintenance_downtime_hrs',
                    'last_maintenance_date', 'days_since_maintenance'
                ]].round(2).to_dict('records') if not maintenance_df.empty else [],
                'availability_analysis': availability_df.round(2).to_dict('records') if not availability_df.empty else [],
                'low_availability_vehicles': availability_df[availability_df['availability_pct'] < 50].to_dict('records') if not availability_df.empty else [],
                'by_vehicle_type': maintenance_df.groupby('vehicle_type')['maintenance_downtime_hrs'].mean().round(2).to_dict() if not maintenance_df.empty else {}
            }
        except Exception as e:
            logger.error(f"Error calculating maintenance downtime KPI: {e}")
            return {'error': str(e)}

    def export_kpis_to_json(self, kpis: Dict, filename: str = None) -> str:
        """Export KPIs to JSON file"""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"operations_kpis_{timestamp}.json"

        filepath = os.path.join(os.path.dirname(__file__), '..', filename)

        try:
            with open(filepath, 'w') as f:
                json.dump(kpis, f, indent=2, default=str)
            logger.info(f"KPIs exported to {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Error exporting KPIs to JSON: {e}")
            return None

# Example usage and testing
if __name__ == "__main__":
    extractor = OperationsKPIExtractor()

    # Test database connection
    if extractor.db.test_connection():
        print("✅ Database connection successful")

        # Extract all KPIs for the last year (default)
        kpis = extractor.extract_all_kpis()

        # Export to JSON
        export_path = extractor.export_kpis_to_json(kpis)

        print(f"📊 Operations KPIs extracted successfully")
        print(f"📁 Exported to: {export_path}")

        # Print summary
        print("\n📈 KPI Summary:")
        print(f"- Turnaround Time: {kpis.get('turnaround_time', {}).get('overall_avg_tat_hours', 0):.2f} hours")
        print(f"- Vehicle Utilization: {kpis.get('vehicle_utilization', {}).get('avg_utilization_pct', 0):.2f}%")
        print(f"- On-time Arrival Rate: {kpis.get('on_time_arrival', {}).get('on_time_rate_pct', 0):.2f}%")
        print(f"- Missed Delivery Rate: {kpis.get('missed_deliveries', {}).get('missed_delivery_rate_pct', 0):.2f}%")

    else:
        print("❌ Database connection failed")
