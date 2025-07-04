/**
 * Universe-style AI Insights Button Component
 * Animated button with Siri-like breathing wave effects and cosmic animations
 */

import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Box
} from '@mui/material';
import {
  AutoAwesome as SparkleIcon,
  Circle as DotIcon
} from '@mui/icons-material';
import { keyframes } from '@mui/system';

import AIInsightsPanel from './AIInsightsPanel';

// Enhanced universe-like breathing animation keyframes
const universeBreathing = keyframes`
  0%, 100% {
    transform: scale(1) rotate(0deg);
    opacity: 0.9;
    filter: hue-rotate(0deg) brightness(1);
  }
  25% {
    transform: scale(1.02) rotate(90deg);
    opacity: 1;
    filter: hue-rotate(90deg) brightness(1.1);
  }
  50% {
    transform: scale(1.05) rotate(180deg);
    opacity: 1;
    filter: hue-rotate(180deg) brightness(1.2);
  }
  75% {
    transform: scale(1.02) rotate(270deg);
    opacity: 1;
    filter: hue-rotate(270deg) brightness(1.1);
  }
`;

const cosmicWave1 = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.4;
    background: linear-gradient(45deg, rgba(25, 118, 210, 0.3) 30%, rgba(63, 81, 181, 0.3) 90%);
  }
  50% {
    transform: scale(1.5);
    opacity: 0.1;
    background: linear-gradient(45deg, rgba(33, 150, 243, 0.3) 30%, rgba(25, 118, 210, 0.3) 90%);
  }
`;

const cosmicWave2 = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.3;
    background: linear-gradient(45deg, rgba(63, 81, 181, 0.2) 30%, rgba(33, 150, 243, 0.2) 90%);
  }
  50% {
    transform: scale(1.7);
    opacity: 0.05;
    background: linear-gradient(45deg, rgba(25, 118, 210, 0.2) 30%, rgba(63, 81, 181, 0.2) 90%);
  }
`;

const cosmicWave3 = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.2;
    background: linear-gradient(45deg, rgba(33, 150, 243, 0.1) 30%, rgba(25, 118, 210, 0.1) 90%);
  }
  50% {
    transform: scale(1.9);
    opacity: 0.02;
    background: linear-gradient(45deg, rgba(63, 81, 181, 0.1) 30%, rgba(33, 150, 243, 0.1) 90%);
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
          {/* Universe-like cosmic wave rings */}
          <Box
            sx={{
              position: 'absolute',
              width: 40,
              height: 40,
              borderRadius: '50%',
              animation: `${cosmicWave1} 3s ease-in-out infinite`,
              zIndex: 1,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: 40,
              height: 40,
              borderRadius: '50%',
              animation: `${cosmicWave2} 3s ease-in-out infinite 0.5s`,
              zIndex: 1,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: 40,
              height: 40,
              borderRadius: '50%',
              animation: `${cosmicWave3} 3s ease-in-out infinite 1s`,
              zIndex: 1,
            }}
          />

          {/* Orbiting sparkles */}
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
                animation: `${sparkleOrbit} 4s linear infinite`,
                transformOrigin: '0 0',
              }}
            />
            <SparkleIcon
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                fontSize: 6,
                color: '#2196f3',
                animation: `${sparkleOrbit} 4s linear infinite 1s`,
                transformOrigin: '0 0',
              }}
            />
            <SparkleIcon
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                fontSize: 10,
                color: '#3f51b5',
                animation: `${sparkleOrbit} 4s linear infinite 2s`,
                transformOrigin: '0 0',
              }}
            />
          </Box>

          {/* Floating dots around the button */}
          <DotIcon
            sx={{
              position: 'absolute',
              top: -15,
              right: -10,
              fontSize: 4,
              color: '#1976d2',
              animation: `${floatingDots} 2s ease-in-out infinite`,
              zIndex: 1,
            }}
          />
          <DotIcon
            sx={{
              position: 'absolute',
              bottom: -12,
              left: -8,
              fontSize: 3,
              color: '#2196f3',
              animation: `${floatingDots} 2s ease-in-out infinite 0.7s`,
              zIndex: 1,
            }}
          />
          <DotIcon
            sx={{
              position: 'absolute',
              top: -8,
              left: -15,
              fontSize: 5,
              color: '#3f51b5',
              animation: `${floatingDots} 2s ease-in-out infinite 1.4s`,
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
              animation: loading ? 'none' : `${universeBreathing} 4s ease-in-out infinite, ${universeGlow} 3s ease-in-out infinite`,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': loading ? {} : {
                background: 'linear-gradient(135deg, #1565c0 0%, #1e88e5 50%, #303f9f 100%)',
                transform: 'scale(1.15)',
                filter: 'brightness(1.2)',
                '&::before': {
                  opacity: 0.8,
                }
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
                animation: loading ? 'none' : `${universeBreathing} 4s ease-in-out infinite 0.5s`,
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
                animation: loading ? 'none' : `${universeBreathing} 4s ease-in-out infinite reverse`,
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
