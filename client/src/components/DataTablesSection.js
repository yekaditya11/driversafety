import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Skeleton,
} from '@mui/material';


const TablePlaceholder = ({ title, loading }) => {
  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
          {[...Array(5)].map((_, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
              <Skeleton variant="text" width="60%" height={20} />
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  const mockDrivers = [
    { name: 'John Smith', score: 92, status: 'Excellent' },
    { name: 'Sarah Johnson', score: 88, status: 'Good' },
    { name: 'Mike Wilson', score: 85, status: 'Good' },
    { name: 'Lisa Brown', score: 78, status: 'Average' },
    { name: 'David Lee', score: 72, status: 'Needs Improvement' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Excellent': return 'success';
      case 'Good': return 'primary';
      case 'Average': return 'warning';
      case 'Needs Improvement': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Driver</TableCell>
                <TableCell align="right">Score</TableCell>
                <TableCell align="right">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockDrivers.map((driver, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.8rem' }}>
                        {driver.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Typography variant="body2">
                        {driver.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {driver.score}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={driver.status}
                      color={getStatusColor(driver.status)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

const DataTablesSection = ({ data, loading }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Performance Tables
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TablePlaceholder
            title="Top Performing Drivers"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TablePlaceholder
            title="Recent Safety Alerts"
            loading={loading}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DataTablesSection;
