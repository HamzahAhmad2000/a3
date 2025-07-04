// services/rideHistory.ts
import api from './api';

export interface RideHistoryItem {
  id: string;
  date: string; // ISO date string
  pickup_location: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  dropoff_location: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  status: 'completed' | 'cancelled' | 'upcoming' | 'in_progress' | 'created';
  driver: {
    id: string;
    name: string;
    rating: number;
  };
  fare: number;
  distance: number;
  duration: number; // in minutes
  car_type: string;
  payment_status: 'paid' | 'pending' | 'failed';
  payment_method: 'wallet' | 'cash' | 'card';
  rating?: number; // User's rating for the ride
  user_feedback?: string; // User's feedback for the ride
}

export interface RideHistoryFilterOptions {
  status?: 'completed' | 'cancelled' | 'upcoming' | 'all';
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  paymentMethod?: 'wallet' | 'cash' | 'card' | 'all';
}

export interface RateRideRequest {
  ride_id: string;
  rating: number;
  feedback?: string;
}

export interface RateRideResponse {
  success: boolean;
}

export interface RealTimeRating {
  rating: number;
  feedback?: string;
  rating_type: 'driver' | 'passenger';
}

export interface RealTimeRatingResponse {
  id: string;
  rating: number;
  feedback: string;
  rating_type: string;
  rater: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export const RideHistoryService = {
  async getRideHistory(filters: RideHistoryFilterOptions = {}): Promise<RideHistoryItem[]> {
    try {
      const response = await api.get('/ride-history/history', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching ride history:', error);
      throw error;
    }
  },
  
  async getRideDetails(rideId: string): Promise<RideHistoryItem> {
    try {
      const response = await api.get(`/rides/${rideId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ride details:', error);
      throw error;
    }
  },
  
  async rateRide(data: RateRideRequest): Promise<RateRideResponse> {
    try {
      const response = await api.post(`/rides/${data.ride_id}/rate`, {
        rating: data.rating,
        feedback: data.feedback
      });
      return response.data;
    } catch (error) {
      console.error('Error rating ride:', error);
      throw error;
    }
  },

  async rateActiveRide(rideId: string, data: RealTimeRating): Promise<RateRideResponse> {
    try {
      const response = await api.post(`/ride-history/${rideId}/rate-active`, data);
      return response.data;
    } catch (error) {
      console.error('Error rating active ride:', error);
      throw error;
    }
  },

  async getRealTimeRatings(rideId: string): Promise<{ success: boolean; ratings: RealTimeRatingResponse[] }> {
    try {
      const response = await api.get(`/ride-history/${rideId}/real-time-ratings`);
      return response.data;
    } catch (error) {
      console.error('Error fetching real-time ratings:', error);
      throw error;
    }
  }
};