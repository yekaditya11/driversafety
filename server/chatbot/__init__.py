"""
KPI Chatbot Package
Conversational AI for Driver Safety and Logistics KPI Analysis
"""

from .kpi_data_loader import KPIDataLoader
from .azure_openai_client import AzureOpenAIClient
from .kpi_chatbot import KPIChatbot

__version__ = "1.0.0"
__author__ = "Driver Safety KPI Team"

__all__ = [
    "KPIDataLoader",
    "AzureOpenAIClient", 
    "KPIChatbot"
]
