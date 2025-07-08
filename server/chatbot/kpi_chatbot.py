"""
KPI Chatbot - Main conversation handler
Combines KPI data loading with Azure OpenAI for intelligent conversations
"""

import os
import sys
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from chatbot.kpi_data_loader import KPIDataLoader
from chatbot.azure_openai_client import AzureOpenAIClient
from chatbot.chart_generator import EChartsGenerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KPIChatbot:
    """Main KPI Chatbot class that handles conversations about KPI data"""
    
    def __init__(self, kpi_data_folder: str = None):
        """
        Initialize KPI Chatbot
        
        Args:
            kpi_data_folder: Path to folder containing KPI JSON files
        """
        self.data_loader = KPIDataLoader(kpi_data_folder)
        self.ai_client = AzureOpenAIClient()
        self.chart_generator = EChartsGenerator()
        self.session_id = None
        self.session_start_time = None
        self.total_questions = 0
        
        # Load initial KPI data
        self.refresh_kpi_data()
        
    def start_session(self, session_id: str = None) -> Dict[str, Any]:
        """
        Start a new chat session
        
        Args:
            session_id: Optional session identifier
            
        Returns:
            Session information
        """
        if not session_id:
            session_id = f"kpi_chat_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
        self.session_id = session_id
        self.session_start_time = datetime.now()
        self.total_questions = 0
        
        # Clear previous conversation
        self.ai_client.clear_conversation()
        
        logger.info(f"Started new KPI chat session: {session_id}")
        
        return {
            "session_id": session_id,
            "start_time": self.session_start_time.isoformat(),
            "status": "active",
            "kpi_data_loaded": bool(self.data_loader.kpi_data),
            "ai_client_ready": bool(self.ai_client.client),
            "welcome_message": self._get_welcome_message()
        }
        
    def _get_welcome_message(self) -> str:
        """Generate welcome message with KPI data summary"""
        if not self.data_loader.kpi_data:
            return """Welcome to the KPI Chatbot! 
            
 No KPI data is currently loaded. Please ensure KPI JSON files are available in the kpi_data folder.

You can ask me questions about:
- Operations KPIs (efficiency, routes, transporters)
- Safety KPIs (driver behavior, incidents, compliance)  
- Combined KPIs (integrated performance metrics)

How can I help you today?"""
        
        summary = self.data_loader.get_kpi_summary()
        
        return f"""Welcome to the Driver Safety KPI Chatbot!

I have access to comprehensive logistics and safety data. Here's what's available:

{summary}

You can ask me questions like:
• "What's the average safety score for drivers?"
• "Which transporters have the best performance?"
• "Show me the top routes by efficiency"
• "What are the main safety concerns?"
• "How is our on-time delivery rate?"

What would you like to know about the KPI data?"""

    def chat(self, user_message: str) -> Dict[str, Any]:
        """
        Process user message and return AI response
        
        Args:
            user_message: User's question or message
            
        Returns:
            Dictionary with response and metadata
        """
        try:
            if not self.session_id:
                # Auto-start session if not started
                self.start_session()
                
            self.total_questions += 1
            
            # Get complete KPI context for comprehensive analysis
            kpi_context = self.data_loader.get_complete_data_for_ai()
            
            # Process with AI
            ai_response = self.ai_client.chat(user_message, kpi_context)

            # Generate chart configuration if appropriate
            chart_config = None
            if ai_response.get('success', False):
                chart_config = self.chart_generator.generate_chart_config(
                    user_message,
                    ai_response.get('response', ''),
                    self.data_loader.kpi_data
                )

            # Add session metadata and chart config
            response = {
                **ai_response,
                "session_id": self.session_id,
                "question_number": self.total_questions,
                "session_duration_minutes": self._get_session_duration(),
                "kpi_data_timestamp": self.data_loader.last_loaded.isoformat() if self.data_loader.last_loaded else None,
                "chart_config": chart_config
            }
            
            logger.info(f"Processed question {self.total_questions} in session {self.session_id}")
            
            return response
            
        except Exception as e:
            logger.error(f"Error processing chat message: {e}")
            return {
                "success": False,
                "error": str(e),
                "response": "I encountered an error while processing your question. Please try again.",
                "session_id": self.session_id,
                "question_number": self.total_questions
            }
            
    def refresh_kpi_data(self) -> Dict[str, Any]:
        """
        Refresh KPI data from files
        
        Returns:
            Status of data refresh
        """
        try:
            success = self.data_loader.refresh_data()
            
            if success:
                logger.info("KPI data refreshed successfully")
                return {
                    "success": True,
                    "message": "KPI data refreshed successfully",
                    "files_loaded": self.data_loader.kpi_data.get('metadata', {}).get('files_loaded', []),
                    "last_updated": self.data_loader.last_loaded.isoformat() if self.data_loader.last_loaded else None
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to refresh KPI data",
                    "error": "Data loading failed"
                }
                
        except Exception as e:
            logger.error(f"Error refreshing KPI data: {e}")
            return {
                "success": False,
                "message": "Error refreshing KPI data",
                "error": str(e)
            }
            
    def get_session_info(self) -> Dict[str, Any]:
        """
        Get current session information
        
        Returns:
            Session details and statistics
        """
        return {
            "session_id": self.session_id,
            "start_time": self.session_start_time.isoformat() if self.session_start_time else None,
            "duration_minutes": self._get_session_duration(),
            "total_questions": self.total_questions,
            "kpi_data_status": {
                "loaded": bool(self.data_loader.kpi_data),
                "last_updated": self.data_loader.last_loaded.isoformat() if self.data_loader.last_loaded else None,
                "files_count": self.data_loader.kpi_data.get('metadata', {}).get('total_files', 0)
            },
            "ai_client_status": {
                "connected": bool(self.ai_client.client),
                "model": self.ai_client.model_name
            },
            "conversation_summary": self.ai_client.get_conversation_summary()
        }
        
    def _get_session_duration(self) -> float:
        """Get session duration in minutes"""
        if not self.session_start_time:
            return 0
        return (datetime.now() - self.session_start_time).total_seconds() / 60
        
    def search_kpis(self, search_term: str) -> Dict[str, Any]:
        """
        Search for specific KPIs
        
        Args:
            search_term: Term to search for
            
        Returns:
            Search results
        """
        try:
            results = self.data_loader.search_kpis(search_term)
            
            return {
                "success": True,
                "search_term": search_term,
                "results_count": len(results),
                "results": results[:10],  # Limit to top 10 results
                "message": f"Found {len(results)} KPIs matching '{search_term}'"
            }
            
        except Exception as e:
            logger.error(f"Error searching KPIs: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": f"Error searching for '{search_term}'"
            }
            
    def get_kpi_categories(self) -> Dict[str, Any]:
        """
        Get available KPI categories and their contents
        
        Returns:
            KPI categories information
        """
        try:
            if not self.data_loader.kpi_data:
                return {
                    "success": False,
                    "message": "No KPI data loaded"
                }
                
            categories = {}
            
            for category, data in self.data_loader.kpi_data.items():
                if category == 'metadata':
                    continue
                    
                if isinstance(data, dict):
                    kpi_names = [key for key in data.keys() 
                               if key not in ['extraction_timestamp', 'date_range']]
                    categories[category] = {
                        "count": len(kpi_names),
                        "kpis": kpi_names[:10],  # Limit to first 10
                        "has_more": len(kpi_names) > 10
                    }
                    
            return {
                "success": True,
                "categories": categories,
                "total_categories": len(categories)
            }
            
        except Exception as e:
            logger.error(f"Error getting KPI categories: {e}")
            return {
                "success": False,
                "error": str(e)
            }
            
    def export_session(self, include_kpi_data: bool = False) -> Dict[str, Any]:
        """
        Export current session data
        
        Args:
            include_kpi_data: Whether to include full KPI data in export
            
        Returns:
            Export status and file path
        """
        try:
            # Export conversation
            conversation_file = self.ai_client.export_conversation()
            
            if not conversation_file:
                return {
                    "success": False,
                    "message": "Failed to export conversation"
                }
                
            export_info = {
                "success": True,
                "conversation_file": conversation_file,
                "session_info": self.get_session_info()
            }
            
            # Optionally export KPI data
            if include_kpi_data and self.data_loader.kpi_data:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                kpi_file = f"session_kpi_data_{timestamp}.json"
                
                import json
                kpi_filepath = os.path.join(os.path.dirname(__file__), '..', kpi_file)
                
                with open(kpi_filepath, 'w', encoding='utf-8') as f:
                    json.dump(self.data_loader.kpi_data, f, indent=2, default=str)
                    
                export_info["kpi_data_file"] = kpi_filepath
                
            return export_info
            
        except Exception as e:
            logger.error(f"Error exporting session: {e}")
            return {
                "success": False,
                "error": str(e)
            }
            
    def end_session(self) -> Dict[str, Any]:
        """
        End current chat session
        
        Returns:
            Session summary
        """
        session_summary = self.get_session_info()
        
        # Clear session data
        self.session_id = None
        self.session_start_time = None
        self.total_questions = 0
        self.ai_client.clear_conversation()
        
        logger.info("KPI chat session ended")
        
        return {
            "message": "Session ended successfully",
            "session_summary": session_summary
        }
