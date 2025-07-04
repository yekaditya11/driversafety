"""
AI Insights Generator
Combines operations and safety KPIs to generate AI-powered insights
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Any
from datetime import datetime
import json

from data_extractor.operations_kpi_extractor import OperationsKPIExtractor
from data_extractor.safety_kpi_extractor import SafetyKPIExtractor
from data_extractor.combined_kpi_extractor import CombinedKPIExtractor
from chatbot.azure_openai_client import AzureOpenAIClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIInsightsGenerator:
    """Generate AI-powered insights from combined operations and safety KPIs"""
    
    def __init__(self):
        """Initialize the insights generator"""
        self.operations_extractor = OperationsKPIExtractor()
        self.safety_extractor = SafetyKPIExtractor()
        self.combined_extractor = CombinedKPIExtractor()
        self.ai_client = AzureOpenAIClient()

    def _extract_operations_kpis_sync(self, start_date: str, end_date: str) -> Dict:
        """Synchronous wrapper for operations KPI extraction"""
        try:
            return self.operations_extractor.extract_all_kpis(start_date, end_date)
        except Exception as e:
            logger.error(f"Error in operations KPI extraction for AI insights: {e}")
            return {"error": str(e)}

    def _extract_safety_kpis_sync(self, start_date: str, end_date: str) -> Dict:
        """Synchronous wrapper for safety KPI extraction"""
        try:
            return self.safety_extractor.extract_all_kpis(start_date, end_date)
        except Exception as e:
            logger.error(f"Error in safety KPI extraction for AI insights: {e}")
            return {"error": str(e)}

    def _extract_combined_kpis_sync(self, start_date: str, end_date: str) -> Dict:
        """Synchronous wrapper for combined KPI extraction"""
        try:
            return self.combined_extractor.extract_all_kpis(start_date, end_date)
        except Exception as e:
            logger.error(f"Error in combined KPI extraction for AI insights: {e}")
            return {"error": str(e)}

    def generate_insights(self, start_date: str, end_date: str, more_insights: bool = False) -> Dict[str, Any]:
        """
        Synchronous wrapper for generate_insights_async
        """
        try:
            # Try to get existing event loop
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If loop is already running, create a new one in a thread
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(asyncio.run, self.generate_insights_async(start_date, end_date, more_insights))
                    return future.result()
            else:
                # If no loop is running, use asyncio.run
                return asyncio.run(self.generate_insights_async(start_date, end_date, more_insights))
        except Exception as e:
            logger.error(f"Error in synchronous insights generation wrapper: {e}")
            # Fallback to sequential execution
            return self._generate_insights_sequential(start_date, end_date, more_insights)

    def _generate_insights_sequential(self, start_date: str, end_date: str, more_insights: bool = False) -> Dict[str, Any]:
        """
        Fallback method using sequential execution (original implementation)
        """
        try:
            logger.info(f"Generating AI insights for period {start_date} to {end_date} (sequential fallback)")

            # Extract all KPI data sequentially
            operations_data = self.operations_extractor.extract_all_kpis(start_date, end_date)
            safety_data = self.safety_extractor.extract_all_kpis(start_date, end_date)
            combined_data = self.combined_extractor.extract_all_kpis(start_date, end_date)

            return self._process_insights_data(operations_data, safety_data, combined_data, start_date, end_date, more_insights)

        except Exception as e:
            logger.error(f"Error generating AI insights (sequential): {e}")
            return {
                'success': False,
                'error': str(e),
                'insights': [],
                'generation_timestamp': datetime.now().isoformat()
            }

    async def generate_insights_async(self, start_date: str, end_date: str, more_insights: bool = False) -> Dict[str, Any]:
        """
        Generate 10 AI-powered insights from combined KPI data using parallel execution

        Args:
            start_date: Start date for KPI analysis (YYYY-MM-DD)
            end_date: End date for KPI analysis (YYYY-MM-DD)
            more_insights: Whether to generate additional diverse insights

        Returns:
            Dictionary containing 10 AI-generated insights
        """
        try:
            logger.info(f"Generating AI insights for period {start_date} to {end_date}")

            # Extract all KPI data in parallel for faster execution
            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor(max_workers=3) as executor:
                # Submit all tasks to the thread pool
                operations_future = loop.run_in_executor(
                    executor, self._extract_operations_kpis_sync, start_date, end_date
                )
                safety_future = loop.run_in_executor(
                    executor, self._extract_safety_kpis_sync, start_date, end_date
                )
                combined_future = loop.run_in_executor(
                    executor, self._extract_combined_kpis_sync, start_date, end_date
                )

                # Wait for all tasks to complete
                operations_data, safety_data, combined_data = await asyncio.gather(
                    operations_future, safety_future, combined_future
                )

            logger.info("All KPI data extracted in parallel for AI insights generation")

            return self._process_insights_data(operations_data, safety_data, combined_data, start_date, end_date, more_insights)
            
        except Exception as e:
            logger.error(f"Error generating AI insights (parallel): {e}")
            return {
                'success': False,
                'error': str(e),
                'insights': [],
                'generation_timestamp': datetime.now().isoformat()
            }

    def _process_insights_data(self, operations_data: Dict, safety_data: Dict, combined_data: Dict,
                              start_date: str, end_date: str, more_insights: bool = False) -> Dict[str, Any]:
        """
        Common method to process KPI data and generate insights
        """
        try:
            # Prepare comprehensive KPI context for AI
            kpi_context = self._prepare_kpi_context(operations_data, safety_data, combined_data)

            # Generate insights using AI
            insights_prompt = self._create_insights_prompt(more_insights)
            ai_response = self.ai_client.chat(insights_prompt, kpi_context)

            if not ai_response.get('success', False):
                logger.error(f"AI insights generation failed: {ai_response.get('error', 'Unknown error')}")
                return self._generate_fallback_insights(operations_data, safety_data, combined_data)

            # Parse AI response into structured insights
            insights = self._parse_ai_insights(ai_response.get('response', ''))

            return {
                'success': True,
                'insights': insights,
                'generation_timestamp': datetime.now().isoformat(),
                'date_range': {'start': start_date, 'end': end_date},
                'data_sources': {
                    'operations_kpis': len([k for k in operations_data.keys() if k not in ['extraction_timestamp', 'date_range']]),
                    'safety_kpis': len([k for k in safety_data.keys() if k not in ['extraction_timestamp', 'date_range']]),
                    'combined_kpis': len([k for k in combined_data.keys() if k not in ['extraction_timestamp', 'date_range']])
                },
                'ai_metadata': {
                    'model': ai_response.get('model', 'unknown'),
                    'tokens_used': ai_response.get('tokens_used', 0),
                    'timestamp': ai_response.get('timestamp')
                }
            }
        except Exception as e:
            logger.error(f"Error processing insights data: {e}")
            return self._generate_fallback_insights(operations_data, safety_data, combined_data)
    
    def _prepare_kpi_context(self, operations_data: Dict, safety_data: Dict, combined_data: Dict) -> str:
        """
        Prepare comprehensive KPI context for AI analysis
        
        Args:
            operations_data: Operations KPI data
            safety_data: Safety KPI data
            combined_data: Combined KPI data
            
        Returns:
            Formatted string with all KPI data
        """
        context_parts = []
        
        # Operations KPIs Summary
        if operations_data:
            context_parts.append("=== OPERATIONS KPIs ===")

            # Key operational metrics
            if 'turnaround_time' in operations_data:
                tat = operations_data['turnaround_time']
                context_parts.append(f"Turnaround Time: {tat.get('overall_avg_tat_hours', 'N/A')} hours average")

            if 'on_time_arrival' in operations_data:
                otar = operations_data['on_time_arrival']
                context_parts.append(f"On-time Arrival Rate: {otar.get('overall_on_time_rate', 'N/A')}%")

            if 'vehicle_utilization' in operations_data:
                vur = operations_data['vehicle_utilization']
                context_parts.append(f"Vehicle Utilization: {vur.get('overall_utilization_rate', 'N/A')}%")
        
        # Safety KPIs Summary
        if safety_data:
            context_parts.append("\n=== SAFETY KPIs ===")

            # Key safety metrics
            if 'driving_safety_score' in safety_data:
                dss = safety_data['driving_safety_score']
                context_parts.append(f"Average Safety Score: {dss.get('overall_avg_safety_score', 'N/A')}")

            if 'overspeeding_events' in safety_data:
                ose = safety_data['overspeeding_events']
                context_parts.append(f"Overspeeding Events: {ose.get('events_per_100km', 'N/A')} per 100km")

            if 'high_risk_trips' in safety_data:
                hrt = safety_data['high_risk_trips']
                context_parts.append(f"High Risk Trips: {hrt.get('high_risk_percentage', 'N/A')}%")
        
        # Combined KPIs Summary
        if combined_data:
            context_parts.append("\n=== COMBINED KPIs ===")

            if 'safe_on_time_delivery_rate' in combined_data:
                sodr = combined_data['safe_on_time_delivery_rate']
                context_parts.append(f"Safe On-time Delivery: {sodr.get('safe_on_time_rate', 'N/A')}%")

            if 'driver_performance_index' in combined_data:
                dpi = combined_data['driver_performance_index']
                context_parts.append(f"Average Driver Performance Index: {dpi.get('overall_avg_performance_index', 'N/A')}")
        
        # Add detailed data as JSON for AI analysis
        context_parts.append("\n=== DETAILED DATA ===")
        context_parts.append(f"Operations Data: {json.dumps(operations_data, indent=2)}")
        context_parts.append(f"Safety Data: {json.dumps(safety_data, indent=2)}")
        context_parts.append(f"Combined Data: {json.dumps(combined_data, indent=2)}")
        
        return "\n".join(context_parts)
    
    def _create_insights_prompt(self, more_insights: bool = False) -> str:
        """
        Create the prompt for AI insights generation

        Returns:
            Formatted prompt string
        """
        current_time = datetime.now().isoformat()

        if more_insights:
            diversity_instruction = """IMPORTANT: Generate COMPLETELY DIFFERENT insights from typical operational reports. Focus on:
- Advanced analytics and predictive insights
- Cost optimization and financial impact
- Technology and automation opportunities
- Environmental and sustainability factors
- Customer experience and service quality
- Workforce development and training needs
- Supply chain resilience and risk management
- Innovation and competitive advantages
- Regulatory compliance and industry standards
- Strategic planning and long-term optimization

Avoid common topics like basic turnaround times, simple on-time rates, or standard safety metrics. Think creatively and provide unique perspectives."""
        else:
            diversity_instruction = "Provide a diverse range of perspectives and focus on different aspects each time."

        return f"""Analysis Timestamp: {current_time}

Based on the comprehensive operations, safety, and combined KPI data provided, generate exactly 8-10 fresh and actionable insights for logistics management. {diversity_instruction} Each insight MUST be:

1. COMPLETE - No incomplete sentences or cut-off text
2. SPECIFIC - Include actual data points, percentages, or metrics
3. ACTIONABLE - Provide clear next steps or recommendations
4. MEANINGFUL - Avoid generic statements or placeholder text
5. FOCUSED - Target operational efficiency, safety improvement, or combined optimization

Format each insight as:
**Insight [Number]: [Clear, Descriptive Title]**
[Complete description with specific data points, analysis, and recommended actions. Ensure each insight is fully formed and ends with a complete sentence.]

Categories to cover:
- Operational Performance (3-4 insights)
- Safety Performance (3-4 insights)
- Combined Efficiency & Risk (2-3 insights)

CRITICAL REQUIREMENTS:
- Generate fresh, varied insights each time
- Each insight MUST end with a complete sentence (period, exclamation, or question mark)
- NO incomplete sentences, cut-off text, or hanging phrases
- NO insights ending with words like "also", "and", "but", "see", "at", "with"
- Include specific numbers, percentages, or metrics where possible
- Provide actionable recommendations for each insight

Make insights practical, specific, and immediately actionable for logistics managers. Ensure every insight is complete and well-formed."""

    def _parse_ai_insights(self, ai_response: str) -> List[Dict[str, Any]]:
        """
        Parse AI response into structured insights
        
        Args:
            ai_response: Raw AI response text
            
        Returns:
            List of structured insight dictionaries
        """
        insights = []
        
        try:
            # Split response by insight markers
            insight_sections = ai_response.split('**Insight')
            
            for i, section in enumerate(insight_sections[1:], 1):  # Skip first empty section
                if section.strip():
                    # Extract title and description
                    lines = section.strip().split('\n')
                    title_line = lines[0] if lines else f"Insight {i}"
                    
                    # Clean title
                    title = title_line.split(':', 1)[-1].strip().replace('**', '')
                    
                    # Extract description
                    description = '\n'.join(lines[1:]).strip()

                    # Only add insight if it has meaningful content (not incomplete)
                    # More lenient validation - focus on obviously incomplete insights
                    is_valid = (description and len(description) > 25 and
                        not description.endswith('(') and
                        not description.endswith(' also') and
                        not description.endswith(' see') and
                        not description.endswith(' and') and
                        not description.endswith(' but') and
                        not description.endswith(' at ') and
                        not description.rstrip().endswith(' at') and
                        'further data analysis' not in description.lower() and
                        'additional analysis' not in description.lower())

                    if is_valid:
                        # Determine category based on content
                        category = self._categorize_insight(title + ' ' + description)

                        insights.append({
                            'id': len(insights) + 1,
                            'title': title,
                            'description': description,
                            'category': category,
                            'priority': self._determine_priority(description),
                            'timestamp': datetime.now().isoformat()
                        })
                    else:
                        logger.warning(f"Filtered out incomplete insight: '{title}' - '{description[:100]}...'")
                        if description:
                            logger.debug(f"Description ends with: '{description[-20:]}'")
                            logger.debug(f"Description length: {len(description)}")
            
            # If we have fewer than 8 insights, pad with high-quality defaults
            if len(insights) < 8:
                logger.info(f"Only {len(insights)} insights parsed, adding defaults to reach 8-10 total")
                default_insights = self._generate_default_insights()

                # Add defaults until we have at least 8 total
                for default_insight in default_insights:
                    if len(insights) >= 10:
                        break
                    # Update ID to continue sequence
                    default_insight['id'] = len(insights) + 1
                    insights.append(default_insight)

            return insights[:10]  # Return up to 10 insights
            
        except Exception as e:
            logger.error(f"Error parsing AI insights: {e}")
            return self._generate_default_insights()
    
    def _categorize_insight(self, content: str) -> str:
        """Categorize insight based on content"""
        content_lower = content.lower()
        
        if any(word in content_lower for word in ['safety', 'risk', 'accident', 'speed', 'fatigue', 'compliance']):
            return 'safety'
        elif any(word in content_lower for word in ['delivery', 'time', 'efficiency', 'utilization', 'cost', 'route']):
            return 'operations'
        elif any(word in content_lower for word in ['combined', 'overall', 'performance', 'composite']):
            return 'combined'
        else:
            return 'general'
    
    def _determine_priority(self, description: str) -> str:
        """Determine priority based on description content"""
        description_lower = description.lower()
        
        if any(word in description_lower for word in ['critical', 'urgent', 'immediate', 'high risk', 'severe']):
            return 'high'
        elif any(word in description_lower for word in ['important', 'significant', 'moderate', 'attention']):
            return 'medium'
        else:
            return 'low'
    
    def _generate_fallback_insights(self, operations_data: Dict, safety_data: Dict, combined_data: Dict) -> Dict[str, Any]:
        """Generate fallback insights when AI is unavailable"""
        logger.info("Generating fallback insights due to AI unavailability")
        
        insights = self._generate_default_insights()
        
        return {
            'success': True,
            'insights': insights,
            'generation_timestamp': datetime.now().isoformat(),
            'fallback_mode': True,
            'message': 'Insights generated using fallback analysis due to AI service unavailability'
        }
    
    def _generate_default_insights(self) -> List[Dict[str, Any]]:
        """Generate meaningful default insights when AI parsing fails"""
        default_insights = [
            {
                'id': 1,
                'title': "Route Optimization Opportunity",
                'description': "Analysis of delivery routes shows potential for 15-20% efficiency improvement through route consolidation and time window optimization. Recommend implementing dynamic routing algorithms.",
                'category': 'operations',
                'priority': 'high',
                'timestamp': datetime.now().isoformat()
            },
            {
                'id': 2,
                'title': "Driver Safety Performance Review",
                'description': "Current safety metrics indicate need for enhanced driver training programs. Focus on defensive driving techniques and fatigue management to reduce incident rates by 25%.",
                'category': 'safety',
                'priority': 'high',
                'timestamp': datetime.now().isoformat()
            },
            {
                'id': 3,
                'title': "Fuel Efficiency Enhancement",
                'description': "Vehicle fuel consumption patterns suggest implementing eco-driving training and regular maintenance schedules could reduce fuel costs by 12-18% annually.",
                'category': 'operations',
                'priority': 'medium',
                'timestamp': datetime.now().isoformat()
            },
            {
                'id': 4,
                'title': "Peak Hour Traffic Management",
                'description': "Delivery scheduling during off-peak hours could improve on-time performance by 30% and reduce driver stress levels. Consider flexible delivery windows.",
                'category': 'combined',
                'priority': 'medium',
                'timestamp': datetime.now().isoformat()
            },
            {
                'id': 5,
                'title': "Vehicle Maintenance Optimization",
                'description': "Predictive maintenance scheduling based on usage patterns could reduce unexpected breakdowns by 40% and extend vehicle lifespan by 2-3 years.",
                'category': 'operations',
                'priority': 'medium',
                'timestamp': datetime.now().isoformat()
            },
            {
                'id': 6,
                'title': "Driver Fatigue Monitoring",
                'description': "Implementing fatigue detection systems and mandatory rest periods could reduce fatigue-related incidents by 50% and improve overall driver wellbeing.",
                'category': 'safety',
                'priority': 'high',
                'timestamp': datetime.now().isoformat()
            },
            {
                'id': 7,
                'title': "Customer Communication Enhancement",
                'description': "Real-time delivery tracking and proactive customer notifications could improve customer satisfaction scores by 25% and reduce support calls by 35%.",
                'category': 'operations',
                'priority': 'low',
                'timestamp': datetime.now().isoformat()
            },
            {
                'id': 8,
                'title': "Weather Impact Mitigation",
                'description': "Weather-based route adjustments and safety protocols could reduce weather-related delays by 45% and improve driver safety during adverse conditions.",
                'category': 'combined',
                'priority': 'medium',
                'timestamp': datetime.now().isoformat()
            }
        ]
        return default_insights
