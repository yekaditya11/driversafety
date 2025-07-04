import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

// Helper functions to generate chart data from real KPI data

// 1. Driver Safety Score Distribution (Pie Chart)
const generateSafetyScoreDistribution = (safetyData) => {
  if (!safetyData?.driving_safety_score?.driver_safety_scores) {
    return [];
  }

  const drivers = safetyData.driving_safety_score.driver_safety_scores;
  const distribution = {
    'Excellent (90-100)': 0,
    'Good (80-89)': 0,
    'Average (70-79)': 0,
    'Poor (60-69)': 0,
    'Critical (<60)': 0
  };

  drivers.forEach(driver => {
    const score = driver.safety_score;
    if (score >= 90) distribution['Excellent (90-100)']++;
    else if (score >= 80) distribution['Good (80-89)']++;
    else if (score >= 70) distribution['Average (70-79)']++;
    else if (score >= 60) distribution['Poor (60-69)']++;
    else distribution['Critical (<60)']++;
  });

  const colors = ['#5A7BA3', '#6BB8E8', '#6BB896', '#F7B84A', '#F29999'];
  return Object.entries(distribution).map(([name, value], index) => ({
    name,
    value,
    color: colors[index],
    percentage: ((value / drivers.length) * 100).toFixed(1)
  }));
};



// 3. Turnaround Time by Location Type (Bar Chart)
const generateTurnaroundTimeData = (operationsData) => {
  if (!operationsData?.turnaround_time?.by_location_type) {
    return [];
  }

  const locationData = operationsData.turnaround_time.by_location_type;
  return Object.entries(locationData).map(([type, data]) => ({
    location: type,
    avgTime: data.avg_tat_hours || 0,
    tripCount: data.trip_count || 0,
  }));
};

// 4. Vehicle Utilization Trends (Line Chart)
const generateVehicleUtilizationTrends = (operationsData) => {
  if (!operationsData?.vehicle_utilization?.vehicle_utilization) {
    return [];
  }

  const vehicles = operationsData.vehicle_utilization.vehicle_utilization;
  return vehicles.slice(0, 10).map((vehicle, index) => ({
    vehicle: vehicle.plate_number || `V${index + 1}`,
    utilization: vehicle.avg_utilization_pct || 0,
    activeHours: vehicle.avg_daily_active_hours || 0,
    idleHours: (24 - (vehicle.avg_daily_active_hours || 0)),
  }));
};

// 5. Driver Risk vs TAT Heatmap (Area Chart)
const generateRiskVsTATData = (combinedData) => {
  if (!combinedData?.driver_risk_vs_tat_heatmap?.heatmap_data) {
    return [];
  }

  const heatmapData = combinedData.driver_risk_vs_tat_heatmap.heatmap_data;
  return heatmapData.map(item => ({
    category: `${item.risk_category} / ${item.tat_category}`,
    riskLevel: item.risk_category === 'Very Low Risk' ? 1 :
               item.risk_category === 'Low Risk' ? 2 :
               item.risk_category === 'Medium Risk' ? 3 : 4,
    driverCount: item.driver_count || 0,
    risk: item.risk_category,
    tat: item.tat_category,
  }));
};



// Chart Component 1: Driver Safety Score Distribution (Pie Chart)
const SafetyScoreDistributionChart = ({ loading, data }) => {
  const theme = useTheme();
  const safetyData = data?.safety || {};
  const chartData = generateSafetyScoreDistribution(safetyData);

  if (loading) {
    return (
      <Card sx={{ height: '100%', minHeight: '400px' }}>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width="60%" height={28} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={320} />
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card sx={{ height: '100%', minHeight: '400px' }}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Driver Safety Score Distribution
          </Typography>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No safety score data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box sx={{
          backgroundColor: 'background.paper',
          p: 2,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          boxShadow: 2
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Drivers: {data.value} ({data.percentage}%)
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Card sx={{ height: '100%', minHeight: '400px' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, color: '#092f57' }}>
          Driver Safety Score Distribution
        </Typography>
        <Box sx={{ flexGrow: 1, minHeight: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius="70%"
                innerRadius="30%"
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color, fontSize: '12px' }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};



// Chart Component 3: Turnaround Time by Location Type (Bar Chart)
const TurnaroundTimeChart = ({ loading, data }) => {
  const theme = useTheme();
  const operationsData = data?.operations || {};
  const chartData = generateTurnaroundTimeData(operationsData);

  if (loading) {
    return (
      <Card sx={{ height: '100%', minHeight: '400px' }}>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width="60%" height={28} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={320} />
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card sx={{ height: '100%', minHeight: '400px' }}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Turnaround Time by Location Type
          </Typography>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No turnaround time data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box sx={{
          backgroundColor: 'background.paper',
          p: 2,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          boxShadow: 2
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Avg Time: {data.avgTime.toFixed(1)} hours
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Trips: {data.tripCount}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Card sx={{ height: '100%', minHeight: '400px' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, color: '#092f57' }}>
          Turnaround Time by Location Type
        </Typography>
        <Box sx={{ flexGrow: 1, minHeight: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis
                dataKey="location"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="avgTime"
                fill="#6BB8E8"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

// Chart Component 4: Vehicle Utilization Trends (Line Chart)
const VehicleUtilizationChart = ({ loading, data }) => {
  const theme = useTheme();
  const operationsData = data?.operations || {};
  const chartData = generateVehicleUtilizationTrends(operationsData);

  if (loading) {
    return (
      <Card sx={{ height: '100%', minHeight: '400px' }}>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width="60%" height={28} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={320} />
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card sx={{ height: '100%', minHeight: '400px' }}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Vehicle Utilization Trends
          </Typography>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No vehicle utilization data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box sx={{
          backgroundColor: 'background.paper',
          p: 2,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          boxShadow: 2
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Utilization: {data.utilization.toFixed(1)}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Active: {data.activeHours.toFixed(1)}h
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Idle: {data.idleHours.toFixed(1)}h
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Card sx={{ height: '100%', minHeight: '400px' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, color: '#092f57' }}>
          Vehicle Utilization Trends
        </Typography>
        <Box sx={{ flexGrow: 1, minHeight: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis
                dataKey="vehicle"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="utilization"
                stroke="#092f57"
                strokeWidth={3}
                dot={{ fill: "#092f57", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#092f57", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

// Chart Component 5: Driver Risk vs TAT Heatmap (Area Chart)
const RiskVsTATChart = ({ loading, data }) => {
  const theme = useTheme();
  const combinedData = data?.combined || {};
  const chartData = generateRiskVsTATData(combinedData);

  if (loading) {
    return (
      <Card sx={{ height: '100%', minHeight: '400px' }}>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width="60%" height={28} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={320} />
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card sx={{ height: '100%', minHeight: '400px' }}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Driver Risk vs TAT Analysis
          </Typography>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No risk vs TAT data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box sx={{
          backgroundColor: 'background.paper',
          p: 2,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          boxShadow: 2
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {data.risk} / {data.tat}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Drivers: {data.driverCount}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Risk Level: {data.riskLevel}/4
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Card sx={{ height: '100%', minHeight: '400px' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, color: '#092f57' }}>
          Driver Risk vs TAT Analysis
        </Typography>
        <Box sx={{ flexGrow: 1, minHeight: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#092f57" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#092f57" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{ value: 'Driver Count', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="driverCount"
                stroke="#092f57"
                fillOpacity={1}
                fill="url(#colorRisk)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};



const ChartsSection = ({ loading, data }) => {
  return (
    <Box sx={{ mb: 4, width: '100%' }}>
      {/* First row - 2 charts side by side */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, width: '100%' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <SafetyScoreDistributionChart loading={loading} data={data} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <TurnaroundTimeChart loading={loading} data={data} />
        </Box>
      </Box>

      {/* Second row - Single chart */}
      <Box sx={{ mb: 3, width: '100%' }}>
        <VehicleUtilizationChart loading={loading} data={data} />
      </Box>

      {/* Third row - Single chart */}
      <Box sx={{ width: '100%' }}>
        <RiskVsTATChart loading={loading} data={data} />
      </Box>
    </Box>
  );
};

export default ChartsSection;
