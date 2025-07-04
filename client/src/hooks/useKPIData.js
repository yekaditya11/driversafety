import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

/**
 * Custom hook for managing KPI data
 * @param {Object} options - Configuration options
 * @param {string} options.startDate - Start date for KPI data
 * @param {string} options.endDate - End date for KPI data
 * @param {boolean} options.autoRefresh - Whether to auto-refresh data
 * @param {number} options.refreshInterval - Refresh interval in milliseconds
 * @returns {Object} KPI data and management functions
 */
const useKPIData = (options = {}) => {
  const {
    startDate = null,
    endDate = null,
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes default
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

  // Fetch all KPI data
  const fetchKPIData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const kpiData = await apiService.getAllKPIs(startDate, endDate);
      
      setData({
        safety: kpiData.safety?.data || null,
        operations: kpiData.operations?.data || null,
        combined: kpiData.combined?.data || null,
      });
      
      setLastUpdated(new Date());
      
      return kpiData;
    } catch (err) {
      console.error('Error fetching KPI data:', err);
      setError(err.message || 'Failed to fetch KPI data');
      throw err;
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [startDate, endDate]);

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

    // Actions
    fetchKPIData,
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
  };
};

export default useKPIData;
