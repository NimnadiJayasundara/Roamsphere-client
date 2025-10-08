import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Container,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  LocationOn,
  DirectionsCar,
  Person,
  Phone,
  Email,
  AccessTime,
  Speed,
  Route,
  MyLocation,
  Refresh,
  Call,
  Message
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import TripServices from '../../services/TripServices';
import LeafletLocationService from '../../services/LocationService';
import Navbar from '../../components/common/Navbar';
import Header from '../../components/common/Header';

function CustomerTripTracker() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [driverDetailsOpen, setDriverDetailsOpen] = useState(false);

  useEffect(() => {
    if (tripId) {
      fetchTripDetails();
      initializeMap();
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      LeafletLocationService.cleanup();
    };
  }, [tripId]);

  const fetchTripDetails = async () => {
    try {
      setLoading(true);
      const response = await TripServices.trackTrip(tripId);
      
      if (response.success) {
        setTrip(response.data.trip);
        setTrackingData(response.data.trackingData);
        setTrackingHistory(response.data.trackingHistory || []);
        
        // Start auto-refresh for active trips
        if (response.data.trip.status === 'in-progress') {
          startAutoRefresh();
        }
      } else {
        setError(response.message || 'Failed to fetch trip details');
      }
    } catch (err) {
      console.error('Error fetching trip details:', err);
      setError('Failed to fetch trip details');
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = async () => {
    try {
      await LeafletLocationService.initializeMap('customer-trip-map');
      setMapLoaded(true);
    } catch (err) {
      console.error('Map initialization error:', err);
    }
  };

  const startAutoRefresh = () => {
    const interval = setInterval(() => {
      fetchTripDetails();
    }, 10000); // Refresh every 10 seconds
    setRefreshInterval(interval);
  };

  const stopAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  };

  const refreshData = () => {
    fetchTripDetails();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'default';
      case 'confirmed': return 'info';
      case 'in-progress': return 'success';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Waiting for Assignment';
      case 'confirmed': return 'Driver Assigned';
      case 'in-progress': return 'Trip in Progress';
      case 'completed': return 'Trip Completed';
      case 'cancelled': return 'Trip Cancelled';
      default: return status;
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const callDriver = () => {
    if (trip?.driver_mobile) {
      window.open(`tel:${trip.driver_mobile}`);
    }
  };

  const messageDriver = () => {
    if (trip?.driver_mobile) {
      window.open(`sms:${trip.driver_mobile}`);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress size={60} sx={{ color: '#FDCB42' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!trip) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Alert severity="info">Trip not found</Alert>
      </Box>
    );
  }

  return (
    <Box display="flex" sx={{ minHeight: '100vh' }}>
      {!isMobile && <Navbar />}
      <Box flexGrow={1} sx={{ display: 'flex', flexDirection: 'column' }}>
        {!isMobile && <Header />}
        
        <Container maxWidth="xl" sx={{ flexGrow: 1, py: 2 }}>
          <Grid container spacing={2}>
            {/* Trip Information */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#FDCB42' }}>
                  Trip Information
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {trip.title}
                  </Typography>
                  <Chip
                    label={getStatusText(trip.status)}
                    color={getStatusColor(trip.status)}
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <List dense>
                  <ListItem>
                    <ListItemIcon><LocationOn color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Route"
                      secondary={`${trip.origin} → ${trip.destination}`}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon><AccessTime color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Date & Time"
                      secondary={`${trip.preferred_date} at ${trip.preferred_time}`}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon><Person color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Passengers"
                      secondary={trip.passenger_count}
                    />
                  </ListItem>
                  
                  {trip.estimated_cost && (
                    <ListItem>
                      <ListItemIcon><Route color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary="Estimated Cost"
                        secondary={`LKR ${trip.estimated_cost}`}
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>

              {/* Driver Information */}
              {trip.driver_first_name && (
                <Paper sx={{ p: 3, mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: '#FDCB42' }}>
                    Driver Information
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ 
                      width: 50, 
                      height: 50, 
                      borderRadius: '50%', 
                      bgcolor: '#FDCB42', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      mr: 2
                    }}>
                      <Person sx={{ color: 'black', fontSize: 30 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6">
                        {trip.driver_first_name} {trip.driver_last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Driver
                      </Typography>
                    </Box>
                  </Box>

                  {trip.driver_mobile && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        startIcon={<Call />}
                        onClick={callDriver}
                        size="small"
                        sx={{ flex: 1 }}
                      >
                        Call
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Message />}
                        onClick={messageDriver}
                        size="small"
                        sx={{ flex: 1 }}
                      >
                        Message
                      </Button>
                    </Box>
                  )}
                </Paper>
              )}

              {/* Vehicle Information */}
              {trip.vehicle_model && (
                <Paper sx={{ p: 3, mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: '#FDCB42' }}>
                    Vehicle Information
                  </Typography>
                  
                  <List dense>
                    <ListItem>
                      <ListItemIcon><DirectionsCar color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary="Model"
                        secondary={trip.vehicle_model}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon><Route color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary="License Plate"
                        secondary={trip.vehicle_plate}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon><Person color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary="Capacity"
                        secondary={`${trip.seating_capacity} passengers`}
                      />
                    </ListItem>
                  </List>
                </Paper>
              )}
            </Grid>

            {/* Map and Tracking */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, height: '70vh', position: 'relative' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#FDCB42' }}>
                    Live Tracking
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={refreshData}
                      size="small"
                    >
                      Refresh
                    </Button>
                    <Fab
                      size="small"
                      sx={{
                        bgcolor: '#FDCB42',
                        color: 'black',
                        '&:hover': { bgcolor: '#fbbf24' }
                      }}
                      onClick={() => {
                        if (trackingData?.driverLocation) {
                          LeafletLocationService.updateCurrentLocationMarker({
                            lat: trackingData.driverLocation.latitude,
                            lng: trackingData.driverLocation.longitude
                          });
                        }
                      }}
                    >
                      <MyLocation />
                    </Fab>
                  </Box>
                </Box>

                {/* Map Container */}
                <Box sx={{ height: 'calc(100% - 60px)', position: 'relative' }}>
                  <div 
                    id="customer-trip-map" 
          style={{
            width: '100%',
            height: '100%',
                      borderRadius: '8px'
          }}
        />
                  
                  {!mapLoaded && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      zIndex: 1000
          }}>
            <CircularProgress sx={{ color: '#FDCB42' }} />
          </Box>
        )}
                </Box>

                {/* Real-time Status Overlay */}
                {trip.status === 'in-progress' && trackingData && (
                  <Paper sx={{
          position: 'absolute',
          top: 16,
                    left: 16,
                    p: 2,
                    minWidth: 200,
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#FDCB42', mb: 1 }}>
                      Live Status
            </Typography>
                    <Typography variant="body2">
                      <Speed sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      Speed: {trackingData.driverLocation?.speed ? Math.round(trackingData.driverLocation.speed) : 'N/A'} km/h
                  </Typography>
                    <Typography variant="body2">
                      <AccessTime sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      Last Update: {trackingData.driverLocation?.lastUpdate ? 
                        new Date(trackingData.driverLocation.lastUpdate).toLocaleTimeString() : 'N/A'}
                  </Typography>
                    <Typography variant="body2" sx={{ color: trackingData.isOnline ? 'green' : 'red' }}>
                      Driver: {trackingData.isOnline ? 'Online' : 'Offline'}
                  </Typography>
                  </Paper>
                )}
              </Paper>

              {/* Tracking History */}
              {trackingHistory.length > 0 && (
                <Paper sx={{ p: 2, mt: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: '#FDCB42' }}>
                    Trip Progress
                  </Typography>
                  <List dense>
                    {trackingHistory.slice(0, 5).map((entry, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <LocationOn color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={entry.status === 'started' ? 'Trip Started' : 
                                 entry.status === 'completed' ? 'Trip Completed' : 'Location Update'}
                          secondary={`${formatDateTime(entry.timestamp)} - ${entry.address || 'Location updated'}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
          </Grid>
        </Grid>
          </Container>
      </Box>
    </Box>
  );
}

export default CustomerTripTracker;