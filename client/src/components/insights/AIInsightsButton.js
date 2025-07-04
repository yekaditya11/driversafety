/**
 * AI Insights Floating Button Component
 * Floating action button that opens the AI insights panel
 * Features animated AI icon with pulsing effect
 */

import React, { useState } from 'react';
import {
  Fab,
  Tooltip,
  Badge,
  Box
} from '@mui/material';
import {
  Psychology as AIIcon,
  AutoAwesome as SparkleIcon
} from '@mui/icons-material';
import { keyframes } from '@mui/system';

import AIInsightsPanel from './AIInsightsPanel';

// Animation keyframes
const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(156, 39, 176, 0.7);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(156, 39, 176, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(156, 39, 176, 0);
  }
`;

const sparkleAnimation = keyframes`
  0%, 100% {
    opacity: 0;
    transform: scale(0.5) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1) rotate(180deg);
  }
`;

const AIInsightsButton = ({ 
  startDate = null, 
  endDate = null,
  position = { bottom: 24, right: 24 }
}) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const [hasNewInsights, setHasNewInsights] = useState(true); // Show badge initially

  const handleOpenPanel = () => {
    setPanelOpen(true);
    setHasNewInsights(false); // Remove badge when opened
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
  };

  return (
    <>
      {/* Floating AI Insights Button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: position.bottom,
          right: position.right,
          zIndex: 1200
        }}
      >
        <Tooltip 
          title="AI Insights - Get intelligent analysis of your KPI data" 
          placement="left"
          arrow
        >
          <Badge
            badgeContent={hasNewInsights ? "New" : 0}
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                height: 18,
                minWidth: 18,
                animation: hasNewInsights ? `${pulseAnimation} 2s infinite` : 'none'
              }
            }}
          >
            <Fab
              color="secondary"
              onClick={handleOpenPanel}
              sx={{
                background: 'linear-gradient(45deg, #9c27b0 30%, #e91e63 90%)',
                animation: `${pulseAnimation} 3s infinite`,
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  background: 'linear-gradient(45deg, #7b1fa2 30%, #c2185b 90%)',
                  transform: 'scale(1.1)',
                  transition: 'all 0.3s ease-in-out'
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                  transform: 'translateX(-100%)',
                  transition: 'transform 0.6s',
                },
                '&:hover::before': {
                  transform: 'translateX(100%)',
                }
              }}
            >
              <Box sx={{ position: 'relative' }}>
                <AIIcon sx={{ fontSize: 28 }} />
                
                {/* Animated sparkle effect */}
                <SparkleIcon
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    fontSize: 16,
                    color: '#fff',
                    animation: `${sparkleAnimation} 2s infinite`,
                    animationDelay: '0.5s'
                  }}
                />
                <SparkleIcon
                  sx={{
                    position: 'absolute',
                    bottom: -6,
                    left: -6,
                    fontSize: 12,
                    color: '#fff',
                    animation: `${sparkleAnimation} 2s infinite`,
                    animationDelay: '1s'
                  }}
                />
              </Box>
            </Fab>
          </Badge>
        </Tooltip>
      </Box>

      {/* AI Insights Panel */}
      <AIInsightsPanel
        open={panelOpen}
        onClose={handleClosePanel}
        startDate={startDate}
        endDate={endDate}
      />
    </>
  );
};

export default AIInsightsButton;
