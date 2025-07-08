import React from 'react';
import {
  Grid,
  Card,
  Typography,
  Box,
  Skeleton,
  Fade,
  useTheme,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  DirectionsCar as VehicleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

const KPICard = ({ title, value, unit, icon, loading, trend, index = 0 }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Card
        sx={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          padding: '24px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          minHeight: '160px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
            '@keyframes shimmer': {
              '0%': { backgroundPosition: '-200% 0' },
              '100%': { backgroundPosition: '200% 0' },
            },
          },
        }}
      >
        <Skeleton
          variant="circular"
          width={32}
          height={32}
          sx={{
            position: 'absolute',
            top: 20,
            left: 20,
            background: 'linear-gradient(90deg, #f0f0f0, #e0e0e0, #f0f0f0)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
        <Skeleton
          variant="text"
          width="70%"
          height={24}
          sx={{
            mx: 'auto',
            mb: 2,
            background: 'linear-gradient(90deg, #f0f0f0, #e0e0e0, #f0f0f0)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
        <Skeleton
          variant="text"
          width="50%"
          height={48}
          sx={{
            mx: 'auto',
            background: 'linear-gradient(90deg, #f0f0f0, #e0e0e0, #f0f0f0)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      </Card>
    );
  }

  return (
    <Fade in={true} timeout={600} style={{ transitionDelay: `${index * 150}ms` }}>
      <Card
        sx={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          padding: '24px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: 'translateY(0) scale(1)',
          minHeight: '160px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          overflow: 'hidden',
          cursor: 'pointer',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.info.main})`,
            opacity: 0.8,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
            pointerEvents: 'none',
          },
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            background: 'rgba(255, 255, 255, 0.98)',
            '&::before': {
              height: '4px',
              background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light}, ${theme.palette.info.light})`,
            },
          },
        }}
      >
        {/* Icon in top left */}
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            left: 20,
            color: theme.palette.primary.main,
            opacity: 0.8,
            zIndex: 2,
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 28 } })}
        </Box>

        {/* Trend indicator in top right */}
        {trend && (
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              zIndex: 2,
            }}
          >
            {trend.trend === 'up' ? (
              <TrendingUpIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 16, color: theme.palette.error.main }} />
            )}
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: trend.trend === 'up' ? theme.palette.success.main : theme.palette.error.main,
              }}
            >
              {trend.value}%
            </Typography>
          </Box>
        )}



        {/* Main content container */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            mt: 2,
            zIndex: 1,
          }}
        >
          {/* Value */}
          <Typography
            sx={{
              fontSize: '2.25rem',
              fontWeight: 700,
              marginBottom: '8px',
              color: theme.palette.primary.main,
              textAlign: 'center',
              lineHeight: 1,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {typeof value === 'number' ? value.toFixed(1) : value}
            {unit && (
              <Typography
                component="span"
                sx={{
                  fontSize: '1rem',
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  ml: 0.5,
                  background: 'none',
                  WebkitTextFillColor: theme.palette.text.secondary,
                }}
              >
                {unit}
              </Typography>
            )}
          </Typography>

          {/* Title */}
          <Typography
            sx={{
              fontSize: '0.9rem',
              color: theme.palette.text.secondary,
              fontWeight: 500,
              textAlign: 'center',
              lineHeight: 1.3,
              letterSpacing: '0.025em',
            }}
          >
            {title}
          </Typography>
        </Box>
      </Card>
    </Fade>
  );
};

const KPICards = ({ data, loading }) => {
  // Extract real data from server response
  const safetyData = data?.rawData?.safety || {};
  const operationsData = data?.rawData?.operations || {};

  // Mock trend data - in real app, this would come from historical comparison
  const generateMockTrend = () => {
    const change = (Math.random() - 0.5) * 20; // Random change between -10% and +10%
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
      icon: <SecurityIcon />,
      trend: generateMockTrend(),
    },
    {
      title: 'On-Time Delivery Rate',
      value: operationsData?.on_time_arrival?.on_time_rate_pct || 0,
      unit: '%',
      icon: <ScheduleIcon />,
      trend: generateMockTrend(),
    },
    {
      title: 'Total Active Drivers',
      value: safetyData?.driving_safety_score?.total_drivers || 0,
      unit: '',
      icon: <PeopleIcon />,
      trend: generateMockTrend(),
    },
    {
      title: 'Vehicle Utilization',
      value: operationsData?.vehicle_utilization?.avg_utilization_pct || 0,
      unit: '%',
      icon: <VehicleIcon />,
      trend: generateMockTrend(),
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
              trend={kpi.trend}
              loading={loading}
              index={index}
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
              trend={kpi.trend}
              loading={loading}
              index={index}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default KPICards;
