import React from 'react';
import { Box, Typography, Container, Grid, Paper } from '@mui/material';
import ChartRenderer from './ChartRenderer';

const ChartTestPage = () => {
  // Sample chart configurations for testing
  const sampleBarChart = {
    title: {
      text: 'Safety Scores by Driver',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Lisa Brown', 'David Lee'],
      axisLabel: {
        rotate: 45,
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 12
      }
    },
    series: [{
      name: 'Safety Score',
      type: 'bar',
      data: [85.5, 92.3, 78.9, 88.7, 91.2],
      itemStyle: {
        color: '#5470c6'
      },
      label: {
        show: true,
        position: 'top'
      }
    }]
  };

  const sampleLineChart = {
    title: {
      text: 'Performance Trend Over Time',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      boundaryGap: false
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: 'Performance',
      type: 'line',
      data: [75, 82, 88, 85, 90, 93],
      smooth: true,
      itemStyle: {
        color: '#91cc75'
      },
      areaStyle: {
        opacity: 0.3
      }
    }]
  };

  const samplePieChart = {
    title: {
      text: 'Incident Distribution',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [{
      name: 'Incidents',
      type: 'pie',
      radius: '50%',
      data: [
        { name: 'Accidents', value: 45 },
        { name: 'Theft', value: 25 },
        { name: 'Breakdown', value: 30 }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  };

  const sampleGaugeChart = {
    title: {
      text: 'Overall Safety Score',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    series: [{
      name: 'Score',
      type: 'gauge',
      detail: {
        formatter: '{value}%'
      },
      data: [{
        value: 87.5,
        name: 'Safety Score'
      }],
      min: 0,
      max: 100,
      axisLine: {
        lineStyle: {
          width: 30,
          color: [
            [0.3, '#fd666d'],
            [0.7, '#37a2da'],
            [1, '#67e0e3']
          ]
        }
      },
      pointer: {
        itemStyle: {
          color: 'auto'
        }
      },
      axisTick: {
        distance: -30,
        length: 8,
        lineStyle: {
          color: '#fff',
          width: 2
        }
      },
      splitLine: {
        distance: -30,
        length: 30,
        lineStyle: {
          color: '#fff',
          width: 4
        }
      },
      axisLabel: {
        color: 'auto',
        distance: 40,
        fontSize: 20
      },
      detail: {
        valueAnimation: true,
        formatter: '{value}',
        color: 'auto'
      }
    }]
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Chart Renderer Test Page
      </Typography>
      
      <Typography variant="body1" paragraph align="center" color="text.secondary">
        Testing ECharts integration with different chart types
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ChartRenderer
            chartConfig={sampleBarChart}
            title="Bar Chart Test"
            height={400}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <ChartRenderer
            chartConfig={sampleLineChart}
            title="Line Chart Test"
            height={400}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <ChartRenderer
            chartConfig={samplePieChart}
            title="Pie Chart Test"
            height={400}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <ChartRenderer
            chartConfig={sampleGaugeChart}
            title="Gauge Chart Test"
            height={400}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Integration Notes:
          </Typography>
          <Typography variant="body2" paragraph>
            • Charts are rendered using Apache ECharts library
          </Typography>
          <Typography variant="body2" paragraph>
            • Each chart includes download and refresh functionality
          </Typography>
          <Typography variant="body2" paragraph>
            • Charts are responsive and resize automatically
          </Typography>
          <Typography variant="body2" paragraph>
            • Chart configurations come from the backend KPI chatbot
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default ChartTestPage;
