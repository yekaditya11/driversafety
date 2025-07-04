#!/usr/bin/env python3
"""
Generate Real KPI Data for Chatbot
Uses the existing KPI extractors to pull real data from database and save as JSON files
"""

import os
import sys
import json
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from the correct path
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Add current directory to path
sys.path.append(os.path.dirname(__file__))

def generate_real_kpi_data():
    """Generate real KPI data using existing extractors"""
    print("🔄 Generating Real KPI Data from Database...")
    
    try:
        # Import the extractors
        from data_extractor.operations_kpi_extractor import OperationsKPIExtractor
        from data_extractor.safety_kpi_extractor import SafetyKPIExtractor
        from data_extractor.combined_kpi_extractor import CombinedKPIExtractor
        
        # Initialize extractors
        print("   - Initializing KPI extractors...")
        operations_extractor = OperationsKPIExtractor()
        safety_extractor = SafetyKPIExtractor()
        combined_extractor = CombinedKPIExtractor()
        
        # Set date range (last 1 year by default)
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')
        
        print(f"   - Date range: {start_date} to {end_date}")
        
        # Create kpi_data directory
        kpi_data_dir = Path(__file__).parent / "kpi_data"
        kpi_data_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        files_created = []
        
        # Extract Operations KPIs
        print("   - Extracting Operations KPIs...")
        try:
            operations_data = operations_extractor.extract_all_kpis(start_date, end_date)
            
            ops_file = kpi_data_dir / f"operations_kpis_{timestamp}.json"
            with open(ops_file, 'w', encoding='utf-8') as f:
                json.dump(operations_data, f, indent=2, default=str)
            files_created.append(str(ops_file))
            print("     ✅ Operations KPIs extracted successfully")
            
        except Exception as e:
            print(f"     ❌ Error extracting Operations KPIs: {e}")
        
        # Extract Safety KPIs
        print("   - Extracting Safety KPIs...")
        try:
            safety_data = safety_extractor.extract_all_kpis(start_date, end_date)
            
            safety_file = kpi_data_dir / f"safety_kpis_{timestamp}.json"
            with open(safety_file, 'w', encoding='utf-8') as f:
                json.dump(safety_data, f, indent=2, default=str)
            files_created.append(str(safety_file))
            print("     ✅ Safety KPIs extracted successfully")
            
        except Exception as e:
            print(f"     ❌ Error extracting Safety KPIs: {e}")
        
        # Extract Combined KPIs
        print("   - Extracting Combined KPIs...")
        try:
            combined_data = combined_extractor.extract_all_kpis(start_date, end_date)
            
            combined_file = kpi_data_dir / f"combined_kpis_{timestamp}.json"
            with open(combined_file, 'w', encoding='utf-8') as f:
                json.dump(combined_data, f, indent=2, default=str)
            files_created.append(str(combined_file))
            print("     ✅ Combined KPIs extracted successfully")
            
        except Exception as e:
            print(f"     ❌ Error extracting Combined KPIs: {e}")
        
        if files_created:
            print(f"\n✅ Real KPI data generated successfully!")
            print(f"📁 Location: {kpi_data_dir}")
            print("📄 Files created:")
            for file_path in files_created:
                print(f"   - {Path(file_path).name}")
            
            print(f"\n🤖 KPI Chatbot can now use this real data!")
            print("💡 The chatbot will have access to:")
            print("   - Real driver performance data")
            print("   - Actual transporter metrics")
            print("   - Live safety incidents and scores")
            print("   - Current operational efficiency metrics")
            
            return True
        else:
            print("❌ No KPI data files were created")
            return False
            
    except Exception as e:
        print(f"❌ Error generating real KPI data: {e}")
        import traceback
        traceback.print_exc()
        return False

def cleanup_old_files():
    """Clean up old KPI data files (keep only latest 5 of each type)"""
    print("\n🧹 Cleaning up old KPI data files...")
    
    try:
        kpi_data_dir = Path(__file__).parent / "kpi_data"
        if not kpi_data_dir.exists():
            return
        
        # Group files by type
        file_types = ['operations_kpis', 'safety_kpis', 'combined_kpis']
        
        for file_type in file_types:
            files = list(kpi_data_dir.glob(f"{file_type}_*.json"))
            files.sort(key=lambda x: x.stat().st_mtime, reverse=True)  # Sort by modification time
            
            # Keep only the latest 5 files of each type
            files_to_delete = files[5:]
            
            for file_path in files_to_delete:
                file_path.unlink()
                print(f"   - Deleted old file: {file_path.name}")
        
        print("✅ Cleanup completed")
        
    except Exception as e:
        print(f"⚠️ Error during cleanup: {e}")

def main():
    """Main function"""
    print("🚛 Driver Safety KPI Data Generator")
    print("=" * 50)
    print("This script extracts real KPI data from your database")
    print("and saves it as JSON files for the chatbot to use.")
    print("=" * 50)
    
    # Check database connection
    print("🔍 Checking database connection...")
    try:
        from config.database import db
        if db.test_connection():
            print("✅ Database connection successful")
        else:
            print("❌ Database connection failed")
            print("Please check your database configuration in .env file")
            return
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return
    
    # Generate real KPI data
    success = generate_real_kpi_data()
    
    if success:
        # Clean up old files
        cleanup_old_files()
        
        print("\n" + "=" * 50)
        print("🎉 KPI Data Generation Complete!")
        print("\n📋 Next Steps:")
        print("1. Start the server: python run_server.py")
        print("2. Test the chatbot at: http://localhost:8000/docs")
        print("3. Use the /api/chat endpoint to ask questions about your real KPI data")
        print("\n💬 Example questions:")
        print("   - 'What are the top performing transporters?'")
        print("   - 'Which drivers have safety issues?'")
        print("   - 'Show me our on-time delivery performance'")
        print("   - 'What are the main operational bottlenecks?'")
    else:
        print("\n❌ KPI data generation failed. Please check the errors above.")

if __name__ == "__main__":
    main()
