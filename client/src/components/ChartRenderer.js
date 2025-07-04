import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { Box, Paper, Typography, IconButton, Tooltip, Dialog, DialogContent, DialogTitle, DialogActions, Button } from '@mui/material';
import {
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Add as AddIcon
} from '@mui/icons-material';

const ChartRenderer = ({
  chartConfig,
  title,
  height = 400,
  width = '100%',
  showToolbar = true,
  showAddButton = false,
  onFullscreen,
  onDownload,
  onRefresh,
  onAddToDashboard,
  isAIDashboard = false
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const expandedChartRef = useRef(null);
  const expandedChartInstance = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!chartConfig || !chartRef.current) return;

    // Initialize chart
    chartInstance.current = echarts.init(chartRef.current);

    // Enhance chart configuration for better layout
    const enhancedConfig = {
      ...chartConfig,
      // Override grid configuration for AI dashboard to use maximum width
      grid: isAIDashboard ? {
        left: '3%',
        right: '3%',
        top: '8%',
        bottom: '12%',
        containLabel: true
      } : (chartConfig.grid || {
        left: '8%',
        right: '8%',
        top: '12%',
        bottom: '12%',
        containLabel: true
      }),
      // Ensure responsive behavior
      responsive: true,
      // Improve text sizing for AI dashboard
      textStyle: isAIDashboard ? {
        fontSize: 12
      } : undefined
    };

    // Set chart configuration
    chartInstance.current.setOption(enhancedConfig, true);

    // Handle resize
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    // Initial resize after a short delay to ensure container is ready
    const resizeTimer = setTimeout(() => {
      handleResize();
    }, 100);

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
    };
  }, [chartConfig, height, width, isAIDashboard]);

  const handleDownloadChart = () => {
    if (chartInstance.current) {
      const url = chartInstance.current.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      });
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title || (typeof chartConfig?.title?.text === 'string' ? chartConfig.title.text : 'chart')}.png`;
      link.click();
    }
    
    if (onDownload) {
      onDownload();
    }
  };

  const handleRefreshChart = () => {
    if (chartInstance.current && chartConfig) {
      chartInstance.current.setOption(chartConfig, true);
    }

    if (onRefresh) {
      onRefresh();
    }
  };

  const handleAddToDashboard = () => {
    if (onAddToDashboard && chartConfig) {
      // Extract title from chart config if not provided as prop
      const chartTitle = title || (typeof chartConfig?.title?.text === 'string' ? chartConfig.title.text : 'Untitled Chart');

      onAddToDashboard({
        chartConfig,
        title: chartTitle,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleExpandChart = () => {
    setIsExpanded(true);
    if (onFullscreen) {
      onFullscreen();
    }
  };

  const handleCloseExpanded = () => {
    setIsExpanded(false);
    if (expandedChartInstance.current) {
      expandedChartInstance.current.dispose();
      expandedChartInstance.current = null;
    }
  };

  // Effect for expanded chart
  useEffect(() => {
    if (isExpanded && expandedChartRef.current && chartConfig) {
      // Initialize expanded chart
      expandedChartInstance.current = echarts.init(expandedChartRef.current);

      // Enhance chart configuration for expanded view
      const enhancedConfig = {
        ...chartConfig,
        // Add grid/spacing configuration for better layout in expanded view
        grid: chartConfig.grid || {
          left: '8%',
          right: '8%',
          top: '12%',
          bottom: '12%',
          containLabel: true
        }
      };

      expandedChartInstance.current.setOption(enhancedConfig);

      // Handle resize for expanded chart
      const handleExpandedResize = () => {
        if (expandedChartInstance.current) {
          expandedChartInstance.current.resize();
        }
      };

      window.addEventListener('resize', handleExpandedResize);

      return () => {
        window.removeEventListener('resize', handleExpandedResize);
      };
    }
  }, [isExpanded, chartConfig]);

  if (!chartConfig) {
    return null;
  }

  return (
    <Paper
      elevation={isAIDashboard ? 0 : 2}
      sx={{
        p: isAIDashboard ? 0 : 2,
        mt: isAIDashboard ? 0 : 2,
        borderRadius: isAIDashboard ? 0 : 2,
        backgroundColor: isAIDashboard ? 'transparent' : 'background.paper',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
      }}
    >
      {/* Chart Header */}
      {(title || showToolbar) && !isAIDashboard && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}
        >
          {(title || chartConfig?.title?.text) && (
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'text.primary'
              }}
            >
              {title || (typeof chartConfig?.title?.text === 'string' ? chartConfig.title.text : 'Chart')}
            </Typography>
          )}
          
          {showToolbar && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {showAddButton && (
                <Tooltip title="Add to AI Dashboard">
                  <IconButton
                    size="small"
                    onClick={handleAddToDashboard}
                    sx={{
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                        color: 'white'
                      }
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              <Tooltip title="Refresh Chart">
                <IconButton
                  size="small"
                  onClick={handleRefreshChart}
                  sx={{ color: 'text.secondary' }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Download Chart">
                <IconButton
                  size="small"
                  onClick={handleDownloadChart}
                  sx={{ color: 'text.secondary' }}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Expand Chart">
                <IconButton
                  size="small"
                  onClick={handleExpandChart}
                  sx={{ color: 'text.secondary' }}
                >
                  <FullscreenIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      )}

      {/* Chart Container */}
      <Box
        ref={chartRef}
        className={isAIDashboard ? 'chart-renderer-container' : ''}
        sx={{
          width: '100%',
          height: isAIDashboard ?
            (typeof height === 'number' ? `${height}px` : height) :
            (typeof height === 'number' ? `${height}px` : height),
          minHeight: isAIDashboard ?
            (typeof height === 'number' ? `${height}px` : '450px') :
            '300px',
          maxHeight: isAIDashboard ?
            (typeof height === 'number' ? `${height}px` : '450px') :
            'none',
          flex: isAIDashboard ? 'none' : 1,
          overflow: 'hidden',
          position: 'relative',
          display: 'block',
          '& canvas': {
            borderRadius: 1,
            width: '100% !important',
            height: '100% !important'
          },
          '& svg': {
            width: '100% !important',
            height: '100% !important'
          },
          // Responsive height adjustments
          '@media (max-width: 1200px)': isAIDashboard ? {
            height: '380px',
            minHeight: '380px',
            maxHeight: '380px'
          } : {},
          '@media (max-width: 768px)': isAIDashboard ? {
            height: '350px',
            minHeight: '350px',
            maxHeight: '350px'
          } : {},
          '@media (max-width: 480px)': isAIDashboard ? {
            height: '300px',
            minHeight: '300px',
            maxHeight: '300px'
          } : {}
        }}
      />

      {/* Expanded Chart Dialog */}
      <Dialog
        open={isExpanded}
        onClose={handleCloseExpanded}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: '90vh',
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title || (typeof chartConfig?.title?.text === 'string' ? chartConfig.title.text : 'Chart View')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Download Chart">
              <IconButton
                size="small"
                onClick={handleDownloadChart}
                sx={{ color: 'text.secondary' }}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton
                size="small"
                onClick={handleCloseExpanded}
                sx={{ color: 'text.secondary' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 2, height: '100%' }}>
          <Box
            ref={expandedChartRef}
            sx={{
              width: '100%',
              height: '100%',
              minHeight: '500px',
              '& canvas': {
                borderRadius: 1
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default ChartRenderer;
