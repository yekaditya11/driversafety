/**
 * Universe-style AI Insights Button Component
 * Animated button with Siri-like breathing wave effects and cosmic animations
 */

import React, { useState } from 'react';
import {
  Tooltip,
  Box
} from '@mui/material';
import {
  AutoAwesome as SparkleIcon,
  Circle as DotIcon
} from '@mui/icons-material';
import { keyframes } from '@mui/system';

import AIInsightsPanel from './AIInsightsPanel';

// Simplified animation keyframes

const cosmicWave = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.1;
  }
`;

const universeGlow = keyframes`
  0%, 100% {
    box-shadow:
      0 0 5px rgba(25, 118, 210, 0.4),
      0 0 10px rgba(33, 150, 243, 0.3),
      0 0 15px rgba(63, 81, 181, 0.2),
      0 0 20px rgba(25, 118, 210, 0.1);
  }
  33% {
    box-shadow:
      0 0 8px rgba(33, 150, 243, 0.5),
      0 0 15px rgba(63, 81, 181, 0.4),
      0 0 25px rgba(25, 118, 210, 0.3),
      0 0 35px rgba(33, 150, 243, 0.2);
  }
  66% {
    box-shadow:
      0 0 6px rgba(63, 81, 181, 0.5),
      0 0 12px rgba(25, 118, 210, 0.4),
      0 0 20px rgba(33, 150, 243, 0.3),
      0 0 30px rgba(63, 81, 181, 0.2);
  }
`;

const sparkleOrbit = keyframes`
  0% {
    transform: rotate(0deg) translateX(25px) rotate(0deg);
    opacity: 0;
  }
  10%, 90% {
    opacity: 1;
  }
  100% {
    transform: rotate(360deg) translateX(25px) rotate(-360deg);
    opacity: 0;
  }
`;

const floatingDots = keyframes`
  0%, 100% {
    transform: translateY(0px) scale(0.8);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-10px) scale(1.2);
    opacity: 0.8;
  }
`;

const SiriAIInsightsButton = ({
  startDate = null,
  endDate = null,
  loading = false
}) => {
  const [panelOpen, setPanelOpen] = useState(false);

  const handleOpenPanel = () => {
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
  };

  return (
    <>
      <Tooltip
        title="AI Insights - Get intelligent analysis of your KPI data"
        placement="bottom"
        arrow
      >
        <Box
          sx={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Simplified cosmic wave ring */}
          <Box
            sx={{
              position: 'absolute',
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, rgba(25, 118, 210, 0.2) 30%, rgba(63, 81, 181, 0.2) 90%)',
              animation: `${cosmicWave} 4s ease-in-out infinite`,
              zIndex: 1,
            }}
          />

          {/* Single orbiting sparkle */}
          <Box
            sx={{
              position: 'absolute',
              width: 50,
              height: 50,
              zIndex: 1,
            }}
          >
            <SparkleIcon
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                fontSize: 8,
                color: '#1976d2',
                animation: `${sparkleOrbit} 6s linear infinite`,
                transformOrigin: '0 0',
              }}
            />
          </Box>

          {/* Single floating dot */}
          <DotIcon
            sx={{
              position: 'absolute',
              top: -12,
              right: -8,
              fontSize: 4,
              color: '#1976d2',
              animation: `${floatingDots} 3s ease-in-out infinite`,
              zIndex: 1,
            }}
          />

          {/* Main universe orb - like Alexa/Siri */}
          <Box
            onClick={handleOpenPanel}
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              position: 'relative',
              zIndex: 2,
              background: loading
                ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.6) 0%, rgba(33, 150, 243, 0.6) 50%, rgba(63, 81, 181, 0.6) 100%)'
                : 'linear-gradient(135deg, #1976d2 0%, #2196f3 50%, #3f51b5 100%)',
              cursor: loading ? 'default' : 'pointer',
              animation: loading ? 'none' : `${universeGlow} 3s ease-in-out infinite`,
              transition: 'all 0.2s ease-in-out',
              '&:hover': loading ? {} : {
                background: 'linear-gradient(135deg, #1565c0 0%, #1e88e5 50%, #303f9f 100%)',
                transform: 'scale(1.05)',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              },
              // Enhanced inner glow effect
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 3,
                left: 3,
                right: 3,
                bottom: 3,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                pointerEvents: 'none',
              },
              // Outer cosmic ring
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -3,
                left: -3,
                right: -3,
                bottom: -3,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.3) 0%, rgba(33, 150, 243, 0.3) 50%, rgba(63, 81, 181, 0.3) 100%)',
                zIndex: -1,
                opacity: 0.6,
              }
            }}
          />
        </Box>
      </Tooltip>

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

export default SiriAIInsightsButton;
