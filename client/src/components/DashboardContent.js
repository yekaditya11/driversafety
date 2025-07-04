import React, { useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Fade,
  Button,
  IconButton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import KPICards from './KPICards';
import ChartsSection from './ChartsSection';
import AIDashboard from './AIDashboard';
import DatePickerFilter from './DatePickerFilter';
import { SiriAIInsightsButton } from './insights';
import useKPIData from '../hooks/useKPIData';

const DashboardContent = ({
  selectedView,
  dateRange,
  onDateRangeChange,
  startDate,
  endDate
}) => {

  // Use the KPI data hook with date parameters
  const {
    data: kpiData,
    loading,
    error,
    refreshData,
    clearError,
    getSafetyScore,
    getOnTimeDeliveryRate,
    getIncidentCount,
    getActiveDriverCount,
  } = useKPIData({
    startDate,
    endDate,
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
  });

  // Handle date range change
  const handleDateRangeChange = (newDateRange) => {
    onDateRangeChange(newDateRange);
  };

  // Transform data for components
  const dashboardData = {
    safetyScore: getSafetyScore(),
    onTimeDelivery: getOnTimeDeliveryRate(),
    incidents: getIncidentCount(),
    activeDrivers: getActiveDriverCount(),
    rawData: kpiData,
    // Direct data access for charts
    safety: kpiData.safety,
    operations: kpiData.operations,
    combined: kpiData.combined,
  };

  const renderContent = () => {
    switch (selectedView) {
      case 'dashboard':
        return (
          <Box sx={{
            minHeight: '100vh',
            backgroundColor: 'background.default',
          }}>
            {/* Header with date filter and refresh */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 4,
            }}>
              <Box>
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    mb: 0,
                    color: '#092f57',
                    letterSpacing: '-0.5px'
                  }}
                >
                  Driver Safety Dashboard
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Date Picker Filter */}
                <DatePickerFilter
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                  compact={true}
                />

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {/* Refresh Button */}
                  <IconButton
                    onClick={refreshData}
                    disabled={loading}
                    sx={{
                      bgcolor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: 1.5,
                      p: 1.5,
                      '&:hover': {
                        bgcolor: '#f8fafc',
                        borderColor: '#092f57',
                      },
                      '&:disabled': {
                        bgcolor: '#f1f5f9',
                      }
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={20} sx={{ color: '#092f57' }} />
                    ) : (
                      <RefreshIcon sx={{ fontSize: 20, color: '#092f57' }} />
                    )}
                  </IconButton>

                  {/* AI Insights Button */}
                  <SiriAIInsightsButton
                    startDate={startDate}
                    endDate={endDate}
                    loading={loading}
                  />
                </Box>
              </Box>
            </Box>

            {/* KPI Cards */}
            <KPICards data={dashboardData} loading={loading} />

            {/* Charts Section */}
            <ChartsSection loading={loading} data={dashboardData} />
          </Box>
        );

      case 'ai-dashboard':
        return <AIDashboard />;



      default:
        return (
          <Box sx={{
            minHeight: '100vh',
            backgroundColor: 'background.default',
          }}>
            {/* Header with date filter and refresh */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 4,
            }}>
              <Box>
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    mb: 0,
                    color: '#092f57',
                    letterSpacing: '-0.5px'
                  }}
                >
                  Driver Safety Dashboard
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Date Picker Filter */}
                <DatePickerFilter
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                  compact={true}
                />

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {/* Refresh Button */}
                  <IconButton
                    onClick={refreshData}
                    disabled={loading}
                    sx={{
                      bgcolor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: 1.5,
                      p: 1.5,
                      '&:hover': {
                        bgcolor: '#f8fafc',
                        borderColor: '#092f57',
                      },
                      '&:disabled': {
                        bgcolor: '#f1f5f9',
                      }
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={20} sx={{ color: '#092f57' }} />
                    ) : (
                      <RefreshIcon sx={{ fontSize: 20, color: '#092f57' }} />
                    )}
                  </IconButton>

                  {/* AI Insights Button */}
                  <SiriAIInsightsButton
                    startDate={startDate}
                    endDate={endDate}
                    loading={loading}
                  />
                </Box>
              </Box>
            </Box>

            {/* KPI Cards */}
            <KPICards data={dashboardData} loading={loading} />

            {/* Charts Section */}
            <ChartsSection loading={loading} data={dashboardData} />
          </Box>
        );
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 2, px: { xs: 1, sm: 2 }, width: '100%' }}>
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" size="small" onClick={clearError}>
                Dismiss
              </Button>
              <Button color="inherit" size="small" onClick={refreshData}>
                Retry
              </Button>
            </Box>
          }
        >
          <Typography variant="subtitle2" gutterBottom>
            Failed to load dashboard data
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Fade in={!loading} timeout={500}>
      <Box sx={{
        py: { xs: 2, sm: 3 },
        px: { xs: 1, sm: 1.5 },
        width: '100%',
      }}>
        {renderContent()}
      </Box>
    </Fade>
  );
};

export default DashboardContent;
