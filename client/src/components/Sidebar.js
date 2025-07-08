import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Divider,
  useTheme,
  IconButton,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

const Sidebar = ({
  drawerWidth,
  mobileOpen,
  onDrawerToggle,
  menuItems,
  selectedView,
  onViewChange,
  isMobile,
}) => {
  const theme = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const handleCollapseToggle = () => {
    setCollapsed(!collapsed);
  };

  const currentDrawerWidth = collapsed ? 72 : drawerWidth;

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Toolbar
        sx={{
          background: 'linear-gradient(135deg, #092f57 0%, #1a4a7a 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: '70px !important',
          px: collapsed ? 1 : 2,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {!collapsed && (
          <Fade in={!collapsed} timeout={300}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              Navigation
            </Typography>
          </Fade>
        )}

        {!isMobile && (
          <Tooltip title={collapsed ? "Expand sidebar" : "Collapse sidebar"} placement="right">
            <IconButton
              onClick={handleCollapseToggle}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                width: 32,
                height: 32,
              }}
            >
              {collapsed ? <ChevronRightIcon sx={{ fontSize: 18 }} /> : <ChevronLeftIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>

      <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.08)' }} />



      {/* Menu Items */}
      <List sx={{ flex: 1, px: collapsed ? 0.5 : 1, py: 1 }}>
        {menuItems.map((item, index) => (
          <Fade key={item.id} in={true} timeout={300} style={{ transitionDelay: `${index * 50}ms` }}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <Tooltip
                title={collapsed ? item.label : ''}
                placement="right"
                disableHoverListener={!collapsed}
              >
                <ListItemButton
                  selected={selectedView === item.id}
                  onClick={() => onViewChange(item.id)}
                  sx={{
                    mx: collapsed ? 0 : 0.5,
                    borderRadius: '6px',
                    minHeight: 48,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    px: collapsed ? 1 : 2,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      background: selectedView === item.id ?
                        `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})` :
                        'transparent',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    },
                    '&.Mui-selected': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}10)`,
                      color: theme.palette.primary.main,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}15)`,
                      },
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.main,
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      transform: collapsed ? 'scale(1.05)' : 'translateX(4px)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed ? 'auto' : 40,
                      color: selectedView === item.id ? theme.palette.primary.main : theme.palette.text.secondary,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {React.cloneElement(item.icon, { sx: { fontSize: 22 } })}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={
                        <Typography
                          sx={{
                            fontSize: '0.9rem',
                            fontWeight: selectedView === item.id ? 600 : 500,
                            letterSpacing: '0.025em',
                          }}
                        >
                          {item.label}
                        </Typography>
                      }
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          </Fade>
        ))}
      </List>

      {/* Footer */}
      <Box sx={{
        p: collapsed ? 1 : 2,
        borderTop: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: '0px !important',
        borderTopLeftRadius: '0px !important',
        borderTopRightRadius: '0px !important',
        borderBottomLeftRadius: '0px !important',
        borderBottomRightRadius: '0px !important',
      }}>
        {!collapsed ? (
          <Fade in={!collapsed} timeout={300}>
            <Box>
              <Typography variant="caption" color="text.secondary" align="center" display="block">
                Driver Safety Dashboard
              </Typography>
              <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ opacity: 0.7 }}>
                Version 1.0.0
              </Typography>
            </Box>
          </Fade>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: theme.palette.success.main,
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                },
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: currentDrawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: currentDrawerWidth,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(0, 0, 0, 0.08)',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
