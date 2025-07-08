import React from 'react';
import { Box, CircularProgress, Typography, Fade, useTheme } from '@mui/material';

const ModernLoading = ({ 
  size = 60, 
  message = 'Loading...', 
  variant = 'default',
  fullScreen = false 
}) => {
  const theme = useTheme();

  const LoadingSpinner = () => (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background circle */}
      <CircularProgress
        variant="determinate"
        value={100}
        size={size}
        thickness={2}
        sx={{
          color: theme.palette.grey[200],
          position: 'absolute',
        }}
      />
      
      {/* Animated circle */}
      <CircularProgress
        size={size}
        thickness={2}
        sx={{
          color: theme.palette.primary.main,
          animation: 'modernSpin 1.5s linear infinite',
          '@keyframes modernSpin': {
            '0%': {
              transform: 'rotate(0deg)',
            },
            '100%': {
              transform: 'rotate(360deg)',
            },
          },
        }}
      />
      
      {/* Center dot */}
      <Box
        sx={{
          position: 'absolute',
          width: size * 0.15,
          height: size * 0.15,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          animation: 'pulse 2s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': {
              transform: 'scale(1)',
              opacity: 1,
            },
            '50%': {
              transform: 'scale(1.2)',
              opacity: 0.8,
            },
          },
        }}
      />
    </Box>
  );

  const SkeletonLoader = () => (
    <Box sx={{ width: '100%', maxWidth: 400 }}>
      {[...Array(3)].map((_, index) => (
        <Box
          key={index}
          sx={{
            height: 20,
            backgroundColor: theme.palette.grey[200],
            borderRadius: 2,
            mb: 1,
            width: `${100 - index * 15}%`,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            '@keyframes shimmer': {
              '0%': { backgroundPosition: '-200% 0' },
              '100%': { backgroundPosition: '200% 0' },
            },
          }}
        />
      ))}
    </Box>
  );

  const DotsLoader = () => (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {[0, 1, 2].map((index) => (
        <Box
          key={index}
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            animation: `dotBounce 1.4s ease-in-out infinite both`,
            animationDelay: `${index * 0.16}s`,
            '@keyframes dotBounce': {
              '0%, 80%, 100%': {
                transform: 'scale(0)',
              },
              '40%': {
                transform: 'scale(1)',
              },
            },
          }}
        />
      ))}
    </Box>
  );

  const renderLoader = () => {
    switch (variant) {
      case 'skeleton':
        return <SkeletonLoader />;
      case 'dots':
        return <DotsLoader />;
      default:
        return <LoadingSpinner />;
    }
  };

  const content = (
    <Fade in={true} timeout={300}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          p: 4,
          ...(fullScreen && {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
          }),
        }}
      >
        {renderLoader()}
        
        {message && (
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500,
              letterSpacing: '0.025em',
              animation: 'fadeInOut 2s ease-in-out infinite',
              '@keyframes fadeInOut': {
                '0%, 100%': { opacity: 0.7 },
                '50%': { opacity: 1 },
              },
            }}
          >
            {message}
          </Typography>
        )}
      </Box>
    </Fade>
  );

  return content;
};

export default ModernLoading;
