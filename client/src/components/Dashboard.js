import React, { useState } from 'react';
import {
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import Header from './Header';
import Sidebar from './Sidebar';
import DashboardContent from './DashboardContent';
import ChatBot from './ChatBot';



const drawerWidth = 240;

const Dashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedView, setSelectedView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const currentDrawerWidth = sidebarCollapsed ? 72 : drawerWidth;

  // State for date range filtering (shared between components)
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
    daysBack: 365 // Default to last year
  });

  // Calculate start and end dates based on dateRange
  const getDateParams = () => {
    if (dateRange.startDate && dateRange.endDate) {
      return {
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0]
      };
    } else if (dateRange.daysBack) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - dateRange.daysBack);
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
    }
    return { startDate: null, endDate: null };
  };

  const { startDate, endDate } = getDateParams();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleViewChange = (view) => {
    setSelectedView(view);
    if (isMobile) {
      setMobileOpen(false);
    }
  };



  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'ai-dashboard', label: 'AI Dashboard', icon: <AnalyticsIcon /> },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Header */}
      <Header 
        drawerWidth={drawerWidth}
        onMenuClick={handleDrawerToggle}
        isMobile={isMobile}
      />

      {/* Sidebar */}
      <Sidebar
        drawerWidth={drawerWidth}
        mobileOpen={mobileOpen}
        onDrawerToggle={handleDrawerToggle}
        menuItems={menuItems}
        selectedView={selectedView}
        onViewChange={handleViewChange}
        isMobile={isMobile}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          position: 'fixed',
          top: '70px',
          left: { xs: 0, sm: `${currentDrawerWidth}px` },
          right: 0,
          bottom: 0,
          backgroundColor: theme.palette.background.default,
          overflow: 'auto',
          pl: { xs: 1, sm: 3 },
          pr: { xs: 1, sm: 3 },
          pt: { xs: 1, sm: 2 },
          pb: { xs: 1, sm: 2 },
          width: { xs: '100%', sm: `calc(100% - ${currentDrawerWidth}px)` },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <DashboardContent
          selectedView={selectedView}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          startDate={startDate}
          endDate={endDate}
        />
      </Box>

      {/* Chat Bot */}
      <ChatBot />




    </Box>
  );
};

export default Dashboard;
