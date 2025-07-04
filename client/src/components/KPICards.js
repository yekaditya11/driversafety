import React from 'react';
import {
  Grid,
  Card,
  Typography,
  Box,
  Skeleton,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  DirectionsCar as VehicleIcon,
} from '@mui/icons-material';

const KPICard = ({ title, value, unit, icon, loading }) => {
  if (loading) {
    return (
      <Card
        sx={{
          background: 'white',
          padding: '16px',
          borderRadius: '10px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          minHeight: '140px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Skeleton variant="circular" width={24} height={24} sx={{ position: 'absolute', top: 16, left: 16 }} />
        <Skeleton variant="text" width="70%" height={20} sx={{ mx: 'auto', mb: 1 }} />
        <Skeleton variant="text" width="50%" height={40} sx={{ mx: 'auto' }} />
      </Card>
    );
  }

  return (
    <Card
      sx={{
        background: 'white',
        padding: '16px',
        borderRadius: '10px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'translateY(0)',
        minHeight: '140px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        '&:hover': {
          boxShadow: '0 6px 20px 0 rgba(0, 0, 0, 0.15)',
          transform: 'translateY(-1px)',
          borderColor: '#d1d5db',
        },
      }}
    >
      {/* Icon in top left */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          color: '#092f57',
          opacity: 0.7,
        }}
      >
        {icon}
      </Box>

      {/* Value */}
      <Typography
        sx={{
          fontSize: '1.875rem',
          fontWeight: 600,
          marginBottom: '6px',
          color: '#092f57',
          textAlign: 'center',
        }}
      >
        {typeof value === 'number' ? value.toFixed(1) : value}
        {unit && (
          <Typography
            component="span"
            sx={{
              fontSize: '0.875rem',
              color: '#64748b',
              fontWeight: 500,
              ml: 0.5
            }}
          >
            {unit}
          </Typography>
        )}
      </Typography>

      {/* Title */}
      <Typography
        sx={{
          fontSize: '0.875rem',
          color: '#64748b',
          fontWeight: 500,
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        {title}
      </Typography>
    </Card>
  );
};

const KPICards = ({ data, loading }) => {
  // Extract real data from server response
  const safetyData = data?.rawData?.safety || {};
  const operationsData = data?.rawData?.operations || {};
  const combinedData = data?.rawData?.combined || {};

  // Calculate trend values (mock data for now - can be enhanced with historical data)
  const calculateTrend = (current, previous = null) => {
    if (!previous) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      trend: change >= 0 ? 'up' : 'down',
      value: Math.abs(change).toFixed(1)
    };
  };

  const kpiData = [
    {
      title: 'Overall Safety Score',
      value: safetyData?.driving_safety_score?.overall_avg_safety_score || 0,
      unit: '/100',
      icon: <SecurityIcon sx={{ fontSize: 20 }} />,
    },
    {
      title: 'On-Time Delivery Rate',
      value: operationsData?.on_time_arrival?.on_time_rate_pct || 0,
      unit: '%',
      icon: <ScheduleIcon sx={{ fontSize: 20 }} />,
    },
    {
      title: 'Total Active Drivers',
      value: safetyData?.driving_safety_score?.total_drivers || 0,
      unit: '',
      icon: <PeopleIcon sx={{ fontSize: 20 }} />,
    },
    {
      title: 'Vehicle Utilization',
      value: operationsData?.vehicle_utilization?.avg_utilization_pct || 0,
      unit: '%',
      icon: <VehicleIcon sx={{ fontSize: 20 }} />,
    },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      {/* Desktop: Equal width cards using flexbox */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          gap: 3,
          width: '100%'
        }}
      >
        {kpiData.map((kpi, index) => (
          <Box key={index} sx={{ flex: 1, minWidth: 0 }}>
            <KPICard
              title={kpi.title}
              value={kpi.value}
              unit={kpi.unit}
              icon={kpi.icon}
              loading={loading}
            />
          </Box>
        ))}
      </Box>

      {/* Mobile: Grid layout */}
      <Grid
        container
        spacing={{ xs: 2, sm: 3 }}
        sx={{ display: { xs: 'flex', md: 'none' } }}
      >
        {kpiData.map((kpi, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <KPICard
              title={kpi.title}
              value={kpi.value}
              unit={kpi.unit}
              icon={kpi.icon}
              loading={loading}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default KPICards;
