/**
 * Dashboard Manager Component
 * Manages custom dashboards and chart integration from chatbot
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import CustomDashboard from './CustomDashboard';
import chartManager from '../../services/chartManager';
import apiService from '../../services/apiService';
import eventBus, { EVENTS } from '../../utils/eventBus';

const DashboardManager = () => {
  const [savedCharts, setSavedCharts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  // Load charts from global chart manager
  useEffect(() => {
    // Initialize chart manager and load charts
    const initializeCharts = async () => {
      try {
        await chartManager.initialize();
        setSavedCharts(chartManager.getCharts());
      } catch (error) {
        console.error('Error initializing charts:', error);
      }
    };

    initializeCharts();

    // Listen for chart updates
    const handleChartsUpdate = (charts) => {
      console.log('DashboardManager: Charts updated, refreshing UI', charts.length);
      setSavedCharts([...charts]); // Force re-render with new array
    };

    chartManager.addListener(handleChartsUpdate);

    // Also listen to event bus for more reliable updates
    const unsubscribeChartAdded = eventBus.on(EVENTS.CHART_ADDED, (data) => {
      console.log('DashboardManager: Chart added event received', data);
      // Force immediate refresh
      const updatedCharts = chartManager.getCharts();
      setSavedCharts([...updatedCharts]);
    });

    const unsubscribeChartsUpdated = eventBus.on(EVENTS.CHARTS_UPDATED, (data) => {
      console.log('DashboardManager: Charts updated event received', data);
      setSavedCharts([...data.charts]);
    });

    // Override global notification function
    if (typeof window !== 'undefined') {
      window.showNotification = showNotification;
    }

    // Set up periodic refresh to catch any missed updates (reduced frequency)
    const refreshInterval = setInterval(() => {
      const currentCharts = chartManager.getCharts();
      setSavedCharts(prevCharts => {
        // Only update if charts have actually changed
        if (JSON.stringify(prevCharts) !== JSON.stringify(currentCharts)) {
          console.log('DashboardManager: Periodic refresh detected changes');
          return [...currentCharts];
        }
        return prevCharts;
      });
    }, 10000); // Check every 10 seconds (reduced from 5)

    return () => {
      chartManager.removeListener(handleChartsUpdate);
      unsubscribeChartAdded();
      unsubscribeChartsUpdated();
      clearInterval(refreshInterval);
    };
  }, []);

  // Show notification
  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  // Close notification
  const closeNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Manual refresh function
  const refreshCharts = async () => {
    try {
      setLoading(true);
      console.log('DashboardManager: Manual refresh triggered');

      // Force reload from API
      await chartManager.loadCharts();

      // Update local state
      const updatedCharts = chartManager.getCharts();
      setSavedCharts([...updatedCharts]);

      showNotification('Charts refreshed successfully!', 'success');
    } catch (error) {
      console.error('Error refreshing charts:', error);
      showNotification('Failed to refresh charts', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save dashboard configuration
  const saveDashboard = async (dashboardConfig) => {
    try {
      setLoading(true);
      
      // Save to backend if API is available
      try {
        await apiService.saveDashboard(
          dashboardConfig.name,
          dashboardConfig.charts,
          'anonymous'
        );
        showNotification(`Dashboard "${dashboardConfig.name}" saved successfully!`, 'success');
      } catch (apiError) {
        console.warn('Backend save failed, using local storage:', apiError);
        // Fallback to localStorage
        const savedDashboards = JSON.parse(localStorage.getItem('savedDashboards') || '[]');
        savedDashboards.push({
          ...dashboardConfig,
          id: `dashboard_${Date.now()}`
        });
        localStorage.setItem('savedDashboards', JSON.stringify(savedDashboards));
        showNotification(`Dashboard "${dashboardConfig.name}" saved locally!`, 'success');
      }
    } catch (error) {
      console.error('Error saving dashboard:', error);
      showNotification('Failed to save dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete chart
  const deleteChart = async (chartId) => {
    try {
      setLoading(true);
      await chartManager.removeChart(chartId);
      showNotification('Chart deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting chart:', error);
      showNotification('Failed to delete chart', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update dashboard (for reordering, etc.)
  const updateDashboard = async (updatedCharts) => {
    try {
      // Update the chart manager's internal state
      chartManager.charts = updatedCharts;
      chartManager.saveToLocalStorage();
      chartManager.notifyListeners();
    } catch (error) {
      console.error('Error updating dashboard:', error);
      showNotification('Failed to update dashboard', 'error');
    }
  };

  // Handle edit mode change
  const handleEditModeChange = (newEditMode) => {
    setEditMode(newEditMode);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <CustomDashboard
        savedCharts={savedCharts}
        onSaveChart={saveDashboard}
        onDeleteChart={deleteChart}
        onUpdateDashboard={updateDashboard}
        onRefreshCharts={refreshCharts}
        editMode={editMode}
        onEditModeChange={handleEditModeChange}
        loading={loading}
      />

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={closeNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DashboardManager;
