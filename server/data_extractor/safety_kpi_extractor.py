"""
Safety KPI Extractor
Focus: Driver behavior, compliance, and risk evaluation

This module extracts comprehensive safety KPIs including:
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

class SafetyKPIExtractor:
    """Extract comprehensive safety KPIs for driver behavior and risk evaluation"""
    
    def __init__(self):
        self.db = db
        
    def extract_all_kpis(self, start_date: str = None, end_date: str = None) -> Dict:
        """
        Extract all safety KPIs for the specified date range
        
        Args:
            start_date: Start date in YYYY-MM-DD format (default: 1 year ago)
            end_date: End date in YYYY-MM-DD format (default: today)
            
        Returns:
            Dictionary containing all safety KPI metrics
        """
        if not start_date:
            start_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
            
        logger.info(f"Extracting Safety KPIs from {start_date} to {end_date}")
        
        kpis = {
            'extraction_timestamp': datetime.now().isoformat(),
            'date_range': {'start': start_date, 'end': end_date},
            'driving_safety_score': self.get_driving_safety_score_kpi(start_date, end_date),
            'phone_usage_rate': self.get_phone_usage_rate_kpi(start_date, end_date),
            'overspeeding_events': self.get_overspeeding_events_kpi(start_date, end_date),
            'harsh_driving_events': self.get_harsh_driving_events_kpi(start_date, end_date),
            'rest_time_compliance': self.get_rest_time_compliance_kpi(start_date, end_date),
            'high_risk_trips': self.get_high_risk_trips_kpi(start_date, end_date),
            'incident_heatmaps': self.get_incident_heatmaps_kpi(start_date, end_date),
            'repeat_offenders': self.get_repeat_offenders_kpi(start_date, end_date),
            'checklist_compliance': self.get_checklist_compliance_kpi(start_date, end_date),
            'accident_near_miss_flags': self.get_accident_near_miss_flags_kpi(start_date, end_date),
            'fatigue_scoring': self.get_fatigue_scoring_kpi(start_date, end_date)
        }

        # Clean data to ensure JSON serialization compatibility
        kpis = clean_data_for_json(kpis)

        logger.info("Safety KPI extraction completed successfully")
        return kpis
    
    def get_driving_safety_score_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate overall driving safety score for all drivers"""
        query = """
        SELECT
            d.driver_id,
            d.name as driver_name,
            d.safety_score,
            COUNT(t.trip_id) as total_trips,
            AVG(d.safety_score) OVER() as avg_safety_score,
            RANK() OVER(ORDER BY d.safety_score DESC) as safety_rank
        FROM drivers d
        LEFT JOIN trips t ON d.driver_id = t.driver_id
            AND t.actual_departure_time >= %(start_date)s
            AND t.actual_departure_time <= %(end_date)s
            AND t.status = 'Completed'
        WHERE d.safety_score IS NOT NULL
        GROUP BY d.driver_id, d.name, d.safety_score
        HAVING COUNT(t.trip_id) > 0
        ORDER BY d.safety_score DESC
        """
        
        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {
                    'overall_avg_safety_score': 0,
                    'driver_safety_scores': [],
                    'safety_distribution': {}
                }

            # Convert numeric columns to proper types
            df['safety_score'] = pd.to_numeric(df['safety_score'], errors='coerce')
            df = df.dropna(subset=['safety_score'])

            if df.empty:
                return {
                    'overall_avg_safety_score': 0,
                    'driver_safety_scores': [],
                    'safety_distribution': {}
                }

            # Safety score distribution
            score_ranges = {
                'excellent': len(df[df['safety_score'] >= 90]),
                'good': len(df[(df['safety_score'] >= 75) & (df['safety_score'] < 90)]),
                'average': len(df[(df['safety_score'] >= 60) & (df['safety_score'] < 75)]),
                'poor': len(df[df['safety_score'] < 60])
            }

            return {
                'overall_avg_safety_score': safe_float(df['safety_score'].mean()),
                'highest_safety_score': safe_float(df['safety_score'].max()),
                'lowest_safety_score': safe_float(df['safety_score'].min()),
                'total_drivers': len(df),
                'driver_safety_scores': df[['driver_name', 'safety_score', 'total_trips', 'safety_rank']].to_dict('records'),
                'safety_distribution': score_ranges,
                'top_performers': df.head(10)[['driver_name', 'safety_score', 'total_trips']].to_dict('records'),
                'bottom_performers': df.tail(10)[['driver_name', 'safety_score', 'total_trips']].to_dict('records')
            }
        except Exception as e:
            logger.error(f"Error calculating driving safety score KPI: {e}")
            return {'error': str(e)}
    
    def get_phone_usage_rate_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate phone usage during trip incidence rate"""
        query = """
        SELECT
            te.trip_id,
            t.driver_id,
            d.name as driver_name,
            COUNT(CASE WHEN te.type = 'phone_usage' THEN 1 END) as phone_usage_events,
            COUNT(*) as total_events,
            EXTRACT(EPOCH FROM (t.actual_arrival_time - t.actual_departure_time))/3600 as trip_duration_hours,
            t.actual_distance_km
        FROM trip_events te
        JOIN trips t ON te.trip_id = t.trip_id
        JOIN drivers d ON t.driver_id = d.driver_id
        WHERE te.event_time >= %(start_date)s
        AND te.event_time <= %(end_date)s
        AND t.status = 'Completed'
        AND t.actual_departure_time IS NOT NULL
        AND t.actual_arrival_time IS NOT NULL
        GROUP BY te.trip_id, t.driver_id, d.name, t.actual_arrival_time, t.actual_departure_time, t.actual_distance_km
        """
        
        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'phone_usage_incidence_rate': 0, 'analysis': {}}

            # Calculate phone usage rate per trip
            df['phone_usage_rate_per_trip'] = df['phone_usage_events'] / df['trip_duration_hours']
            
            # Calculate overall metrics
            total_trips = len(df)
            trips_with_phone_usage = len(df[df['phone_usage_events'] > 0])
            phone_usage_incidence_rate = (trips_with_phone_usage / total_trips * 100) if total_trips > 0 else 0

            # Driver-level analysis
            driver_analysis = df.groupby(['driver_id', 'driver_name']).agg({
                'phone_usage_events': 'sum',
                'trip_duration_hours': 'sum',
                'trip_id': 'count'
            }).reset_index()
            
            driver_analysis['phone_usage_rate_per_hour'] = driver_analysis['phone_usage_events'] / driver_analysis['trip_duration_hours']
            driver_analysis.columns = ['driver_id', 'driver_name', 'total_phone_events', 'total_hours', 'total_trips', 'usage_rate_per_hour']

            return {
                'phone_usage_incidence_rate': round(phone_usage_incidence_rate, 2),
                'total_trips_analyzed': total_trips,
                'trips_with_phone_usage': trips_with_phone_usage,
                'avg_phone_events_per_trip': safe_float(df['phone_usage_events'].mean()),
                'driver_analysis': driver_analysis.round(2).to_dict('records'),
                'worst_offenders': driver_analysis.nlargest(10, 'usage_rate_per_hour')[
                    ['driver_name', 'total_phone_events', 'total_trips', 'usage_rate_per_hour']
                ].to_dict('records')
            }
        except Exception as e:
            logger.error(f"Error calculating phone usage rate KPI: {e}")
            return {'error': str(e)}

    def get_overspeeding_events_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate overspeeding events per 100 km"""
        query = """
        SELECT
            te.trip_id,
            t.driver_id,
            d.name as driver_name,
            t.actual_distance_km,
            COUNT(CASE WHEN te.type = 'overspeeding' THEN 1 END) as overspeeding_events,
            AVG(CASE WHEN te.type = 'overspeeding' THEN te.speed_kmph END) as avg_overspeed_kmph,
            MAX(CASE WHEN te.type = 'overspeeding' THEN te.speed_kmph END) as max_overspeed_kmph
        FROM trip_events te
        JOIN trips t ON te.trip_id = t.trip_id
        JOIN drivers d ON t.driver_id = d.driver_id
        WHERE te.event_time >= %(start_date)s
        AND te.event_time <= %(end_date)s
        AND t.status = 'Completed'
        AND t.actual_distance_km IS NOT NULL
        AND t.actual_distance_km > 0
        GROUP BY te.trip_id, t.driver_id, d.name, t.actual_distance_km
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'overspeeding_events_per_100km': 0, 'analysis': {}}

            # Calculate overspeeding events per 100km
            df['overspeeding_per_100km'] = (df['overspeeding_events'] / df['actual_distance_km']) * 100

            # Overall metrics
            total_distance = df['actual_distance_km'].sum()
            total_overspeeding_events = df['overspeeding_events'].sum()
            overspeeding_per_100km = (total_overspeeding_events / total_distance * 100) if total_distance > 0 else 0

            # Driver-level analysis
            driver_analysis = df.groupby(['driver_id', 'driver_name']).agg({
                'overspeeding_events': 'sum',
                'actual_distance_km': 'sum',
                'avg_overspeed_kmph': 'mean',
                'max_overspeed_kmph': 'max',
                'trip_id': 'count'
            }).reset_index()

            driver_analysis['overspeeding_per_100km'] = (driver_analysis['overspeeding_events'] / driver_analysis['actual_distance_km']) * 100
            driver_analysis.columns = ['driver_id', 'driver_name', 'total_overspeeding_events', 'total_distance_km',
                                     'avg_overspeed_kmph', 'max_overspeed_kmph', 'total_trips', 'overspeeding_per_100km']

            return {
                'overspeeding_events_per_100km': round(overspeeding_per_100km, 2),
                'total_overspeeding_events': safe_int(total_overspeeding_events),
                'total_distance_analyzed_km': safe_float(total_distance),
                'avg_overspeed_kmph': safe_float(df['avg_overspeed_kmph'].mean()),
                'max_overspeed_recorded_kmph': safe_float(df['max_overspeed_kmph'].max()),
                'driver_analysis': driver_analysis.round(2).to_dict('records'),
                'worst_offenders': driver_analysis.nlargest(10, 'overspeeding_per_100km')[
                    ['driver_name', 'total_overspeeding_events', 'total_distance_km', 'overspeeding_per_100km']
                ].to_dict('records')
            }
        except Exception as e:
            logger.error(f"Error calculating overspeeding events KPI: {e}")
            return {'error': str(e)}

    def get_harsh_driving_events_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate harsh braking/acceleration/cornering events per trip"""
        query = """
        SELECT
            te.trip_id,
            t.driver_id,
            d.name as driver_name,
            COUNT(CASE WHEN te.type = 'harsh_braking' THEN 1 END) as harsh_braking_events,
            COUNT(CASE WHEN te.type = 'harsh_acceleration' THEN 1 END) as harsh_acceleration_events,
            COUNT(CASE WHEN te.type = 'harsh_cornering' THEN 1 END) as harsh_cornering_events,
            COUNT(CASE WHEN te.type IN ('harsh_braking', 'harsh_acceleration', 'harsh_cornering') THEN 1 END) as total_harsh_events,
            te.severity
        FROM trip_events te
        JOIN trips t ON te.trip_id = t.trip_id
        JOIN drivers d ON t.driver_id = d.driver_id
        WHERE te.event_time >= %(start_date)s
        AND te.event_time <= %(end_date)s
        AND t.status = 'Completed'
        AND te.type IN ('harsh_braking', 'harsh_acceleration', 'harsh_cornering')
        GROUP BY te.trip_id, t.driver_id, d.name, te.severity
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'harsh_events_per_trip': 0, 'analysis': {}}

            # Calculate events per trip
            trip_analysis = df.groupby('trip_id').agg({
                'harsh_braking_events': 'sum',
                'harsh_acceleration_events': 'sum',
                'harsh_cornering_events': 'sum',
                'total_harsh_events': 'sum'
            }).reset_index()

            # Driver-level analysis
            driver_analysis = df.groupby(['driver_id', 'driver_name']).agg({
                'harsh_braking_events': 'sum',
                'harsh_acceleration_events': 'sum',
                'harsh_cornering_events': 'sum',
                'total_harsh_events': 'sum',
                'trip_id': 'nunique'
            }).reset_index()

            driver_analysis['harsh_events_per_trip'] = driver_analysis['total_harsh_events'] / driver_analysis['trip_id']
            driver_analysis.columns = ['driver_id', 'driver_name', 'total_harsh_braking', 'total_harsh_acceleration',
                                     'total_harsh_cornering', 'total_harsh_events', 'total_trips', 'harsh_events_per_trip']

            # Severity analysis
            severity_analysis = df.groupby('severity')['total_harsh_events'].sum().to_dict()

            return {
                'avg_harsh_events_per_trip': safe_float(trip_analysis['total_harsh_events'].mean()),
                'total_harsh_events': safe_int(df['total_harsh_events'].sum()),
                'total_trips_analyzed': len(trip_analysis),
                'event_breakdown': {
                    'harsh_braking': safe_int(df['harsh_braking_events'].sum()),
                    'harsh_acceleration': safe_int(df['harsh_acceleration_events'].sum()),
                    'harsh_cornering': safe_int(df['harsh_cornering_events'].sum())
                },
                'severity_distribution': severity_analysis,
                'driver_analysis': driver_analysis.round(2).to_dict('records'),
                'worst_offenders': driver_analysis.nlargest(10, 'harsh_events_per_trip')[
                    ['driver_name', 'total_harsh_events', 'total_trips', 'harsh_events_per_trip']
                ].to_dict('records')
            }
        except Exception as e:
            logger.error(f"Error calculating harsh driving events KPI: {e}")
            return {'error': str(e)}

    def get_rest_time_compliance_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate non-compliance with rest time (fatigue risk)"""
        query = """
        WITH trip_intervals AS (
            SELECT
                t1.driver_id,
                d.name as driver_name,
                t1.trip_id as current_trip,
                t1.actual_arrival_time as current_arrival,
                t2.actual_departure_time as next_departure,
                EXTRACT(EPOCH FROM (t2.actual_departure_time - t1.actual_arrival_time))/3600 as rest_hours,
                CASE
                    WHEN EXTRACT(EPOCH FROM (t2.actual_departure_time - t1.actual_arrival_time))/3600 < 8 THEN 'Non-Compliant'
                    ELSE 'Compliant'
                END as compliance_status
            FROM trips t1
            JOIN trips t2 ON t1.driver_id = t2.driver_id
                AND t2.actual_departure_time > t1.actual_arrival_time
            JOIN drivers d ON t1.driver_id = d.driver_id
            WHERE t1.actual_arrival_time >= %(start_date)s
            AND t1.actual_arrival_time <= %(end_date)s
            AND t1.status = 'Completed'
            AND t2.status = 'Completed'
            AND t1.actual_arrival_time IS NOT NULL
            AND t2.actual_departure_time IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM trips t3
                WHERE t3.driver_id = t1.driver_id
                AND t3.actual_departure_time > t1.actual_arrival_time
                AND t3.actual_departure_time < t2.actual_departure_time
            )
        )
        SELECT
            driver_id,
            driver_name,
            COUNT(*) as total_intervals,
            COUNT(CASE WHEN compliance_status = 'Non-Compliant' THEN 1 END) as non_compliant_intervals,
            COUNT(CASE WHEN compliance_status = 'Compliant' THEN 1 END) as compliant_intervals,
            AVG(rest_hours) as avg_rest_hours,
            MIN(rest_hours) as min_rest_hours
        FROM trip_intervals
        GROUP BY driver_id, driver_name
        ORDER BY non_compliant_intervals DESC
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'rest_time_compliance_rate': 100, 'analysis': {}}

            # Calculate overall compliance rate
            total_intervals = df['total_intervals'].sum()
            compliant_intervals = df['compliant_intervals'].sum()
            compliance_rate = (compliant_intervals / total_intervals * 100) if total_intervals > 0 else 100

            # Driver-level compliance
            df['compliance_rate'] = (df['compliant_intervals'] / df['total_intervals'] * 100)
            df['non_compliance_rate'] = (df['non_compliant_intervals'] / df['total_intervals'] * 100)

            return {
                'rest_time_compliance_rate': round(compliance_rate, 2),
                'total_rest_intervals_analyzed': safe_int(total_intervals),
                'compliant_intervals': safe_int(compliant_intervals),
                'non_compliant_intervals': safe_int(df['non_compliant_intervals'].sum()),
                'avg_rest_hours': safe_float(df['avg_rest_hours'].mean()),
                'min_rest_hours_recorded': safe_float(df['min_rest_hours'].min()),
                'driver_analysis': df[['driver_name', 'total_intervals', 'compliant_intervals',
                                     'non_compliant_intervals', 'compliance_rate', 'avg_rest_hours']].round(2).to_dict('records'),
                'worst_compliance': df.nsmallest(10, 'compliance_rate')[
                    ['driver_name', 'total_intervals', 'non_compliant_intervals', 'compliance_rate']
                ].to_dict('records'),
                'fatigue_risk_drivers': df[df['compliance_rate'] < 70][
                    ['driver_name', 'compliance_rate', 'min_rest_hours']
                ].to_dict('records')
            }
        except Exception as e:
            logger.error(f"Error calculating rest time compliance KPI: {e}")
            return {'error': str(e)}

    def get_high_risk_trips_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate high-risk trips based on composite score thresholds"""
        query = """
        WITH trip_risk_scores AS (
            SELECT
                t.trip_id,
                t.driver_id,
                d.name as driver_name,
                d.safety_score,
                d.fatigue_score,
                tr.composite_score as transporter_score,
                COUNT(te.event_id) as total_events,
                COUNT(CASE WHEN te.type IN ('harsh_braking', 'harsh_acceleration', 'harsh_cornering') THEN 1 END) as harsh_events,
                COUNT(CASE WHEN te.type = 'overspeeding' THEN 1 END) as overspeeding_events,
                COUNT(CASE WHEN te.type = 'phone_usage' THEN 1 END) as phone_events,
                -- Calculate composite risk score (lower is riskier)
                (
                    COALESCE(d.safety_score, 50) * 0.4 +
                    COALESCE(d.fatigue_score, 50) * 0.3 +
                    COALESCE(tr.composite_score, 50) * 0.2 +
                    GREATEST(0, 100 - COUNT(te.event_id) * 5) * 0.1
                ) as trip_risk_score
            FROM trips t
            JOIN drivers d ON t.driver_id = d.driver_id
            JOIN transporters tr ON t.transporter_id = tr.transporter_id
            LEFT JOIN trip_events te ON t.trip_id = te.trip_id
            WHERE t.actual_departure_time >= %(start_date)s
            AND t.actual_departure_time <= %(end_date)s
            AND t.status = 'Completed'
            GROUP BY t.trip_id, t.driver_id, d.name, d.safety_score, d.fatigue_score, tr.composite_score
        )
        SELECT
            trip_id,
            driver_id,
            driver_name,
            safety_score,
            fatigue_score,
            transporter_score,
            total_events,
            harsh_events,
            overspeeding_events,
            phone_events,
            trip_risk_score,
            CASE
                WHEN trip_risk_score < 40 THEN 'Very High Risk'
                WHEN trip_risk_score < 60 THEN 'High Risk'
                WHEN trip_risk_score < 75 THEN 'Medium Risk'
                ELSE 'Low Risk'
            END as risk_category
        FROM trip_risk_scores
        ORDER BY trip_risk_score ASC
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'high_risk_trip_percentage': 0, 'analysis': {}}

            # Risk distribution
            risk_distribution = df['risk_category'].value_counts().to_dict()
            total_trips = len(df)
            high_risk_trips = len(df[df['risk_category'].isin(['High Risk', 'Very High Risk'])])
            high_risk_percentage = (high_risk_trips / total_trips * 100) if total_trips > 0 else 0

            # Driver risk analysis
            driver_risk = df.groupby(['driver_id', 'driver_name']).agg({
                'trip_risk_score': 'mean',
                'trip_id': 'count',
                'total_events': 'sum'
            }).reset_index()
            driver_risk.columns = ['driver_id', 'driver_name', 'avg_risk_score', 'total_trips', 'total_events']

            # High-risk drivers (avg score < 60)
            high_risk_drivers = driver_risk[driver_risk['avg_risk_score'] < 60]

            return {
                'high_risk_trip_percentage': round(high_risk_percentage, 2),
                'total_trips_analyzed': total_trips,
                'high_risk_trips': high_risk_trips,
                'avg_trip_risk_score': safe_float(df['trip_risk_score'].mean()),
                'risk_distribution': risk_distribution,
                'highest_risk_trips': df.nsmallest(20, 'trip_risk_score')[
                    ['driver_name', 'trip_risk_score', 'risk_category', 'total_events']
                ].to_dict('records'),
                'driver_risk_analysis': driver_risk.round(2).to_dict('records'),
                'high_risk_drivers': high_risk_drivers[
                    ['driver_name', 'avg_risk_score', 'total_trips']
                ].to_dict('records')
            }
        except Exception as e:
            logger.error(f"Error calculating high-risk trips KPI: {e}")
            return {'error': str(e)}

    def get_incident_heatmaps_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate incident heatmaps (location-based trends)"""
        query = """
        SELECT
            ir.latitude,
            ir.longitude,
            ir.type as incident_type,
            ir.severity,
            COUNT(*) as incident_count,
            AVG(ir.latitude) as avg_lat,
            AVG(ir.longitude) as avg_lng,
            STRING_AGG(DISTINCT d.name, ', ') as involved_drivers
        FROM incident_reports ir
        JOIN drivers d ON ir.driver_id = d.driver_id
        WHERE ir.timestamp >= %(start_date)s
        AND ir.timestamp <= %(end_date)s
        AND ir.latitude IS NOT NULL
        AND ir.longitude IS NOT NULL
        GROUP BY ir.latitude, ir.longitude, ir.type, ir.severity
        ORDER BY incident_count DESC
        """

        # Also get trip events for additional location data
        events_query = """
        SELECT
            te.latitude,
            te.longitude,
            te.type as event_type,
            te.severity,
            COUNT(*) as event_count
        FROM trip_events te
        JOIN trips t ON te.trip_id = t.trip_id
        WHERE te.event_time >= %(start_date)s
        AND te.event_time <= %(end_date)s
        AND te.latitude IS NOT NULL
        AND te.longitude IS NOT NULL
        AND te.type IN ('harsh_braking', 'harsh_acceleration', 'harsh_cornering', 'overspeeding')
        GROUP BY te.latitude, te.longitude, te.type, te.severity
        ORDER BY event_count DESC
        """

        try:
            engine = self.db.get_engine()
            incidents_df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})
            events_df = pd.read_sql_query(events_query, engine, params={'start_date': start_date, 'end_date': end_date})

            # Incident hotspots
            incident_hotspots = []
            if not incidents_df.empty:
                incident_hotspots = incidents_df.head(20).to_dict('records')

            # Event hotspots
            event_hotspots = []
            if not events_df.empty:
                event_hotspots = events_df.head(20).to_dict('records')

            # Geographic clustering (simplified - group by rounded coordinates)
            geographic_clusters = {}
            if not incidents_df.empty:
                incidents_df['lat_rounded'] = incidents_df['latitude'].round(2)
                incidents_df['lng_rounded'] = incidents_df['longitude'].round(2)

                clusters = incidents_df.groupby(['lat_rounded', 'lng_rounded']).agg({
                    'incident_count': 'sum',
                    'incident_type': lambda x: list(x),
                    'severity': lambda x: list(x)
                }).reset_index()

                geographic_clusters = clusters.to_dict('records')

            return {
                'total_incidents_with_location': safe_int(incidents_df['incident_count'].sum()) if not incidents_df.empty else 0,
                'total_events_with_location': safe_int(events_df['event_count'].sum()) if not events_df.empty else 0,
                'incident_hotspots': incident_hotspots,
                'event_hotspots': event_hotspots,
                'geographic_clusters': geographic_clusters,
                'incident_type_distribution': incidents_df['incident_type'].value_counts().to_dict() if not incidents_df.empty else {},
                'severity_distribution': incidents_df['severity'].value_counts().to_dict() if not incidents_df.empty else {}
            }
        except Exception as e:
            logger.error(f"Error calculating incident heatmaps KPI: {e}")
            return {'error': str(e)}

    def get_repeat_offenders_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate repeat offenders (driver-level behavior history)"""
        query = """
        WITH driver_violations AS (
            SELECT
                d.driver_id,
                d.name as driver_name,
                COUNT(CASE WHEN te.type = 'overspeeding' THEN 1 END) as overspeeding_violations,
                COUNT(CASE WHEN te.type = 'phone_usage' THEN 1 END) as phone_violations,
                COUNT(CASE WHEN te.type IN ('harsh_braking', 'harsh_acceleration', 'harsh_cornering') THEN 1 END) as harsh_driving_violations,
                COUNT(ir.incident_id) as incident_reports,
                COUNT(DISTINCT t.trip_id) as total_trips,
                COUNT(te.event_id) as total_violations
            FROM drivers d
            LEFT JOIN trips t ON d.driver_id = t.driver_id
                AND t.actual_departure_time >= %(start_date)s
                AND t.actual_departure_time <= %(end_date)s
                AND t.status = 'Completed'
            LEFT JOIN trip_events te ON t.trip_id = te.trip_id
                AND te.type IN ('overspeeding', 'phone_usage', 'harsh_braking', 'harsh_acceleration', 'harsh_cornering')
            LEFT JOIN incident_reports ir ON d.driver_id = ir.driver_id
                AND ir.timestamp >= %(start_date)s
                AND ir.timestamp <= %(end_date)s
            GROUP BY d.driver_id, d.name
            HAVING COUNT(DISTINCT t.trip_id) > 0
        )
        SELECT
            driver_id,
            driver_name,
            overspeeding_violations,
            phone_violations,
            harsh_driving_violations,
            incident_reports,
            total_trips,
            total_violations,
            (total_violations::float / total_trips) as violations_per_trip,
            CASE
                WHEN total_violations >= 20 AND (total_violations::float / total_trips) >= 2 THEN 'High Risk Repeat Offender'
                WHEN total_violations >= 10 AND (total_violations::float / total_trips) >= 1 THEN 'Moderate Risk Repeat Offender'
                WHEN total_violations >= 5 THEN 'Low Risk Repeat Offender'
                ELSE 'Compliant Driver'
            END as offender_category
        FROM driver_violations
        ORDER BY (total_violations::float / total_trips) DESC, total_violations DESC
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'repeat_offenders_count': 0, 'analysis': {}}

            # Offender distribution
            offender_distribution = df['offender_category'].value_counts().to_dict()

            # Repeat offenders (excluding compliant drivers)
            repeat_offenders = df[df['offender_category'] != 'Compliant Driver']

            # Top violation types
            violation_totals = {
                'overspeeding': safe_int(df['overspeeding_violations'].sum()),
                'phone_usage': safe_int(df['phone_violations'].sum()),
                'harsh_driving': safe_int(df['harsh_driving_violations'].sum()),
                'incidents': safe_int(df['incident_reports'].sum())
            }

            return {
                'repeat_offenders_count': len(repeat_offenders),
                'total_drivers_analyzed': len(df),
                'repeat_offender_percentage': round((len(repeat_offenders) / len(df) * 100), 2) if len(df) > 0 else 0,
                'offender_distribution': offender_distribution,
                'violation_totals': violation_totals,
                'avg_violations_per_trip': safe_float(df['violations_per_trip'].mean()),
                'repeat_offenders_list': repeat_offenders[
                    ['driver_name', 'total_violations', 'total_trips', 'violations_per_trip', 'offender_category']
                ].round(2).to_dict('records'),
                'worst_offenders': df.head(15)[
                    ['driver_name', 'overspeeding_violations', 'phone_violations', 'harsh_driving_violations',
                     'incident_reports', 'violations_per_trip']
                ].round(2).to_dict('records'),
                'compliant_drivers': len(df[df['offender_category'] == 'Compliant Driver'])
            }
        except Exception as e:
            logger.error(f"Error calculating repeat offenders KPI: {e}")
            return {'error': str(e)}

    def get_checklist_compliance_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate checklist compliance rate (e.g., daily inspection, onboarding)"""
        query = """
        SELECT
            c.driver_id,
            d.name as driver_name,
            COUNT(*) as total_checklists,
            COUNT(CASE WHEN c.submitted = true THEN 1 END) as submitted_checklists,
            COUNT(CASE WHEN c.compliant = true THEN 1 END) as compliant_checklists,
            COUNT(CASE WHEN c.submitted = true AND c.compliant = true THEN 1 END) as fully_compliant,
            AVG(CASE WHEN c.submitted THEN 1 ELSE 0 END) * 100 as submission_rate,
            AVG(CASE WHEN c.compliant THEN 1 ELSE 0 END) * 100 as compliance_rate,
            COUNT(DISTINCT t.trip_id) as total_trips
        FROM checklists c
        JOIN drivers d ON c.driver_id = d.driver_id
        LEFT JOIN trips t ON c.trip_id = t.trip_id
            AND t.actual_departure_time >= %(start_date)s
            AND t.actual_departure_time <= %(end_date)s
        WHERE c.submission_time >= %(start_date)s
        AND c.submission_time <= %(end_date)s
        GROUP BY c.driver_id, d.name
        ORDER BY compliance_rate DESC
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'overall_compliance_rate': 0, 'analysis': {}}

            # Overall metrics
            total_checklists = df['total_checklists'].sum()
            total_compliant = df['compliant_checklists'].sum()
            total_submitted = df['submitted_checklists'].sum()

            overall_compliance_rate = (total_compliant / total_checklists * 100) if total_checklists > 0 else 0
            overall_submission_rate = (total_submitted / total_checklists * 100) if total_checklists > 0 else 0

            # Driver performance categories
            df['performance_category'] = df['compliance_rate'].apply(
                lambda x: 'Excellent' if x >= 95 else
                         'Good' if x >= 85 else
                         'Average' if x >= 70 else
                         'Poor'
            )

            performance_distribution = df['performance_category'].value_counts().to_dict()

            return {
                'overall_compliance_rate': round(overall_compliance_rate, 2),
                'overall_submission_rate': round(overall_submission_rate, 2),
                'total_checklists': safe_int(total_checklists),
                'total_drivers': len(df),
                'performance_distribution': performance_distribution,
                'driver_compliance': df[['driver_name', 'total_checklists', 'submitted_checklists',
                                       'compliant_checklists', 'submission_rate', 'compliance_rate',
                                       'performance_category']].round(2).to_dict('records'),
                'top_performers': df.nlargest(10, 'compliance_rate')[
                    ['driver_name', 'compliance_rate', 'total_checklists']
                ].to_dict('records'),
                'poor_performers': df[df['compliance_rate'] < 70][
                    ['driver_name', 'compliance_rate', 'submission_rate', 'total_checklists']
                ].to_dict('records')
            }
        except Exception as e:
            logger.error(f"Error calculating checklist compliance KPI: {e}")
            return {'error': str(e)}

    def get_accident_near_miss_flags_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate accident/near-miss flags (manual reporting or system detection)"""
        query = """
        SELECT
            ir.incident_id,
            ir.driver_id,
            d.name as driver_name,
            ir.type as incident_type,
            ir.severity,
            ir.timestamp,
            ir.latitude,
            ir.longitude,
            ir.description,
            t.trip_id,
            v.plate_number,
            tr.name as transporter_name
        FROM incident_reports ir
        JOIN drivers d ON ir.driver_id = d.driver_id
        LEFT JOIN trips t ON ir.trip_id = t.trip_id
        LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
        LEFT JOIN transporters tr ON t.transporter_id = tr.transporter_id
        WHERE ir.timestamp >= %(start_date)s
        AND ir.timestamp <= %(end_date)s
        ORDER BY ir.timestamp DESC
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'total_incidents': 0, 'analysis': {}}

            # Incident analysis
            incident_type_distribution = df['incident_type'].value_counts().to_dict()
            severity_distribution = df['severity'].value_counts().to_dict()

            # Driver involvement
            driver_incidents = df.groupby(['driver_id', 'driver_name']).agg({
                'incident_id': 'count',
                'severity': lambda x: list(x),
                'incident_type': lambda x: list(x)
            }).reset_index()
            driver_incidents.columns = ['driver_id', 'driver_name', 'incident_count', 'severities', 'incident_types']

            # High-risk drivers (multiple incidents)
            high_risk_drivers = driver_incidents[driver_incidents['incident_count'] >= 2]

            # Recent incidents (last 30 days)
            recent_cutoff = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            recent_incidents = df[df['timestamp'] >= recent_cutoff] if not df.empty else pd.DataFrame()

            return {
                'total_incidents': len(df),
                'total_drivers_involved': df['driver_id'].nunique(),
                'incident_type_distribution': incident_type_distribution,
                'severity_distribution': severity_distribution,
                'recent_incidents_30_days': len(recent_incidents),
                'incident_details': df[['driver_name', 'incident_type', 'severity', 'timestamp',
                                      'plate_number', 'transporter_name', 'description']].to_dict('records'),
                'driver_incident_summary': driver_incidents.to_dict('records'),
                'high_risk_drivers': high_risk_drivers[['driver_name', 'incident_count']].to_dict('records'),
                'recent_incidents': recent_incidents[['driver_name', 'incident_type', 'severity', 'timestamp']].to_dict('records') if not recent_incidents.empty else []
            }
        except Exception as e:
            logger.error(f"Error calculating accident/near-miss flags KPI: {e}")
            return {'error': str(e)}

    def get_fatigue_scoring_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate fatigue scoring for drivers"""
        query = """
        SELECT
            d.driver_id,
            d.name as driver_name,
            d.fatigue_score,
            COUNT(t.trip_id) as total_trips,
            AVG(EXTRACT(EPOCH FROM (t.actual_arrival_time - t.actual_departure_time))/3600) as avg_trip_duration_hours,
            SUM(EXTRACT(EPOCH FROM (t.actual_arrival_time - t.actual_departure_time))/3600) as total_driving_hours,
            COUNT(DISTINCT DATE(t.actual_departure_time)) as active_days
        FROM drivers d
        LEFT JOIN trips t ON d.driver_id = t.driver_id
            AND t.actual_departure_time >= %(start_date)s
            AND t.actual_departure_time <= %(end_date)s
            AND t.status = 'Completed'
            AND t.actual_departure_time IS NOT NULL
            AND t.actual_arrival_time IS NOT NULL
        WHERE d.fatigue_score IS NOT NULL
        GROUP BY d.driver_id, d.name, d.fatigue_score
        HAVING COUNT(t.trip_id) > 0
        ORDER BY d.fatigue_score ASC
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'avg_fatigue_score': 0, 'analysis': {}}

            # Convert numeric columns
            df['fatigue_score'] = pd.to_numeric(df['fatigue_score'], errors='coerce')
            df = df.dropna(subset=['fatigue_score'])

            if df.empty:
                return {'avg_fatigue_score': 0, 'analysis': {}}

            # Calculate additional metrics
            df['avg_daily_hours'] = df['total_driving_hours'] / df['active_days']

            # Fatigue risk categories
            df['fatigue_risk_category'] = df['fatigue_score'].apply(
                lambda x: 'High Risk' if x <= 30 else
                         'Medium Risk' if x <= 60 else
                         'Low Risk'
            )

            fatigue_distribution = df['fatigue_risk_category'].value_counts().to_dict()

            # High fatigue drivers
            high_fatigue_drivers = df[df['fatigue_score'] <= 40]

            return {
                'avg_fatigue_score': safe_float(df['fatigue_score'].mean()),
                'lowest_fatigue_score': safe_float(df['fatigue_score'].min()),
                'highest_fatigue_score': safe_float(df['fatigue_score'].max()),
                'total_drivers_analyzed': len(df),
                'fatigue_risk_distribution': fatigue_distribution,
                'avg_daily_driving_hours': safe_float(df['avg_daily_hours'].mean()),
                'driver_fatigue_analysis': df[['driver_name', 'fatigue_score', 'total_trips', 'total_driving_hours',
                                             'avg_daily_hours', 'fatigue_risk_category']].round(2).to_dict('records'),
                'high_fatigue_risk_drivers': high_fatigue_drivers[
                    ['driver_name', 'fatigue_score', 'avg_daily_hours', 'total_driving_hours']
                ].round(2).to_dict('records'),
                'overworked_drivers': df[df['avg_daily_hours'] > 10][
                    ['driver_name', 'avg_daily_hours', 'fatigue_score', 'active_days']
                ].round(2).to_dict('records')
            }
        except Exception as e:
            logger.error(f"Error calculating fatigue scoring KPI: {e}")
            return {'error': str(e)}

    def export_kpis_to_json(self, kpis: Dict, filename: str = None) -> str:
        """Export KPIs to JSON file"""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"safety_kpis_{timestamp}.json"

        filepath = os.path.join(os.path.dirname(__file__), '..', filename)

        try:
            with open(filepath, 'w') as f:
                json.dump(kpis, f, indent=2, default=str)
            logger.info(f"Safety KPIs exported to {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Error exporting Safety KPIs to JSON: {e}")
            return None

# Example usage and testing
if __name__ == "__main__":
    extractor = SafetyKPIExtractor()

    # Test database connection
    if extractor.db.test_connection():
        print("✅ Database connection successful")

        # Extract all KPIs for the last year (default)
        kpis = extractor.extract_all_kpis()

        # Export to JSON
        export_path = extractor.export_kpis_to_json(kpis)

        print(f"📊 Safety KPIs extracted successfully")
        print(f"📁 Exported to: {export_path}")

        # Print summary
        print("\n📈 Safety KPI Summary:")
        print(f"- Overall Safety Score: {kpis.get('driving_safety_score', {}).get('overall_avg_safety_score', 0):.2f}")
        print(f"- Phone Usage Rate: {kpis.get('phone_usage_rate', {}).get('phone_usage_incidence_rate', 0):.2f}%")
        print(f"- Overspeeding Events per 100km: {kpis.get('overspeeding_events', {}).get('overspeeding_events_per_100km', 0):.2f}")
        print(f"- Rest Time Compliance: {kpis.get('rest_time_compliance', {}).get('rest_time_compliance_rate', 0):.2f}%")
        print(f"- High Risk Trip Percentage: {kpis.get('high_risk_trips', {}).get('high_risk_trip_percentage', 0):.2f}%")
        print(f"- Checklist Compliance Rate: {kpis.get('checklist_compliance', {}).get('overall_compliance_rate', 0):.2f}%")
        print(f"- Total Incidents: {kpis.get('accident_near_miss_flags', {}).get('total_incidents', 0)}")
        print(f"- Average Fatigue Score: {kpis.get('fatigue_scoring', {}).get('avg_fatigue_score', 0):.2f}")
        print(f"- Repeat Offenders: {kpis.get('repeat_offenders', {}).get('repeat_offenders_count', 0)}")

    else:
        print("❌ Database connection failed")
