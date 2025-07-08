import React, { useState } from 'react';
import {
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Fab,
  Tooltip,
  useTheme,
  Box,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  KeyboardCommandKey as CommandIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const FloatingActions = ({ 
  onRefresh, 
  onCommandPalette, 
  onExport, 
  onFilter,
  position = { bottom: 24, right: 24 }
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const actions = [
    {
      icon: <RefreshIcon />,
      name: 'Refresh Data',
      onClick: () => {
        onRefresh?.();
        handleClose();
      },
    },
    {
      icon: <CommandIcon />,
      name: 'Command Palette (⌘K)',
      onClick: () => {
        onCommandPalette?.();
        handleClose();
      },
    },
    {
      icon: <DownloadIcon />,
      name: 'Export Data',
      onClick: () => {
        onExport?.();
        handleClose();
      },
    },
    {
      icon: <FilterIcon />,
      name: 'Filter Options',
      onClick: () => {
        onFilter?.();
        handleClose();
      },
    },
    {
      icon: <HelpIcon />,
      name: 'Help & Support',
      onClick: () => {
        console.log('Help functionality');
        handleClose();
      },
    },
  ];

  return (
    <Box
      sx={{
        position: 'fixed',
        ...position,
        zIndex: theme.zIndex.speedDial,
      }}
    >
      <SpeedDial
        ariaLabel="Dashboard actions"
        icon={
          <SpeedDialIcon 
            icon={<AddIcon />} 
            openIcon={<CloseIcon />}
          />
        }
        onClose={handleClose}
        onOpen={handleOpen}
        open={open}
        direction="up"
        sx={{
          '& .MuiSpeedDial-fab': {
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            color: 'white',
            width: 56,
            height: 56,
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
              transform: 'scale(1.1)',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.2)',
            },
          },
          '& .MuiSpeedDialAction-fab': {
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: theme.palette.primary.main,
            width: 48,
            height: 48,
            margin: '8px 0',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 1)',
              transform: 'scale(1.1)',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
              color: theme.palette.primary.dark,
            },
          },
          '& .MuiSpeedDialAction-staticTooltipLabel': {
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '0.875rem',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            tooltipOpen
            onClick={action.onClick}
            sx={{
              '& .MuiSpeedDialAction-staticTooltipLabel': {
                minWidth: 'max-content',
              },
            }}
          />
        ))}
      </SpeedDial>
    </Box>
  );
};

// Alternative simpler floating action button
export const SimpleFloatingAction = ({ 
  icon, 
  onClick, 
  tooltip = 'Action',
  position = { bottom: 24, right: 24 },
  color = 'primary'
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'fixed',
        ...position,
        zIndex: theme.zIndex.fab,
      }}
    >
      <Tooltip title={tooltip} placement="left">
        <Fab
          color={color}
          onClick={onClick}
          sx={{
            background: color === 'primary' 
              ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
              : undefined,
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.2)',
              background: color === 'primary'
                ? `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`
                : undefined,
            },
          }}
        >
          {icon}
        </Fab>
      </Tooltip>
    </Box>
  );
};

// Floating notification badge
export const FloatingNotification = ({ 
  count, 
  onClick,
  position = { top: 100, right: 24 }
}) => {
  const theme = useTheme();

  if (!count || count === 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        ...position,
        zIndex: theme.zIndex.fab,
      }}
    >
      <Tooltip title={`${count} new notifications`} placement="left">
        <Fab
          size="small"
          onClick={onClick}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.warning.main})`,
            color: 'white',
            width: 48,
            height: 48,
            fontSize: '0.875rem',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'pulse 2s infinite',
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
              animation: 'none',
            },
            '@keyframes pulse': {
              '0%, 100%': {
                transform: 'scale(1)',
                opacity: 1,
              },
              '50%': {
                transform: 'scale(1.05)',
                opacity: 0.9,
              },
            },
          }}
        >
          {count > 99 ? '99+' : count}
        </Fab>
      </Tooltip>
    </Box>
  );
};

export default FloatingActions;
