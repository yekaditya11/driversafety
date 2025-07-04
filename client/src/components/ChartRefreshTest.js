import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Chip } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import chartManager from '../services/chartManager';

/**
 * Test component to verify automatic chart refresh functionality
 */
const ChartRefreshTest = () => {
  const [charts, setCharts] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [listenerCount, setListenerCount] = useState(0);

  useEffect(() => {
    // Initialize charts
    setCharts(chartManager.getCharts());
    setLastUpdate(new Date().toLocaleTimeString());

    // Listen for chart updates
    const handleChartsUpdate = (updatedCharts) => {
      console.log('ChartRefreshTest: Received chart update', updatedCharts.length);
      setCharts([...updatedCharts]);
      setLastUpdate(new Date().toLocaleTimeString());
      setListenerCount(prev => prev + 1);
    };

    chartManager.addListener(handleChartsUpdate);
    console.log('ChartRefreshTest: Listener added');

    return () => {
      chartManager.removeListener(handleChartsUpdate);
      console.log('ChartRefreshTest: Listener removed');
    };
  }, []);

  const handleManualRefresh = async () => {
    try {
      console.log('ChartRefreshTest: Manual refresh triggered');
      await chartManager.loadCharts();
      console.log('ChartRefreshTest: Manual refresh completed');
    } catch (error) {
      console.error('ChartRefreshTest: Manual refresh failed', error);
    }
  };

  const simulateChartAddition = async () => {
    try {
      console.log('ChartRefreshTest: Simulating chart addition');
      
      // Create a test chart
      const testChart = {
        title: `Test Chart ${Date.now()}`,
        description: 'Test chart for refresh functionality',
        chart_config: {
          type: 'bar',
          data: {
            labels: ['A', 'B', 'C'],
            datasets: [{
              label: 'Test Data',
              data: [1, 2, 3],
              backgroundColor: '#3b82f6'
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: `Test Chart ${Date.now()}`
              }
            }
          }
        },
        source: 'test'
      };

      await chartManager.addChart(testChart);
      console.log('ChartRefreshTest: Test chart added');
    } catch (error) {
      console.error('ChartRefreshTest: Failed to add test chart', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        🧪 Chart Refresh Test Component
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Status
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Chip 
            label={`Charts: ${charts.length}`} 
            color="primary" 
            variant="outlined" 
          />
          <Chip 
            label={`Updates: ${listenerCount}`} 
            color="secondary" 
            variant="outlined" 
          />
          <Chip 
            label={`Last Update: ${lastUpdate || 'Never'}`} 
            color="info" 
            variant="outlined" 
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleManualRefresh}
          >
            Manual Refresh
          </Button>
          <Button
            variant="contained"
            onClick={simulateChartAddition}
          >
            Add Test Chart
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Charts List
        </Typography>
        {charts.length === 0 ? (
          <Typography color="text.secondary">
            No charts found. Add a chart from the chatbot or use the test button above.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {charts.map((chart, index) => (
              <Box
                key={chart.id || index}
                sx={{
                  p: 1,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {chart.title || 'Untitled Chart'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Source: {chart.source || 'Unknown'} | 
                    Created: {chart.created_at ? new Date(chart.created_at).toLocaleString() : 'Unknown'}
                  </Typography>
                </Box>
                <Chip 
                  label={chart.id || 'No ID'} 
                  size="small" 
                  variant="outlined" 
                />
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 2, mt: 2, bgcolor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom>
          Instructions
        </Typography>
        <Typography variant="body2" component="div">
          <ol>
            <li>Open the chatbot and generate a chart</li>
            <li>Click the "+" button to add it to the dashboard</li>
            <li>Watch this component - it should automatically update without page reload</li>
            <li>The "Updates" counter should increment when charts are added</li>
            <li>Use "Add Test Chart" to simulate chart addition</li>
          </ol>
        </Typography>
      </Paper>
    </Box>
  );
};

export default ChartRefreshTest;
