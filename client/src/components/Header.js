import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
} from '@mui/icons-material';

const Header = ({ drawerWidth, onMenuClick, isMobile }) => {
  const theme = useTheme();

  return (
    <AppBar
      position="fixed"
      sx={{
        width: '100%',
        backgroundColor: '#092f57',
        color: 'white',
        boxShadow: '0 2px 8px rgba(9,47,87,0.2)',
        zIndex: theme.zIndex.drawer + 1,
        borderRadius: '0 !important',
        borderTopLeftRadius: '0 !important',
        borderTopRightRadius: '0 !important',
        borderBottomLeftRadius: '0 !important',
        borderBottomRightRadius: '0 !important',
        left: 0,
        right: 0,
      }}
    >
      <Toolbar sx={{
        minHeight: '70px !important',
        px: { xs: 2, sm: 3 },
        borderRadius: '0 !important',
        borderTopLeftRadius: '0 !important',
        borderTopRightRadius: '0 !important',
        borderBottomLeftRadius: '0 !important',
        borderBottomRightRadius: '0 !important',
      }}>
        {/* Menu Button for Mobile */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo Only */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <img
            src="/SafetyConnect_logo.png"
            alt="SafetyConnect"
            style={{
              height: '30px',
              maxHeight: '30px',
              width: 'auto',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)', // Make logo white
            }}
          />
        </Box>



        {/* Right Side Icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit">
            <NotificationsIcon />
          </IconButton>
          <IconButton color="inherit">
            <AccountIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
