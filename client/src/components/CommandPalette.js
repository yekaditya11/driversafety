import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
  InputAdornment,
  Fade,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  KeyboardArrowRight as ArrowIcon,
} from '@mui/icons-material';

const CommandPalette = ({ open, onClose, onNavigate, onRefresh }) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Define available commands
  const commands = [
    {
      id: 'dashboard',
      title: 'Go to Dashboard',
      description: 'View main dashboard with KPIs and charts',
      icon: <DashboardIcon />,
      action: () => onNavigate('dashboard'),
      category: 'Navigation',
      keywords: ['dashboard', 'home', 'main', 'kpi', 'charts'],
    },
    {
      id: 'ai-dashboard',
      title: 'Go to AI Dashboard',
      description: 'View AI-generated charts and insights',
      icon: <AnalyticsIcon />,
      action: () => onNavigate('ai-dashboard'),
      category: 'Navigation',
      keywords: ['ai', 'analytics', 'insights', 'charts'],
    },
    {
      id: 'refresh',
      title: 'Refresh Data',
      description: 'Reload all dashboard data',
      icon: <RefreshIcon />,
      action: onRefresh,
      category: 'Actions',
      keywords: ['refresh', 'reload', 'update', 'sync'],
    },
    {
      id: 'export',
      title: 'Export Data',
      description: 'Download dashboard data as PDF or Excel',
      icon: <DownloadIcon />,
      action: () => console.log('Export functionality'),
      category: 'Actions',
      keywords: ['export', 'download', 'pdf', 'excel', 'save'],
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure dashboard preferences',
      icon: <SettingsIcon />,
      action: () => console.log('Settings functionality'),
      category: 'System',
      keywords: ['settings', 'preferences', 'config', 'options'],
    },
    {
      id: 'help',
      title: 'Help & Documentation',
      description: 'View help documentation and guides',
      icon: <HelpIcon />,
      action: () => console.log('Help functionality'),
      category: 'System',
      keywords: ['help', 'docs', 'documentation', 'guide', 'support'],
    },
  ];

  // Filter commands based on search query
  const filteredCommands = commands.filter(command => {
    const query = searchQuery.toLowerCase();
    return (
      command.title.toLowerCase().includes(query) ||
      command.description.toLowerCase().includes(query) ||
      command.keywords.some(keyword => keyword.includes(query)) ||
      command.category.toLowerCase().includes(query)
    );
  });

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event) => {
    if (!open) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleCommandSelect(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
      default:
        break;
    }
  }, [open, filteredCommands, selectedIndex, onClose]);

  // Handle command selection
  const handleCommandSelect = (command) => {
    command.action();
    onClose();
    setSearchQuery('');
    setSelectedIndex(0);
  };

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((groups, command) => {
    const category = command.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(command);
    return groups;
  }, {});

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '16px',
          maxHeight: '70vh',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Search Input */}
        <Box sx={{ p: 3, pb: 0 }}>
          <TextField
            fullWidth
            placeholder="Type a command or search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                },
                '&.Mui-focused': {
                  borderColor: theme.palette.primary.main,
                  boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
                },
                '& fieldset': {
                  border: 'none',
                },
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Chip
                      label="ESC"
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.75rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.08)',
                        color: theme.palette.text.secondary,
                      }}
                    />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        {/* Commands List */}
        <Box sx={{ maxHeight: '400px', overflow: 'auto', p: 2 }}>
          {filteredCommands.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No commands found for "{searchQuery}"
              </Typography>
            </Box>
          ) : (
            Object.entries(groupedCommands).map(([category, categoryCommands]) => (
              <Box key={category} sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    px: 2,
                    py: 1,
                    display: 'block',
                  }}
                >
                  {category}
                </Typography>
                <List sx={{ py: 0 }}>
                  {categoryCommands.map((command, categoryIndex) => {
                    const globalIndex = filteredCommands.indexOf(command);
                    const isSelected = globalIndex === selectedIndex;
                    
                    return (
                      <Fade key={command.id} in={true} timeout={300}>
                        <ListItem disablePadding>
                          <ListItemButton
                            selected={isSelected}
                            onClick={() => handleCommandSelect(command)}
                            sx={{
                              borderRadius: '8px',
                              mx: 1,
                              mb: 0.5,
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&.Mui-selected': {
                                backgroundColor: theme.palette.primary.main,
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: theme.palette.primary.dark,
                                },
                                '& .MuiListItemIcon-root': {
                                  color: 'white',
                                },
                              },
                            }}
                          >
                            <ListItemIcon
                              sx={{
                                color: isSelected ? 'white' : theme.palette.text.secondary,
                                minWidth: 40,
                              }}
                            >
                              {command.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={command.title}
                              secondary={command.description}
                              primaryTypographyProps={{
                                fontWeight: 500,
                                fontSize: '0.9rem',
                              }}
                              secondaryTypographyProps={{
                                fontSize: '0.8rem',
                                color: isSelected ? 'rgba(255,255,255,0.7)' : theme.palette.text.secondary,
                              }}
                            />
                            <ArrowIcon
                              sx={{
                                fontSize: 16,
                                color: isSelected ? 'white' : theme.palette.text.secondary,
                                opacity: 0.5,
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      </Fade>
                    );
                  })}
                </List>
              </Box>
            ))
          )}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Use ↑↓ to navigate, ↵ to select, ESC to close
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label="⌘K" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
