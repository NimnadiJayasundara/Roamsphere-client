
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  Chip,
  Alert,
  CircularProgress,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Container,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton
} from '@mui/material';
import {
  LocationOn,
  Navigation,
  Stop,
  PlayArrow,
  MyLocation,
  Timer,
  Speed,
  Route,
  Settings,
  Map,
  Close,
  Share
} from '@mui/icons-material';
import LeafletLocationService from '../../services/LocationService';
import TripServices from '../../services/TripServices';
import Navbar from '../../components/common/Navbar';
import Header from '../../components/common/Header';
import { jwtDecode } from 'jwt-decode';

function TripTracker({ tripId, onLocationUpdate, embedded = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const mapRef = useRef(null);
  
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [currentDriverId, setCurrentDriverId] = useState(null);
  const [tripStats, setTripStats] = useState({
    distance: 0,
    duration: 0,
    speed: 0,
    startTime: null,
    totalDistance: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [autoSendLocation, setAutoSendLocation] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showTrail, setShowTrail] = useState(true);
  const [trackingStatus, setTrackingStatus] = useState('ready'); // ready, starting, active, stopping
  
  // Popular Sri Lankan destinations
  const popularDestinations = [
    'Colombo', 'Kandy', 'Galle', 'Negombo', 'Jaffna', 
    'Anuradhapura', 'Polonnaruwa', 'Trincomalee', 'Batticaloa',
    'Ratnapura', 'Kurunegala', 'Matara', 'Hambantota'
  ];

  useEffect(() => {
    initializeComponent();
    return () => {
      LeafletLocationService.cleanup();
    };
  }, []);

  const initializeComponent = async () => {
    await getCurrentDriverInfo();
    await initializeMap();
    await getCurrentLocation();
  };

  const getCurrentDriverInfo = () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const decoded = jwtDecode(token);
        setCurrentDriverId(decoded.userId || decoded.user_id);
      }
    } catch (error) {
      console.error('Error getting driver info:', error);
    }
  };

  const initializeMap = async () => {
    try {
      setLoading(true);
      await LeafletLocationService.initializeMap(mapRef.current);
      setMapLoaded(true);
      setError('');
    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Failed to load map. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await LeafletLocationService.getCurrentLocation();
      setCurrentLocation(location);
      LeafletLocationService.updateCurrentLocationMarker(location);
      
      // Get address for current location
      const address = await LeafletLocationService.reverseGeocode(location.lat, location.lng);
      console.log('Current address:', address.address);
      
      // Send initial location to server if auto-send is enabled
      if (autoSendLocation && currentDriverId) {
        await sendLocationToServer(currentDriverId, location, tripId);
      }
    } catch (err) {
      console.error('Location error:', err);
      setError('Unable to get current location. Please check location permissions.');
    }
  };

  const sendLocationToServer = async (driverId, location, tripId) => {
    try {
      await TripServices.updateDriverLocation({
        driverId,
        latitude: location.lat,
        longitude: location.lng,
        accuracy: location.accuracy,
        speed: location.speed,
        heading: location.heading,
        isOnline: true,
        tripId
      });
    } catch (error) {
      console.error('Error sending location to server:', error);
    }
  };

const handleDestinationSubmit = async () => {
  if (!destination.trim()) {
    setError('Please enter a destination');
    return;
  }

  try {
    setLoading(true);
    setError('');
    setSuccess('');

    // Geocode the destination address
    const geocodedResult = await LeafletLocationService.geocode(destination);
    const destLocation = {
      lat: geocodedResult.lat,
      lng: geocodedResult.lng
    };
    
    setDestinationCoords(destLocation);
    
    // Add destination marker with the actual address
    LeafletLocationService.addDestinationMarker(destLocation, geocodedResult.address);

    if (currentLocation) {
      const route = await LeafletLocationService.calculateRoute(
        currentLocation,
        destLocation,
        'driving'
      );

      if (route && route.coordinates?.length > 0) {
        setRouteInfo(route);
        LeafletLocationService.drawRoute(route.coordinates);
        
        // Get current location address for display
        const currentAddress = await LeafletLocationService.reverseGeocode(
          currentLocation.lat,
          currentLocation.lng
        );
        
        setSuccess(`Route from ${currentAddress.address} → ${geocodedResult.address} displayed!`);
      } else {
        throw new Error('No route found between current location and destination');
      }
    } else {
      setSuccess(`Destination set: ${geocodedResult.address}`);
    }
  } catch (err) {
    console.error('Destination error:', err);
    setError(err.message || 'Failed to find destination. Please try a different address.');
  } finally {
    setLoading(false);
  }
};




  const startTracking = async () => {
    if (!currentLocation || !destinationCoords) {
      setError('Please set a destination before starting tracking');
      return;
    }

    try {
      setLoading(true);
      setTrackingStatus('starting');
      setIsTracking(true);

      const startTime = new Date();
      setTripStats(prev => ({
        ...prev,
        startTime: startTime
      }));

      // Clear previous trail if not showing
      if (!showTrail) {
        LeafletLocationService.clearVehicleTrail();
      }

      // Calculate and draw route when trip starts
      const route = await LeafletLocationService.calculateRoute(
        currentLocation,
        destinationCoords,
        'driving'
      );

      if (route && route.coordinates && route.coordinates.length > 0) {
        setRouteInfo(route);
        LeafletLocationService.drawRoute(route.coordinates);
      } else {
        console.warn('No route found between start and destination');
      }

      // Server trip start logic
      if (tripId) {
        const startAddress = await LeafletLocationService.reverseGeocode(
          currentLocation.lat,
          currentLocation.lng
        );

        await TripServices.startTripTracking(tripId, {
          driverId: currentDriverId,
          startLatitude: currentLocation.lat,
          startLongitude: currentLocation.lng,
          startAddress: startAddress.address
        });
      }

      // Start real-time location tracking
      LeafletLocationService.startLocationTracking(async (location, error) => {
        if (error) {
          console.error('Location tracking error:', error);
          setError('Location tracking failed. Please check permissions.');
          return;
        }

        if (location) {
          setCurrentLocation(location);
          updateTripStats(location);

          // Send location to server
          if (autoSendLocation) {
            await sendLocationToServer(currentDriverId, location, tripId);
          }

          // Notify parent component
          if (onLocationUpdate) {
            onLocationUpdate({
              tripId,
              location,
              timestamp: new Date().toISOString(),
              driverId: currentDriverId
            });
          }
        }
      });

      setTrackingStatus('active');
      setSuccess('Real-time tracking started successfully!');
      setError('');
    } catch (err) {
      console.error('Tracking start error:', err);
      setIsTracking(false);
      setTrackingStatus('ready');
      setError('Failed to start tracking. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const stopTracking = async () => {
    try {
      setLoading(true);
      setTrackingStatus('stopping');
      setIsTracking(false);
      LeafletLocationService.stopLocationTracking();
      
      const endTime = new Date();
      const duration = tripStats.startTime ? 
        (endTime - tripStats.startTime) / 1000 / 60 : 0; // in minutes

      // Stop trip tracking on server
      if (tripId && currentLocation && currentDriverId) {
        const endAddress = await LeafletLocationService.reverseGeocode(
          currentLocation.lat, 
          currentLocation.lng
        );
        
        await TripServices.stopTripTracking(tripId, {
          driverId: currentDriverId,
          endLatitude: currentLocation.lat,
          endLongitude: currentLocation.lng,
          endAddress: endAddress.address,
          totalDistance: tripStats.totalDistance,
          totalDuration: Math.round(duration)
        });
      }
      
      setTripStats(prev => ({
        ...prev,
        duration: duration
      }));

      setTrackingStatus('ready');
      setSuccess('Trip completed successfully!');
    } catch (err) {
      console.error('Error stopping trip:', err);
      setError('Error stopping trip tracking');
      setTrackingStatus('ready');
    } finally {
      setLoading(false);
    }
  };

  const toggleTrail = () => {
    setShowTrail(!showTrail);
    if (!showTrail) {
      // Trail is being enabled, but we need to clear it first to start fresh
      LeafletLocationService.clearVehicleTrail();
    } else {
      // Trail is being disabled, clear existing trail
      LeafletLocationService.clearVehicleTrail();
    }
  };

  const handleQuickDestination = async (dest) => {
    setDestination(dest);
    await handleDestinationSubmit();
  };

  const updateTripStats = (location) => {
    if (!destinationCoords) return;

    // Calculate distance to destination
    const distanceToDestination = LeafletLocationService.calculateDistance(
      location,
      destinationCoords
    );

    // Calculate total distance traveled
    const totalDistance = tripStats.startTime && currentLocation ? 
      LeafletLocationService.calculateDistance(currentLocation, location) + tripStats.totalDistance : 0;

    // Calculate speed (if available)
    const speed = location.speed ? (location.speed * 3.6) : 0; // Convert m/s to km/h

    setTripStats(prev => ({
      ...prev,
      distance: distanceToDestination,
      speed: speed,
      totalDistance: totalDistance
    }));

    // Update trip progress on server
    if (tripId && isTracking) {
      const progress = {
        distanceCovered: totalDistance,
        timeElapsed: tripStats.startTime ? 
          Math.round((new Date() - tripStats.startTime) / 1000) : 0,
        estimatedTimeRemaining: Math.round(distanceToDestination / (speed || 1) * 60),
        estimatedDistanceRemaining: distanceToDestination,
        currentSpeed: speed
      };

      TripServices.updateTripProgress(tripId, {
        currentLatitude: location.lat,
        currentLongitude: location.lng,
        ...progress
      }).catch(err => console.error('Error updating trip progress:', err));
    }
  };

  const centerOnCurrentLocation = async () => {
    try {
      const location = await LeafletLocationService.getCurrentLocation();
      setCurrentLocation(location);
      LeafletLocationService.updateCurrentLocationMarker(location, false);
    } catch (err) {
      setError('Unable to get current location');
    }
  };

  const shareLocation = async () => {
    if (!currentLocation) {
      setError('Current location not available');
      return;
    }

    try {
      const locationUrl = `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'My Current Location',
          text: 'Here is my current location',
          url: locationUrl
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(locationUrl);
        setSuccess('Location link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing location:', err);
      setError('Unable to share location');
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Render map and controls
  const renderMapAndControls = () => (
    <>
      {/* Map Container */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <div 
          ref={mapRef} 
          style={{ 
            width: '100%', 
            height: '100%',
            borderRadius: isMobile ? 0 : '8px'
          }} 
        />
        
        {loading && !mapLoaded && (
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

        {/* Map Controls */}
        <Box sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}>
          <Fab
            size="small"
            sx={{
              bgcolor: '#FDCB42',
              color: 'black',
              '&:hover': { bgcolor: '#fbbf24' }
            }}
            onClick={centerOnCurrentLocation}
          >
            <MyLocation />
          </Fab>
          
          <Fab
            size="small"
            sx={{
              bgcolor: showTrail ? '#4CAF50' : 'white',
              color: showTrail ? 'white' : 'black',
              '&:hover': { bgcolor: showTrail ? '#45a049' : '#f5f5f5' }
            }}
            onClick={toggleTrail}
            title={showTrail ? 'Hide vehicle trail' : 'Show vehicle trail'}
          >
            <Route />
          </Fab>
          
          <Fab
            size="small"
            sx={{
              bgcolor: 'white',
              color: 'black',
              '&:hover': { bgcolor: '#f5f5f5' }
            }}
            onClick={() => setSettingsOpen(true)}
          >
            <Settings />
          </Fab>
          
          <Fab
            size="small"
            sx={{
              bgcolor: 'green',
              color: 'white',
              '&:hover': { bgcolor: '#45a049' }
            }}
            onClick={shareLocation}
          >
            <Share />
          </Fab>
        </Box>

        {/* Trip Status Overlay */}
        {isTracking && (
          <Paper sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            p: 2,
            minWidth: 220,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}>
            <Typography variant="h6" sx={{ color: '#FDCB42', mb: 1, display: 'flex', alignItems: 'center' }}>
              <Box sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: trackingStatus === 'active' ? '#4CAF50' : '#FF9800',
                mr: 1,
                animation: trackingStatus === 'active' ? 'pulse 2s infinite' : 'none'
              }} />
              Real-time Tracking
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <Speed sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              Speed: {Math.round(tripStats.speed)} km/h
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <LocationOn sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              Distance: {tripStats.distance.toFixed(1)} km
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <Timer sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              Duration: {tripStats.startTime ? 
                formatDuration((new Date() - tripStats.startTime) / 1000 / 60) : '0m'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
              Trail: {showTrail ? 'ON' : 'OFF'}
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Control Panel */}
      <Paper sx={{ 
        p: isMobile ? 2 : 3, 
        borderRadius: isMobile ? 0 : '8px 8px 0 0',
        maxHeight: isMobile ? '50vh' : '40vh',
        overflow: 'auto'
      }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Destination Input */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                label="Enter Destination"
                placeholder="e.g., Colombo, Kandy, Galle, Negombo..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                disabled={isTracking}
                size={isMobile ? "small" : "medium"}
                InputProps={{
                  startAdornment: <LocationOn sx={{ mr: 1, color: '#FDCB42' }} />
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleDestinationSubmit()}
                helperText="Enter a city, town, or specific address in Sri Lanka"
              />
              <Button
                variant="contained"
                onClick={handleDestinationSubmit}
                disabled={loading || isTracking}
                sx={{
                  bgcolor: '#FDCB42',
                  color: 'black',
                  '&:hover': { bgcolor: '#fbbf24' },
                  minWidth: isMobile ? 80 : 100
                }}
              >
                {loading ? <CircularProgress size={20} /> : 'Set'}
              </Button>
            </Box>
          </Grid>

          {/* Quick Destination Buttons */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Quick Select:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {popularDestinations.map((dest) => (
                <Chip
                  key={dest}
                  label={dest}
                  onClick={() => handleQuickDestination(dest)}
                  disabled={isTracking || loading}
                  size="small"
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: '#FDCB42',
                      color: 'black'
                    }
                  }}
                />
              ))}
            </Box>
          </Grid>

          {/* Trip Stats */}
          {routeInfo && (
            <Grid item xs={12}>
              <Grid container spacing={1}>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Distance
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#FDCB42' }}>
                      {routeInfo.distance}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Duration
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#FDCB42' }}>
                      {routeInfo.duration}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Speed
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#FDCB42' }}>
                      {Math.round(tripStats.speed)} km/h
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={isTracking ? 'Tracking' : 'Ready'}
                      color={isTracking ? 'success' : 'default'}
                      size="small"
                    />
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          )}

          {/* Control Buttons */}
          <Grid item xs={12}>
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              justifyContent: 'center',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              {!isTracking ? (
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={startTracking}
                  disabled={!destinationCoords || loading}
                  fullWidth={isMobile}
                  sx={{
                    bgcolor: '#4CAF50',
                    '&:hover': { bgcolor: '#45a049' }
                  }}
                >
                  {trackingStatus === 'starting' ? 'Starting...' : 'Start Real-time Tracking'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<Stop />}
                  onClick={stopTracking}
                  disabled={loading}
                  fullWidth={isMobile}
                  sx={{
                    bgcolor: '#f44336',
                    '&:hover': { bgcolor: '#da190b' }
                  }}
                >
                  {trackingStatus === 'stopping' ? 'Stopping...' : 'Stop Tracking'}
                </Button>
              )}
              
              <Button
                variant="outlined"
                startIcon={<Navigation />}
                disabled={!routeInfo}
                fullWidth={isMobile}
                onClick={() => {
                  if (routeInfo && destinationCoords) {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${destinationCoords.lat},${destinationCoords.lng}`;
                    window.open(url, '_blank');
                  }
                }}
                sx={{
                  borderColor: '#FDCB42',
                  color: '#FDCB42',
                  '&:hover': {
                    bgcolor: '#FDCB42',
                    color: 'black'
                  }
                }}
              >
                Open in Maps
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Settings Dialog */}
      <Dialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Trip Tracker Settings
          {isMobile && (
            <IconButton
              sx={{ position: 'absolute', right: 8, top: 8 }}
              onClick={() => setSettingsOpen(false)}
            >
              <Close />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoSendLocation}
                  onChange={(e) => setAutoSendLocation(e.target.checked)}
                  color="primary"
                />
              }
              label="Auto-send location to server"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={showTrail}
                  onChange={(e) => setShowTrail(e.target.checked)}
                  color="primary"
                />
              }
              label="Show vehicle trail"
            />
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Current Location
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentLocation ? 
                `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}` : 
                'Location not available'
              }
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Trip Statistics
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><Timer /></ListItemIcon>
                <ListItemText 
                  primary="Trip Duration"
                  secondary={tripStats.startTime ? 
                    formatDuration((new Date() - tripStats.startTime) / 1000 / 60) : 'Not started'
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Route /></ListItemIcon>
                <ListItemText 
                  primary="Total Distance"
                  secondary={`${tripStats.totalDistance.toFixed(2)} km`}
                />
              </ListItem>
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  // If embedded, render without Navbar/Header
  if (embedded) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {renderMapAndControls()}
      </Box>
    );
  }

  // Full page layout with Navbar/Header
  return (
    <Box display="flex" sx={{ minHeight: '100vh' }}>
      {!isMobile && <Navbar />}
      <Box flexGrow={1} sx={{ display: 'flex', flexDirection: 'column' }}>
        {!isMobile && <Header />}
        
        {/* Main Content */}
        <Box sx={{ 
          flexGrow: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: isMobile ? '100vh' : 'calc(100vh - 64px)'
        }}>
          <Container maxWidth="xl" sx={{ 
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            p: isMobile ? 0 : 1
          }}>
            {/* Trip Tracker Header */}
            {!isMobile && (
              <Paper sx={{ p: 2, mb: 1 }}>
                <Typography variant="h6" sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: '#FDCB42'
                }}>
                  <Map sx={{ mr: 1 }} />
                  Trip Tracker
                  {tripId && (
                    <Chip 
                      label={`Trip ID: ${tripId}`} 
                      size="small" 
                      sx={{ ml: 2 }}
                    />
                  )}
                </Typography>
              </Paper>
            )}
            
            {/* Map and Controls */}
            <Box sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'column',
              minHeight: 0
            }}>
              {renderMapAndControls()}
            </Box>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}

export default TripTracker;