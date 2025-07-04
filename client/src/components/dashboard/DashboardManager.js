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

const DashboardManager = () => {
  const [savedCharts, setSavedCharts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  // Load charts from global chart manager
  useEffect(() => {
    // Get initial charts
    setSavedCharts(chartManager.getCharts());

    // Listen for chart updates
    const handleChartsUpdate = (charts) => {
      setSavedCharts(charts);
    };

    chartManager.addListener(handleChartsUpdate);

    // Override global notification function
    if (typeof window !== 'undefined') {
      window.showNotification = showNotification;
    }

    return () => {
      chartManager.removeListener(handleChartsUpdate);
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
        editMode={editMode}
        onEditModeChange={handleEditModeChange}
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
