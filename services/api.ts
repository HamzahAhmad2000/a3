// services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update this URL to match your backend deployment
// For Android emulator, use 10.0.2.2 instead of localhost
// For physical devices, use the actual IP address or domain
const API_URL = 'http://0.0.0.0:5000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor to add JWT token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refreshing
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error doesn't have response, it's a network error
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    // If unauthorized and not already retrying
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const res = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        
        // Store new token
        await AsyncStorage.setItem('accessToken', res.data.access_token);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        
        // Return specific error for auth failure
        return Promise.reject(new Error('Authentication expired. Please log in again.'));
      }
    }
    
    // Extract error message from response if available
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'An unknown error occurred';
    
    // Return error for other cases
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;