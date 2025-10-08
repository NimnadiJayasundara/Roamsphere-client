import L from 'leaflet';

let map;
let currentLocationMarker;
let destinationMarker;
let routeLayer;
let vehicleTrail;
let watchId;
let lastPosition;
let isTracking = false;
let trackingCallback;

// Create custom vehicle icon
const createVehicleIcon = (heading = 0) => {
  return L.divIcon({
    className: 'vehicle-marker',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: #FDCB42;
        border: 2px solid #000;
        border-radius: 50% 50% 50% 0;
        transform: rotate(${heading}deg);
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const LeafletLocationService = {
  initializeMap(container) {
    map = L.map(container).setView([7.8731, 80.7718], 8); // Sri Lanka center
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
  },

  updateCurrentLocationMarker(location, smooth = false) {
    if (!map) return;
    
    const newLatLng = [location.lat, location.lng];
    const heading = location.heading || 0;
    
    if (currentLocationMarker) {
      if (smooth && lastPosition) {
        // Smooth animation for real-time tracking
        this.animateMarker(currentLocationMarker, newLatLng, heading);
      } else {
        // Instant update for manual location changes
        currentLocationMarker.setLatLng(newLatLng);
        currentLocationMarker.setIcon(createVehicleIcon(heading));
      }
    } else {
      // Create new marker with vehicle icon
      currentLocationMarker = L.marker(newLatLng, {
        icon: createVehicleIcon(heading)
      }).addTo(map);
    }
    
    // Add to vehicle trail
    this.addToVehicleTrail(newLatLng);
    
    // Update last position
    lastPosition = newLatLng;
    
    // Auto-center map during tracking
    if (isTracking) {
      map.setView(newLatLng, map.getZoom(), { animate: true, duration: 1 });
    } else {
      map.setView(newLatLng, 13);
    }
  },

  // Smooth marker animation
  animateMarker(marker, newLatLng, heading) {
    const startLatLng = marker.getLatLng();
    const startTime = Date.now();
    const duration = 1000; // 1 second animation
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeInOutCubic = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      const currentLat = startLatLng.lat + (newLatLng[0] - startLatLng.lat) * easeInOutCubic;
      const currentLng = startLatLng.lng + (newLatLng[1] - startLatLng.lng) * easeInOutCubic;
      
      marker.setLatLng([currentLat, currentLng]);
      marker.setIcon(createVehicleIcon(heading));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  },

  // Add point to vehicle trail
  addToVehicleTrail(latLng) {
    if (!vehicleTrail) {
      vehicleTrail = L.polyline([], {
        color: '#FDCB42',
        weight: 3,
        opacity: 0.7,
        dashArray: '5, 5'
      }).addTo(map);
    }
    
    vehicleTrail.addLatLng(latLng);
    
    // Limit trail length to prevent performance issues
    const trailPoints = vehicleTrail.getLatLngs();
    if (trailPoints.length > 100) {
      trailPoints.splice(0, trailPoints.length - 100);
      vehicleTrail.setLatLngs(trailPoints);
    }
  },

  // Clear vehicle trail
  clearVehicleTrail() {
    if (vehicleTrail) {
      map.removeLayer(vehicleTrail);
      vehicleTrail = null;
    }
  },

  addDestinationMarker(location, label = 'Destination') {
    if (!map) return;
    if (destinationMarker) {
      destinationMarker.setLatLng([location.lat, location.lng]);
    } else {
      destinationMarker = L.marker([location.lat, location.lng])
        .bindPopup(label)
        .addTo(map);
    }
  },

  async calculateRoute(start, end, mode = 'driving') {
    // Example with OSRM demo server
    const url = `https://router.project-osrm.org/route/v1/${mode}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        distance: (route.distance / 1000).toFixed(1) + ' km',
        duration: Math.round(route.duration / 60) + ' mins',
        coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
      };
    }
    return null;
  },

  drawRoute(coordinates) {
    if (!map) return;
    if (routeLayer) {
      map.removeLayer(routeLayer);
    }
    routeLayer = L.polyline(coordinates, { color: 'blue', weight: 5 }).addTo(map);
    map.fitBounds(routeLayer.getBounds());
  },

  // Start real-time location tracking
  startLocationTracking(callback) {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    isTracking = true;
    trackingCallback = callback;

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000
    };

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
          timestamp: position.timestamp
        };

        // Update marker with smooth animation
        this.updateCurrentLocationMarker(location, true);
        
        // Call the callback with location data
        if (trackingCallback) {
          trackingCallback(location);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (trackingCallback) {
          trackingCallback(null, error);
        }
      },
      options
    );
  },

  // Stop real-time location tracking
  stopLocationTracking() {
    isTracking = false;
    trackingCallback = null;
    
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  },

  // Get current location (one-time)
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: position.timestamp
          };
          resolve(location);
        },
        (error) => {
          reject(error);
        },
        options
      );
    });
  },

  // Calculate distance between two points
  calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  // Forward geocoding - convert address to coordinates
  async geocode(address) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=lk&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name,
          components: result.address || {}
        };
      }
      throw new Error('No results found for the given address');
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error(`Unable to find location: ${address}`);
    }
  },

  // Reverse geocoding - convert coordinates to address
  async reverseGeocode(lat, lng) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      return {
        address: data.display_name || 'Unknown location',
        components: data.address || {}
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return { address: 'Unknown location', components: {} };
    }
  },

  // Check if tracking is active
  isTrackingActive() {
    return isTracking;
  },

  cleanup() {
    this.stopLocationTracking();
    this.clearVehicleTrail();
    
    if (map) {
      map.remove();
      map = null;
    }
    
    currentLocationMarker = null;
    destinationMarker = null;
    routeLayer = null;
    lastPosition = null;
  }
};

export default LeafletLocationService;
