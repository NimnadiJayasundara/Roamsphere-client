
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
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
import L from 'leaflet';

function TripTracker({ tripId, onLocationUpdate, embedded = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const mapRef = useRef(null);
  
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [currentDriverId, setCurrentDriverId] = useState(null);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
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

  // Draw route on map when routeInfo is available
  useEffect(() => {
    if (routeInfo && mapLoaded) {
      drawRouteOnMap(routeInfo);
    }
  }, [routeInfo, mapLoaded]);

  // Scroll event listener for scroll buttons
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      setShowScrollTop(scrollTop > 300);
      setShowScrollBottom(scrollTop < documentHeight - windowHeight - 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  const initializeComponent = async () => {
    await getCurrentDriverInfo();
    await fetchCurrentTrip();
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

  const fetchCurrentTrip = async () => {
    try {
      setLoading(true);
      
      // First check if trip data was passed via localStorage (from START button)
      const storedTripData = localStorage.getItem('currentTripData');
      if (storedTripData) {
        const tripData = JSON.parse(storedTripData);
        setCurrentTrip(tripData);
        setDestination(tripData.destination);
        // Calculate route for the trip
        await calculateRoute(tripData.origin, tripData.destination);
        // Clear the stored data after using it
        localStorage.removeItem('currentTripData');
        setLoading(false);
        return;
      }
      
      // Otherwise, fetch from API
      try {
        const response = await TripServices.getDriverTrips();
        
        if (response.success && response.data.trips) {
          // Find the current active trip (in-progress or assigned)
          const activeTrip = response.data.trips.find(trip => 
            trip.status === 'in-progress' || trip.status === 'assigned' || trip.status === 'confirmed'
          );
          
          if (activeTrip) {
            setCurrentTrip(activeTrip);
            setDestination(activeTrip.destination);
            // Calculate route for the trip
            await calculateRoute(activeTrip.origin, activeTrip.destination);
          }
        }
      } catch (apiError) {
        console.error('API call failed, but continuing with localStorage data if available:', apiError);
        // Don't set error here as we might have localStorage data
      }
    } catch (error) {
      console.error('Error fetching current trip:', error);
      setError('Failed to fetch current trip details');
    } finally {
      setLoading(false);
    }
  };

  const calculateRoute = async (origin, destination) => {
    try {
      setRouteLoading(true);
      
      // For Bandarawela to Badulla route, we'll use a predefined route
      if (origin && destination) {
        const route = await getRouteDetails(origin, destination);
        setRouteInfo(route);
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      setError('Failed to calculate route');
    } finally {
      setRouteLoading(false);
    }
  };

  const getRouteDetails = async (origin, destination) => {
    // For Bandarawela to Badulla, provide detailed route information
    if (origin.toLowerCase().includes('bandarawela') && destination.toLowerCase().includes('badulla')) {
      return {
        distance: 45.2, // km
        duration: 1.2, // hours
        route: [
          "Start from Bandarawela town center",
          "Head northeast on A16 highway",
          "Continue on A16 for 25km",
          "Pass through Haputale",
          "Continue on A16 towards Badulla",
          "Enter Badulla town center",
          "Arrive at destination"
        ],
        waypoints: [
          { name: "Bandarawela", lat: 6.8356, lng: 80.9856 },
          { name: "Haputale", lat: 6.7667, lng: 80.9500 },
          { name: "Badulla", lat: 6.9934, lng: 81.0550 }
        ],
        estimatedTime: "1 hour 12 minutes",
        roadType: "Highway (A16)",
        difficulty: "Easy"
      };
    }
    
    // Default route calculation for other locations
    return {
      distance: 50,
      duration: 1.5,
      route: [`Route from ${origin} to ${destination}`],
      waypoints: [],
      estimatedTime: "1 hour 30 minutes",
      roadType: "Mixed",
      difficulty: "Moderate"
    };
  };

  const drawRouteOnMap = async (routeInfo) => {
    if (!routeInfo || !routeInfo.waypoints || routeInfo.waypoints.length === 0) {
      return;
    }

    try {
      // Wait for map to be loaded
      if (!mapLoaded) {
        setTimeout(() => drawRouteOnMap(routeInfo), 1000);
        return;
      }

      const map = LeafletLocationService.getMap();
      if (!map) {
        console.log('Map not available yet, retrying...');
        setTimeout(() => drawRouteOnMap(routeInfo), 1000);
        return;
      }

      // Clear existing route layers
      map.eachLayer((layer) => {
        if (layer.routeLayer) {
          map.removeLayer(layer);
        }
      });

      // Add markers for waypoints
      const markers = [];
      routeInfo.waypoints.forEach((waypoint, index) => {
        const marker = L.marker([waypoint.lat, waypoint.lng], {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color:${index === 0 ? '#4CAF50' : index === routeInfo.waypoints.length - 1 ? '#F44336' : '#2196F3'}; width:2rem; height:2rem; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold;">${index === 0 ? 'S' : index === routeInfo.waypoints.length - 1 ? 'E' : index}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
          })
        }).addTo(map);
        
        marker.bindPopup(`<b>${waypoint.name}</b>`);
        markers.push(marker);
      });

      // Draw route line connecting waypoints
      const routeCoordinates = routeInfo.waypoints.map(wp => [wp.lat, wp.lng]);
      const routeLine = L.polyline(routeCoordinates, {
        color: '#FDCB42',
        weight: 6,
        opacity: 0.8,
        dashArray: '10, 10'
      }).addTo(map);
      
      routeLine.routeLayer = true; // Mark as route layer for cleanup

      // Fit map to show the entire route
      const group = new L.featureGroup(markers.concat([routeLine]));
      map.fitBounds(group.getBounds().pad(0.1));

      console.log('Route drawn on map successfully');
    } catch (error) {
      console.error('Error drawing route on map:', error);
    }
  };

  const initializeMap = async () => {
    try {
      setLoading(true);
      
      // Check if map is already initialized
      if (mapRef.current && mapRef.current._leaflet_id) {
        console.log('Map already initialized, skipping...');
        setMapLoaded(true);
        return;
      }
      
      await LeafletLocationService.initializeMap(mapRef.current);
      setMapLoaded(true);
      setError('');
    } catch (err) {
      console.error('Map initialization error:', err);
      // If map is already initialized, that's okay
      if (err.message && err.message.includes('already initialized')) {
        setMapLoaded(true);
        setError('');
      } else {
        setError('Failed to load map. Please check your internet connection.');
      }
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
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: isMobile ? '100vh' : 'calc(100vh - 64px)',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#FDCB42',
            borderRadius: '4px',
            '&:hover': {
              background: '#F4B942',
            },
          },
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

            {/* Current Trip Information */}
            {currentTrip && (
              <Paper sx={{ p: 2, mb: 1, bgcolor: '#f8f9fa', border: '2px solid #FDCB42' }}>
                <Typography variant="h6" sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: '#FDCB42',
                  fontWeight: 'bold',
                  mb: 2
                }}>
                  <LocationOn sx={{ mr: 1 }} />
                  Current Trip Details
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ bgcolor: 'rgba(46, 125, 50, 0.1)', border: '1px solid #2e7d32' }}>
                      <CardContent sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOn sx={{ fontSize: 20, mr: 1, color: 'success.main' }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                            Start Location
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#1b5e20' }}>
                          {currentTrip.origin}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card sx={{ bgcolor: 'rgba(211, 47, 47, 0.1)', border: '1px solid #d32f2f' }}>
                      <CardContent sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOn sx={{ fontSize: 20, mr: 1, color: 'error.main' }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                            Destination
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#b71c1c' }}>
                          {currentTrip.destination}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={`Trip: ${currentTrip.title || 'Untitled Trip'}`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={`Status: ${currentTrip.status}`}
                    color={currentTrip.status === 'in-progress' ? 'success' : 'default'}
                    variant="filled"
                  />
                  <Chip
                    label={`Passengers: ${currentTrip.passenger_count || 1}`}
                    color="info"
                    variant="outlined"
                  />
                  {currentTrip.preferred_date && (
                    <Chip
                      label={`Date: ${new Date(currentTrip.preferred_date).toLocaleDateString()}`}
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Paper>
            )}

            {/* Route Information */}
            {routeInfo && (
              <Paper sx={{ p: 2, mb: 1, bgcolor: '#e3f2fd', border: '2px solid #2196f3' }}>
                <Typography variant="h6" sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: '#1976d2',
                  fontWeight: 'bold',
                  mb: 2
                }}>
                  <Route sx={{ mr: 1 }} />
                  Route Information
                  {routeLoading && <CircularProgress size={20} sx={{ ml: 2 }} />}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', border: '1px solid #2196f3' }}>
                      <CardContent sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Route sx={{ fontSize: 20, mr: 1, color: 'primary.main' }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                            Distance
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0d47a1' }}>
                          {routeInfo.distance} km
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4caf50' }}>
                      <CardContent sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Timer sx={{ fontSize: 20, mr: 1, color: 'success.main' }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                            Duration
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1b5e20' }}>
                          {routeInfo.estimatedTime}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)', border: '1px solid #ff9800' }}>
                      <CardContent sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Navigation sx={{ fontSize: 20, mr: 1, color: 'warning.main' }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#e65100' }}>
                            Road Type
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#bf360c' }}>
                          {routeInfo.roadType}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#bf360c' }}>
                          Difficulty: {routeInfo.difficulty}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                {/* Route Steps */}
                {routeInfo.route && routeInfo.route.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#1976d2' }}>
                      Route Directions:
                    </Typography>
                    <List dense>
                      {routeInfo.route.map((step, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemIcon>
                            <Chip 
                              label={index + 1} 
                              size="small" 
                              sx={{ 
                                bgcolor: '#2196f3', 
                                color: 'white',
                                minWidth: '24px',
                                height: '24px'
                              }} 
                            />
                          </ListItemIcon>
                          <ListItemText 
                            primary={step}
                            sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem' } }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
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

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Fab
          color="primary"
          size="medium"
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            zIndex: 1000,
            bgcolor: '#FDCB42',
            '&:hover': {
              bgcolor: '#F4B942',
              transform: 'scale(1.1)'
            },
            transition: 'all 0.3s ease-in-out',
            boxShadow: '0 4px 12px rgba(253, 203, 66, 0.4)'
          }}
          aria-label="scroll to top"
        >
          <Navigation sx={{ transform: 'rotate(-90deg)' }} />
        </Fab>
      )}

      {/* Scroll to Bottom Button */}
      {showScrollBottom && (
        <Fab
          color="primary"
          size="medium"
          onClick={scrollToBottom}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
            bgcolor: '#2196F3',
            '&:hover': {
              bgcolor: '#1976D2',
              transform: 'scale(1.1)'
            },
            transition: 'all 0.3s ease-in-out',
            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)'
          }}
          aria-label="scroll to bottom"
        >
          <Navigation sx={{ transform: 'rotate(90deg)' }} />
        </Fab>
      )}
    </Box>
  );
}

export default TripTracker;