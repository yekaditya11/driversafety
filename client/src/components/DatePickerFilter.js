/**
 * Date Picker Filter Component
 * Provides date range selection with predefined options
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Popover,
  ClickAwayListener,
  Paper,
} from '@mui/material';
import {
  DateRange as DateRangeIcon,
  Clear as ClearIcon,
  Today as TodayIcon,
  Check as CheckIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';

const DatePickerFilter = ({
  dateRange,
  onDateRangeChange,
  showDaysBackOption = true,
  label = "Date Filter",
  compact = false
}) => {
  const [filterType, setFilterType] = useState('daysBack');
  // Local state for custom date selection to prevent premature API calls
  const [localCustomDates, setLocalCustomDates] = useState({
    startDate: null,
    endDate: null
  });
  // State for calendar dropdown
  const [calendarAnchorEl, setCalendarAnchorEl] = useState(null);
  const isCalendarOpen = Boolean(calendarAnchorEl);

  // Sync local custom dates with incoming dateRange prop when it changes externally
  useEffect(() => {
    if (dateRange.startDate || dateRange.endDate) {
      setLocalCustomDates({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
    }
  }, [dateRange.startDate, dateRange.endDate]);

  // Predefined date range options
  const daysBackOptions = [
    { value: 7, label: 'Last 7 days' },
    { value: 30, label: 'Last 30 days' },
    { value: 90, label: 'Last 90 days' },
    { value: 180, label: 'Last 6 months' },
    { value: 365, label: 'Last year' },
    { value: 730, label: 'Last 2 years' },
  ];

  // Handle filter type change
  const handleFilterTypeChange = (event) => {
    const newType = event.target.value;
    setFilterType(newType);

    if (newType === 'daysBack') {
      // Reset to default days back and clear local custom dates
      setLocalCustomDates({ startDate: null, endDate: null });
      onDateRangeChange({
        startDate: null,
        endDate: null,
        daysBack: 365
      });
    } else {
      // Reset to custom date range and clear local custom dates
      setLocalCustomDates({ startDate: null, endDate: null });
      // Don't trigger API call yet for custom range
    }
  };

  // Handle days back change
  const handleDaysBackChange = (event) => {
    const daysBack = event.target.value;
    onDateRangeChange({
      startDate: null,
      endDate: null,
      daysBack: daysBack
    });
  };

  // Handle start date change - only update local state, don't trigger API call yet
  const handleStartDateChange = (newDate) => {
    setLocalCustomDates({
      ...localCustomDates,
      startDate: newDate
    });
  };

  // Handle end date change - only update local state, don't trigger API call yet
  const handleEndDateChange = (newDate) => {
    setLocalCustomDates({
      ...localCustomDates,
      endDate: newDate
    });
  };

  // Handle apply custom date range
  const handleApplyCustomRange = () => {
    if (localCustomDates.startDate && localCustomDates.endDate) {
      onDateRangeChange({
        startDate: localCustomDates.startDate,
        endDate: localCustomDates.endDate,
        daysBack: null
      });
      setCalendarAnchorEl(null); // Close the calendar dropdown
    }
  };

  // Handle calendar button click
  const handleCalendarClick = (event) => {
    setCalendarAnchorEl(event.currentTarget);
    setFilterType('custom');
  };

  // Handle calendar close
  const handleCalendarClose = () => {
    setCalendarAnchorEl(null);
  };

  // Clear date filters
  const handleClear = () => {
    setLocalCustomDates({ startDate: null, endDate: null });
    onDateRangeChange({
      startDate: null,
      endDate: null,
      daysBack: 365
    });
    setFilterType('daysBack');
  };

  // Set to today
  const handleToday = () => {
    const today = new Date();
    setLocalCustomDates({ startDate: today, endDate: today });
    onDateRangeChange({
      startDate: today,
      endDate: today,
      daysBack: null
    });
    setFilterType('custom');
  };

  // Compact layout for dashboard header
  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Single dropdown with predefined options only */}
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select
            value={`days_${dateRange.daysBack || 365}`}
            onChange={(e) => {
              const value = e.target.value;
              if (value.startsWith('days_')) {
                const days = parseInt(value.replace('days_', ''));
                setFilterType('daysBack');
                setCalendarAnchorEl(null); // Close calendar if open
                onDateRangeChange({
                  startDate: null,
                  endDate: null,
                  daysBack: days
                });
              }
            }}
            sx={{
              bgcolor: 'white',
              borderRadius: 0.5,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#e5e7eb',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#092f57',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#092f57',
              },
            }}
          >
            {daysBackOptions.map((option) => (
              <MenuItem key={option.value} value={`days_${option.value}`}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Calendar button for custom date range */}
        <Tooltip title="Custom Date Range">
          <IconButton
            onClick={handleCalendarClick}
            sx={{
              bgcolor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: 0.5,
              p: 1.5,
              '&:hover': {
                bgcolor: '#f8fafc',
              }
            }}
          >
            <CalendarIcon sx={{ fontSize: 20, color: '#092f57' }} />
          </IconButton>
        </Tooltip>

        {/* Custom Date Range Popover */}
        <Popover
          open={isCalendarOpen}
          anchorEl={calendarAnchorEl}
          onClose={handleCalendarClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <ClickAwayListener onClickAway={handleCalendarClose}>
            <Paper sx={{ p: 2, minWidth: 400 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: '#092f57', fontWeight: 600 }}>
                Select Custom Date Range
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                {/* Start Date */}
                <TextField
                  type="date"
                  size="small"
                  label="Start Date"
                  value={localCustomDates.startDate ? localCustomDates.startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleStartDateChange(e.target.value ? new Date(e.target.value) : null)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    max: localCustomDates.endDate ? localCustomDates.endDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                  }}
                  sx={{ flex: 1 }}
                />

                {/* End Date */}
                <TextField
                  type="date"
                  size="small"
                  label="End Date"
                  value={localCustomDates.endDate ? localCustomDates.endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleEndDateChange(e.target.value ? new Date(e.target.value) : null)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: localCustomDates.startDate ? localCustomDates.startDate.toISOString().split('T')[0] : undefined,
                    max: new Date().toISOString().split('T')[0]
                  }}
                  sx={{ flex: 1 }}
                />
              </Box>

              {/* Warning/Info Messages */}
              {(!localCustomDates.startDate || !localCustomDates.endDate) && (
                <Typography variant="caption" color="warning.main" sx={{ display: 'block', mb: 2 }}>
                  ⚠️ Please select both start and end dates
                </Typography>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  onClick={handleCalendarClose}
                  sx={{ color: '#6b7280' }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleApplyCustomRange}
                  disabled={!localCustomDates.startDate || !localCustomDates.endDate}
                  sx={{
                    bgcolor: '#092f57',
                    '&:hover': { bgcolor: '#061f3d' }
                  }}
                >
                  Apply
                </Button>
              </Box>
            </Paper>
          </ClickAwayListener>
        </Popover>
      </Box>
    );
  }

  // Full layout for other uses (not used in compact mode)
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="subtitle2" sx={{ mb: 2, color: '#092f57', fontWeight: 600 }}>
        {label}
      </Typography>
      {/* Add full layout implementation if needed */}
    </Box>
  );
};

export default DatePickerFilter;
