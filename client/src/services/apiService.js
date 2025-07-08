import axios from 'axios';

// Base URL for the API - adjust this based on your server configuration
const BASE_URL = process.env.REACT_APP_API_URL || 'http://16.170.98.127:8000';
// const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 120 seconds timeout for long-running operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging and authentication
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`Response received from: ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      console.error(`API Error ${status}:`, data);
      
      switch (status) {
        case 404:
          throw new Error('API endpoint not found. Please check if the server is running.');
        case 500:
          throw new Error('Internal server error. Please try again later.');
        case 503:
          throw new Error('Service unavailable. Please try again later.');
        default:
          throw new Error(data?.detail || data?.message || 'An unexpected error occurred.');
      }
    } else if (error.request) {
      // Network error
      throw new Error('Unable to connect to the server. Please check your connection and ensure the server is running.');
    } else {
      // Other error
      throw new Error(error.message || 'An unexpected error occurred.');
    }
  }
);

// API Service class
class ApiService {
  /**
   * Get Safety KPIs
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Object>} Safety KPI data
   */
  async getSafetyKPIs(startDate = null, endDate = null) {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await apiClient.get('/api/safety-kpis', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching safety KPIs:', error);
      throw error;
    }
  }

  /**
   * Get Operations KPIs
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Object>} Operations KPI data
   */
  async getOperationsKPIs(startDate = null, endDate = null) {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await apiClient.get('/api/operations-kpis', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching operations KPIs:', error);
      throw error;
    }
  }

  /**
   * Get Combined KPIs
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Object>} Combined KPI data
   */
  async getCombinedKPIs(startDate = null, endDate = null) {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await apiClient.get('/api/combined-kpis', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching combined KPIs:', error);
      throw error;
    }
  }

  /**
   * Get ALL KPIs (Operations, Safety, and Combined) executed in parallel for maximum performance
   * This method executes all three KPI extractors simultaneously, significantly reducing total execution time
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Object>} All KPI data with execution statistics
   */
  async getAllKPIsParallel(startDate = null, endDate = null) {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      console.log('🚀 Fetching all KPIs in parallel...');
      const startTime = performance.now();

      const response = await apiClient.get('/api/all-kpis-parallel', { params });

      const endTime = performance.now();
      const clientExecutionTime = (endTime - startTime) / 1000; // Convert to seconds

      console.log(`⚡ Parallel KPI fetch completed in ${clientExecutionTime.toFixed(2)}s`);
      console.log(`📊 Server execution time: ${response.data.execution_stats?.total_execution_time_seconds}s`);

      return response.data;
    } catch (error) {
      console.error('Error fetching all KPIs in parallel:', error);
      throw error;
    }
  }

  /**
   * Get AI-generated insights from combined KPI data
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @param {Object} options - Additional options like offset, limit, more_insights
   * @returns {Promise<Object>} AI insights data
   */
  async getAIInsights(startDate = null, endDate = null, options = {}) {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      // Add additional parameters for more insights
      if (options.offset) params.offset = options.offset;
      if (options.limit) params.limit = options.limit;
      if (options.more_insights) params.more_insights = options.more_insights;

      const response = await apiClient.get('/api/ai-insights', {
        params,
        timeout: 180000 // 3 minutes timeout for AI insights (OpenAI API calls can be slow)
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      throw error;
    }
  }

  /**
   * Get all KPIs at once using the parallel endpoint for maximum performance
   * No fallback to individual calls to avoid redundant processing
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @param {boolean} useParallel - Whether to use parallel endpoint (default: true)
   * @returns {Promise<Object>} All KPI data combined
   */
  async getAllKPIs(startDate = null, endDate = null, useParallel = true) {
    try {
      if (useParallel) {
        console.log('🚀 Using parallel KPI endpoint for optimal performance...');

        // Use the parallel endpoint - no fallback to avoid redundant calls
        const parallelResult = await this.getAllKPIsParallel(startDate, endDate);

        // Transform the parallel result to match the expected format
        return {
          safety: {
            success: parallelResult.success,
            data: parallelResult.data.safety_kpis,
            message: 'Safety KPIs extracted via parallel execution',
            extraction_timestamp: parallelResult.extraction_timestamp
          },
          operations: {
            success: parallelResult.success,
            data: parallelResult.data.operations_kpis,
            message: 'Operations KPIs extracted via parallel execution',
            extraction_timestamp: parallelResult.extraction_timestamp
          },
          combined: {
            success: parallelResult.success,
            data: parallelResult.data.combined_kpis,
            message: 'Combined KPIs extracted via parallel execution',
            extraction_timestamp: parallelResult.extraction_timestamp
          },
          timestamp: parallelResult.extraction_timestamp,
          execution_stats: parallelResult.execution_stats,
          parallel_execution: true
        };
      }

      // If parallel is disabled, throw error to force explicit choice
      throw new Error('Parallel execution is disabled. Use getAllKPIsSequential() for individual calls or enable parallel execution.');
    } catch (error) {
      console.error('Error fetching all KPIs:', error);
      throw error;
    }
  }

  /**
   * Force parallel execution of all KPIs (no fallback)
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Object>} All KPI data from parallel execution
   */
  async getAllKPIsParallelOnly(startDate = null, endDate = null) {
    console.log('⚡ Forcing parallel KPI execution...');
    return await this.getAllKPIsParallel(startDate, endDate);
  }

  /**
   * Force sequential execution of all KPIs (fallback method)
   * This makes individual API calls - use only when parallel endpoint fails
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Object>} All KPI data from sequential execution
   */
  async getAllKPIsSequential(startDate = null, endDate = null) {
    console.log('🔄 Using sequential KPI execution (individual API calls)...');

    const [safetyKPIs, operationsKPIs, combinedKPIs] = await Promise.all([
      this.getSafetyKPIs(startDate, endDate),
      this.getOperationsKPIs(startDate, endDate),
      this.getCombinedKPIs(startDate, endDate),
    ]);

    return {
      safety: safetyKPIs,
      operations: operationsKPIs,
      combined: combinedKPIs,
      timestamp: new Date().toISOString(),
      parallel_execution: false
    };
  }

  /**
   * Send chat message to KPI chatbot
   * @param {string} message - User message
   * @param {string} sessionId - Optional session ID
   * @returns {Promise<Object>} Chat response
   */
  async sendChatMessage(message, sessionId = null) {
    try {
      const payload = { message };
      if (sessionId) payload.session_id = sessionId;

      const response = await apiClient.post('/api/chat', payload, {
        timeout: 180000 // 3 minutes timeout for chat (OpenAI API calls can be slow)
      });
      return response.data;
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }

  /**
   * Start a new chat session
   * @returns {Promise<Object>} Session information
   */
  async startChatSession() {
    try {
      const response = await apiClient.post('/api/chat/session/start');
      return response.data;
    } catch (error) {
      console.error('Error starting chat session:', error);
      throw error;
    }
  }

  /**
   * End current chat session
   * @returns {Promise<Object>} Session summary
   */
  async endChatSession() {
    try {
      const response = await apiClient.post('/api/chat/session/end');
      return response.data;
    } catch (error) {
      console.error('Error ending chat session:', error);
      throw error;
    }
  }

  /**
   * Refresh KPI data on server
   * @returns {Promise<Object>} Refresh status
   */
  async refreshKPIData() {
    try {
      const response = await apiClient.post('/api/chat/refresh-data');
      return response.data;
    } catch (error) {
      console.error('Error refreshing KPI data:', error);
      throw error;
    }
  }

  /**
   * Check server health
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      console.error('Error checking server health:', error);
      throw error;
    }
  }

  // Chart Storage API Methods

  /**
   * Save a new chart configuration
   * @param {Object} chartData - Chart data to save
   * @returns {Promise<Object>} Saved chart response
   */
  async saveChart(chartData) {
    try {
      const response = await apiClient.post('/api/charts', chartData);
      return response.data;
    } catch (error) {
      console.error('Error saving chart:', error);
      throw error;
    }
  }

  /**
   * Get all saved charts
   * @returns {Promise<Object>} List of charts
   */
  async getAllCharts() {
    try {
      const response = await apiClient.get('/api/charts');
      return response.data;
    } catch (error) {
      console.error('Error getting charts:', error);
      throw error;
    }
  }

  /**
   * Get a specific chart by ID
   * @param {string} chartId - Chart ID
   * @returns {Promise<Object>} Chart data
   */
  async getChart(chartId) {
    try {
      const response = await apiClient.get(`/api/charts/${chartId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting chart:', error);
      throw error;
    }
  }

  /**
   * Update an existing chart
   * @param {string} chartId - Chart ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated chart response
   */
  async updateChart(chartId, updateData) {
    try {
      const response = await apiClient.put(`/api/charts/${chartId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating chart:', error);
      throw error;
    }
  }

  /**
   * Delete a chart
   * @param {string} chartId - Chart ID
   * @returns {Promise<Object>} Delete response
   */
  async deleteChart(chartId) {
    try {
      const response = await apiClient.delete(`/api/charts/${chartId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting chart:', error);
      throw error;
    }
  }

  // Dashboard Management API Methods

  /**
   * Add chart to dashboard (legacy method for compatibility)
   * @param {Object} chartData - Chart configuration
   * @param {string} title - Chart title
   * @param {string} source - Chart source
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Response
   */
  async addChartToDashboard(chartData, title, source = 'chat', userId = 'anonymous') {
    return this.saveChart({
      chart_config: chartData,
      title: title,
      description: null,
      source: source,
      user_id: userId
    });
  }

  /**
   * Save dashboard configuration
   * @param {string} dashboardName - Dashboard name
   * @param {Array} charts - Charts array
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Response
   */
  async saveDashboard(dashboardName, charts, userId = 'anonymous') {
    try {
      const response = await apiClient.post('/api/dashboard/save', {
        dashboard_name: dashboardName,
        charts: charts,
        user_id: userId
      });
      return response.data;
    } catch (error) {
      console.error('Error saving dashboard:', error);
      throw error;
    }
  }

  /**
   * Load dashboard configuration
   * @param {string} dashboardId - Dashboard ID
   * @returns {Promise<Object>} Dashboard data
   */
  async loadDashboard(dashboardId) {
    try {
      const response = await apiClient.get(`/api/dashboard/load/${dashboardId}`);
      return response.data;
    } catch (error) {
      console.error('Error loading dashboard:', error);
      throw error;
    }
  }

  /**
   * Get all saved dashboards
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Dashboards list
   */
  async getAllDashboards(userId = 'anonymous') {
    try {
      const response = await apiClient.get('/api/dashboard/list', {
        params: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting dashboards:', error);
      throw error;
    }
  }

  /**
   * Delete dashboard
   * @param {string} dashboardId - Dashboard ID
   * @returns {Promise<Object>} Delete response
   */
  async deleteDashboard(dashboardId) {
    try {
      const response = await apiClient.delete(`/api/dashboard/${dashboardId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
