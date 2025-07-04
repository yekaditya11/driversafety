/**
 * AI Insights Panel Component
 * Displays AI-generated insights from combined operations and safety KPIs
 * Features animated AI icon and clean bullet point display
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Fade,
  Zoom,
  Collapse
} from '@mui/material';
import jsPDF from 'jspdf';
import {
  Psychology as AIIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { keyframes } from '@mui/system';

import apiService from '../../services/apiService';

// Animated AI icon keyframes
const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
`;

const floatAnimation = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const AIInsightsPanel = ({ 
  open, 
  onClose, 
  startDate = null, 
  endDate = null 
}) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [insightFeedback, setInsightFeedback] = useState({});
  const [hoveredInsight, setHoveredInsight] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [canLoadMore, setCanLoadMore] = useState(true);

  // Fetch AI insights
  const fetchInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching AI insights...', { startDate, endDate });
      const response = await apiService.getAIInsights(startDate, endDate);

      console.log('AI insights response:', response);

      if (response && response.success) {
        setInsights(response.insights || []);
        setCanLoadMore(true); // Reset ability to load more
      } else {
        const errorMsg = response?.error || response?.message || 'Failed to fetch AI insights';
        setError(errorMsg);
        console.error('AI insights error:', errorMsg);
      }
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to connect to AI insights service';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Fetch more AI insights
  const fetchMoreInsights = async () => {
    if (!canLoadMore || loadingMore) return;

    setLoadingMore(true);
    setError(null);

    try {
      console.log('Fetching more AI insights...', { startDate, endDate });
      // Call the API again to get fresh insights (simulating more insights)
      const response = await apiService.getAIInsights(startDate, endDate, {
        more_insights: true // Flag to indicate we want additional insights
      });

      console.log('More AI insights response:', response);

      if (response && response.success) {
        const newInsights = response.insights || [];
        // Enhanced duplicate detection - check for similar content, not just exact matches
        const existingDescriptions = insights.map(insight => insight.description.toLowerCase());
        const uniqueNewInsights = newInsights.filter(insight => {
          const newDescription = insight.description.toLowerCase();

          // Check for exact duplicates
          if (existingDescriptions.includes(newDescription)) {
            return false;
          }

          // Check for similar content (if 70% of words match, consider it duplicate)
          const newWords = new Set(newDescription.split(' ').filter(word => word.length > 3));
          const isDuplicate = existingDescriptions.some(existingDesc => {
            const existingWords = new Set(existingDesc.split(' ').filter(word => word.length > 3));
            const commonWords = [...newWords].filter(word => existingWords.has(word));
            const similarity = commonWords.length / Math.max(newWords.size, existingWords.size);
            return similarity > 0.7; // 70% similarity threshold
          });

          return !isDuplicate;
        });

        if (uniqueNewInsights.length > 0) {
          // Add unique insights with updated IDs
          const updatedInsights = uniqueNewInsights.slice(0, 7).map((insight, index) => ({
            ...insight,
            id: insights.length + index + 1
          }));
          setInsights(prev => [...prev, ...updatedInsights]);
        } else {
          setCanLoadMore(false); // No more unique insights available
        }
      } else {
        const errorMsg = response?.error || response?.message || 'Failed to fetch more insights';
        setError(errorMsg);
        console.error('More AI insights error:', errorMsg);
      }
    } catch (err) {
      console.error('Error fetching more AI insights:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to connect to AI insights service';
      setError(errorMsg);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handler functions for insight interactions
  const handleLikeInsight = (insightId) => {
    setInsightFeedback(prev => ({
      ...prev,
      [insightId]: prev[insightId] === 'like' ? null : 'like'
    }));
  };

  const handleDislikeInsight = (insightId) => {
    setInsightFeedback(prev => ({
      ...prev,
      [insightId]: prev[insightId] === 'dislike' ? null : 'dislike'
    }));
  };

  const handleRemoveInsight = (insightId) => {
    setInsights(prev => prev.filter(insight => insight.id !== insightId));
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const downloadPDF = () => {
    if (insights.length === 0) return;

    try {
      // Create new PDF document
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Helper function to add text with word wrapping
      const addText = (text, fontSize = 12, isBold = false) => {
        pdf.setFontSize(fontSize);
        if (isBold) {
          pdf.setFont(undefined, 'bold');
        } else {
          pdf.setFont(undefined, 'normal');
        }

        const lines = pdf.splitTextToSize(text, maxWidth);

        // Check if we need a new page
        if (yPosition + (lines.length * fontSize * 0.5) > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * fontSize * 0.5 + 5;
      };

      // Header
      addText('AI INSIGHTS REPORT', 20, true);
      yPosition += 5;

      // Report details
      const currentDate = new Date().toLocaleDateString();
      const dateRange = startDate && endDate
        ? `${startDate} to ${endDate}`
        : 'All Time';

      addText(`Generated on: ${currentDate}`, 12);
      addText(`Date Range: ${dateRange}`, 12);
      addText(`Total Insights: ${insights.length}`, 12);

      // Add separator line
      yPosition += 10;
      pdf.setDrawColor(25, 118, 210); // Blue color
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;

      // Add insights
      insights.forEach((insight, index) => {
        addText(`${index + 1}. ${insight.description}`, 11);
        yPosition += 5;
      });

      // Footer
      yPosition += 10;
      pdf.setDrawColor(25, 118, 210);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;

      addText('Report generated by Driver Safety KPI System', 10);
      addText(`© ${new Date().getFullYear()} Gytworkz Technologies`, 10);

      // Save the PDF
      const fileName = `AI_Insights_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to text file if PDF generation fails
      const currentDate = new Date().toLocaleDateString();
      const dateRange = startDate && endDate
        ? `${startDate} to ${endDate}`
        : 'All Time';

      let textContent = `AI INSIGHTS REPORT\nGenerated on: ${currentDate}\nDate Range: ${dateRange}\nTotal Insights: ${insights.length}\n\n`;

      insights.forEach((insight, index) => {
        textContent += `${index + 1}. ${insight.description}\n\n`;
      });

      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AI_Insights_Report_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  };

  // Fetch insights when panel opens or dates change
  useEffect(() => {
    if (open) {
      fetchInsights();
    }
  }, [open, startDate, endDate]);





  if (!open) return null;

  return (
    <Fade in={open}>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          top: '10vh',
          right: '2%',
          width: { xs: '100%', md: '50%', lg: '50%' },
          height: expanded ? '80vh' : 'auto',
          maxHeight: '80vh',
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fafafa',
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          transition: 'height 0.3s ease-in-out'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                animation: `${pulseAnimation} 2s ease-in-out infinite, ${floatAnimation} 3s ease-in-out infinite`,
                color: '#1976d2'
              }}
            >
              <AIIcon sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                AI Insights
              </Typography>
              <Typography variant="body2" color="text.secondary">
                AI-powered analysis of operations & safety KPIs
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={expanded ? "Collapse Insights" : "Expand Insights"}>
              <IconButton onClick={toggleExpanded}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Download Insights as PDF">
              <IconButton
                onClick={downloadPDF}
                disabled={loading || insights.length === 0}
                sx={{
                  color: insights.length > 0 ? '#1976d2' : 'inherit',
                  '&:hover': {
                    backgroundColor: insights.length > 0 ? 'rgba(25, 118, 210, 0.04)' : 'inherit'
                  }
                }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Generate New Insights">
              <IconButton onClick={fetchInsights} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>



        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2, pt: 1 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Generating AI insights...
                </Typography>
              </Box>
            </Box>
          )}

          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={fetchInsights}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          {!loading && !error && insights.length > 0 && (
            <Collapse in={expanded}>
              <Box sx={{ p: 3 }}>
                {/* Enhanced Insights with Actions */}
                <Box component="ul" sx={{
                  m: 0,
                  p: 0,
                  pl: 0,
                  listStyle: 'none',
                }}>
                  {insights.map((insight, index) => (
                    <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }} key={insight.id}>
                      <Box
                        component="li"
                        onMouseEnter={() => setHoveredInsight(insight.id)}
                        onMouseLeave={() => setHoveredInsight(null)}
                        sx={{
                          marginBottom: '18px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px'
                        }}
                      >
                        <Box sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: '#1976d2',
                          mt: 1,
                          flexShrink: 0
                        }} />

                        <Typography sx={{
                          fontSize: '15px',
                          lineHeight: 1.6,
                          color: '#374151',
                          flex: 1
                        }}>
                          {insight.description}
                        </Typography>

                        {/* Action buttons on hover - at the end of the text */}
                        {hoveredInsight === insight.id && (
                          <Fade in={true}>
                            <Box sx={{
                              display: 'flex',
                              gap: 0.5,
                              alignItems: 'center',
                              ml: 1
                            }}>
                              <Tooltip title="Like this insight">
                                <IconButton
                                  size="small"
                                  onClick={() => handleLikeInsight(insight.id)}
                                  sx={{
                                    color: insightFeedback[insight.id] === 'like' ? '#4caf50' : '#9e9e9e',
                                    '&:hover': { color: '#4caf50' },
                                    width: 24,
                                    height: 24
                                  }}
                                >
                                  <ThumbUpIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Dislike this insight">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDislikeInsight(insight.id)}
                                  sx={{
                                    color: insightFeedback[insight.id] === 'dislike' ? '#f44336' : '#9e9e9e',
                                    '&:hover': { color: '#f44336' },
                                    width: 24,
                                    height: 24
                                  }}
                                >
                                  <ThumbDownIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Remove this insight">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveInsight(insight.id)}
                                  sx={{
                                    color: '#9e9e9e',
                                    '&:hover': { color: '#f44336' },
                                    width: 24,
                                    height: 24
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Fade>
                        )}
                      </Box>
                    </Zoom>
                  ))}

                  {/* More insights option */}
                  {canLoadMore && !loading && (
                    <Zoom in={true} style={{ transitionDelay: `${insights.length * 100}ms` }}>
                      <Box
                        component="li"
                        onClick={fetchMoreInsights}
                        sx={{
                          marginBottom: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: 'pointer',
                          opacity: 0.7,
                          transition: 'opacity 0.2s ease-in-out',
                          '&:hover': {
                            opacity: 1,
                          }
                        }}
                      >
                        <Box sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: '#1976d2',
                          mt: 1,
                          flexShrink: 0
                        }} />

                        <Typography sx={{
                          fontSize: '15px',
                          lineHeight: 1.6,
                          color: '#1976d2',
                          fontStyle: 'italic',
                          cursor: 'pointer',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}>
                          {loadingMore ? 'Loading more insights...' : '...more points'}
                        </Typography>

                        {loadingMore && (
                          <CircularProgress size={16} sx={{ color: '#1976d2', ml: 1 }} />
                        )}
                      </Box>
                    </Zoom>
                  )}
                </Box>
              </Box>
            </Collapse>
          )}

          {!loading && !error && insights.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AIIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No insights available
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Try refreshing or check your data range
              </Typography>
              <Button variant="outlined" onClick={fetchInsights}>
                Generate New Insights
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </Fade>
  );
};

export default AIInsightsPanel;
