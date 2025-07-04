"""
KPI Data Loader for Chatbot
Loads and processes all KPI JSON files for AI context
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KPIDataLoader:
    """Load and process KPI data from JSON files for chatbot context"""
    
    def __init__(self, kpi_data_folder: str = None):
        """
        Initialize KPI Data Loader
        
        Args:
            kpi_data_folder: Path to folder containing KPI JSON files
        """
        if kpi_data_folder is None:
            # Default to kpi_data folder in server directory
            self.kpi_data_folder = Path(__file__).parent.parent / "kpi_data"
        else:
            self.kpi_data_folder = Path(kpi_data_folder)
            
        self.kpi_data = {}
        self.last_loaded = None
        
    def load_all_kpi_data(self) -> Dict[str, Any]:
        """
        Load all KPI data from JSON files
        
        Returns:
            Dictionary containing all KPI data organized by type
        """
        try:
            logger.info(f"Loading KPI data from {self.kpi_data_folder}")
            
            # Initialize data structure
            self.kpi_data = {
                'operations_kpis': {},
                'safety_kpis': {},
                'combined_kpis': {},
                'metadata': {
                    'loaded_at': datetime.now().isoformat(),
                    'files_loaded': [],
                    'total_files': 0
                }
            }
            
            # Check if folder exists
            if not self.kpi_data_folder.exists():
                logger.warning(f"KPI data folder does not exist: {self.kpi_data_folder}")
                return self.kpi_data
                
            # Load JSON files
            json_files = list(self.kpi_data_folder.glob("*.json"))
            
            if not json_files:
                logger.warning(f"No JSON files found in {self.kpi_data_folder}")
                return self.kpi_data
                
            for json_file in json_files:
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        
                    # Categorize based on filename
                    filename = json_file.stem.lower()
                    
                    if 'operations' in filename:
                        self.kpi_data['operations_kpis'] = data
                        logger.info(f"Loaded operations KPIs from {json_file.name}")
                    elif 'safety' in filename:
                        self.kpi_data['safety_kpis'] = data
                        logger.info(f"Loaded safety KPIs from {json_file.name}")
                    elif 'combined' in filename:
                        self.kpi_data['combined_kpis'] = data
                        logger.info(f"Loaded combined KPIs from {json_file.name}")
                    else:
                        # Generic KPI data
                        self.kpi_data[filename] = data
                        logger.info(f"Loaded generic KPI data from {json_file.name}")
                        
                    self.kpi_data['metadata']['files_loaded'].append(json_file.name)
                    
                except Exception as e:
                    logger.error(f"Error loading {json_file}: {e}")
                    continue
                    
            self.kpi_data['metadata']['total_files'] = len(self.kpi_data['metadata']['files_loaded'])
            self.last_loaded = datetime.now()
            
            logger.info(f"Successfully loaded {self.kpi_data['metadata']['total_files']} KPI files")
            return self.kpi_data
            
        except Exception as e:
            logger.error(f"Error loading KPI data: {e}")
            return {}
            
    def get_kpi_summary(self) -> str:
        """
        Generate a summary of available KPI data for AI context
        
        Returns:
            String summary of KPI data structure and content
        """
        if not self.kpi_data:
            return "No KPI data loaded."
            
        summary_parts = []
        
        # Add metadata
        metadata = self.kpi_data.get('metadata', {})
        summary_parts.append(f"KPI Data Summary (Loaded: {metadata.get('loaded_at', 'Unknown')})")
        summary_parts.append(f"Total files loaded: {metadata.get('total_files', 0)}")
        summary_parts.append("")
        
        # Operations KPIs
        if self.kpi_data.get('operations_kpis'):
            ops_data = self.kpi_data['operations_kpis']
            summary_parts.append("=== OPERATIONS KPIs ===")
            
            if 'date_range' in ops_data:
                date_range = ops_data['date_range']
                summary_parts.append(f"Date Range: {date_range.get('start')} to {date_range.get('end')}")
                
            # List available KPI categories
            kpi_categories = [key for key in ops_data.keys() 
                            if key not in ['extraction_timestamp', 'date_range']]
            summary_parts.append(f"Available Operations KPIs ({len(kpi_categories)}):")
            for category in kpi_categories[:10]:  # Limit to first 10
                summary_parts.append(f"  - {category}")
            if len(kpi_categories) > 10:
                summary_parts.append(f"  ... and {len(kpi_categories) - 10} more")
            summary_parts.append("")
            
        # Safety KPIs
        if self.kpi_data.get('safety_kpis'):
            safety_data = self.kpi_data['safety_kpis']
            summary_parts.append("=== SAFETY KPIs ===")
            
            if 'date_range' in safety_data:
                date_range = safety_data['date_range']
                summary_parts.append(f"Date Range: {date_range.get('start')} to {date_range.get('end')}")
                
            # List available KPI categories
            kpi_categories = [key for key in safety_data.keys() 
                            if key not in ['extraction_timestamp', 'date_range']]
            summary_parts.append(f"Available Safety KPIs ({len(kpi_categories)}):")
            for category in kpi_categories[:10]:  # Limit to first 10
                summary_parts.append(f"  - {category}")
            if len(kpi_categories) > 10:
                summary_parts.append(f"  ... and {len(kpi_categories) - 10} more")
            summary_parts.append("")
            
        # Combined KPIs
        if self.kpi_data.get('combined_kpis'):
            combined_data = self.kpi_data['combined_kpis']
            summary_parts.append("=== COMBINED KPIs ===")
            
            if 'date_range' in combined_data:
                date_range = combined_data['date_range']
                summary_parts.append(f"Date Range: {date_range.get('start')} to {date_range.get('end')}")
                
            # List available KPI categories
            kpi_categories = [key for key in combined_data.keys() 
                            if key not in ['extraction_timestamp', 'date_range']]
            summary_parts.append(f"Available Combined KPIs ({len(kpi_categories)}):")
            for category in kpi_categories[:10]:  # Limit to first 10
                summary_parts.append(f"  - {category}")
            if len(kpi_categories) > 10:
                summary_parts.append(f"  ... and {len(kpi_categories) - 10} more")
            summary_parts.append("")
            
        return "\n".join(summary_parts)
        
    def get_specific_kpi(self, kpi_type: str, kpi_name: str) -> Optional[Dict]:
        """
        Get specific KPI data
        
        Args:
            kpi_type: Type of KPI ('operations', 'safety', 'combined')
            kpi_name: Name of the specific KPI
            
        Returns:
            KPI data if found, None otherwise
        """
        kpi_key = f"{kpi_type}_kpis"
        
        if kpi_key not in self.kpi_data:
            return None
            
        return self.kpi_data[kpi_key].get(kpi_name)
        
    def search_kpis(self, search_term: str) -> List[Dict]:
        """
        Search for KPIs containing the search term
        
        Args:
            search_term: Term to search for
            
        Returns:
            List of matching KPI data
        """
        results = []
        search_term_lower = search_term.lower()
        
        for kpi_type, kpi_data in self.kpi_data.items():
            if kpi_type == 'metadata':
                continue
                
            if isinstance(kpi_data, dict):
                for kpi_name, kpi_value in kpi_data.items():
                    if search_term_lower in kpi_name.lower():
                        results.append({
                            'type': kpi_type,
                            'name': kpi_name,
                            'data': kpi_value
                        })
                        
        return results
        
    def get_data_for_ai_context(self, max_length: int = 100000) -> str:
        """
        Get formatted KPI data for AI context with length limit
        
        Args:
            max_length: Maximum length of context string
            
        Returns:
            Formatted string for AI context
        """
        if not self.kpi_data:
            return "No KPI data available."
            
        context_parts = []
        context_parts.append("=== DRIVER SAFETY KPI DATA ===")
        context_parts.append(self.get_kpi_summary())
        context_parts.append("")
        context_parts.append("=== DETAILED KPI DATA ===")
        
        # Add comprehensive metrics from each category
        current_length = len("\n".join(context_parts))

        for kpi_type in ['operations_kpis', 'safety_kpis', 'combined_kpis']:
            if current_length >= max_length:
                break

            if kpi_type in self.kpi_data:
                kpi_data = self.kpi_data[kpi_type]
                context_parts.append(f"\n--- {kpi_type.upper().replace('_', ' ')} ---")

                # Add ALL metrics with intelligent truncation
                for key, value in kpi_data.items():
                    if key in ['extraction_timestamp', 'date_range']:
                        continue

                    # Include complete data but with smart formatting
                    if isinstance(value, dict):
                        # For complex objects, include key summary metrics
                        if len(str(value)) < 1000:
                            context_parts.append(f"{key}: {json.dumps(value, indent=2)}")
                        else:
                            # Extract key summary metrics for large objects
                            summary = self._extract_key_metrics(key, value)
                            context_parts.append(f"{key}: {summary}")
                    else:
                        context_parts.append(f"{key}: {value}")

                    current_length = len("\n".join(context_parts))
                    if current_length >= max_length:
                        break
                        
        context_str = "\n".join(context_parts)
        
        # Truncate if too long
        if len(context_str) > max_length:
            context_str = context_str[:max_length] + "\n... (truncated)"
            
        return context_str

    def get_complete_data_for_ai(self) -> str:
        """
        Get complete KPI data formatted for AI with minimal truncation

        Returns:
            Complete formatted string for AI context
        """
        if not self.kpi_data:
            return "No KPI data available."

        context_parts = []
        context_parts.append("=== COMPLETE DRIVER SAFETY KPI DATASET ===")
        context_parts.append(self.get_kpi_summary())
        context_parts.append("")

        # Add complete data for each category
        for kpi_type in ['operations_kpis', 'safety_kpis', 'combined_kpis']:
            if kpi_type in self.kpi_data:
                kpi_data = self.kpi_data[kpi_type]
                context_parts.append(f"\n=== {kpi_type.upper().replace('_', ' ')} - COMPLETE DATA ===")

                # Add date range info
                if 'date_range' in kpi_data:
                    date_range = kpi_data['date_range']
                    context_parts.append(f"Date Range: {date_range.get('start')} to {date_range.get('end')}")

                # Add all KPI data
                for key, value in kpi_data.items():
                    if key in ['extraction_timestamp', 'date_range']:
                        continue

                    context_parts.append(f"\n--- {key.upper().replace('_', ' ')} ---")

                    if isinstance(value, dict):
                        # Format nested data nicely
                        context_parts.append(json.dumps(value, indent=2))
                    else:
                        context_parts.append(str(value))

                context_parts.append("")  # Add spacing between categories

        return "\n".join(context_parts)

    def _extract_key_metrics(self, kpi_name: str, kpi_data: dict) -> str:
        """
        Extract key metrics from complex KPI data for AI context

        Args:
            kpi_name: Name of the KPI
            kpi_data: KPI data dictionary

        Returns:
            Formatted string with key metrics
        """
        try:
            key_metrics = []

            # Common patterns for extracting key information
            for key, value in kpi_data.items():
                # Include overall/average metrics
                if any(keyword in key.lower() for keyword in ['overall', 'avg', 'average', 'total', 'rate', 'score', 'count']):
                    if isinstance(value, (int, float)):
                        key_metrics.append(f"{key}: {value}")
                    elif isinstance(value, str):
                        key_metrics.append(f"{key}: {value}")

                # Include top/bottom performers (limited)
                elif any(keyword in key.lower() for keyword in ['top', 'bottom', 'best', 'worst', 'high', 'low']):
                    if isinstance(value, list) and len(value) > 0:
                        # Show first few items
                        items = value[:3] if len(value) > 3 else value
                        key_metrics.append(f"{key}: {json.dumps(items, indent=2)}")

                # Include distribution/breakdown data
                elif any(keyword in key.lower() for keyword in ['distribution', 'breakdown', 'by_']):
                    if isinstance(value, dict):
                        key_metrics.append(f"{key}: {json.dumps(value, indent=2)}")

            # If no key metrics found, include first few items
            if not key_metrics:
                for key, value in list(kpi_data.items())[:3]:
                    if isinstance(value, (int, float, str)):
                        key_metrics.append(f"{key}: {value}")
                    elif isinstance(value, list) and len(value) > 0:
                        key_metrics.append(f"{key}: {json.dumps(value[:2], indent=2)}")

            return "\n".join(key_metrics) if key_metrics else json.dumps(kpi_data, indent=2)[:500]

        except Exception as e:
            logger.error(f"Error extracting key metrics for {kpi_name}: {e}")
            return str(kpi_data)[:500]

    def refresh_data(self) -> bool:
        """
        Refresh KPI data from files
        
        Returns:
            True if successful, False otherwise
        """
        try:
            self.load_all_kpi_data()
            return True
        except Exception as e:
            logger.error(f"Error refreshing KPI data: {e}")
            return False
