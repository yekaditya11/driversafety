/**
 * Chart Test Utilities
 * Helper functions to test ECharts integration with the KPI chatbot
 */

// Sample chart configurations for testing
export const sampleChartConfigs = {
  barChart: {
    title: {
      text: 'Driver Safety Scores',
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
  },

  lineChart: {
    title: {
      text: 'Delivery Performance Trend',
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
      name: 'On-Time Delivery %',
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
  },

  pieChart: {
    title: {
      text: 'Incident Type Distribution',
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
        { name: 'Vehicle Breakdown', value: 30 }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  },

  gaugeChart: {
    title: {
      text: 'Overall Safety Score',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    series: [{
      name: 'Safety Score',
      type: 'gauge',
      detail: {
        formatter: '{value}%'
      },
      data: [{
        value: 87.5,
        name: 'Score'
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
  }
};

// Sample chat responses with chart configurations
export const sampleChatResponses = {
  safetyScores: {
    success: true,
    response: "Here are the current driver safety scores based on the latest data analysis:\n\n• John Smith: 85.5 (Good)\n• Sarah Johnson: 92.3 (Excellent)\n• Mike Wilson: 78.9 (Needs Improvement)\n• Lisa Brown: 88.7 (Very Good)\n• David Lee: 91.2 (Excellent)\n\nSarah Johnson and David Lee are our top performers, while Mike Wilson may need additional safety training.",
    session_id: "test_session_123",
    timestamp: new Date().toISOString(),
    chart_config: sampleChartConfigs.barChart
  },

  performanceTrend: {
    success: true,
    response: "The delivery performance trend shows steady improvement over the past 6 months:\n\n• January: 75% on-time delivery\n• February: 82% (+7% improvement)\n• March: 88% (+6% improvement)\n• April: 85% (-3% slight dip)\n• May: 90% (+5% recovery)\n• June: 93% (+3% continued growth)\n\nOverall, we've seen a 18% improvement from January to June, with only a minor dip in April.",
    session_id: "test_session_123",
    timestamp: new Date().toISOString(),
    chart_config: sampleChartConfigs.lineChart
  },

  incidentDistribution: {
    success: true,
    response: "Analysis of incident types over the past year shows the following distribution:\n\n• Accidents: 45% (Most common - focus on safety training)\n• Theft: 25% (Security measures needed)\n• Vehicle Breakdown: 30% (Maintenance improvements required)\n\nAccidents are our primary concern, representing nearly half of all incidents. We should prioritize driver safety training and route safety assessments.",
    session_id: "test_session_123",
    timestamp: new Date().toISOString(),
    chart_config: sampleChartConfigs.pieChart
  },

  overallScore: {
    success: true,
    response: "The overall safety score for our fleet is currently 87.5 out of 100.\n\nThis is considered a 'Very Good' rating, but there's room for improvement to reach our target of 90+. Key areas for improvement:\n\n• Reduce harsh braking incidents\n• Improve phone usage compliance\n• Enhance fatigue management\n\nWith focused efforts, we can achieve our 90+ target within the next quarter.",
    session_id: "test_session_123",
    timestamp: new Date().toISOString(),
    chart_config: sampleChartConfigs.gaugeChart
  }
};

// Test questions that should trigger chart generation
export const testQuestions = [
  {
    question: "Show me the safety scores by driver",
    expectedResponse: sampleChatResponses.safetyScores,
    chartType: "bar"
  },
  {
    question: "What's the trend in delivery performance?",
    expectedResponse: sampleChatResponses.performanceTrend,
    chartType: "line"
  },
  {
    question: "Display the incident distribution",
    expectedResponse: sampleChatResponses.incidentDistribution,
    chartType: "pie"
  },
  {
    question: "What's our overall safety score?",
    expectedResponse: sampleChatResponses.overallScore,
    chartType: "gauge"
  }
];

// Utility function to simulate chat response with chart
export const simulateChatWithChart = (questionIndex = 0) => {
  const testCase = testQuestions[questionIndex];
  if (!testCase) {
    return {
      success: false,
      response: "Invalid test case index",
      session_id: "test_session_123",
      timestamp: new Date().toISOString(),
      chart_config: null
    };
  }
  
  return testCase.expectedResponse;
};

// Utility function to validate chart configuration
export const validateChartConfig = (chartConfig) => {
  if (!chartConfig) return { valid: false, error: "No chart configuration provided" };
  
  const requiredFields = ['title', 'series'];
  const missingFields = requiredFields.filter(field => !chartConfig[field]);
  
  if (missingFields.length > 0) {
    return { 
      valid: false, 
      error: `Missing required fields: ${missingFields.join(', ')}` 
    };
  }
  
  if (!Array.isArray(chartConfig.series) || chartConfig.series.length === 0) {
    return { 
      valid: false, 
      error: "Chart must have at least one series" 
    };
  }
  
  return { valid: true, error: null };
};

export default {
  sampleChartConfigs,
  sampleChatResponses,
  testQuestions,
  simulateChatWithChart,
  validateChartConfig
};
