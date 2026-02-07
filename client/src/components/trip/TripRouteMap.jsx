import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Grid
} from '@mui/material';
import { 
  Close, 
  LocationOn, 
  Route, 
  DirectionsCar, 
  Schedule,
  Person,
  Group
} from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default markers issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different markers
const createCustomIcon = (color, iconType) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: white;
        font-weight: bold;
      ">
        <span style="transform: rotate(45deg);">${iconType}</span>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30]
  });
};

const TripRouteMap = ({ 
  open, 
  onClose, 
  trip, 
  isMobile = false 
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const routeLayer = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [routeData, setRouteData] = useState(null);

  useEffect(() => {
    if (open && trip && mapRef.current && !mapInstance.current) {
      initializeMap();
    }
    
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [open, trip]);

  useEffect(() => {
    if (open && trip && mapInstance.current) {
      loadRoute();
    }
  }, [open, trip, mapInstance.current]);

  const initializeMap = () => {
    try {
      // Default center (Colombo, Sri Lanka)
      const defaultCenter = [6.9271, 79.8612];
      
      mapInstance.current = L.map(mapRef.current, {
        center: defaultCenter,
        zoom: 10,
        zoomControl: true,
        attributionControl: true
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance.current);

      // Add scale control
      L.control.scale().addTo(mapInstance.current);

    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map');
    }
  };

  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=lk&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          display_name: data[0].display_name
        };
      }
      return null;
    } catch (err) {
      console.error('Geocoding error:', err);
      return null;
    }
  };

  const loadRoute = async () => {
    if (!trip || !mapInstance.current) return;

    setLoading(true);
    setError('');

    try {
      // Clear existing route
      if (routeLayer.current) {
        mapInstance.current.removeLayer(routeLayer.current);
      }

      // Geocode origin and destination
      const [originData, destinationData] = await Promise.all([
        geocodeAddress(trip.origin),
        geocodeAddress(trip.destination)
      ]);

      if (!originData || !destinationData) {
        setError('Could not find locations on map');
        setLoading(false);
        return;
      }

      // Create markers
      const originIcon = createCustomIcon('#4CAF50', 'S');
      const destinationIcon = createCustomIcon('#F44336', 'E');

      const originMarker = L.marker([originData.lat, originData.lng], { icon: originIcon })
        .addTo(mapInstance.current)
        .bindPopup(`
          <div style="text-align: center;">
            <strong>Start Point</strong><br/>
            ${trip.origin}<br/>
            <small>${originData.display_name}</small>
          </div>
        `);

      const destinationMarker = L.marker([destinationData.lat, destinationData.lng], { icon: destinationIcon })
        .addTo(mapInstance.current)
        .bindPopup(`
          <div style="text-align: center;">
            <strong>End Point</strong><br/>
            ${trip.destination}<br/>
            <small>${destinationData.display_name}</small>
          </div>
        `);

      // Get route using OpenRouteService (free tier)
      const routeResponse = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248c8b8b5b3b8b4b5b3&start=${originData.lng},${originData.lat}&end=${destinationData.lng},${destinationData.lat}`
      );

      if (routeResponse.ok) {
        const routeData = await routeResponse.json();
        
        if (routeData.features && routeData.features.length > 0) {
          const coordinates = routeData.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
          
          // Create route polyline
          routeLayer.current = L.polyline(coordinates, {
            color: '#FDCB42',
            weight: 4,
            opacity: 0.8
          }).addTo(mapInstance.current);

          // Add route popup
          const summary = routeData.features[0].properties.summary;
          const distance = (summary.distance / 1000).toFixed(1);
          const duration = Math.round(summary.duration / 60);

          routeLayer.current.bindPopup(`
            <div style="text-align: center;">
              <strong>Route Information</strong><br/>
              Distance: ${distance} km<br/>
              Duration: ${duration} minutes<br/>
              <small>via OpenRouteService</small>
            </div>
          `);

          // Fit map to show both markers and route
          const group = new L.featureGroup([originMarker, destinationMarker, routeLayer.current]);
          mapInstance.current.fitBounds(group.getBounds().pad(0.1));

          setRouteData({
            distance: distance,
            duration: duration,
            coordinates: coordinates
          });
        }
      } else {
        // Fallback: just show markers without route
        const group = new L.featureGroup([originMarker, destinationMarker]);
        mapInstance.current.fitBounds(group.getBounds().pad(0.1));
        
        setRouteData({
          distance: 'Unknown',
          duration: 'Unknown',
          coordinates: []
        });
      }

    } catch (err) {
      console.error('Error loading route:', err);
      setError('Failed to load route information');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Not set';
    return new Date(dateTime).toLocaleString();
  };

  if (!trip) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isSmallScreen}
      PaperProps={{
        sx: {
          minHeight: isSmallScreen ? '100vh' : '80vh',
          m: isSmallScreen ? 0 : 2
        }
      }}
    >
      <DialogTitle sx={{
        bgcolor: '#FDCB42',
        color: 'black',
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Route sx={{ mr: 1 }} />
          Trip Route - {trip.title || 'Untitled Trip'}
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'black' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Grid container spacing={0} sx={{ height: isSmallScreen ? 'calc(100vh - 120px)' : '60vh' }}>
          {/* Map Section */}
          <Grid item xs={12} md={8}>
            <Box sx={{ position: 'relative', height: '100%' }}>
              {loading && (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  zIndex: 1000
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Loading route...
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {error && (
                <Alert severity="error" sx={{ m: 2 }}>
                  {error}
                </Alert>
              )}
              
              <div 
                ref={mapRef} 
                style={{ 
                  width: '100%', 
                  height: '100%',
                  minHeight: '400px'
                }} 
              />
            </Box>
          </Grid>

          {/* Trip Details Section */}
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, height: '100%', overflow: 'auto', bgcolor: '#f8f9fa' }}>
              {/* Trip Status */}
              <Card sx={{ mb: 2, bgcolor: 'white' }}>
                <CardContent sx={{ py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Chip
                      label={trip.status || 'Unknown'}
                      color={trip.status === 'confirmed' ? 'success' : 'default'}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={trip.category || 'Standard'}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {trip.title || 'Untitled Trip'}
                  </Typography>
                </CardContent>
              </Card>

              {/* Route Information */}
              <Card sx={{ mb: 2, bgcolor: 'white' }}>
                <CardContent sx={{ py: 1.5 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Route sx={{ mr: 1, fontSize: 16 }} />
                    Route Information
                  </Typography>
                  
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <LocationOn sx={{ fontSize: 16, mr: 1, color: 'success.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        From: {trip.origin}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationOn sx={{ fontSize: 16, mr: 1, color: 'error.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        To: {trip.destination}
                      </Typography>
                    </Box>
                  </Box>

                  {routeData && (
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Distance:</strong> {routeData.distance} km
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Duration:</strong> {routeData.duration} min
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Trip Details */}
              <Card sx={{ mb: 2, bgcolor: 'white' }}>
                <CardContent sx={{ py: 1.5 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Schedule sx={{ mr: 1, fontSize: 16 }} />
                    Trip Details
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Schedule sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatDateTime(trip.preferred_date && trip.preferred_time 
                        ? `${trip.preferred_date} ${trip.preferred_time}` 
                        : trip.start_date_time || trip.startDateTime)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Group sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Passengers: {trip.passenger_count || 1}
                    </Typography>
                  </Box>

                  {trip.estimated_duration && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Schedule sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Duration: {trip.estimated_duration} hours
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Driver & Vehicle Info */}
              {(trip.driver_first_name || trip.driverName) && (
                <Card sx={{ mb: 2, bgcolor: 'white' }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Person sx={{ mr: 1, fontSize: 16 }} />
                      Driver
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {trip.driver_first_name && trip.driver_last_name 
                        ? `${trip.driver_first_name} ${trip.driver_last_name}`
                        : trip.driverName || 'Not assigned'
                      }
                    </Typography>
                    {trip.driver_phone && (
                      <Typography variant="caption" color="text.secondary">
                        Phone: {trip.driver_phone}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              )}

              {(trip.vehicle_model || trip.vehicleName) && (
                <Card sx={{ mb: 2, bgcolor: 'white' }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <DirectionsCar sx={{ mr: 1, fontSize: 16 }} />
                      Vehicle
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {trip.vehicle_model || trip.vehicleName || 'Not assigned'}
                    </Typography>
                    {trip.vehicle_plate_number && (
                      <Typography variant="caption" color="text.secondary">
                        Plate: {trip.vehicle_plate_number}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button 
          onClick={() => {
            // Open in external map
            const origin = encodeURIComponent(trip.origin);
            const destination = encodeURIComponent(trip.destination);
            const url = `https://www.google.com/maps/dir/${origin}/${destination}`;
            window.open(url, '_blank');
          }}
          variant="contained"
          sx={{
            bgcolor: '#FDCB42',
            '&:hover': { bgcolor: '#fbbf24' },
            fontWeight: 'bold'
          }}
        >
          Open in Google Maps
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TripRouteMap;

