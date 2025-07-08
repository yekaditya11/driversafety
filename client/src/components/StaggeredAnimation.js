import React from 'react';
import { Fade, Slide, Grow, Zoom, Box } from '@mui/material';

const StaggeredAnimation = ({ 
  children, 
  delay = 100, 
  animation = 'fade',
  direction = 'up',
  timeout = 600,
  container = true 
}) => {
  const animations = {
    fade: Fade,
    slide: Slide,
    grow: Grow,
    zoom: Zoom,
  };

  const AnimationComponent = animations[animation] || Fade;

  const getAnimationProps = () => {
    const baseProps = {
      timeout,
      in: true,
    };

    switch (animation) {
      case 'slide':
        return {
          ...baseProps,
          direction,
        };
      default:
        return baseProps;
    }
  };

  const renderChildren = () => {
    return React.Children.map(children, (child, index) => {
      if (!React.isValidElement(child)) return child;

      return (
        <AnimationComponent
          key={index}
          {...getAnimationProps()}
          style={{ 
            transitionDelay: `${index * delay}ms`,
          }}
        >
          <Box>{child}</Box>
        </AnimationComponent>
      );
    });
  };

  if (!container) {
    return <>{renderChildren()}</>;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {renderChildren()}
    </Box>
  );
};

// Specialized components for common use cases
export const StaggeredCards = ({ children, ...props }) => (
  <StaggeredAnimation animation="fade" delay={150} {...props}>
    {children}
  </StaggeredAnimation>
);

export const StaggeredList = ({ children, ...props }) => (
  <StaggeredAnimation animation="slide" direction="right" delay={100} {...props}>
    {children}
  </StaggeredAnimation>
);

export const StaggeredGrid = ({ children, ...props }) => (
  <StaggeredAnimation animation="grow" delay={120} container={false} {...props}>
    {children}
  </StaggeredAnimation>
);

// Floating animation for interactive elements
export const FloatingElement = ({ children, intensity = 'medium' }) => {
  const intensityMap = {
    low: '1px',
    medium: '2px',
    high: '4px',
  };

  return (
    <Box
      sx={{
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: `translateY(-${intensityMap[intensity]})`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
      }}
    >
      {children}
    </Box>
  );
};

// Pulse animation for attention-grabbing elements
export const PulseElement = ({ children, color = 'primary' }) => (
  <Box
    sx={{
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 'inherit',
        background: `${color}.main`,
        opacity: 0,
        animation: 'pulse 2s infinite',
        '@keyframes pulse': {
          '0%': {
            transform: 'scale(1)',
            opacity: 0.7,
          },
          '70%': {
            transform: 'scale(1.05)',
            opacity: 0,
          },
          '100%': {
            transform: 'scale(1)',
            opacity: 0,
          },
        },
      },
    }}
  >
    {children}
  </Box>
);

// Shimmer effect for loading states
export const ShimmerElement = ({ width = '100%', height = 20, borderRadius = 4 }) => (
  <Box
    sx={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      '@keyframes shimmer': {
        '0%': { backgroundPosition: '-200% 0' },
        '100%': { backgroundPosition: '200% 0' },
      },
    }}
  />
);

export default StaggeredAnimation;
