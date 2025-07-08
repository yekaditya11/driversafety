"""
Combined Operational + Safety KPI Extractor
Focus: Overall logistics health, combining efficiency and risk data

This module extracts comprehensive combined KPIs including:
- Safe On-Time Delivery Rate (trips that are both safe and on-time)
- Driver Risk vs TAT Heatmap (correlation between speed and safety)
- Top 10 Routes by Risk-Weighted Efficiency
- R&R Eligible Trips (meets combined criteria across ops and safety)
- Driver Engagement Index (training content, checklist use, driving score)
- Transporter Composite Score (combining safety and operational metrics)
- Fatigue Risk by Route Length and Time of Day
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from config.database import db
import pandas as pd
from datetime import datetime, timedelta
import logging
from typing import Dict
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

class CombinedKPIExtractor:
    """Extract comprehensive combined operational and safety KPIs for overall logistics health analysis"""
    
    def __init__(self):
        self.db = db
        
    def extract_all_kpis(self, start_date: str = None, end_date: str = None) -> Dict:
        """
        Extract all combined KPIs for the specified date range
        
        Args:
            start_date: Start date in YYYY-MM-DD format (default: 1 year ago)
            end_date: End date in YYYY-MM-DD format (default: today)
            
        Returns:
            Dictionary containing all combined KPI metrics
        """
        if not start_date:
            start_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
            
        logger.info(f"Extracting Combined KPIs from {start_date} to {end_date}")
        
        kpis = {
            'extraction_timestamp': datetime.now().isoformat(),
            'date_range': {'start': start_date, 'end': end_date},
            'safe_on_time_delivery_rate': self.get_safe_on_time_delivery_rate_kpi(start_date, end_date),
            'driver_risk_vs_tat_heatmap': self.get_driver_risk_vs_tat_heatmap_kpi(start_date, end_date),
            'top_routes_by_risk_weighted_efficiency': self.get_top_routes_by_risk_weighted_efficiency_kpi(start_date, end_date),
            'rr_eligible_trips': self.get_rr_eligible_trips_kpi(start_date, end_date),
            'driver_engagement_index': self.get_driver_engagement_index_kpi(start_date, end_date),
            'transporter_composite_score': self.get_transporter_composite_score_kpi(start_date, end_date),
            'fatigue_risk_by_route_and_time': self.get_fatigue_risk_by_route_and_time_kpi(start_date, end_date)
            # Removed driver_performance_index KPI due to data processing issues
        }

        # Clean data to ensure JSON serialization compatibility
        kpis = clean_data_for_json(kpis)

        logger.info("Combined KPI extraction completed successfully")
        return kpis
    
    def get_safe_on_time_delivery_rate_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate Safe On-Time Delivery Rate (trips that are both safe and on-time)"""
        query = """
        WITH trip_safety_scores AS (
            SELECT
                t.trip_id,
                t.is_on_time,
                d.safety_score,
                d.fatigue_score,
                COUNT(CASE WHEN te.type IN ('harsh_braking', 'harsh_acceleration', 'harsh_cornering', 'overspeeding', 'phone_usage') THEN 1 END) as safety_violations,
                COUNT(ir.incident_id) as incidents,
                -- Calculate trip safety status (safe if no major violations and good driver scores)
                CASE
                    WHEN COUNT(CASE WHEN te.type IN ('harsh_braking', 'harsh_acceleration', 'harsh_cornering', 'overspeeding', 'phone_usage') THEN 1 END) = 0
                         AND COUNT(ir.incident_id) = 0
                         AND COALESCE(d.safety_score, 0) >= 70
                         AND COALESCE(d.fatigue_score, 0) >= 70
                    THEN true
                    ELSE false
                END as is_safe_trip
            FROM trips t
            JOIN drivers d ON t.driver_id = d.driver_id
            LEFT JOIN trip_events te ON t.trip_id = te.trip_id
            LEFT JOIN incident_reports ir ON t.trip_id = ir.trip_id
            WHERE t.actual_departure_time >= %(start_date)s
            AND t.actual_departure_time <= %(end_date)s
            AND t.status = 'Completed'
            GROUP BY t.trip_id, t.is_on_time, d.safety_score, d.fatigue_score
        )
        SELECT
            COUNT(*) as total_trips,
            COUNT(CASE WHEN is_on_time = true THEN 1 END) as on_time_trips,
            COUNT(CASE WHEN is_safe_trip = true THEN 1 END) as safe_trips,
            COUNT(CASE WHEN is_on_time = true AND is_safe_trip = true THEN 1 END) as safe_on_time_trips,
            (COUNT(CASE WHEN is_on_time = true AND is_safe_trip = true THEN 1 END)::float / COUNT(*) * 100) as safe_on_time_rate
        FROM trip_safety_scores
        """
        
        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty or df['total_trips'].iloc[0] == 0:
                return {
                    'safe_on_time_delivery_rate': 0,
                    'total_trips': 0,
                    'safe_trips': 0,
                    'on_time_trips': 0,
                    'safe_on_time_trips': 0
                }

            result = df.iloc[0]
            return {
                'safe_on_time_delivery_rate': safe_float(result['safe_on_time_rate']),
                'total_trips': safe_int(result['total_trips']),
                'safe_trips': safe_int(result['safe_trips']),
                'on_time_trips': safe_int(result['on_time_trips']),
                'safe_on_time_trips': safe_int(result['safe_on_time_trips']),
                'safety_rate': safe_float((result['safe_trips'] / result['total_trips'] * 100) if result['total_trips'] > 0 else 0),
                'on_time_rate': safe_float((result['on_time_trips'] / result['total_trips'] * 100) if result['total_trips'] > 0 else 0)
            }
        except Exception as e:
            logger.error(f"Error calculating safe on-time delivery rate KPI: {e}")
            return {'error': str(e)}
    
    def get_driver_risk_vs_tat_heatmap_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate Driver Risk vs TAT Heatmap (correlation between speed and safety)"""
        query = """
        SELECT
            d.driver_id,
            d.name as driver_name,
            d.safety_score,
            d.fatigue_score,
            AVG(EXTRACT(EPOCH FROM (t.actual_arrival_time - t.actual_departure_time))/3600) as avg_tat_hours,
            COUNT(t.trip_id) as total_trips,
            COUNT(CASE WHEN te.type IN ('harsh_braking', 'harsh_acceleration', 'harsh_cornering', 'overspeeding') THEN 1 END) as risk_events,
            AVG(t.actual_distance_km / NULLIF(EXTRACT(EPOCH FROM (t.actual_arrival_time - t.actual_departure_time))/3600, 0)) as avg_speed_kmph,
            -- Risk score (lower is riskier)
            (
                COALESCE(d.safety_score, 50) * 0.5 +
                COALESCE(d.fatigue_score, 50) * 0.3 +
                GREATEST(0, 100 - COUNT(CASE WHEN te.type IN ('harsh_braking', 'harsh_acceleration', 'harsh_cornering', 'overspeeding') THEN 1 END) * 10) * 0.2
            ) as driver_risk_score
        FROM drivers d
        JOIN trips t ON d.driver_id = t.driver_id
        LEFT JOIN trip_events te ON t.trip_id = te.trip_id
        WHERE t.actual_departure_time >= %(start_date)s
        AND t.actual_departure_time <= %(end_date)s
        AND t.status = 'Completed'
        AND t.actual_departure_time IS NOT NULL
        AND t.actual_arrival_time IS NOT NULL
        GROUP BY d.driver_id, d.name, d.safety_score, d.fatigue_score
        HAVING COUNT(t.trip_id) >= 3
        ORDER BY driver_risk_score ASC
        """
        
        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'correlation_analysis': {}, 'heatmap_data': []}

            # Calculate correlation between risk and TAT
            correlation = df['driver_risk_score'].corr(df['avg_tat_hours']) if len(df) > 1 else 0

            # Create risk vs TAT categories for heatmap
            df['risk_category'] = pd.cut(df['driver_risk_score'], 
                                       bins=[0, 40, 60, 80, 100], 
                                       labels=['High Risk', 'Medium Risk', 'Low Risk', 'Very Low Risk'])
            
            df['tat_category'] = pd.cut(df['avg_tat_hours'], 
                                      bins=[0, 4, 8, 12, float('inf')], 
                                      labels=['Fast', 'Normal', 'Slow', 'Very Slow'])

            # Heatmap data
            heatmap_data = df.groupby(['risk_category', 'tat_category'], observed=True).size().reset_index(name='driver_count')

            return {
                'correlation_coefficient': safe_float(correlation),
                'total_drivers_analyzed': len(df),
                'avg_risk_score': safe_float(df['driver_risk_score'].mean()),
                'avg_tat_hours': safe_float(df['avg_tat_hours'].mean()),
                'heatmap_data': clean_data_for_json(heatmap_data.to_dict('records')),
                'driver_analysis': clean_data_for_json(df[['driver_name', 'safety_score', 'avg_tat_hours', 'avg_speed_kmph',
                                     'risk_events', 'driver_risk_score']].round(2).to_dict('records')),
                'high_risk_fast_drivers': clean_data_for_json(df[(df['driver_risk_score'] < 50) & (df['avg_tat_hours'] < 6)][
                    ['driver_name', 'driver_risk_score', 'avg_tat_hours', 'avg_speed_kmph']
                ].to_dict('records'))
            }
        except Exception as e:
            logger.error(f"Error calculating driver risk vs TAT heatmap KPI: {e}")
            return {'error': str(e)}

    def get_top_routes_by_risk_weighted_efficiency_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate Top 10 Routes by Risk-Weighted Efficiency"""
        query = """
        WITH route_metrics AS (
            SELECT
                r.route_id,
                r.origin,
                r.destination,
                r.distance_km as planned_distance,
                COUNT(t.trip_id) as total_trips,
                AVG(t.actual_distance_km) as avg_actual_distance,
                AVG(EXTRACT(EPOCH FROM (t.actual_arrival_time - t.actual_departure_time))/3600) as avg_duration_hours,
                AVG(CASE WHEN t.is_on_time THEN 1 ELSE 0 END) * 100 as on_time_rate,
                COUNT(CASE WHEN te.type IN ('harsh_braking', 'harsh_acceleration', 'harsh_cornering', 'overspeeding') THEN 1 END) as safety_events,
                COUNT(ir.incident_id) as incidents,
                AVG(d.safety_score) as avg_driver_safety_score,
                -- Efficiency score (higher is better)
                (
                    (AVG(CASE WHEN t.is_on_time THEN 1 ELSE 0 END) * 100) * 0.4 +  -- On-time performance
                    (100 - (AVG(t.actual_distance_km) / NULLIF(r.distance_km, 0) - 1) * 100) * 0.3 +  -- Distance efficiency
                    (100 / NULLIF(AVG(EXTRACT(EPOCH FROM (t.actual_arrival_time - t.actual_departure_time))/3600), 0) * r.distance_km) * 0.3  -- Speed efficiency
                ) as efficiency_score,
                -- Risk score (lower is riskier)
                (
                    AVG(COALESCE(d.safety_score, 50)) * 0.5 +
                    GREATEST(0, 100 - COUNT(CASE WHEN te.type IN ('harsh_braking', 'harsh_acceleration', 'harsh_cornering', 'overspeeding') THEN 1 END) * 5) * 0.3 +
                    GREATEST(0, 100 - COUNT(ir.incident_id) * 20) * 0.2
                ) as safety_score
            FROM routes r
            JOIN trips t ON r.route_id = t.route_id
            JOIN drivers d ON t.driver_id = d.driver_id
            LEFT JOIN trip_events te ON t.trip_id = te.trip_id
            LEFT JOIN incident_reports ir ON t.trip_id = ir.trip_id
            WHERE t.actual_departure_time >= %(start_date)s
            AND t.actual_departure_time <= %(end_date)s
            AND t.status = 'Completed'
            GROUP BY r.route_id, r.origin, r.destination, r.distance_km
            HAVING COUNT(t.trip_id) >= 5
        )
        SELECT
            route_id,
            origin,
            destination,
            planned_distance,
            total_trips,
            avg_actual_distance,
            avg_duration_hours,
            on_time_rate,
            safety_events,
            incidents,
            avg_driver_safety_score,
            efficiency_score,
            safety_score,
            -- Risk-weighted efficiency (combines both metrics)
            (efficiency_score * (safety_score / 100)) as risk_weighted_efficiency
        FROM route_metrics
        ORDER BY risk_weighted_efficiency DESC
        LIMIT 10
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'top_routes': [], 'analysis': {}}

            return {
                'top_10_routes': clean_data_for_json(df.round(2).to_dict('records')),
                'avg_risk_weighted_efficiency': safe_float(df['risk_weighted_efficiency'].mean()),
                'best_route': {
                    'route': f"{df.iloc[0]['origin']} → {df.iloc[0]['destination']}",
                    'efficiency_score': safe_float(df.iloc[0]['risk_weighted_efficiency']),
                    'total_trips': safe_int(df.iloc[0]['total_trips'])
                } if len(df) > 0 else {},
                'efficiency_distribution': {
                    'excellent': len(df[df['risk_weighted_efficiency'] >= 80]),
                    'good': len(df[(df['risk_weighted_efficiency'] >= 60) & (df['risk_weighted_efficiency'] < 80)]),
                    'average': len(df[(df['risk_weighted_efficiency'] >= 40) & (df['risk_weighted_efficiency'] < 60)]),
                    'poor': len(df[df['risk_weighted_efficiency'] < 40])
                }
            }
        except Exception as e:
            logger.error(f"Error calculating top routes by risk-weighted efficiency KPI: {e}")
            return {'error': str(e)}

    def get_rr_eligible_trips_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate R&R Eligible Trips (meets combined criteria across ops and safety)"""
        query = """
        WITH trip_eligibility AS (
            SELECT
                t.trip_id,
                d.name as driver_name,
                v.plate_number,
                tr.name as transporter_name,
                t.is_on_time,
                d.safety_score,
                d.fatigue_score,
                COUNT(CASE WHEN te.type IN ('harsh_braking', 'harsh_acceleration', 'harsh_cornering', 'overspeeding', 'phone_usage') THEN 1 END) as safety_violations,
                COUNT(ir.incident_id) as incidents,
                (t.delivery_volume_actual / NULLIF(t.delivery_volume_planned, 0) * 100) as volume_fulfillment_pct,
                -- R&R Eligibility Criteria
                CASE
                    WHEN t.is_on_time = true
                         AND COALESCE(d.safety_score, 0) >= 80
                         AND COALESCE(d.fatigue_score, 0) >= 70
                         AND COUNT(CASE WHEN te.type IN ('harsh_braking', 'harsh_acceleration', 'harsh_cornering', 'overspeeding', 'phone_usage') THEN 1 END) = 0
                         AND COUNT(ir.incident_id) = 0
                         AND (t.delivery_volume_actual / NULLIF(t.delivery_volume_planned, 0) * 100) >= 95
                    THEN true
                    ELSE false
                END as is_rr_eligible
            FROM trips t
            JOIN drivers d ON t.driver_id = d.driver_id
            JOIN vehicles v ON t.vehicle_id = v.vehicle_id
            JOIN transporters tr ON t.transporter_id = tr.transporter_id
            LEFT JOIN trip_events te ON t.trip_id = te.trip_id
            LEFT JOIN incident_reports ir ON t.trip_id = ir.trip_id
            WHERE t.actual_departure_time >= %(start_date)s
            AND t.actual_departure_time <= %(end_date)s
            AND t.status = 'Completed'
            AND t.delivery_volume_planned IS NOT NULL
            AND t.delivery_volume_actual IS NOT NULL
            GROUP BY t.trip_id, d.name, v.plate_number, tr.name, t.is_on_time, d.safety_score, d.fatigue_score,
                     t.delivery_volume_actual, t.delivery_volume_planned
        )
        SELECT
            COUNT(*) as total_trips,
            COUNT(CASE WHEN is_rr_eligible = true THEN 1 END) as rr_eligible_trips,
            (COUNT(CASE WHEN is_rr_eligible = true THEN 1 END)::float / COUNT(*) * 100) as rr_eligibility_rate,
            driver_name,
            transporter_name,
            is_rr_eligible,
            safety_score,
            fatigue_score,
            safety_violations,
            volume_fulfillment_pct,
            COUNT(CASE WHEN is_on_time = true THEN 1 END) as on_time_trips,
            COUNT(CASE WHEN safety_score >= 80 THEN 1 END) as high_safety_score_trips,
            COUNT(CASE WHEN safety_violations = 0 THEN 1 END) as zero_violations_trips,
            COUNT(CASE WHEN volume_fulfillment_pct >= 95 THEN 1 END) as high_volume_fulfillment_trips
        FROM trip_eligibility
        GROUP BY driver_name, transporter_name, is_rr_eligible, safety_score, fatigue_score, safety_violations, volume_fulfillment_pct
        ORDER BY is_rr_eligible DESC, safety_score DESC
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'rr_eligibility_rate': 0, 'analysis': {}}

            # Calculate overall metrics
            total_trips = df['total_trips'].sum()
            rr_eligible_trips = df['rr_eligible_trips'].sum()
            rr_eligibility_rate = (rr_eligible_trips / total_trips * 100) if total_trips > 0 else 0

            # Driver performance for R&R
            driver_rr_performance = df[df['is_rr_eligible'] == True].groupby('driver_name').agg({
                'rr_eligible_trips': 'sum',
                'safety_score': 'mean',
                'fatigue_score': 'mean'
            }).reset_index().sort_values('rr_eligible_trips', ascending=False)

            # Transporter performance for R&R
            transporter_rr_performance = df[df['is_rr_eligible'] == True].groupby('transporter_name').agg({
                'rr_eligible_trips': 'sum'
            }).reset_index().sort_values('rr_eligible_trips', ascending=False)

            return {
                'rr_eligibility_rate': round(rr_eligibility_rate, 2),
                'total_trips_analyzed': safe_int(total_trips),
                'rr_eligible_trips': safe_int(rr_eligible_trips),
                'top_rr_drivers': clean_data_for_json(driver_rr_performance.head(10).round(2).to_dict('records')),
                'top_rr_transporters': clean_data_for_json(transporter_rr_performance.head(10).to_dict('records')),
                'rr_criteria_breakdown': {
                    'on_time_trips': safe_int(df['on_time_trips'].sum()),
                    'high_safety_score_trips': safe_int(df['high_safety_score_trips'].sum()),
                    'zero_violations_trips': safe_int(df['zero_violations_trips'].sum()),
                    'high_volume_fulfillment_trips': safe_int(df['high_volume_fulfillment_trips'].sum())
                }
            }
        except Exception as e:
            logger.error(f"Error calculating R&R eligible trips KPI: {e}")
            return {'error': str(e)}

    def get_driver_engagement_index_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate Driver Engagement Index (training content, checklist use, driving score)"""
        query = """
        SELECT
            d.driver_id,
            d.name as driver_name,
            d.safety_score,
            d.fatigue_score,
            d.engagement_index,
            COUNT(DISTINCT t.trip_id) as total_trips,
            COUNT(c.checklist_id) as total_checklists,
            COUNT(CASE WHEN c.submitted = true THEN 1 END) as submitted_checklists,
            COUNT(CASE WHEN c.compliant = true THEN 1 END) as compliant_checklists,
            -- Calculate engagement metrics
            (COUNT(CASE WHEN c.submitted = true THEN 1 END)::float / NULLIF(COUNT(c.checklist_id), 0) * 100) as checklist_submission_rate,
            (COUNT(CASE WHEN c.compliant = true THEN 1 END)::float / NULLIF(COUNT(c.checklist_id), 0) * 100) as checklist_compliance_rate,
            -- Composite engagement score
            (
                COALESCE(d.safety_score, 50) * 0.3 +
                COALESCE(d.engagement_index, 50) * 0.3 +
                COALESCE((COUNT(CASE WHEN c.submitted = true THEN 1 END)::float / NULLIF(COUNT(c.checklist_id), 0) * 100), 50) * 0.2 +
                COALESCE((COUNT(CASE WHEN c.compliant = true THEN 1 END)::float / NULLIF(COUNT(c.checklist_id), 0) * 100), 50) * 0.2
            ) as composite_engagement_score
        FROM drivers d
        LEFT JOIN trips t ON d.driver_id = t.driver_id
            AND t.actual_departure_time >= %(start_date)s
            AND t.actual_departure_time <= %(end_date)s
            AND t.status = 'Completed'
        LEFT JOIN checklists c ON d.driver_id = c.driver_id
            AND c.submission_time >= %(start_date)s
            AND c.submission_time <= %(end_date)s
        GROUP BY d.driver_id, d.name, d.safety_score, d.fatigue_score, d.engagement_index
        HAVING COUNT(DISTINCT t.trip_id) > 0
        ORDER BY composite_engagement_score DESC
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'avg_engagement_score': 0, 'analysis': {}}

            # Engagement categories
            df['engagement_category'] = df['composite_engagement_score'].apply(
                lambda x: 'Highly Engaged' if x >= 80 else
                         'Engaged' if x >= 60 else
                         'Moderately Engaged' if x >= 40 else
                         'Low Engagement'
            )

            engagement_distribution = df['engagement_category'].value_counts().to_dict()

            return {
                'avg_engagement_score': safe_float(df['composite_engagement_score'].mean()),
                'total_drivers_analyzed': len(df),
                'engagement_distribution': engagement_distribution,
                'avg_checklist_submission_rate': safe_float(df['checklist_submission_rate'].mean()),
                'avg_checklist_compliance_rate': safe_float(df['checklist_compliance_rate'].mean()),
                'driver_engagement_details': df[['driver_name', 'safety_score', 'engagement_index',
                                               'checklist_submission_rate', 'checklist_compliance_rate',
                                               'composite_engagement_score', 'engagement_category']].round(2).to_dict('records'),
                'top_engaged_drivers': df.head(10)[['driver_name', 'composite_engagement_score', 'engagement_category']].to_dict('records'),
                'low_engagement_drivers': df[df['composite_engagement_score'] < 50][
                    ['driver_name', 'composite_engagement_score', 'checklist_submission_rate']
                ].to_dict('records')
            }
        except Exception as e:
            logger.error(f"Error calculating driver engagement index KPI: {e}")
            return {'error': str(e)}

    def get_transporter_composite_score_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate Transporter Composite Score (combining safety and operational metrics)"""
        query = """
        SELECT
            tr.transporter_id,
            tr.name as transporter_name,
            tr.composite_score as existing_composite_score,
            COUNT(t.trip_id) as total_trips,
            -- Operational metrics
            AVG(CASE WHEN t.is_on_time THEN 1 ELSE 0 END) * 100 as on_time_rate,
            AVG(t.actual_distance_km / NULLIF(t.planned_distance_km, 0)) as distance_efficiency,
            AVG((t.delivery_volume_actual / NULLIF(t.delivery_volume_planned, 0)) * 100) as volume_fulfillment_rate,
            COUNT(md.id) as missed_deliveries,
            -- Safety metrics
            AVG(d.safety_score) as avg_driver_safety_score,
            COUNT(CASE WHEN te.type IN ('harsh_braking', 'harsh_acceleration', 'harsh_cornering', 'overspeeding') THEN 1 END) as safety_violations,
            COUNT(ir.incident_id) as incidents,
            -- Calculate new composite score
            (
                (AVG(CASE WHEN t.is_on_time THEN 1 ELSE 0 END) * 100) * 0.25 +  -- On-time performance
                (AVG((t.delivery_volume_actual / NULLIF(t.delivery_volume_planned, 0)) * 100)) * 0.20 +  -- Volume fulfillment
                (100 - (COUNT(md.id)::float / COUNT(t.trip_id) * 100)) * 0.15 +  -- Delivery success rate
                AVG(COALESCE(d.safety_score, 50)) * 0.20 +  -- Driver safety
                GREATEST(0, 100 - COUNT(CASE WHEN te.type IN ('harsh_braking', 'harsh_acceleration', 'harsh_cornering', 'overspeeding') THEN 1 END)::float / COUNT(t.trip_id) * 20) * 0.15 +  -- Safety violations
                GREATEST(0, 100 - COUNT(ir.incident_id) * 10) * 0.05  -- Incidents
            ) as calculated_composite_score
        FROM transporters tr
        LEFT JOIN trips t ON tr.transporter_id = t.transporter_id
            AND t.actual_departure_time >= %(start_date)s
            AND t.actual_departure_time <= %(end_date)s
            AND t.status = 'Completed'
        LEFT JOIN drivers d ON t.driver_id = d.driver_id
        LEFT JOIN trip_events te ON t.trip_id = te.trip_id
        LEFT JOIN incident_reports ir ON t.trip_id = ir.trip_id
        LEFT JOIN missed_deliveries md ON t.trip_id = md.trip_id
        GROUP BY tr.transporter_id, tr.name, tr.composite_score
        HAVING COUNT(t.trip_id) > 0
        ORDER BY calculated_composite_score DESC
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'avg_composite_score': 0, 'analysis': {}}

            # Performance categories
            df['performance_category'] = df['calculated_composite_score'].apply(
                lambda x: 'Excellent' if x >= 85 else
                         'Good' if x >= 70 else
                         'Average' if x >= 55 else
                         'Poor'
            )

            performance_distribution = df['performance_category'].value_counts().to_dict()

            return {
                'avg_composite_score': safe_float(df['calculated_composite_score'].mean()),
                'total_transporters_analyzed': len(df),
                'performance_distribution': performance_distribution,
                'transporter_scores': df[['transporter_name', 'existing_composite_score', 'calculated_composite_score',
                                        'on_time_rate', 'volume_fulfillment_rate', 'avg_driver_safety_score',
                                        'safety_violations', 'incidents', 'performance_category']].round(2).to_dict('records'),
                'top_performers': df.head(5)[['transporter_name', 'calculated_composite_score', 'performance_category']].to_dict('records'),
                'bottom_performers': df.tail(5)[['transporter_name', 'calculated_composite_score', 'performance_category']].to_dict('records'),
                'score_improvement_needed': df[df['calculated_composite_score'] < 60][
                    ['transporter_name', 'calculated_composite_score', 'on_time_rate', 'safety_violations']
                ].to_dict('records')
            }
        except Exception as e:
            logger.error(f"Error calculating transporter composite score KPI: {e}")
            return {'error': str(e)}

    def get_fatigue_risk_by_route_and_time_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate Fatigue Risk by Route Length and Time of Day"""
        query = """
        SELECT
            r.route_id,
            r.origin,
            r.destination,
            r.distance_km,
            EXTRACT(HOUR FROM t.actual_departure_time) as departure_hour,
            CASE
                WHEN EXTRACT(HOUR FROM t.actual_departure_time) BETWEEN 6 AND 11 THEN 'Morning'
                WHEN EXTRACT(HOUR FROM t.actual_departure_time) BETWEEN 12 AND 17 THEN 'Afternoon'
                WHEN EXTRACT(HOUR FROM t.actual_departure_time) BETWEEN 18 AND 23 THEN 'Evening'
                ELSE 'Night'
            END as time_period,
            CASE
                WHEN r.distance_km <= 100 THEN 'Short'
                WHEN r.distance_km <= 300 THEN 'Medium'
                WHEN r.distance_km <= 500 THEN 'Long'
                ELSE 'Very Long'
            END as route_length_category,
            d.fatigue_score,
            COUNT(t.trip_id) as trip_count,
            AVG(d.fatigue_score) as avg_fatigue_score,
            COUNT(CASE WHEN d.fatigue_score <= 40 THEN 1 END) as high_fatigue_trips,
            COUNT(CASE WHEN te.type IN ('harsh_braking', 'harsh_acceleration', 'harsh_cornering') THEN 1 END) as fatigue_related_events,
            -- Fatigue risk score (lower is riskier)
            (
                AVG(COALESCE(d.fatigue_score, 50)) * 0.6 +
                CASE
                    WHEN EXTRACT(HOUR FROM t.actual_departure_time) BETWEEN 22 AND 5 THEN 20  -- Night penalty
                    WHEN EXTRACT(HOUR FROM t.actual_departure_time) BETWEEN 14 AND 16 THEN 30  -- Afternoon dip penalty
                    ELSE 50
                END * 0.2 +
                CASE
                    WHEN r.distance_km > 500 THEN 20  -- Long distance penalty
                    WHEN r.distance_km > 300 THEN 35
                    ELSE 50
                END * 0.2
            ) as fatigue_risk_score
        FROM routes r
        JOIN trips t ON r.route_id = t.route_id
        JOIN drivers d ON t.driver_id = d.driver_id
        LEFT JOIN trip_events te ON t.trip_id = te.trip_id
        WHERE t.actual_departure_time >= %(start_date)s
        AND t.actual_departure_time <= %(end_date)s
        AND t.status = 'Completed'
        AND d.fatigue_score IS NOT NULL
        GROUP BY r.route_id, r.origin, r.destination, r.distance_km, departure_hour, time_period, route_length_category, d.fatigue_score
        ORDER BY fatigue_risk_score ASC
        """

        try:
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})

            if df.empty:
                return {'fatigue_risk_analysis': {}, 'heatmap_data': []}

            # Fatigue risk heatmap by time and route length
            heatmap_data = df.groupby(['time_period', 'route_length_category']).agg({
                'fatigue_risk_score': 'mean',
                'trip_count': 'sum',
                'high_fatigue_trips': 'sum'
            }).reset_index()

            # High-risk combinations
            high_risk_combinations = df[df['fatigue_risk_score'] < 40]

            # Time-based analysis
            time_analysis = df.groupby('time_period').agg({
                'fatigue_risk_score': 'mean',
                'trip_count': 'sum',
                'high_fatigue_trips': 'sum',
                'avg_fatigue_score': 'mean'
            }).reset_index()

            # Route length analysis
            route_analysis = df.groupby('route_length_category').agg({
                'fatigue_risk_score': 'mean',
                'trip_count': 'sum',
                'high_fatigue_trips': 'sum',
                'avg_fatigue_score': 'mean'
            }).reset_index()

            return {
                'overall_fatigue_risk_score': safe_float(df['fatigue_risk_score'].mean()),
                'total_trips_analyzed': safe_int(df['trip_count'].sum()),
                'high_fatigue_risk_trips': safe_int(df['high_fatigue_trips'].sum()),
                'fatigue_risk_heatmap': heatmap_data.round(2).to_dict('records'),
                'high_risk_combinations': high_risk_combinations[
                    ['origin', 'destination', 'time_period', 'route_length_category', 'fatigue_risk_score']
                ].round(2).to_dict('records'),
                'time_period_analysis': time_analysis.round(2).to_dict('records'),
                'route_length_analysis': route_analysis.round(2).to_dict('records'),
                'riskiest_time_period': time_analysis.loc[time_analysis['fatigue_risk_score'].idxmin(), 'time_period'] if not time_analysis.empty else 'Unknown',
                'riskiest_route_category': route_analysis.loc[route_analysis['fatigue_risk_score'].idxmin(), 'route_length_category'] if not route_analysis.empty else 'Unknown'
            }
        except Exception as e:
            logger.error(f"Error calculating fatigue risk by route and time KPI: {e}")
            return {'error': str(e)}

    def get_driver_performance_index_kpi(self, start_date: str, end_date: str) -> Dict:
        """Calculate Driver Performance Index (Ops + Safety blend) – Composite driver score factoring delivery metrics and driving behaviour"""
        query = """
        SELECT
            d.driver_id,
            d.name as driver_name,
            d.safety_score,
            d.fatigue_score,
            d.engagement_index,
            COUNT(t.trip_id) as total_trips,
            -- Operational metrics
            AVG(CASE WHEN t.is_on_time THEN 1 ELSE 0 END) * 100 as on_time_rate,
            AVG((t.delivery_volume_actual / NULLIF(t.delivery_volume_planned, 0)) * 100) as avg_volume_fulfillment,
            AVG(t.actual_distance_km / NULLIF(t.planned_distance_km, 0)) as distance_efficiency,
            COUNT(md.id) as missed_deliveries,
            -- Safety metrics
            COUNT(CASE WHEN te.type = 'overspeeding' THEN 1 END) as overspeeding_events,
            COUNT(CASE WHEN te.type = 'phone_usage' THEN 1 END) as phone_usage_events,
            COUNT(CASE WHEN te.type IN ('harsh_braking', 'harsh_acceleration', 'harsh_cornering') THEN 1 END) as harsh_driving_events,
            COUNT(ir.incident_id) as incidents,
            -- Composite Performance Index (0-100 scale)
            (
                -- Operational Performance (50% weight)
                (
                    (AVG(CASE WHEN t.is_on_time THEN 1 ELSE 0 END) * 100) * 0.15 +  -- On-time delivery
                    (AVG((t.delivery_volume_actual / NULLIF(t.delivery_volume_planned, 0)) * 100)) * 0.15 +  -- Volume fulfillment
                    (100 - (COUNT(md.id)::float / COUNT(t.trip_id) * 100)) * 0.10 +  -- Delivery success
                    (CASE WHEN AVG(t.actual_distance_km / NULLIF(t.planned_distance_km, 0)) <= 1.1 THEN 100
                          ELSE GREATEST(0, 100 - (AVG(t.actual_distance_km / NULLIF(t.planned_distance_km, 0)) - 1) * 100) END) * 0.10  -- Distance efficiency
                ) +
                -- Safety Performance (50% weight)
                (
                    COALESCE(d.safety_score, 50) * 0.20 +  -- Safety score
                    COALESCE(d.fatigue_score, 50) * 0.10 +  -- Fatigue score
                    GREATEST(0, 100 - COUNT(CASE WHEN te.type = 'overspeeding' THEN 1 END)::float / COUNT(t.trip_id) * 20) * 0.05 +  -- Overspeeding penalty
                    GREATEST(0, 100 - COUNT(CASE WHEN te.type = 'phone_usage' THEN 1 END)::float / COUNT(t.trip_id) * 30) * 0.05 +  -- Phone usage penalty
                    GREATEST(0, 100 - COUNT(CASE WHEN te.type IN ('harsh_braking', 'harsh_acceleration', 'harsh_cornering') THEN 1 END)::float / COUNT(t.trip_id) * 15) * 0.05 +  -- Harsh driving penalty
                    GREATEST(0, 100 - COUNT(ir.incident_id) * 25) * 0.05  -- Incident penalty
                )
            ) as driver_performance_index
        FROM drivers d
        LEFT JOIN trips t ON d.driver_id = t.driver_id
            AND t.actual_departure_time >= %(start_date)s
            AND t.actual_departure_time <= %(end_date)s
            AND t.status = 'Completed'
        LEFT JOIN trip_events te ON t.trip_id = te.trip_id
        LEFT JOIN incident_reports ir ON t.trip_id = ir.trip_id
        LEFT JOIN missed_deliveries md ON t.trip_id = md.trip_id
        GROUP BY d.driver_id, d.name, d.safety_score, d.fatigue_score, d.engagement_index
        HAVING COUNT(t.trip_id) >= 3
        ORDER BY driver_performance_index DESC
        """

        try:
            logger.info(f"Starting driver performance index KPI calculation for {start_date} to {end_date}")
            engine = self.db.get_engine()
            df = pd.read_sql_query(query, engine, params={'start_date': start_date, 'end_date': end_date})
            logger.info(f"Query executed successfully. DataFrame shape: {df.shape}")

            if df.empty:
                logger.warning("No data found for driver performance index KPI")
                return {'avg_performance_index': 0, 'analysis': {}}

            # Clean numeric columns to handle NaN/inf values
            try:
                numeric_columns = ['safety_score', 'fatigue_score', 'on_time_rate', 'avg_volume_fulfillment',
                                 'overspeeding_events', 'harsh_driving_events', 'incidents', 'driver_performance_index']
                logger.info(f"DataFrame columns: {list(df.columns)}")
                for col in numeric_columns:
                    if col in df.columns:
                        logger.info(f"Processing numeric column: {col}")
                        df[col] = df[col].apply(safe_float)
                    else:
                        logger.warning(f"Column {col} not found in DataFrame")
                logger.info("Numeric column processing completed")
            except Exception as numeric_error:
                logger.error(f"Error processing numeric columns: {numeric_error}")
                raise

            # Performance categories
            try:
                df['performance_category'] = df['driver_performance_index'].apply(
                    lambda x: 'Excellent' if x >= 85 else
                             'Good' if x >= 70 else
                             'Average' if x >= 55 else
                             'Poor'
                )
                logger.info(f"Performance categories created successfully. Sample: {df['performance_category'].head().tolist()}")
            except Exception as cat_error:
                logger.error(f"Error creating performance categories: {cat_error}")
                df['performance_category'] = 'Unknown'

            try:
                performance_distribution = {str(k): safe_int(v) for k, v in df['performance_category'].value_counts().to_dict().items()}
                logger.info(f"Performance distribution calculated: {performance_distribution}")
            except Exception as dist_error:
                logger.error(f"Error calculating performance distribution: {dist_error}")
                performance_distribution = {'Unknown': len(df)}

            # Prepare data for JSON serialization
            details_columns = ['driver_name', 'safety_score', 'fatigue_score', 'on_time_rate',
                             'avg_volume_fulfillment', 'overspeeding_events', 'harsh_driving_events',
                             'incidents', 'driver_performance_index', 'performance_category']

            # Filter columns that actually exist in the DataFrame
            available_columns = [col for col in details_columns if col in df.columns]
            logger.info(f"Available columns for driver performance details: {available_columns}")
            logger.info(f"DataFrame shape: {df.shape}, columns: {list(df.columns)}")

            # Safely convert DataFrame to records
            try:
                if available_columns and len(df) > 0:
                    # Ensure we have valid data before converting
                    detail_df = df[available_columns].copy()
                    # Round only numeric columns
                    numeric_cols = detail_df.select_dtypes(include=['number']).columns
                    detail_df[numeric_cols] = detail_df[numeric_cols].round(2)
                    driver_performance_details = detail_df.to_dict('records')
                    driver_performance_details = clean_data_for_json(driver_performance_details)
                else:
                    driver_performance_details = []
            except Exception as detail_error:
                logger.error(f"Error converting driver performance details: {detail_error}")
                logger.error(f"DataFrame info: shape={df.shape}, columns={list(df.columns)}")
                driver_performance_details = []

            # Safely get top performers
            try:
                required_cols = ['driver_name', 'driver_performance_index', 'performance_category']
                if all(col in df.columns for col in required_cols) and len(df) > 0:
                    top_df = df.head(10)[required_cols].copy()
                    # Round only numeric columns
                    numeric_cols = top_df.select_dtypes(include=['number']).columns
                    top_df[numeric_cols] = top_df[numeric_cols].round(2)
                    top_performers = top_df.to_dict('records')
                    top_performers = clean_data_for_json(top_performers)
                else:
                    top_performers = []
            except Exception as top_error:
                logger.error(f"Error getting top performers: {top_error}")
                top_performers = []

            # Safely get bottom performers
            try:
                required_cols = ['driver_name', 'driver_performance_index', 'performance_category']
                if all(col in df.columns for col in required_cols) and len(df) > 0:
                    bottom_df = df.tail(10)[required_cols].copy()
                    # Round only numeric columns
                    numeric_cols = bottom_df.select_dtypes(include=['number']).columns
                    bottom_df[numeric_cols] = bottom_df[numeric_cols].round(2)
                    bottom_performers = bottom_df.to_dict('records')
                    bottom_performers = clean_data_for_json(bottom_performers)
                else:
                    bottom_performers = []
            except Exception as bottom_error:
                logger.error(f"Error getting bottom performers: {bottom_error}")
                bottom_performers = []

            # Safely get improvement needed
            try:
                improvement_cols = ['driver_name', 'driver_performance_index', 'on_time_rate', 'safety_score', 'incidents']
                improvement_available_cols = [col for col in improvement_cols if col in df.columns]
                if improvement_available_cols and len(df) > 0:
                    improvement_df = df[df['driver_performance_index'] < 60][improvement_available_cols].copy()
                    if len(improvement_df) > 0:
                        # Round only numeric columns
                        numeric_cols = improvement_df.select_dtypes(include=['number']).columns
                        improvement_df[numeric_cols] = improvement_df[numeric_cols].round(2)
                        improvement_needed = improvement_df.to_dict('records')
                        improvement_needed = clean_data_for_json(improvement_needed)
                    else:
                        improvement_needed = []
                else:
                    improvement_needed = []
            except Exception as improvement_error:
                logger.error(f"Error getting improvement needed: {improvement_error}")
                improvement_needed = []

            return {
                'avg_driver_performance_index': safe_float(df['driver_performance_index'].mean()),
                'total_drivers_analyzed': len(df),
                'performance_distribution': performance_distribution,
                'driver_performance_details': driver_performance_details,
                'top_performers': top_performers,
                'bottom_performers': bottom_performers,
                'improvement_needed': improvement_needed
            }
        except Exception as e:
            logger.error(f"Error calculating driver performance index KPI: {e}")
            return {'error': str(e)}

    def export_kpis_to_json(self, kpis: Dict, filename: str = None) -> str:
        """Export KPIs to JSON file"""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"combined_kpis_{timestamp}.json"

        filepath = os.path.join(os.path.dirname(__file__), '..', filename)

        try:
            with open(filepath, 'w') as f:
                json.dump(kpis, f, indent=2, default=str)
            logger.info(f"Combined KPIs exported to {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Error exporting Combined KPIs to JSON: {e}")
            return None

# Example usage and testing
if __name__ == "__main__":
    extractor = CombinedKPIExtractor()

    # Test database connection
    if extractor.db.test_connection():
        print("✅ Database connection successful")

        # Extract all KPIs for the last year (default)
        kpis = extractor.extract_all_kpis()

        # Export to JSON
        export_path = extractor.export_kpis_to_json(kpis)

        print(f"📊 Combined KPIs extracted successfully")
        print(f"📁 Exported to: {export_path}")

        # Print summary
        print("\n📈 Combined KPI Summary:")
        print(f"- Safe On-Time Delivery Rate: {kpis.get('safe_on_time_delivery_rate', {}).get('safe_on_time_delivery_rate', 0):.2f}%")
        print(f"- R&R Eligibility Rate: {kpis.get('rr_eligible_trips', {}).get('rr_eligibility_rate', 0):.2f}%")
        print(f"- Average Driver Engagement Score: {kpis.get('driver_engagement_index', {}).get('avg_engagement_score', 0):.2f}")
        print(f"- Average Transporter Composite Score: {kpis.get('transporter_composite_score', {}).get('avg_composite_score', 0):.2f}")
        print(f"- Overall Fatigue Risk Score: {kpis.get('fatigue_risk_by_route_and_time', {}).get('overall_fatigue_risk_score', 0):.2f}")
        print(f"- Average Driver Performance Index: {kpis.get('driver_performance_index', {}).get('avg_driver_performance_index', 0):.2f}")
        print(f"- Risk-TAT Correlation: {kpis.get('driver_risk_vs_tat_heatmap', {}).get('correlation_coefficient', 0):.3f}")

    else:
        print("❌ Database connection failed")
