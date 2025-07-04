"""
Azure OpenAI Client for KPI Chatbot
Handles communication with Azure OpenAI GPT-4.1-mini
"""

import os
import logging
from typing import List, Dict, Any
from datetime import datetime
import json
from dotenv import load_dotenv

# Load environment variables from the correct path
from pathlib import Path
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

try:
    from openai import AzureOpenAI
except ImportError:
    AzureOpenAI = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AzureOpenAIClient:
    """Azure OpenAI client for KPI chatbot conversations"""
    
    def __init__(self):
        """Initialize Azure OpenAI client"""
        self.client = None
        # Try to get model name from environment, fallback to gpt-4o-mini
        self.model_name = os.getenv("AZURE_OPENAI_MODEL_NAME", "gpt-4o-mini")
        self.conversation_history = []
        self.system_prompt = self._create_system_prompt()
        
        # Azure OpenAI configuration
        self.azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        self.api_key = os.getenv("AZURE_OPENAI_API_KEY")
        self.api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")
        
        self._initialize_client()
        
    def _initialize_client(self):
        """Initialize the Azure OpenAI client"""
        try:
            if not AzureOpenAI:
                logger.error("Azure OpenAI library not installed. Please install: pip install openai>=1.12.0")
                return False

            if not self.azure_endpoint or not self.api_key:
                logger.error("Azure OpenAI credentials not found. Please set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY environment variables.")
                return False

            # Try different initialization approaches for compatibility
            try:
                # Method 1: Standard initialization
                self.client = AzureOpenAI(
                    azure_endpoint=self.azure_endpoint,
                    api_key=self.api_key,
                    api_version=self.api_version
                )
            except TypeError as te:
                # Method 2: Alternative initialization for older versions
                logger.warning(f"Standard initialization failed: {te}. Trying alternative method...")
                self.client = AzureOpenAI(
                    azure_endpoint=self.azure_endpoint,
                    api_key=self.api_key,
                    api_version=self.api_version,
                    azure_deployment=None  # Explicitly set to None
                )

            logger.info("Azure OpenAI client initialized successfully")
            return True

        except Exception as e:
            logger.error(f"Error initializing Azure OpenAI client: {e}")
            logger.error("Please ensure you have the correct OpenAI library version: pip install openai>=1.12.0")
            return False
            
    def _create_system_prompt(self) -> str:
        """Create system prompt for KPI chatbot"""
        return """You are a specialized AI assistant for Driver Safety and Logistics KPI Analysis. You have access to comprehensive KPI data including:

**Operations KPIs (12 metrics):**
- Turnaround Time (TAT), Trip Count per Vehicle, Distance Efficiency
- Vehicle Utilization, On-time Arrival Rate, Trip Delays
- Transporter Performance, Missed Deliveries, Geo-deviation Events
- Loading/Unloading Time, Volume Fulfillment, Maintenance Downtime

**Safety KPIs (11 metrics):**
- Driving Safety Score, Phone Usage, Overspeeding Events
- Harsh Braking/Acceleration/Cornering, Rest Time Compliance
- High-Risk Trips, Incident Heatmaps, Repeat Offenders
- Checklist Compliance, Accident/Near-Miss Flags, Fatigue Scoring

**Combined KPIs (8 metrics):**
- Safe On-Time Delivery Rate, Driver Risk vs TAT Correlation
- Risk-Weighted Route Efficiency, R&R Eligible Trips
- Driver Engagement Index, Transporter Composite Score
- Fatigue Risk Analysis, Driver Performance Index

**Your Role:**
1. Answer questions about KPI data with specific numbers from the dataset
2. Give direct, short answers with key data points
3. Use actual driver names, transporter names, and exact values
4. Keep responses brief and to the point

**Response Guidelines:**
- Use specific data points and exact values from the KPI data
- Include names and scores for top performers
- Keep answers short - just the essential information
- No detailed analysis unless specifically requested

**Response Style:**
- Keep responses SHORT and SIMPLE - maximum 3-4 sentences
- Use bullet points for lists, avoid long paragraphs
- Lead with the direct answer, then provide 1-2 key data points
- NO detailed explanations, recommendations, or analysis unless specifically asked
- NO phrases like "If you want...", "Would you like...", "Let me know if..."
- Be conversational but concise

**Data Context:**
The complete KPI dataset will be provided with each conversation. Use ALL available data to provide comprehensive, accurate, and specific responses.

**Chart Generation Instructions:**
When users ask questions that would benefit from visual representation, you should format your response to enable automatic chart generation:

1. **Identify Chart Opportunities**: Look for questions about:
   - Comparisons: "compare", "vs", "which is better", "top", "bottom", "ranking"
   - Trends: "trend", "over time", "progress", "change", "growth"
   - Distributions: "breakdown", "distribution", "percentage", "share"
   - Performance: "performance", "scores", "ratings", "underperforming"
   - Lists: "show me", "list", "display", "vehicles", "drivers"

2. **Data Formatting for Charts**: When providing data that should be visualized, format it clearly:

   **For Rankings/Comparisons (Bar Charts):**
   ```
   Top Safety Performers:
   • John Smith: 95.2 points
   • Sarah Johnson: 92.8 points
   • Mike Wilson: 89.5 points
   ```

   **For Vehicle Data:**
   ```
   Underperforming Vehicles:
   • MNZ-908 (Truck): 3.82% utilization
   • ABC-123 (Van): 5.21% utilization
   • XYZ-456 (Truck): 7.15% utilization
   ```

   **For Location/Category Data:**
   ```
   Turnaround Time by Location:
   • Warehouse A: 2.5 hours
   • Distribution Center: 3.2 hours
   • Loading Dock: 1.8 hours
   ```

3. **Response Structure**: When providing data that should be charted:
   - Start with a brief answer (1-2 sentences)
   - Present data in a clear, structured format using bullet points
   - Use consistent formatting: "Name/Category: Value unit"
   - Include actual names, IDs, and exact numerical values
   - Keep data sets to 5-15 items for optimal visualization

4. **Data Quality Guidelines**:
   - Always use real data from the KPI dataset
   - Include specific names (drivers, vehicles, locations)
   - Provide exact numerical values with appropriate units
   - Use consistent formatting throughout the response
   - Avoid generic placeholders or example data

5. **Chart Type Triggers**:
   - Use bullet points (•) for bar chart data
   - Mention "trend" or "over time" for line charts
   - Use "distribution" or "breakdown" for pie charts
   - Include "score" or "rating" for gauge charts

The system will automatically detect when your response contains chartable data and generate appropriate visualizations."""

    def set_kpi_context(self, kpi_context: str):
        """
        Set KPI data context for the conversation
        
        Args:
            kpi_context: Formatted KPI data string
        """
        # Update system prompt with current KPI data
        self.current_context = f"{self.system_prompt}\n\n**CURRENT KPI DATA:**\n{kpi_context}"
        
    def chat(self, user_message: str, kpi_context: str = None) -> Dict[str, Any]:
        """
        Send a chat message and get response
        
        Args:
            user_message: User's question or message
            kpi_context: Current KPI data context
            
        Returns:
            Dictionary with response and metadata
        """
        try:
            if not self.client:
                return {
                    "success": False,
                    "error": "Azure OpenAI client not initialized",
                    "response": "Sorry, I'm having trouble connecting to the AI service. Please check the configuration."
                }
                
            # Update context if provided
            if kpi_context:
                self.set_kpi_context(kpi_context)
                
            # Prepare messages
            messages = [
                {"role": "system", "content": self.current_context}
            ]
            
            # Add conversation history (last 10 messages to avoid token limit)
            messages.extend(self.conversation_history[-10:])
            
            # Add current user message
            messages.append({"role": "user", "content": user_message})
            
            # Make API call
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.3,  # Lower temperature for more focused responses
                max_tokens=500,   # Reduced token limit for shorter responses
                top_p=0.9
            )
            
            # Extract response
            ai_response = response.choices[0].message.content
            
            # Update conversation history
            self.conversation_history.append({"role": "user", "content": user_message})
            self.conversation_history.append({"role": "assistant", "content": ai_response})
            
            # Keep conversation history manageable
            if len(self.conversation_history) > 20:
                self.conversation_history = self.conversation_history[-20:]
                
            return {
                "success": True,
                "response": ai_response,
                "timestamp": datetime.now().isoformat(),
                "tokens_used": response.usage.total_tokens if response.usage else 0,
                "model": self.model_name
            }
            
        except Exception as e:
            logger.error(f"Error in chat completion: {e}")
            return {
                "success": False,
                "error": str(e),
                "response": f"I encountered an error while processing your request: {str(e)}"
            }
            
    def clear_conversation(self):
        """Clear conversation history"""
        self.conversation_history = []
        logger.info("Conversation history cleared")
        
    def get_conversation_summary(self) -> Dict[str, Any]:
        """
        Get summary of current conversation
        
        Returns:
            Dictionary with conversation metadata
        """
        return {
            "total_messages": len(self.conversation_history),
            "user_messages": len([msg for msg in self.conversation_history if msg["role"] == "user"]),
            "assistant_messages": len([msg for msg in self.conversation_history if msg["role"] == "assistant"]),
            "last_interaction": self.conversation_history[-1]["content"] if self.conversation_history else None
        }
        
    def export_conversation(self, filename: str = None) -> str:
        """
        Export conversation history to JSON file
        
        Args:
            filename: Optional filename for export
            
        Returns:
            Path to exported file
        """
        try:
            if not filename:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"kpi_chat_conversation_{timestamp}.json"
                
            export_data = {
                "export_timestamp": datetime.now().isoformat(),
                "model": self.model_name,
                "conversation_history": self.conversation_history,
                "summary": self.get_conversation_summary()
            }
            
            filepath = os.path.join(os.path.dirname(__file__), '..', filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False)
                
            logger.info(f"Conversation exported to {filepath}")
            return filepath
            
        except Exception as e:
            logger.error(f"Error exporting conversation: {e}")
            return None
            
    def test_connection(self) -> bool:
        """
        Test Azure OpenAI connection
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            if not self.client:
                return False
                
            # Simple test message
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": "Hello, can you respond with 'Connection successful'?"}],
                max_tokens=10
            )
            
            return "successful" in response.choices[0].message.content.lower()
            
        except Exception as e:
            logger.error(f"Connection test failed: {e}")
            return False
            
    def get_available_models(self) -> List[str]:
        """
        Get list of available models (if supported by API)
        
        Returns:
            List of model names
        """
        try:
            # Note: Azure OpenAI might not support listing models
            # Return the configured model
            return [self.model_name]
        except Exception as e:
            logger.error(f"Error getting available models: {e}")
            return [self.model_name]
