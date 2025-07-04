#!/usr/bin/env python3
"""
Check Azure OpenAI Deployments
Help identify available model deployments
"""

import os
from dotenv import load_dotenv

# Load environment variables from the correct path
from pathlib import Path
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

def check_deployments():
    """Check available deployments and provide guidance"""
    print("🔍 Azure OpenAI Deployment Checker")
    print("=" * 50)
    
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    
    if not endpoint or not api_key:
        print("❌ Azure OpenAI credentials not found in .env file")
        return
    
    print(f"✅ Azure OpenAI Endpoint: {endpoint}")
    print(f"✅ API Key configured: {'*' * (len(api_key) - 4) + api_key[-4:]}")
    
    print("\n📋 To fix the DeploymentNotFound error:")
    print("\n**Option 1: Create GPT-4o-mini Deployment**")
    print("1. Go to Azure OpenAI Studio: https://oai.azure.com/")
    print("2. Navigate to 'Deployments'")
    print("3. Click 'Create new deployment'")
    print("4. Select model: GPT-4o-mini")
    print("5. Deployment name: gpt-4o-mini")
    print("6. Click 'Create'")
    
    print("\n**Option 2: Use Existing Deployment**")
    print("1. Check your existing deployments in Azure OpenAI Studio")
    print("2. Add this line to your .env file:")
    print("   AZURE_OPENAI_MODEL_NAME=your-existing-deployment-name")
    
    print("\n**Common Deployment Names:**")
    print("- gpt-4o-mini")
    print("- gpt-4o")
    print("- gpt-4")
    print("- gpt-35-turbo")
    
    print("\n**Your Current Configuration:**")
    print(f"- Endpoint: {endpoint}")
    print(f"- API Version: {os.getenv('AZURE_OPENAI_API_VERSION', 'Not set')}")
    print(f"- Model Name: {os.getenv('AZURE_OPENAI_MODEL_NAME', 'gpt-4o-mini (default)')}")
    
    print("\n💡 **Quick Fix:**")
    print("Add this line to your .env file:")
    print("AZURE_OPENAI_MODEL_NAME=your-actual-deployment-name")

if __name__ == "__main__":
    check_deployments()
