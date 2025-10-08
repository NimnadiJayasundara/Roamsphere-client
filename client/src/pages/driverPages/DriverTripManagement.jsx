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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  useMediaQuery,
  Container,
  Fab,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  DirectionsCar,
  Person,
  Phone,
  Email,
  AccessTime,
  LocationOn,
  CheckCircle,
  PlayArrow,
  Stop,
  Navigation,
  Speed,
  Route,
  MyLocation,
  Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TripServices from '../../services/TripServices';
import DriverServices from '../../services/DriverServices';
import LeafletLocationService from '../../services/LocationService';
import Navbar from '../../components/common/Navbar';
import Header from '../../components/common/Header';

const tripSteps = ['Assigned', 'Started', 'In Progress', 'Completed'];

function DriverTripManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [startLocation, setStartLocation] = useState({ latitude: '', longitude: '', address: '' });
  const [endLocation, setEndLocation] = useState({ latitude: '', longitude: '', address: '' });
  const [actualCost, setActualCost] = useState('');
  const [tripNotes, setTripNotes] = useState('');
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    fetchDriverTrips();
    initializeMap();
  }, []);

  const fetchDriverTrips = async () => {
    try {
      setLoading(true);
      const response = await TripServices.getDriverTrips();
      
      if (response.success) {
        setTrips(response.data.trips);
        
        // Find current active trip
        const activeTrip = response.data.trips.find(trip => trip.status === 'in-progress');
        if (activeTrip) {
          setCurrentTrip(activeTrip);
          setIsTracking(true);
        }
      } else {
        setError(response.message || 'Failed to fetch trips');
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = async () => {
    try {
      await LeafletLocationService.initializeMap('driver-trip-map');
      setMapLoaded(true);
    } catch (err) {
      console.error('Map initialization error:', err);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await LeafletLocationService.getCurrentLocation();
      const address = await LeafletLocationService.reverseGeocode(location.lat, location.lng);
      
      setStartLocation({
        latitude: location.lat,
        longitude: location.lng,
        address: address.address
      });
    } catch (err) {
      setError('Unable to get current location');
    }
  };

  const startTrip = async () => {
    try {
      if (!currentTrip) return;

      setLoading(true);
      const response = await TripServices.startTrip(currentTrip.trip_id, startLocation);
      
      if (response.success) {
        setSuccess('Trip started successfully!');
        setIsTracking(true);
        setCurrentTrip({ ...currentTrip, status: 'in-progress' });
        setLocationDialogOpen(false);
        
        // Start location tracking
        startLocationTracking();
      } else {
        setError(response.message || 'Failed to start trip');
      }
    } catch (err) {
      console.error('Error starting trip:', err);
      setError('Failed to start trip');
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = () => {
    LeafletLocationService.startLocationTracking(async (location) => {
      if (location) {
        // Update location on server
        await TripServices.updateTripLocation(currentTrip.trip_id, {
          latitude: location.lat,
          longitude: location.lng,
          heading: location.heading,
          speed: location.speed,
          accuracy: location.accuracy,
          address: await LeafletLocationService.reverseGeocode(location.lat, location.lng).then(r => r.address)
        });
      }
    });
  };

  const completeTrip = async () => {
    try {
      if (!currentTrip) return;

      setLoading(true);
      const response = await TripServices.completeTrip(currentTrip.trip_id, {
        ...endLocation,
        actualCost: parseFloat(actualCost),
        notes: tripNotes
      });
      
      if (response.success) {
        setSuccess('Trip completed successfully!');
        setIsTracking(false);
        setCurrentTrip(null);
        setLocationDialogOpen(false);
        
        // Stop location tracking
        LeafletLocationService.stopLocationTracking();
        
        // Refresh trips
        fetchDriverTrips();
      } else {
        setError(response.message || 'Failed to complete trip');
      }
    } catch (err) {
      console.error('Error completing trip:', err);
      setError('Failed to complete trip');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'info';
      case 'in-progress': return 'success';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Ready to Start';
      case 'in-progress': return 'Trip in Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  const getCurrentStep = (status) => {
    switch (status) {
      case 'confirmed': return 0;
      case 'in-progress': return 2;
      case 'completed': return 3;
      default: return 0;
    }
  };

  if (loading && trips.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress size={60} sx={{ color: '#FDCB42' }} />
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
            {/* Current Trip Status */}
            {currentTrip && (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, mb: 2, bgcolor: '#f8f9fa' }}>
                  <Typography variant="h5" sx={{ mb: 2, color: '#FDCB42' }}>
                    Current Trip
                  </Typography>
                  
                  <Stepper activeStep={getCurrentStep(currentTrip.status)} sx={{ mb: 3 }}>
                    {tripSteps.map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            {currentTrip.title}
                          </Typography>
                          
                          <List dense>
                            <ListItem>
                              <ListItemIcon><LocationOn color="primary" /></ListItemIcon>
                              <ListItemText 
                                primary="Route"
                                secondary={`${currentTrip.origin} → ${currentTrip.destination}`}
                              />
                            </ListItem>
                            
                            <ListItem>
                              <ListItemIcon><AccessTime color="primary" /></ListItemIcon>
                              <ListItemText 
                                primary="Date & Time"
                                secondary={`${currentTrip.preferred_date} at ${currentTrip.preferred_time}`}
                              />
                            </ListItem>
                            
                            <ListItem>
                              <ListItemIcon><Person color="primary" /></ListItemIcon>
                              <ListItemText 
                                primary="Passengers"
                                secondary={currentTrip.passenger_count}
                              />
                            </ListItem>
                            
                            {currentTrip.estimated_cost && (
                              <ListItem>
                                <ListItemIcon><Route color="primary" /></ListItemIcon>
                                <ListItemText 
                                  primary="Estimated Cost"
                                  secondary={`LKR ${currentTrip.estimated_cost}`}
                                />
                              </ListItem>
                            )}
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Chip
                          label={getStatusText(currentTrip.status)}
                          color={getStatusColor(currentTrip.status)}
                          sx={{ alignSelf: 'flex-start' }}
                        />
                        
                        {currentTrip.status === 'confirmed' && (
                          <Button
                            variant="contained"
                            startIcon={<PlayArrow />}
                            onClick={() => setLocationDialogOpen(true)}
                            fullWidth
                            sx={{
                              bgcolor: '#4CAF50',
                              '&:hover': { bgcolor: '#45a049' }
                            }}
                          >
                            Start Trip
                          </Button>
                        )}
                        
                        {currentTrip.status === 'in-progress' && (
                          <Button
                            variant="contained"
                            startIcon={<Stop />}
                            onClick={() => setLocationDialogOpen(true)}
                            fullWidth
                            sx={{
                              bgcolor: '#f44336',
                              '&:hover': { bgcolor: '#da190b' }
                            }}
                          >
                            Complete Trip
                          </Button>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}

            {/* Trip History */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#FDCB42' }}>
                  Trip History
                </Typography>
                
                {trips.length === 0 ? (
                  <Typography color="text.secondary">
                    No trips assigned yet
                  </Typography>
                ) : (
                  <List>
                    {trips.map((trip) => (
                      <React.Fragment key={trip.trip_id}>
                        <ListItem>
                          <ListItemIcon>
                            <DirectionsCar color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={trip.title}
                            secondary={
                              <Box>
                                <Typography variant="body2">
                                  {trip.origin} → {trip.destination}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDateTime(trip.preferred_date)} {trip.preferred_time}
                                </Typography>
                                <Chip
                                  label={getStatusText(trip.status)}
                                  color={getStatusColor(trip.status)}
                                  size="small"
                                  sx={{ ml: 1 }}
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>

            {/* Map */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '400px', position: 'relative' }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#FDCB42' }}>
                  Live Tracking
                </Typography>
                
                <Box sx={{ height: 'calc(100% - 40px)', position: 'relative' }}>
                  <div 
                    id="driver-trip-map" 
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

                {isTracking && (
                  <Fab
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      bgcolor: '#FDCB42',
                      color: 'black',
                      '&:hover': { bgcolor: '#fbbf24' }
                    }}
                    onClick={() => {
                      if (currentTrip) {
                        LeafletLocationService.updateCurrentLocationMarker({
                          lat: currentTrip.origin_latitude || 6.8370,
                          lng: currentTrip.origin_longitude || 80.9999
                        });
                      }
                    }}
                  >
                    <MyLocation />
                  </Fab>
                )}
              </Paper>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}
        </Container>
      </Box>

      {/* Location Dialog */}
      <Dialog
        open={locationDialogOpen}
        onClose={() => setLocationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {currentTrip?.status === 'confirmed' ? 'Start Trip' : 'Complete Trip'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {currentTrip?.status === 'confirmed' ? 'Start Location' : 'End Location'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Address"
                  value={currentTrip?.status === 'confirmed' ? startLocation.address : endLocation.address}
                  onChange={(e) => {
                    if (currentTrip?.status === 'confirmed') {
                      setStartLocation(prev => ({ ...prev, address: e.target.value }));
                    } else {
                      setEndLocation(prev => ({ ...prev, address: e.target.value }));
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<MyLocation />}
                  onClick={getCurrentLocation}
                  sx={{ minWidth: 120 }}
                >
                  Current
                </Button>
              </Box>
            </Grid>
            
            {currentTrip?.status === 'in-progress' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Actual Cost (LKR)"
                    type="number"
                    value={actualCost}
                    onChange={(e) => setActualCost(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Trip Notes"
                    value={tripNotes}
                    onChange={(e) => setTripNotes(e.target.value)}
                    placeholder="Any notes about the trip..."
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLocationDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={currentTrip?.status === 'confirmed' ? startTrip : completeTrip}
            disabled={loading}
            sx={{
              bgcolor: '#FDCB42',
              color: 'black',
              '&:hover': { bgcolor: '#fbbf24' }
            }}
          >
            {loading ? (
              <CircularProgress size={20} />
            ) : currentTrip?.status === 'confirmed' ? (
              'Start Trip'
            ) : (
              'Complete Trip'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DriverTripManagement;
