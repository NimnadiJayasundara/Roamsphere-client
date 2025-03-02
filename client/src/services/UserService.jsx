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
  }
};

export default UserService;