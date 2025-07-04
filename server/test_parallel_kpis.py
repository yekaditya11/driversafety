#!/usr/bin/env python3
"""
Test Parallel KPI Execution
Quick test to verify parallel execution works correctly
"""

import os
import sys
import time
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from the correct path
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Add current directory to path
sys.path.append(os.path.dirname(__file__))

async def test_parallel_execution():
    """Test parallel KPI execution"""
    print("🧪 Testing Parallel KPI Execution")
    print("=" * 50)
    
    try:
        # Import the extractors
        from data_extractor.operations_kpi_extractor import OperationsKPIExtractor
        from data_extractor.safety_kpi_extractor import SafetyKPIExtractor
        from data_extractor.combined_kpi_extractor import CombinedKPIExtractor
        from concurrent.futures import ThreadPoolExecutor
        
        # Initialize extractors
        print("📊 Initializing KPI extractors...")
        operations_extractor = OperationsKPIExtractor()
        safety_extractor = SafetyKPIExtractor()
        combined_extractor = CombinedKPIExtractor()
        
        # Test database connection
        print("🔍 Testing database connection...")
        from config.database import db
        if not db.test_connection():
            print("❌ Database connection failed")
            return
        print("✅ Database connection successful")
        
        # Set date range (last 30 days for faster testing)
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        print(f"📅 Date range: {start_date} to {end_date}")
        
        # Test sequential execution
        print("\n🔄 Testing Sequential Execution...")
        sequential_start = time.time()
        
        print("   - Extracting Operations KPIs...")
        ops_start = time.time()
        operations_kpis = operations_extractor.extract_all_kpis(start_date, end_date)
        ops_time = time.time() - ops_start
        
        print("   - Extracting Safety KPIs...")
        safety_start = time.time()
        safety_kpis = safety_extractor.extract_all_kpis(start_date, end_date)
        safety_time = time.time() - safety_start
        
        print("   - Extracting Combined KPIs...")
        combined_start = time.time()
        combined_kpis = combined_extractor.extract_all_kpis(start_date, end_date)
        combined_time = time.time() - combined_start
        
        sequential_total = time.time() - sequential_start
        
        # Test parallel execution
        print("\n⚡ Testing Parallel Execution...")
        parallel_start = time.time()
        
        def extract_operations_sync():
            return operations_extractor.extract_all_kpis(start_date, end_date)
        
        def extract_safety_sync():
            return safety_extractor.extract_all_kpis(start_date, end_date)
        
        def extract_combined_sync():
            return combined_extractor.extract_all_kpis(start_date, end_date)
        
        # Execute in parallel
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor(max_workers=3) as executor:
            operations_future = loop.run_in_executor(executor, extract_operations_sync)
            safety_future = loop.run_in_executor(executor, extract_safety_sync)
            combined_future = loop.run_in_executor(executor, extract_combined_sync)
            
            parallel_ops, parallel_safety, parallel_combined = await asyncio.gather(
                operations_future, safety_future, combined_future
            )
        
        parallel_total = time.time() - parallel_start
        
        # Results
        print("\n📊 Performance Results:")
        print("=" * 50)
        print(f"Sequential Execution:")
        print(f"   - Operations KPIs: {ops_time:.2f}s")
        print(f"   - Safety KPIs: {safety_time:.2f}s")
        print(f"   - Combined KPIs: {combined_time:.2f}s")
        print(f"   - Total Time: {sequential_total:.2f}s")
        
        print(f"\nParallel Execution:")
        print(f"   - Total Time: {parallel_total:.2f}s")
        
        speedup = sequential_total / parallel_total if parallel_total > 0 else 0
        time_saved = sequential_total - parallel_total
        
        print(f"\n🚀 Performance Improvement:")
        print(f"   - Speedup: {speedup:.2f}x")
        print(f"   - Time Saved: {time_saved:.2f}s ({(time_saved/sequential_total*100):.1f}%)")
        
        # Verify data integrity
        print(f"\n🔍 Data Integrity Check:")
        ops_match = len(operations_kpis) == len(parallel_ops)
        safety_match = len(safety_kpis) == len(parallel_safety)
        combined_match = len(combined_kpis) == len(parallel_combined)
        
        print(f"   - Operations KPIs match: {'✅' if ops_match else '❌'}")
        print(f"   - Safety KPIs match: {'✅' if safety_match else '❌'}")
        print(f"   - Combined KPIs match: {'✅' if combined_match else '❌'}")
        
        if ops_match and safety_match and combined_match:
            print("✅ All data integrity checks passed!")
        else:
            print("⚠️ Some data integrity issues detected")
        
        print(f"\n🎉 Parallel execution test completed successfully!")
        print(f"💡 Use the new endpoint: /api/all-kpis-parallel for {speedup:.1f}x faster KPI extraction")
        
    except Exception as e:
        print(f"❌ Error during parallel execution test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_parallel_execution())
