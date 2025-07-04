/**
 * Custom Dashboard Component
 * Allows users to create custom dashboards with AI-generated charts from chatbot
 * Supports drag-and-drop, resizing, and chart management
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Dashboard as DashboardIcon,
  DragIndicator as DragIcon,
  Fullscreen as FullscreenIcon,
  MoreVert as MoreIcon,
  GridView as GridIcon
} from '@mui/icons-material';
// Note: framer-motion and react-beautiful-dnd removed due to React 19 compatibility
// Using simpler animations and drag functionality

// Import chart components
import ChartRenderer from '../ChartRenderer';

const CustomDashboard = ({
  savedCharts = [],
  onSaveChart,
  onDeleteChart,
  onUpdateDashboard,
  editMode = false,
  onEditModeChange
}) => {
  const [charts, setCharts] = useState(savedCharts);
  const [editDialog, setEditDialog] = useState({ open: false, chart: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, chart: null });
  const [saveDialog, setSaveDialog] = useState({ open: false });
  const [dashboardName, setDashboardName] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedChart, setSelectedChart] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Update charts when savedCharts prop changes
  useEffect(() => {
    setCharts(savedCharts);
  }, [savedCharts]);

  // Handle chart reordering (simplified without drag-and-drop)
  const moveChart = (fromIndex, toIndex) => {
    const items = Array.from(charts);
    const [reorderedItem] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, reorderedItem);

    setCharts(items);

    // Notify parent component
    if (onUpdateDashboard) {
      onUpdateDashboard(items);
    }
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.dataTransfer.setDragImage(e.target, 0, 0);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveChart(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Handle chart edit
  const handleEditChart = (chart) => {
    setEditDialog({ open: true, chart: { ...chart } });
    setAnchorEl(null);
  };

  // Handle chart delete
  const handleDeleteChart = (chart) => {
    setDeleteDialog({ open: true, chart });
    setAnchorEl(null);
  };

  // Handle edit save
  const handleEditSave = () => {
    const { chart } = editDialog;
    if (onDeleteChart && onSaveChart) {
      // Update the chart
      const updatedCharts = charts.map(c => 
        c.id === chart.id ? { ...c, title: chart.title, description: chart.description } : c
      );
      setCharts(updatedCharts);
      
      if (onUpdateDashboard) {
        onUpdateDashboard(updatedCharts);
      }
    }
    setEditDialog({ open: false, chart: null });
  };

  // Handle delete confirm
  const handleDeleteConfirm = () => {
    const { chart } = deleteDialog;
    if (onDeleteChart) {
      onDeleteChart(chart.id);
    }
    setDeleteDialog({ open: false, chart: null });
  };

  // Handle save dashboard
  const handleSaveDashboard = () => {
    if (onSaveChart && dashboardName.trim()) {
      onSaveChart({
        name: dashboardName.trim(),
        charts: charts
      });
      setSaveDialog({ open: false });
      setDashboardName('');
    }
  };

  // Handle chart menu
  const handleChartMenu = (event, chart) => {
    setAnchorEl(event.currentTarget);
    setSelectedChart(chart);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedChart(null);
  };

  // Render individual chart
  const renderChart = (chart, index) => (
    <Grid
      key={chart.id}
      item
      xs={12}
      sm={6}
      md={6}
      lg={6}
      xl={6}
      className="ai-dashboard-grid-item"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 520
      }}
    >
      <Box
        sx={{
          opacity: 1,
          transform: 'none',
          transition: 'transform 0.2s ease, opacity 0.3s ease',
          height: '100%',
          flexDirection: 'column',
          '&:hover': {
            transform: 'translateY(-2px)',
          }
        }}
      >
        <Card
          className="ai-dashboard-card"
          draggable={editMode}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          sx={{
            minHeight: { xs: 480, sm: 520, md: 540, lg: 560 },
            height: 'auto',
            position: 'relative',
            boxShadow: draggedIndex === index ? 4 : (dragOverIndex === index ? 3 : 2),
            transition: 'box-shadow 0.2s ease, transform 0.2s ease',
            overflow: 'visible',
            display: 'flex',
            flexDirection: 'column',
            cursor: editMode ? 'grab' : 'default',
            opacity: draggedIndex === index ? 0.5 : 1,
            transform: dragOverIndex === index ? 'scale(1.02)' : 'scale(1)',
            border: dragOverIndex === index ? '2px dashed #1976d2' : 'none',
            width: '100%',
            '&:hover': {
              boxShadow: draggedIndex === index ? 4 : 3,
            },
            '&:active': {
              cursor: editMode ? 'grabbing' : 'default',
            }
          }}
        >
          {/* Drag Handle - Only show in edit mode */}
          {editMode && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 1,
                px: 1,
                py: 0.5,
                boxShadow: 1
              }}
            >
              <DragIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Drag to reorder
              </Typography>
            </Box>
          )}

          {/* Chart Actions - Only show in edit mode */}
          {editMode && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 10,
                display: 'flex',
                gap: 0.5
              }}
            >
              <Tooltip title="Edit Chart">
                <IconButton
                  size="small"
                  onClick={() => handleEditChart(chart)}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 1)'
                    }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Chart">
                <IconButton
                  size="small"
                  onClick={() => handleDeleteChart(chart)}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: 'error.main',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 1)'
                    }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          <CardContent
            className="ai-dashboard-card-content"
            sx={{
              pt: editMode ? 7 : 2,
              pb: 2,
              px: 1,
              display: 'block',
              overflow: 'visible',
              height: 'auto',
              flex: 'none',
              width: '100%'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, px: 1 }}>
              {chart.title}
            </Typography>
            {chart.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, px: 1 }}>
                {chart.description}
              </Typography>
            )}
            <Box
              className="ai-dashboard-chart-container custom-dashboard-chart"
              sx={{
                width: '100%',
                height: { xs: 320, sm: 360, md: 380, lg: 400 },
                minHeight: { xs: 320, sm: 360, md: 380, lg: 400 },
                maxHeight: { xs: 320, sm: 360, md: 380, lg: 400 },
                overflow: 'hidden',
                position: 'relative',
                '& > div': {
                  width: '100% !important',
                  height: '100% !important'
                },
                '& canvas, & svg': {
                  width: '100% !important',
                  height: '100% !important'
                }
              }}
            >
              <ChartRenderer
                chartConfig={chart.chart_config}
                height={{ xs: 320, sm: 360, md: 380, lg: 400 }}
                width="100%"
                showToolbar={false}
                isAIDashboard={true}
              />
            </Box>

            {/* Chart metadata */}
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Chip
                label={chart.source || 'AI Generated'}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
              {chart.created_at && (
                <Typography variant="caption" color="text.secondary">
                  {new Date(chart.created_at).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Grid>
  );

  return (
    <Box sx={{ width: '100%', p: { xs: 1, sm: 2 } }} className="dashboard-container">
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Custom Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {charts.length === 0 
              ? 'No charts added yet. Use the chatbot to generate charts and add them here.'
              : `${charts.length} chart${charts.length === 1 ? '' : 's'} in your dashboard`
            }
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {charts.length > 0 && (
            <>
              <Button
                variant={editMode ? "contained" : "outlined"}
                startIcon={<EditIcon />}
                onClick={() => onEditModeChange && onEditModeChange(!editMode)}
                color={editMode ? "primary" : "inherit"}
              >
                {editMode ? 'Done Editing' : 'Edit Mode'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={() => setSaveDialog({ open: true })}
              >
                Save Dashboard
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Charts Grid with Drag and Drop */}
      {charts.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
            textAlign: 'center',
            color: 'text.secondary'
          }}
        >
          <DashboardIcon sx={{ fontSize: 64, color: '#9ca3af', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No charts added yet
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', maxWidth: 400 }}>
            Start a conversation with the AI chatbot and add generated charts to your custom dashboard using the "+" button on each chart.
          </Typography>
        </Box>
      ) : (
        <Grid
          container
          spacing={{ xs: 2, sm: 3, md: 3, lg: 4 }}
          sx={{
            width: '100%',
            margin: 0
          }}
          className="ai-dashboard-grid-container custom-dashboard-grid"
        >
          {charts.map((chart, index) => renderChart(chart, index))}
        </Grid>
      )}

      {/* Chart Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEditChart(selectedChart)}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit Chart
        </MenuItem>
        <MenuItem onClick={() => handleDeleteChart(selectedChart)}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete Chart
        </MenuItem>
      </Menu>

      {/* Edit Chart Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, chart: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Chart</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Chart Title"
            fullWidth
            variant="outlined"
            value={editDialog.chart?.title || ''}
            onChange={(e) => setEditDialog(prev => ({
              ...prev,
              chart: { ...prev.chart, title: e.target.value }
            }))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={editDialog.chart?.description || ''}
            onChange={(e) => setEditDialog(prev => ({
              ...prev,
              chart: { ...prev.chart, description: e.target.value }
            }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, chart: null })}>
            Cancel
          </Button>
          <Button onClick={handleEditSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, chart: null })}>
        <DialogTitle>Delete Chart</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.chart?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, chart: null })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save Dashboard Dialog */}
      <Dialog open={saveDialog.open} onClose={() => setSaveDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Save Dashboard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Dashboard Name"
            fullWidth
            variant="outlined"
            value={dashboardName}
            onChange={(e) => setDashboardName(e.target.value)}
            placeholder="Enter a name for your dashboard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialog({ open: false })}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveDashboard}
            variant="contained"
            disabled={!dashboardName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomDashboard;
