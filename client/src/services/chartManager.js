/**
 * Chart Manager Service
 * Manages custom dashboard charts and integration with chatbot
 * Handles adding, removing, and organizing charts from AI-generated content
 */

import apiService from './apiService';

class ChartManager {
  constructor() {
    this.charts = [];
    this.listeners = [];
    this.isInitialized = false;

    // Initialize asynchronously to avoid blocking
    setTimeout(() => {
      this.loadCharts();
    }, 100);
  }

  // Initialize the chart manager
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      await this.loadCharts();
      this.isInitialized = true;
      console.log('ChartManager initialized successfully');
    } catch (error) {
      console.error('Error initializing ChartManager:', error);
    }
  }

  // Load charts from API or localStorage
  async loadCharts() {
    try {
      // Try to load from API first
      const response = await apiService.getAllCharts();
      this.charts = response.charts || [];
      console.log('Charts loaded from API:', this.charts.length);
    } catch (error) {
      console.warn('Failed to load charts from API, using localStorage:', error);
      // Fallback to localStorage
      this.loadFromLocalStorage();
    }
    
    this.notifyListeners();
  }

  // Load charts from localStorage
  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('customDashboardCharts');
      if (saved) {
        this.charts = JSON.parse(saved);
        console.log('Charts loaded from localStorage:', this.charts.length);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      this.charts = [];
    }
  }

  // Save charts to localStorage
  saveToLocalStorage() {
    try {
      localStorage.setItem('customDashboardCharts', JSON.stringify(this.charts));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  // Add chart from chatbot
  async addChart(chartConfig) {
    try {
      console.log('ChartManager: Adding chart', chartConfig);

      // Prepare chart data for API
      const chartData = {
        title: (typeof chartConfig?.title === 'string' ? chartConfig.title :
                typeof chartConfig?.title?.text === 'string' ? chartConfig.title.text : 'AI Generated Chart'),
        description: chartConfig.description || null,
        chart_config: chartConfig.chartData || chartConfig.chartConfig || chartConfig,
        source: chartConfig.source || 'chat',
        created_at: new Date().toISOString()
      };

      console.log('ChartManager: Prepared chart data', chartData);

      // Try API first
      try {
        const response = await apiService.saveChart(chartData);
        
        if (response.success || response.chart) {
          // Reload charts from API
          await this.loadCharts();
          this.showNotification('Chart added to dashboard successfully!', 'success');
          return response;
        }
      } catch (apiError) {
        console.warn('API save failed, using localStorage:', apiError);
        
        // Fallback to localStorage
        const localChart = {
          id: `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...chartData
        };
        
        this.charts.push(localChart);
        this.saveToLocalStorage();
        this.notifyListeners();
        this.showNotification('Chart added to dashboard (saved locally)!', 'success');
        return { success: true, chart: localChart };
      }
    } catch (error) {
      console.error('Error adding chart:', error);
      this.showNotification('Failed to add chart to dashboard', 'error');
      throw error;
    }
  }

  // Remove chart
  async removeChart(chartId) {
    try {
      // Try API first
      try {
        await apiService.deleteChart(chartId);
      } catch (apiError) {
        console.warn('API delete failed, removing from localStorage:', apiError);
      }
      
      // Remove from local state regardless
      this.charts = this.charts.filter(chart => chart.id !== chartId);
      this.saveToLocalStorage();
      this.notifyListeners();
      this.showNotification('Chart removed from dashboard', 'success');
    } catch (error) {
      console.error('Error removing chart:', error);
      this.showNotification('Failed to remove chart', 'error');
      throw error;
    }
  }

  // Update chart
  async updateChart(chartId, updates) {
    try {
      // Try API first
      try {
        await apiService.updateChart(chartId, updates);
      } catch (apiError) {
        console.warn('API update failed, updating localStorage:', apiError);
      }
      
      // Update local state
      this.charts = this.charts.map(chart => 
        chart.id === chartId ? { ...chart, ...updates } : chart
      );
      this.saveToLocalStorage();
      this.notifyListeners();
      this.showNotification('Chart updated successfully', 'success');
    } catch (error) {
      console.error('Error updating chart:', error);
      this.showNotification('Failed to update chart', 'error');
      throw error;
    }
  }

  // Get all charts
  getCharts() {
    return [...this.charts];
  }

  // Get chart by ID
  getChart(chartId) {
    return this.charts.find(chart => chart.id === chartId);
  }

  // Clear all charts
  async clearCharts() {
    try {
      // Note: We don't clear from API, only local state
      this.charts = [];
      this.saveToLocalStorage();
      this.notifyListeners();
      this.showNotification('All charts cleared from dashboard', 'success');
    } catch (error) {
      console.error('Error clearing charts:', error);
      this.showNotification('Failed to clear charts', 'error');
    }
  }

  // Reorder charts
  reorderCharts(startIndex, endIndex) {
    const result = Array.from(this.charts);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    this.charts = result;
    this.saveToLocalStorage();
    this.notifyListeners();
  }

  // Add listener for chart updates
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Remove listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.charts);
      } catch (error) {
        console.error('Error in chart manager listener:', error);
      }
    });
  }

  // Show notification (will be overridden by components)
  showNotification(message, severity = 'success') {
    console.log(`Notification (${severity}): ${message}`);

    // Try to use global notification function if available
    if (typeof window !== 'undefined' && window.showNotification) {
      window.showNotification(message, severity);
      return;
    }

    // Fallback to browser notification or console
    this.showBrowserNotification(message, severity);
  }

  // Show browser notification as fallback
  showBrowserNotification(message, severity) {
    // Create a simple toast notification
    if (typeof document !== 'undefined') {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease-in-out;
        max-width: 300px;
        word-wrap: break-word;
        background-color: ${severity === 'error' ? '#f44336' : severity === 'warning' ? '#ff9800' : '#4caf50'};
      `;

      notification.textContent = message;
      document.body.appendChild(notification);

      // Animate in
      setTimeout(() => {
        notification.style.transform = 'translateX(0)';
      }, 100);

      // Auto-hide after 4 seconds
      const autoHideTimeout = setTimeout(() => {
        hideNotification();
      }, 4000);

      const hideNotification = () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      };

      // Pause auto-hide on hover
      notification.addEventListener('mouseenter', () => {
        clearTimeout(autoHideTimeout);
      });

      // Resume auto-hide when mouse leaves
      notification.addEventListener('mouseleave', () => {
        setTimeout(hideNotification, 2000);
      });

      // Allow manual close on click
      notification.addEventListener('click', () => {
        clearTimeout(autoHideTimeout);
        hideNotification();
      });
    }
  }
}

// Create global instance
const chartManager = new ChartManager();

// Expose globally for chatbot integration
if (typeof window !== 'undefined') {
  window.addChartToDashboard = (chartConfig) => chartManager.addChart(chartConfig);
  window.chartManager = chartManager;
}

export default chartManager;
