import axios from 'axios';
import { USER_URL } from '../config';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const PaymentService = {
  // Create payment intent for trip request
  createPaymentIntent: async (tripData, amount) => {
    try {
      const response = await axios.post(`${USER_URL}/payment/create-intent`, {
        tripData,
        amount,
        currency: 'LKR'
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },

  // Confirm payment
  confirmPayment: async (paymentIntentId, tripId) => {
    try {
      const response = await axios.post(`${USER_URL}/payment/confirm`, {
        paymentIntentId,
        tripId
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  },

  // Get payment methods
  getPaymentMethods: async () => {
    try {
      const response = await axios.get(`${USER_URL}/payment/methods`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  },

  // Calculate trip cost estimate
  calculateTripCost: async (tripData) => {
    try {
      const response = await axios.post(`${USER_URL}/payment/calculate-cost`, tripData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating trip cost:', error);
      throw error;
    }
  },

  // Get payment history
  getPaymentHistory: async () => {
    try {
      const response = await axios.get(`${USER_URL}/payment/history`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }
};

export default PaymentService;
