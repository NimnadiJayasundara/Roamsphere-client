import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Enhanced Trip Services for the complete trip management system
const EnhancedTripServices = {
  // Customer Trip Management
  createTripRequest: async (tripData) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_BASE_URL}/trip/request`, tripData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create trip request');
    }
  },

  getCustomerTrips: async (filters = {}) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/trip/my-trips`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch trips');
    }
  },

  getTripDetails: async (tripId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/trip/my-trips/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch trip details');
    }
  },

  updateTripRequest: async (tripId, updateData) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(`${API_BASE_URL}/trip/my-trips/${tripId}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update trip');
    }
  },

  cancelTripRequest: async (tripId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.patch(`${API_BASE_URL}/trip/my-trips/${tripId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to cancel trip');
    }
  },

  getTripStatistics: async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/trip/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch trip statistics');
    }
  },

  // Real-time trip tracking
  trackTrip: async (tripId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/trip/track/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to track trip');
    }
  },

  // Tour Operator Trip Management
  getAllTripRequests: async (filters = {}) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/trip/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch all trips');
    }
  },

  assignTripToDriver: async (tripId, assignmentData) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.patch(`${API_BASE_URL}/trip/${tripId}/assign`, assignmentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to assign trip');
    }
  },

  updateTripStatus: async (tripId, status) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.patch(`${API_BASE_URL}/trip/${tripId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update trip status');
    }
  },

  getAssignmentOptions: async (tripId, requirements = {}) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/trip/${tripId}/assignment-options`, {
        headers: { Authorization: `Bearer ${token}` },
        params: requirements
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch assignment options');
    }
  },

  // Driver Trip Management
  getDriverTrips: async (filters = {}) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/driver/trips`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch driver trips');
    }
  },

  startTrip: async (tripId, locationData) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_BASE_URL}/driver/trips/${tripId}/start`, locationData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to start trip');
    }
  },

  updateTripLocation: async (tripId, locationData) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_BASE_URL}/driver/trips/${tripId}/location`, locationData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update location');
    }
  },

  completeTrip: async (tripId, completionData) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_BASE_URL}/driver/trips/${tripId}/complete`, completionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to complete trip');
    }
  },

  // Driver location and availability
  updateDriverLocation: async (locationData) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(`${API_BASE_URL}/driver/location`, locationData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update location');
    }
  },

  updateDriverAvailability: async (availabilityStatus) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.patch(`${API_BASE_URL}/driver/availability`, { availabilityStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update availability');
    }
  },

  // Vehicle Management
  getAvailableVehicles: async (requirements = {}) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/vehicles/available`, {
        headers: { Authorization: `Bearer ${token}` },
        params: requirements
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch available vehicles');
    }
  },

  // Real-time tracking with WebSocket (if implemented)
  subscribeToTripUpdates: (tripId, callback) => {
    // This would be implemented with WebSocket connection
    // For now, we'll use polling
    const interval = setInterval(async () => {
      try {
        const data = await EnhancedTripServices.trackTrip(tripId);
        callback(data);
      } catch (error) {
        console.error('Error fetching trip updates:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }
};

export default EnhancedTripServices;
