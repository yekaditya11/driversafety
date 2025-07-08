import { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/apiService';

/**
 * Custom hook for managing KPI data with parallel execution support
 * @param {Object} options - Configuration options
 * @param {string} options.startDate - Start date for KPI data
 * @param {string} options.endDate - End date for KPI data
 * @param {boolean} options.autoRefresh - Whether to auto-refresh data
 * @param {number} options.refreshInterval - Refresh interval in milliseconds
 * @param {boolean} options.useParallel - Whether to use parallel execution (default: true)
 * @param {string} options.executionMode - 'auto', 'parallel', or 'sequential' (default: 'auto')
 * @returns {Object} KPI data and management functions
 */
const useKPIData = (options = {}) => {
  const {
    startDate = null,
    endDate = null,
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes default
    useParallel = true,
    executionMode = 'auto', // 'auto', 'parallel', 'sequential'
  } = options;

  // State management
  const [data, setData] = useState({
    safety: null,
    operations: null,
    combined: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [executionStats, setExecutionStats] = useState(null);
  const [isParallelExecution, setIsParallelExecution] = useState(false);

  // Debounce mechanism to prevent rapid successive API calls
  const debounceTimeoutRef = useRef(null);
  const lastCallTimeRef = useRef(0);
  const DEBOUNCE_DELAY = 2000; // 2 seconds minimum between calls

  // Fetch all KPI data with execution mode support
  const fetchKPIData = useCallback(async (showLoading = true, mode = executionMode) => {
    try {
      // Debounce mechanism to prevent rapid successive calls
      const currentTime = Date.now();
      if (currentTime - lastCallTimeRef.current < DEBOUNCE_DELAY) {
        console.log('🚫 KPI fetch call debounced - too frequent');
        return;
      }
      lastCallTimeRef.current = currentTime;

      if (showLoading) setLoading(true);
      setError(null);

      let kpiData;
      const startTime = performance.now();

      // Choose execution method based on mode
      switch (mode) {
        case 'parallel':
          console.log('🚀 Forcing parallel execution...');
          kpiData = await apiService.getAllKPIsParallelOnly(startDate, endDate);
          // Transform parallel result to match expected format
          kpiData = {
            safety: { data: kpiData.data.safety_kpis },
            operations: { data: kpiData.data.operations_kpis },
            combined: { data: kpiData.data.combined_kpis },
            execution_stats: kpiData.execution_stats,
            parallel_execution: true
          };
          break;

        case 'sequential':
          console.log('🔄 Forcing sequential execution...');
          kpiData = await apiService.getAllKPIsSequential(startDate, endDate);
          break;

        case 'auto':
        default:
          console.log('🎯 Using auto execution mode...');
          kpiData = await apiService.getAllKPIs(startDate, endDate, useParallel);
          break;
      }

      const endTime = performance.now();
      const clientExecutionTime = (endTime - startTime) / 1000;

      setData({
        safety: kpiData.safety?.data || null,
        operations: kpiData.operations?.data || null,
        combined: kpiData.combined?.data || null,
      });

      setExecutionStats({
        ...kpiData.execution_stats,
        client_execution_time_seconds: clientExecutionTime,
        execution_mode: mode,
        total_time_with_network: clientExecutionTime
      });

      setIsParallelExecution(kpiData.parallel_execution || false);
      setLastUpdated(new Date());

      // Log performance info
      if (kpiData.execution_stats) {
        console.log(`📊 KPI Execution Stats:`, {
          mode: mode,
          server_time: kpiData.execution_stats.total_execution_time_seconds,
          client_time: clientExecutionTime,
          parallel: kpiData.parallel_execution
        });
      }

      return kpiData;
    } catch (err) {
      console.error('Error fetching KPI data:', err);
      setError(err.message || 'Failed to fetch KPI data');
      throw err;
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [startDate, endDate, executionMode, useParallel]);

  // Fetch specific KPI type
  const fetchSafetyKPIs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getSafetyKPIs(startDate, endDate);
      setData(prev => ({ ...prev, safety: response.data }));
      setLastUpdated(new Date());
      
      return response;
    } catch (err) {
      setError(err.message || 'Failed to fetch safety KPIs');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const fetchOperationsKPIs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getOperationsKPIs(startDate, endDate);
      setData(prev => ({ ...prev, operations: response.data }));
      setLastUpdated(new Date());
      
      return response;
    } catch (err) {
      setError(err.message || 'Failed to fetch operations KPIs');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const fetchCombinedKPIs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getCombinedKPIs(startDate, endDate);
      setData(prev => ({ ...prev, combined: response.data }));
      setLastUpdated(new Date());
      
      return response;
    } catch (err) {
      setError(err.message || 'Failed to fetch combined KPIs');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Refresh data
  const refreshData = useCallback(async () => {
    try {
      await apiService.refreshKPIData();
      await fetchKPIData(false); // Refresh without showing loading
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err.message || 'Failed to refresh data');
    }
  }, [fetchKPIData]);

  // Force parallel execution
  const fetchKPIDataParallel = useCallback(async (showLoading = true) => {
    console.log('⚡ Forcing parallel KPI execution...');
    return await fetchKPIData(showLoading, 'parallel');
  }, [fetchKPIData]);

  // Force sequential execution
  const fetchKPIDataSequential = useCallback(async (showLoading = true) => {
    console.log('🔄 Forcing sequential KPI execution...');
    return await fetchKPIData(showLoading, 'sequential');
  }, [fetchKPIData]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchKPIData();
  }, [fetchKPIData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchKPIData(false); // Auto-refresh without showing loading
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchKPIData]);

  // Derived state for easier access
  const hasData = data.safety || data.operations || data.combined;
  const isEmpty = !hasData && !loading;

  // Helper functions to extract specific metrics
  const getSafetyScore = () => {
    return data.safety?.driving_safety_score?.overall_avg_safety_score || 0;
  };

  const getOnTimeDeliveryRate = () => {
    return data.operations?.on_time_arrival?.on_time_rate_pct || 0;
  };

  const getIncidentCount = () => {
    return data.safety?.accident_near_miss_flags?.total_incidents || 0;
  };

  const getActiveDriverCount = () => {
    return data.safety?.driving_safety_score?.total_drivers || 0;
  };

  const getTopDrivers = (limit = 10) => {
    return data.safety?.driving_safety_score?.top_performers?.slice(0, limit) || [];
  };

  const getRecentIncidents = (limit = 10) => {
    return data.safety?.incident_reports?.recent_incidents?.slice(0, limit) || [];
  };

  return {
    // Data
    data,
    loading,
    error,
    lastUpdated,
    hasData,
    isEmpty,
    executionStats,
    isParallelExecution,

    // Actions
    fetchKPIData,
    fetchKPIDataParallel,
    fetchKPIDataSequential,
    fetchSafetyKPIs,
    fetchOperationsKPIs,
    fetchCombinedKPIs,
    refreshData,
    clearError,

    // Helper functions
    getSafetyScore,
    getOnTimeDeliveryRate,
    getIncidentCount,
    getActiveDriverCount,
    getTopDrivers,
    getRecentIncidents,

    // Performance info
    getExecutionMode: () => executionStats?.execution_mode || 'unknown',
    getServerExecutionTime: () => executionStats?.total_execution_time_seconds || 0,
    getClientExecutionTime: () => executionStats?.client_execution_time_seconds || 0,
    getTotalExecutionTime: () => executionStats?.total_time_with_network || 0,
  };
};

export default useKPIData;
