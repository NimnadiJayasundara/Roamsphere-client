// import axios from 'axios';
// import { USER_URL } from '../config';

// const UserService = {
//   getAllUsers: async () => {
//     try {
//       const response = await axios.get(`${USER_URL}/users`);
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching users:', error);
//       throw error;
//     }
//   },

//   findUserByEmail: async (email) => {
//     try {
//       const response = await axios.get(`${USER_URL}/finduser`, { params: { email } });
//       return response.data;
//     } catch (error) {
//       console.error('Error checking user existence:', error);
//       throw error;
//     }
//   },

//   getDriverProfileByEmail: async (email) => {
//     try {
//       const response = await axios.get(`${USER_URL}/profile`, { params: { email } });
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching driver profile:', error);
//       throw error;
//     }
//   },

//   addDriver: async (driverData) => {
//     try {
//       const response = await axios.post(`${USER_URL}/add`, driverData);
//       return response.data;
//     } catch (error) {
//       console.error('Error adding driver:', error);
//       throw error;
//     }
//   },

//   updateDriver: async (driverData) => {
//   try {
//     const response = await axios.put(`${USER_URL}/update`, driverData);
//       return response.data;
//     } catch (error) {
//       console.error('Error updating driver:', error);
//       throw error;
//     }
//   },

//   addVehicle: async (vehicleData) => {
//     try {
//       const response = await axios.post(`${USER_URL}/add-vehicle`, vehicleData);
//       return response.data;
//     } catch (error) {
//       console.error('Error adding vehicle:', error);
//       throw error;
//     }
//   },

//   updateVehicle: async (vehicleData) => {
//     try {
//       const response = await axios.put(`${USER_URL}/update-vehicle`, vehicleData);
//       return response.data;
//     } catch (error) {
//       console.error('Error updating vehicle:', error);
//       throw error;
//     }
//   },

//   getVehicleProfileByEmail: async (email) => {
//     try {
//       const response = await axios.get(`${USER_URL}/vehicle-profile`, { params: { email } });
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching vehicle profile:', error);
//       throw error;
//     }
//   },

//   getAllVehicles: async () => {
//     try {
//       const response = await axios.get(`${USER_URL}/vehicles`);
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching all vehicles:', error);
//       throw error;
//     }
//   }
// };

// export default UserService;


import axios from 'axios';
import { USER_URL } from '../config';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const UserService = {
  // Public route - no auth required
  findUserByEmail: async (email) => {
    try {
      const response = await axios.get(`${USER_URL}/finduser`, { params: { email } });
      return response.data;
    } catch (error) {
      console.error('Error checking user existence:', error);
      throw error;
    }
  },

  // Protected route - requires Auth + IsAdmin
  getAllUsers: async () => {
    try {
      const response = await axios.get(`${USER_URL}/users`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Protected route - requires Auth
  getDriverProfileByEmail: async (email) => {
    try {
      const response = await axios.get(`${USER_URL}/profile`, { 
        params: { email },
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching driver profile:', error);
      throw error;
    }
  },

  // Protected route - requires Auth
  addDriver: async (driverData) => {
    try {
      const response = await axios.post(`${USER_URL}/add`, driverData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error adding driver:', error);
      throw error;
    }
  },

  // Protected route - requires Auth
  updateDriver: async (driverData) => {
    try {
      const response = await axios.put(`${USER_URL}/update`, driverData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating driver:', error);
      throw error;
    }
  },

  // Protected route - requires Auth + IsAdmin
  addVehicle: async (vehicleData) => {
    try {
      const response = await axios.post(`${USER_URL}/add-vehicle`, vehicleData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
  },

  // Protected route - requires Auth + IsAdmin
  updateVehicle: async (vehicleData) => {
    try {
      const response = await axios.put(`${USER_URL}/update-vehicle`, vehicleData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  },

  // Protected route - requires Auth
  getVehicleProfileByEmail: async (email) => {
    try {
      const response = await axios.get(`${USER_URL}/vehicle-profile`, { 
        params: { email },
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle profile:', error);
      throw error;
    }
  },

  // Protected route - requires Auth
  getAllVehicles: async () => {
    try {
      const response = await axios.get(`${USER_URL}/vehicles`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all vehicles:', error);
      throw error;
    }
  }
};

export default UserService;