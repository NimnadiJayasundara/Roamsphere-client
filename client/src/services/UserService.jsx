import axios from 'axios';
import { USER_URL } from '../config';

const UserService = {
  getAllUsers: async () => {
    try {
      const response = await axios.get(`${USER_URL}/users`);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  findUserByEmail: async (email) => {
    try {
      const response = await axios.get(`${USER_URL}/finduser`, { params: { email } });
      return response.data;
    } catch (error) {
      console.error('Error checking user existence:', error);
      throw error;
    }
  },

 getDriverProfileByEmail: async (email) => {
    try {
      const response = await axios.get(`${USER_URL}/profile`, { params: { email } });
      return response.data;
    } catch (error) {
      console.error('Error fetching driver profile:', error);
      throw error;
    }
  },

  addDriver: async (driverData) => {
    try {
      const response = await axios.post(`${USER_URL}/add`, driverData);
      return response.data;
    } catch (error) {
      console.error('Error adding driver:', error);
      throw error;
    }
  },

  updateDriver: async (driverData) => {
  try {
    const response = await axios.put(`${USER_URL}/update`, driverData);
      return response.data;
    } catch (error) {
      console.error('Error updating driver:', error);
      throw error;
    }
  }
};

export default UserService;