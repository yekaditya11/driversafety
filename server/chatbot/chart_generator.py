"""
ECharts Configuration Generator for KPI Data Visualization
Generates Apache ECharts configurations based on KPI data and user queries
"""

import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EChartsGenerator:
    """Simplified ECharts generator that analyzes user questions and AI responses directly"""

    def __init__(self):
        """Initialize the chart generator with color palettes and animation configs"""
        self.color_palettes = {
            'default': ['#7B9BD9', '#A8D4A8', '#FDD97A', '#F29999', '#9BD4E8', '#6BB896', '#FCA575', '#B584C7', '#F0A3D9', '#FFB8A3'],
            'safety': ['#F07A7A', '#F7B84A', '#F5D76B', '#5DD87A', '#5BC97A'],
            'performance': ['#6BB8E8', '#5BA3D9', '#B584C7', '#A66BC7', '#6B7A8E'],
            'gradient': ['#8FA3F0', '#9B6BC7', '#F5B8FC', '#F7859C', '#7AC4FE']
        }

        self.animation_config = {
            "animation": True,
            "animationDuration": 1000,
            "animationEasing": "cubicOut"
        }
        
    def _analyze_for_chart(self, user_message: str, ai_response: str) -> Dict[str, Any]:
        """
        Analyze user question and AI response to determine chart requirements

        Args:
            user_message: User's question
            ai_response: AI's text response

        Returns:
            Dictionary with chart analysis results
        """
        message_lower = user_message.lower()
        response_lower = ai_response.lower()
        combined_text = f"{message_lower} {response_lower}"

        # Check if chart should be generated
        chart_indicators = [
            'show', 'display', 'visualize', 'chart', 'graph', 'plot',
            'compare', 'comparison', 'trend', 'distribution', 'breakdown',
            'top', 'bottom', 'ranking', 'performance', 'analysis',
            'underperform', 'vehicles', 'which', 'list', 'score'
        ]

        should_generate = any(indicator in combined_text for indicator in chart_indicators)
        should_generate = should_generate or bool(re.search(r'\d+\.?\d*%?', response_lower))

        # Determine chart type based on content
        chart_type = 'bar'  # default
        if any(word in combined_text for word in ['trend', 'over time', 'timeline', 'progress']):
            chart_type = 'line'
        elif any(word in combined_text for word in ['distribution', 'breakdown', 'percentage', 'share']):
            chart_type = 'pie'
        elif any(word in combined_text for word in ['score', 'rating', 'index']) and 'vs' not in combined_text:
            chart_type = 'gauge'
        elif any(word in combined_text for word in ['correlation', 'relationship', 'vs', 'against']):
            chart_type = 'scatter'

        # Generate title
        title = "Driver Safety Analysis"
        if 'safety' in combined_text:
            title = "Safety Performance Analysis"
        elif 'performance' in combined_text:
            title = "Performance Analysis"
        elif 'utilization' in combined_text:
            title = "Vehicle Utilization Analysis"
        elif 'underperform' in combined_text:
            title = "Underperforming Analysis"

        # Choose theme based on content
        theme = 'default'
        if 'safety' in combined_text:
            theme = 'safety'
        elif 'performance' in combined_text:
            theme = 'performance'

        return {
            'should_generate': should_generate,
            'chart_type': chart_type,
            'title': title,
            'theme': theme
        }

    def _extract_chart_data(self, ai_response: str) -> Dict[str, Any]:
        """
        Simple data extraction from AI response for chart generation

        Args:
            ai_response: AI's text response

        Returns:
            Extracted data structure for charting
        """
        extracted_data = {
            'categories': [],
            'values': [],
            'series_data': []
        }

        # Simple patterns to extract data from AI response
        patterns = [
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*):\s*(\d+\.?\d*)\s*%?',  # "Name: 85.5%"
            r'(\d+)\.\s*([^:]+):\s*(\d+\.?\d*)\s*%?',  # "1. Name: 85.5%"
            r'[•\-\*]\s*([^:]+):\s*(\d+\.?\d*)\s*%?',  # "• Name: 85.5%"
            r'([A-Za-z][A-Za-z\s\-]+?)\s+(\d+\.?\d*)\s*%?'  # "Name 85.5%"
        ]

        # Try each pattern until we find matches
        for pattern in patterns:
            matches = re.findall(pattern, ai_response, re.MULTILINE | re.IGNORECASE)
            if matches:
                for match in matches:
                    try:
                        if len(match) == 2:
                            category, value = match
                        elif len(match) == 3:  # Handle numbered lists
                            _, category, value = match
                        else:
                            continue

                        # Clean category name
                        category = category.strip()
                        if len(category) < 2 or category.isdigit():
                            continue

                        # Convert value to float
                        value = float(value)
                        if value < 0 or value > 10000:
                            continue

                        extracted_data['categories'].append(category)
                        extracted_data['values'].append(value)

                    except (ValueError, AttributeError):
                        continue

                # If we found data, break and use it
                if extracted_data['categories'] and extracted_data['values']:
                    break

        return extracted_data

    def _create_chart_config(self, chart_type: str, data: Dict[str, Any], title: str, theme: str) -> Dict:
        """
        Create ECharts configuration with colors and animations

        Args:
            chart_type: Type of chart (bar, line, pie, etc.)
            data: Chart data with categories and values
            title: Chart title
            theme: Color theme to use

        Returns:
            Complete ECharts configuration
        """
        colors = self.color_palettes.get(theme, self.color_palettes['default'])

        base_config = {
            "title": {
                "text": title,
                "left": "center",
                "top": "2%",
                "textStyle": {
                    "fontSize": 18,
                    "fontWeight": "bold",
                    "color": "#2c3e50"
                }
            },
            "tooltip": {
                "trigger": "axis" if chart_type in ['bar', 'line'] else "item",
                "backgroundColor": "rgba(50, 50, 50, 0.9)",
                "borderColor": "#777",
                "textStyle": {"color": "#fff"},
                "formatter": "{b}<br/>{a}: {c}" if chart_type in ['bar', 'line'] else "{b}: {c} ({d}%)"
            },
            "color": colors,
            **self.animation_config
        }

        if chart_type == 'bar':
            return self._create_bar_config(base_config, data, colors)
        elif chart_type == 'line':
            return self._create_line_config(base_config, data, colors)
        elif chart_type == 'pie':
            return self._create_pie_config(base_config, data, colors)
        elif chart_type == 'gauge':
            return self._create_gauge_config(base_config, data, colors)
        else:
            return self._create_bar_config(base_config, data, colors)  # default

    def _create_bar_config(self, base_config: Dict, data: Dict, colors: List[str]) -> Dict:
        """Create bar chart configuration"""
        config = base_config.copy()
        config.update({
            "grid": {"left": "5%", "right": "5%", "bottom": "15%", "top": "15%", "containLabel": True},
            "xAxis": {
                "type": "category",
                "data": data['categories'],
                "axisLabel": {"fontSize": 11, "color": "#666", "rotate": 45},
                "axisLine": {"lineStyle": {"color": "#ddd"}}
            },
            "yAxis": {
                "type": "value",
                "axisLabel": {"fontSize": 11, "color": "#666"},
                "axisLine": {"lineStyle": {"color": "#ddd"}},
                "splitLine": {"lineStyle": {"color": "#f0f0f0"}}
            },
            "series": [{
                "name": "Value",
                "type": "bar",
                "data": data['values'],
                "itemStyle": {
                    "borderRadius": [4, 4, 0, 0]
                },
                "emphasis": {"itemStyle": {"shadowBlur": 10, "shadowColor": "rgba(0,0,0,0.3)"}}
            }]
        })
        return config

    def _create_line_config(self, base_config: Dict, data: Dict, colors: List[str]) -> Dict:
        """Create line chart configuration"""
        config = base_config.copy()
        config.update({
            "grid": {"left": "5%", "right": "5%", "bottom": "15%", "top": "15%", "containLabel": True},
            "xAxis": {
                "type": "category",
                "data": data['categories'],
                "boundaryGap": False,
                "axisLabel": {"fontSize": 11, "color": "#666", "rotate": 45}
            },
            "yAxis": {"type": "value", "axisLabel": {"fontSize": 11, "color": "#666"}},
            "series": [{
                "name": "Value",
                "type": "line",
                "data": data['values'],
                "smooth": True,
                "lineStyle": {"width": 3, "color": colors[0]},
                "itemStyle": {"color": colors[0], "borderWidth": 2},
                "areaStyle": {"color": "rgba(84, 112, 198, 0.3)"}
            }]
        })
        return config

    def _create_pie_config(self, base_config: Dict, data: Dict, colors: List[str]) -> Dict:
        """Create pie chart configuration"""
        pie_data = [{"name": cat, "value": val, "itemStyle": {"color": colors[i % len(colors)]}}
                   for i, (cat, val) in enumerate(zip(data['categories'], data['values']))]

        config = base_config.copy()
        config.update({
            "series": [{
                "name": "Distribution",
                "type": "pie",
                "radius": ["40%", "70%"],
                "center": ["50%", "60%"],
                "data": pie_data,
                "emphasis": {"itemStyle": {"shadowBlur": 10, "shadowOffsetX": 0, "shadowColor": "rgba(0, 0, 0, 0.5)"}},
                "label": {"show": True, "fontSize": 12},
                "labelLine": {"show": True}
            }]
        })
        return config

    def _create_gauge_config(self, base_config: Dict, data: Dict, colors: List[str]) -> Dict:
        """Create gauge chart configuration"""
        value = data['values'][0] if data['values'] else 0
        config = base_config.copy()
        config.update({
            "series": [{
                "name": "Score",
                "type": "gauge",
                "radius": "80%",
                "data": [{"value": value, "name": "Score"}],
                "detail": {"fontSize": 20, "color": colors[0]},
                "axisLine": {"lineStyle": {"color": [[0.3, colors[3]], [0.7, colors[1]], [1, colors[0]]], "width": 20}}
            }]
        })
        return config

    def _validate_and_clean_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate and clean extracted data for chart generation

        Args:
            data: Raw extracted data

        Returns:
            Cleaned and validated data
        """
        cleaned_data = {
            'categories': [],
            'values': [],
            'series_data': [],
            'title': data.get('title', 'KPI Analysis')
        }

        categories = data.get('categories', [])
        values = data.get('values', [])

        if not categories or not values:
            return cleaned_data

        # Ensure equal length
        min_length = min(len(categories), len(values))
        categories = categories[:min_length]
        values = values[:min_length]

        # Clean and validate each data point
        for i, (category, value) in enumerate(zip(categories, values)):
            try:
                # Clean category name
                if isinstance(category, str):
                    category = category.strip()
                    # Remove extra whitespace and special characters
                    category = re.sub(r'\s+', ' ', category)
                    category = re.sub(r'[^\w\s\-\(\)\.%]', '', category)

                    # Skip if too short or empty
                    if len(category) < 1:
                        continue

                # Validate and convert value
                if isinstance(value, (int, float)):
                    value = float(value)
                elif isinstance(value, str):
                    # Try to extract number from string
                    value_match = re.search(r'(\d+\.?\d*)', value)
                    if value_match:
                        value = float(value_match.group(1))
                    else:
                        continue
                else:
                    continue

                # Skip invalid values
                if value < 0 or value > 100000:  # Reasonable bounds
                    continue

                cleaned_data['categories'].append(category)
                cleaned_data['values'].append(round(value, 2))

            except (ValueError, TypeError, AttributeError):
                continue

        # Limit to reasonable number of items for visualization
        if len(cleaned_data['categories']) > 15:
            cleaned_data['categories'] = cleaned_data['categories'][:15]
            cleaned_data['values'] = cleaned_data['values'][:15]

        return cleaned_data

    def generate_bar_chart(self, data: Dict[str, Any], title: str = "KPI Comparison") -> Dict:
        """Generate enhanced bar chart configuration with better width and styling"""
        return {
            "title": {
                "text": title,
                "left": "center",
                "top": "2%",
                "textStyle": {
                    "fontSize": 18,
                    "fontWeight": "bold",
                    "color": "#2c3e50"
                }
            },
            "tooltip": {
                "trigger": "axis",
                "axisPointer": {
                    "type": "shadow"
                },
                "backgroundColor": "rgba(50, 50, 50, 0.9)",
                "borderColor": "#777",
                "textStyle": {
                    "color": "#fff"
                },
                "formatter": "{b}<br/>{a}: {c}"
            },
            "grid": {
                "left": "5%",
                "right": "5%",
                "bottom": "15%",
                "top": "15%",
                "containLabel": True
            },
            "xAxis": {
                "type": "category",
                "data": data.get('categories', []),
                "axisLabel": {
                    "rotate": 45,
                    "fontSize": 11,
                    "color": "#666",
                    "interval": 0
                },
                "axisLine": {
                    "lineStyle": {
                        "color": "#ddd"
                    }
                }
            },
            "yAxis": {
                "type": "value",
                "axisLabel": {
                    "fontSize": 11,
                    "color": "#666"
                },
                "axisLine": {
                    "lineStyle": {
                        "color": "#ddd"
                    }
                },
                "splitLine": {
                    "lineStyle": {
                        "color": "#f0f0f0"
                    }
                }
            },
            "series": [{
                "name": "Value",
                "type": "bar",
                "data": data.get('values', []),
                "itemStyle": {
                    "color": {
                        "type": "linear",
                        "x": 0,
                        "y": 0,
                        "x2": 0,
                        "y2": 1,
                        "colorStops": [
                            {"offset": 0, "color": "#5470c6"},
                            {"offset": 1, "color": "#91cc75"}
                        ]
                    },
                    "borderRadius": [4, 4, 0, 0]
                },
                "label": {
                    "show": True,
                    "position": "top",
                    "fontSize": 10,
                    "color": "#333",
                    "fontWeight": "bold"
                },
                "emphasis": {
                    "itemStyle": {
                        "color": "#ee6666"
                    }
                }
            }]
        }
        
    def generate_line_chart(self, data: Dict[str, Any], title: str = "KPI Trend") -> Dict:
        """Generate enhanced line chart configuration"""
        return {
            "title": {
                "text": title,
                "left": "center",
                "top": "2%",
                "textStyle": {
                    "fontSize": 18,
                    "fontWeight": "bold",
                    "color": "#2c3e50"
                }
            },
            "tooltip": {
                "trigger": "axis",
                "backgroundColor": "rgba(50, 50, 50, 0.9)",
                "borderColor": "#777",
                "textStyle": {
                    "color": "#fff"
                },
                "formatter": "{b}<br/>{a}: {c}"
            },
            "grid": {
                "left": "5%",
                "right": "5%",
                "bottom": "15%",
                "top": "15%",
                "containLabel": True
            },
            "xAxis": {
                "type": "category",
                "data": data.get('categories', []),
                "boundaryGap": False,
                "axisLabel": {
                    "fontSize": 11,
                    "color": "#666",
                    "rotate": 45
                },
                "axisLine": {
                    "lineStyle": {
                        "color": "#ddd"
                    }
                }
            },
            "yAxis": {
                "type": "value",
                "axisLabel": {
                    "fontSize": 11,
                    "color": "#666"
                },
                "axisLine": {
                    "lineStyle": {
                        "color": "#ddd"
                    }
                },
                "splitLine": {
                    "lineStyle": {
                        "color": "#f0f0f0"
                    }
                }
            },
            "series": [{
                "name": "Trend",
                "type": "line",
                "data": data.get('values', []),
                "smooth": True,
                "symbol": "circle",
                "symbolSize": 6,
                "itemStyle": {
                    "color": "#91cc75",
                    "borderColor": "#fff",
                    "borderWidth": 2
                },
                "lineStyle": {
                    "width": 3,
                    "color": {
                        "type": "linear",
                        "x": 0,
                        "y": 0,
                        "x2": 1,
                        "y2": 0,
                        "colorStops": [
                            {"offset": 0, "color": "#91cc75"},
                            {"offset": 1, "color": "#5470c6"}
                        ]
                    }
                },
                "areaStyle": {
                    "opacity": 0.2,
                    "color": {
                        "type": "linear",
                        "x": 0,
                        "y": 0,
                        "x2": 0,
                        "y2": 1,
                        "colorStops": [
                            {"offset": 0, "color": "rgba(145, 204, 117, 0.3)"},
                            {"offset": 1, "color": "rgba(145, 204, 117, 0.1)"}
                        ]
                    }
                },
                "emphasis": {
                    "itemStyle": {
                        "color": "#ee6666",
                        "borderColor": "#fff",
                        "borderWidth": 3
                    }
                }
            }]
        }
        
    def generate_pie_chart(self, data: Dict[str, Any], title: str = "KPI Distribution") -> Dict:
        """Generate enhanced pie chart configuration"""
        pie_data = []
        categories = data.get('categories', [])
        values = data.get('values', [])

        # Color palette for pie chart (lighter colors)
        colors = [
            "#7B9BD9", "#A8D4A8", "#FDD97A", "#F29999", "#9BD4E8",
            "#6BB896", "#FCA575", "#B584C7", "#F0A3D9", "#FFB8A3"
        ]

        for i, category in enumerate(categories):
            if i < len(values):
                pie_data.append({
                    "name": category,
                    "value": values[i],
                    "itemStyle": {
                        "color": colors[i % len(colors)]
                    }
                })

        return {
            "title": {
                "text": title,
                "left": "center",
                "top": "2%",
                "textStyle": {
                    "fontSize": 18,
                    "fontWeight": "bold",
                    "color": "#2c3e50"
                }
            },
            "tooltip": {
                "trigger": "item",
                "formatter": "{a} <br/>{b}: {c} ({d}%)",
                "backgroundColor": "rgba(50, 50, 50, 0.9)",
                "borderColor": "#777",
                "textStyle": {
                    "color": "#fff"
                }
            },
            "legend": {
                "orient": "horizontal",
                "bottom": "5%",
                "left": "center",
                "itemGap": 15,
                "textStyle": {
                    "fontSize": 11,
                    "color": "#666"
                },
                "itemWidth": 12,
                "itemHeight": 12
            },
            "series": [{
                "name": "Distribution",
                "type": "pie",
                "radius": ["0%", "60%"],
                "center": ["50%", "50%"],
                "avoidLabelOverlap": True,
                "data": pie_data,
                "label": {
                    "show": True,
                    "position": "outside",
                    "formatter": "{b}: {d}%",
                    "fontSize": 12,
                    "distanceToLabelLine": 10
                },
                "labelLine": {
                    "show": True,
                    "length": 15,
                    "length2": 20,
                    "smooth": False
                },
                "emphasis": {
                    "itemStyle": {
                        "shadowBlur": 10,
                        "shadowOffsetX": 0,
                        "shadowColor": "rgba(0, 0, 0, 0.5)"
                    },
                    "label": {
                        "show": True,
                        "fontSize": 14,
                        "fontWeight": "bold"
                    }
                }
            }]
        }
        
    def generate_gauge_chart(self, value: float, title: str = "KPI Score", max_value: float = 100) -> Dict:
        """Generate enhanced gauge chart configuration"""
        return {
            "title": {
                "text": title,
                "left": "center",
                "top": "2%",
                "textStyle": {
                    "fontSize": 18,
                    "fontWeight": "bold",
                    "color": "#2c3e50"
                }
            },
            "series": [{
                "name": "Score",
                "type": "gauge",
                "detail": {
                    "formatter": "{value}%"
                },
                "data": [{
                    "value": value,
                    "name": "Score"
                }],
                "min": 0,
                "max": max_value,
                "axisLine": {
                    "lineStyle": {
                        "width": 30,
                        "color": [
                            [0.3, '#fd666d'],
                            [0.7, '#37a2da'],
                            [1, '#67e0e3']
                        ]
                    }
                },
                "pointer": {
                    "itemStyle": {
                        "color": "auto"
                    }
                },
                "axisTick": {
                    "distance": -30,
                    "length": 8,
                    "lineStyle": {
                        "color": "#fff",
                        "width": 2
                    }
                },
                "splitLine": {
                    "distance": -30,
                    "length": 30,
                    "lineStyle": {
                        "color": "#fff",
                        "width": 4
                    }
                },
                "axisLabel": {
                    "color": "auto",
                    "distance": 40,
                    "fontSize": 20
                },
                "detail": {
                    "valueAnimation": True,
                    "formatter": "{value}",
                    "color": "auto"
                }
            }]
        }

    def generate_chart_config(self, user_message: str, ai_response: str, kpi_data: Dict = None) -> Optional[Dict]:
        """
        Simplified chart generation that analyzes user question and AI response directly

        Args:
            user_message: User's question
            ai_response: AI's text response
            kpi_data: Optional KPI data (kept for compatibility)

        Returns:
            ECharts configuration dictionary or None if no chart needed
        """
        try:
            # Analyze if chart is needed and what type
            chart_analysis = self._analyze_for_chart(user_message, ai_response)

            if not chart_analysis['should_generate']:
                return None

            # Extract data from AI response
            chart_data = self._extract_chart_data(ai_response)

            if not chart_data['categories'] or not chart_data['values']:
                return None

            # Generate chart config based on analysis
            return self._create_chart_config(
                chart_analysis['chart_type'],
                chart_data,
                chart_analysis['title'],
                chart_analysis['theme']
            )

        except Exception as e:
            logger.error(f"Error generating chart config: {e}")
            return None

    def _generate_chart_title(self, user_message: str, ai_response: str) -> str:
        """Generate appropriate chart title"""
        # Extract key terms from user message
        key_terms = []
        message_lower = user_message.lower()

        # Common KPI terms
        kpi_terms = ['safety', 'performance', 'efficiency', 'delivery', 'turnaround', 'utilization']
        for term in kpi_terms:
            if term in message_lower:
                key_terms.append(term.title())

        # Vehicle-specific terms
        if any(term in message_lower for term in ['vehicle', 'vehicles']):
            if 'underperform' in message_lower:
                return "Underperforming Vehicles - Utilization Analysis"
            elif 'utilization' in message_lower:
                return "Vehicle Utilization Analysis"
            else:
                return "Vehicle Performance Analysis"

        if key_terms:
            return f"{' & '.join(key_terms)} Analysis"
        else:
            return "KPI Analysis"

    def _extract_from_kpi_data(self, user_message: str, kpi_data: Dict) -> Dict[str, Any]:
        """
        Enhanced extraction of relevant data directly from KPI dataset based on user query

        Args:
            user_message: User's question
            kpi_data: Complete KPI dataset

        Returns:
            Extracted data structure for charting
        """
        extracted_data = {
            'categories': [],
            'values': [],
            'series_data': [],
            'title': 'KPI Analysis'
        }

        message_lower = user_message.lower()

        # Enhanced keyword matching for better data extraction
        try:
            # Safety-related queries
            if any(keyword in message_lower for keyword in ['safety', 'driver', 'score', 'performance']):
                if 'safety_kpis' in kpi_data:
                    safety_data = kpi_data['safety_kpis']

                    # Driving safety scores by driver
                    if 'driving_safety_score' in safety_data and 'by_driver' in safety_data['driving_safety_score']:
                        drivers = safety_data['driving_safety_score']['by_driver']

                        # Handle different query types
                        if any(word in message_lower for word in ['top', 'best', 'highest']):
                            # Sort by score descending and take top 10
                            sorted_drivers = sorted(drivers, key=lambda x: x.get('safety_score', 0), reverse=True)[:10]
                        elif any(word in message_lower for word in ['bottom', 'worst', 'lowest', 'underperform']):
                            # Sort by score ascending and take bottom 10
                            sorted_drivers = sorted(drivers, key=lambda x: x.get('safety_score', 0))[:10]
                        else:
                            # Default: take first 10 drivers
                            sorted_drivers = drivers[:10]

                        for driver in sorted_drivers:
                            name = driver.get('driver_name', 'Unknown')
                            score = driver.get('safety_score', 0)
                            if name != 'Unknown' and score > 0:
                                extracted_data['categories'].append(name)
                                extracted_data['values'].append(round(score, 2))

                    # Phone usage data
                    elif 'phone_usage' in safety_data and any(word in message_lower for word in ['phone', 'usage']):
                        phone_data = safety_data['phone_usage']
                        if 'by_driver' in phone_data:
                            for driver in phone_data['by_driver'][:10]:
                                name = driver.get('driver_name', 'Unknown')
                                usage = driver.get('phone_usage_minutes', 0)
                                if name != 'Unknown':
                                    extracted_data['categories'].append(name)
                                    extracted_data['values'].append(round(usage, 2))

            # Operations-related queries
            elif any(keyword in message_lower for keyword in ['operations', 'delivery', 'turnaround', 'tat', 'utilization']):
                if 'operations_kpis' in kpi_data:
                    ops_data = kpi_data['operations_kpis']

                    # Vehicle utilization
                    if any(word in message_lower for word in ['utilization', 'vehicle', 'usage']) and 'vehicle_utilization' in ops_data:
                        util_data = ops_data['vehicle_utilization']
                        if 'by_vehicle' in util_data:
                            vehicles = util_data['by_vehicle']

                            # Handle underperforming vehicles specifically
                            if 'underperform' in message_lower:
                                sorted_vehicles = sorted(vehicles, key=lambda x: x.get('utilization_percentage', 0))[:10]
                            else:
                                sorted_vehicles = vehicles[:10]

                            for vehicle in sorted_vehicles:
                                vehicle_id = vehicle.get('vehicle_id', 'Unknown')
                                utilization = vehicle.get('utilization_percentage', 0)
                                if vehicle_id != 'Unknown':
                                    extracted_data['categories'].append(vehicle_id)
                                    extracted_data['values'].append(round(utilization, 2))

                    # Turnaround time by location
                    elif any(word in message_lower for word in ['turnaround', 'tat', 'time']) and 'turnaround_time' in ops_data:
                        tat_data = ops_data['turnaround_time']
                        if 'by_location_type' in tat_data:
                            for location, data in tat_data['by_location_type'].items():
                                extracted_data['categories'].append(location.title())
                                extracted_data['values'].append(round(data.get('avg_tat_hours', 0), 2))
                        elif 'by_location' in tat_data:
                            for location in tat_data['by_location'][:10]:
                                name = location.get('location_name', 'Unknown')
                                time_val = location.get('avg_tat_hours', 0)
                                if name != 'Unknown':
                                    extracted_data['categories'].append(name)
                                    extracted_data['values'].append(round(time_val, 2))

                    # On-time delivery
                    elif any(word in message_lower for word in ['delivery', 'ontime', 'on-time']) and 'on_time_arrival_rate' in ops_data:
                        delivery_data = ops_data['on_time_arrival_rate']
                        if 'by_transporter' in delivery_data:
                            for transporter in delivery_data['by_transporter'][:10]:
                                name = transporter.get('transporter_name', 'Unknown')
                                rate = transporter.get('on_time_percentage', 0)
                                if name != 'Unknown':
                                    extracted_data['categories'].append(name)
                                    extracted_data['values'].append(round(rate, 2))

            # Combined KPIs
            elif 'combined_kpis' in kpi_data:
                combined_data = kpi_data['combined_kpis']

                # Driver performance index
                if any(word in message_lower for word in ['performance', 'index']) and 'driver_performance_index' in combined_data:
                    perf_data = combined_data['driver_performance_index']
                    if 'by_driver' in perf_data:
                        for driver in perf_data['by_driver'][:10]:
                            name = driver.get('driver_name', 'Unknown')
                            index = driver.get('performance_index', 0)
                            if name != 'Unknown':
                                extracted_data['categories'].append(name)
                                extracted_data['values'].append(round(index, 2))

        except Exception as e:
            logger.error(f"Error extracting from KPI data: {e}")

        return extracted_data
