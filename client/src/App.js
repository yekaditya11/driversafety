import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Dashboard from './components/Dashboard';
import './App.css';

// Import chart manager to initialize it globally
import './services/chartManager';

// Create a professional theme with #092f57
const theme = createTheme({
  palette: {
    primary: {
      main: '#092f57', // Original dark blue
      dark: '#061f3d',
      light: '#1a4a7a',
    },
    secondary: {
      main: '#dc004e', // Original safety red for alerts
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    success: {
      main: '#2e7d32', // Original green for good metrics
    },
    warning: {
      main: '#ed6c02', // Original orange for warnings
    },
    error: {
      main: '#d32f2f', // Original red for critical issues
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: '0px !important', // Remove rounded corners from header
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: '0px !important', // Remove rounded corners from sidebar
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: '8px', // Keep rounded corners for cards
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          '&.MuiAppBar-root': {
            borderRadius: '0px !important', // Ensure AppBar has no rounded corners
          },
          '&.MuiDrawer-paper': {
            borderRadius: '0px !important', // Ensure Drawer has no rounded corners
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Dashboard />
    </ThemeProvider>
  );
}

export default App;
