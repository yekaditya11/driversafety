import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Dashboard from './components/Dashboard';
import './App.css';

// Import chart manager to initialize it globally
import './services/chartManager';

// Create a modern theme with enhanced design tokens
const theme = createTheme({
  palette: {
    primary: {
      main: '#092f57', // Original dark blue
      dark: '#061f3d',
      light: '#1a4a7a',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6366f1', // Modern indigo accent
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafbfc', // Softer background
      paper: '#ffffff',
      surface: '#f8fafc', // New surface level
    },
    success: {
      main: '#10b981', // Modern green
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b', // Modern amber
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444', // Modern red
      light: '#f87171',
      dark: '#dc2626',
    },
    info: {
      main: '#3b82f6', // Modern blue
      light: '#60a5fa',
      dark: '#2563eb',
    },
    grey: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.025em',
      fontSize: '2.25rem',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
      fontSize: '1.875rem',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.025em',
      fontSize: '1.5rem',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.025em',
      fontSize: '1.25rem',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.025em',
      fontSize: '1.125rem',
    },
    h6: {
      fontWeight: 500,
      letterSpacing: '-0.025em',
      fontSize: '1rem',
    },
    body1: {
      lineHeight: 1.6,
      fontSize: '1rem',
    },
    body2: {
      lineHeight: 1.5,
      fontSize: '0.875rem',
    },
    button: {
      fontWeight: 500,
      letterSpacing: '0.025em',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 4, // Reduced radius for less rounded corners
  },
  shadows: [
    'none',
    '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  ],
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: '0px !important',
          borderTopLeftRadius: '0px !important',
          borderTopRightRadius: '0px !important',
          borderBottomLeftRadius: '0px !important',
          borderBottomRightRadius: '0px !important',
          background: 'linear-gradient(135deg, #092f57 0%, #1a4a7a 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(9, 47, 87, 0.3)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: '0px !important',
          borderTopLeftRadius: '0px !important',
          borderTopRightRadius: '0px !important',
          borderBottomLeftRadius: '0px !important',
          borderBottomRightRadius: '0px !important',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 500,
          padding: '10px 20px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          '&.MuiAppBar-root': {
            borderRadius: '0px !important',
            borderTopLeftRadius: '0px !important',
            borderTopRightRadius: '0px !important',
            borderBottomLeftRadius: '0px !important',
            borderBottomRightRadius: '0px !important',
          },
          '&.MuiDrawer-paper': {
            borderRadius: '0px !important',
            borderTopLeftRadius: '0px !important',
            borderTopRightRadius: '0px !important',
            borderBottomLeftRadius: '0px !important',
            borderBottomRightRadius: '0px !important',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          margin: '4px 8px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateX(4px)',
          },
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, #092f57 0%, #1a4a7a 100%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(135deg, #061f3d 0%, #092f57 100%)',
            },
          },
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          borderRadius: '0px !important',
          borderTopLeftRadius: '0px !important',
          borderTopRightRadius: '0px !important',
          borderBottomLeftRadius: '0px !important',
          borderBottomRightRadius: '0px !important',
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
