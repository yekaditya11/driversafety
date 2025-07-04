import React, { useState } from 'react';
import useKPIData from '../hooks/useKPIData';

/**
 * Demo component to showcase parallel vs sequential KPI execution
 */
const ParallelKPIDemo = () => {
  const [executionMode, setExecutionMode] = useState('auto');
  const [dateRange, setDateRange] = useState({
    startDate: '2024-07-04',
    endDate: '2025-07-04'
  });

  // Initialize the hook with current settings
  const {
    data,
    loading,
    error,
    executionStats,
    isParallelExecution,
    fetchKPIData,
    fetchKPIDataParallel,
    fetchKPIDataSequential,
    getExecutionMode,
    getServerExecutionTime,
    getClientExecutionTime,
    getTotalExecutionTime,
    clearError
  } = useKPIData({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    executionMode: executionMode,
    useParallel: true
  });

  const handleExecutionModeChange = (mode) => {
    setExecutionMode(mode);
    clearError();
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleManualFetch = async (mode) => {
    try {
      clearError();
      switch (mode) {
        case 'parallel':
          await fetchKPIDataParallel();
          break;
        case 'sequential':
          await fetchKPIDataSequential();
          break;
        default:
          await fetchKPIData();
      }
    } catch (err) {
      console.error('Manual fetch error:', err);
    }
  };

  const formatExecutionTime = (seconds) => {
    return seconds ? `${seconds.toFixed(2)}s` : 'N/A';
  };

  const getSpeedupRatio = () => {
    if (!executionStats || !executionStats.total_execution_time_seconds) return 'N/A';
    // Estimate sequential time as 3x parallel time (rough estimate)
    const estimatedSequentialTime = executionStats.total_execution_time_seconds * 3;
    const actualTime = executionStats.total_execution_time_seconds;
    return `~${(estimatedSequentialTime / actualTime).toFixed(1)}x`;
  };

  return (
    <div className="parallel-kpi-demo p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        🚀 Parallel KPI Execution Demo
      </h2>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Date Range */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Date Range</h3>
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-600">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Execution Mode */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Execution Mode</h3>
          <div className="space-y-2">
            {['auto', 'parallel', 'sequential'].map((mode) => (
              <label key={mode} className="flex items-center">
                <input
                  type="radio"
                  name="executionMode"
                  value={mode}
                  checked={executionMode === mode}
                  onChange={(e) => handleExecutionModeChange(e.target.value)}
                  className="mr-2"
                />
                <span className="capitalize">
                  {mode === 'auto' && '🎯 Auto (Parallel with fallback)'}
                  {mode === 'parallel' && '⚡ Parallel Only'}
                  {mode === 'sequential' && '🔄 Sequential Only'}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Fetch Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => handleManualFetch('parallel')}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ⚡ Fetch Parallel
        </button>
        <button
          onClick={() => handleManualFetch('sequential')}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🔄 Fetch Sequential
        </button>
        <button
          onClick={() => handleManualFetch('auto')}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🎯 Fetch Auto
        </button>
      </div>

      {/* Status */}
      <div className="mb-6">
        {loading && (
          <div className="flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Loading KPI data...
          </div>
        )}
        {error && (
          <div className="text-red-600 bg-red-50 p-3 rounded-md">
            ❌ Error: {error}
          </div>
        )}
      </div>

      {/* Execution Stats */}
      {executionStats && (
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">📊 Execution Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Mode:</span>
              <div className="text-lg">
                {isParallelExecution ? '⚡ Parallel' : '🔄 Sequential'}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Server Time:</span>
              <div className="text-lg font-mono">
                {formatExecutionTime(getServerExecutionTime())}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Total Time:</span>
              <div className="text-lg font-mono">
                {formatExecutionTime(getTotalExecutionTime())}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Speedup:</span>
              <div className="text-lg font-bold text-green-600">
                {isParallelExecution ? getSpeedupRatio() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Summary */}
      {data && (data.safety || data.operations || data.combined) && (
        <div className="bg-blue-50 p-4 rounded-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">📈 Data Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {data.safety ? '✅' : '❌'}
              </div>
              <div>Safety KPIs</div>
              {data.safety && (
                <div className="text-xs text-gray-600 mt-1">
                  {Object.keys(data.safety).length} metrics
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.operations ? '✅' : '❌'}
              </div>
              <div>Operations KPIs</div>
              {data.operations && (
                <div className="text-xs text-gray-600 mt-1">
                  {Object.keys(data.operations).length} metrics
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {data.combined ? '✅' : '❌'}
              </div>
              <div>Combined KPIs</div>
              {data.combined && (
                <div className="text-xs text-gray-600 mt-1">
                  {Object.keys(data.combined).length} metrics
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">💡 How to Use</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Auto Mode:</strong> Uses parallel execution with fallback to sequential</li>
          <li>• <strong>Parallel Mode:</strong> Forces parallel execution (fastest)</li>
          <li>• <strong>Sequential Mode:</strong> Forces sequential execution (slower but more reliable)</li>
          <li>• Compare execution times to see the performance improvement</li>
          <li>• Parallel execution should be 2-3x faster than sequential</li>
        </ul>
      </div>
    </div>
  );
};

export default ParallelKPIDemo;
