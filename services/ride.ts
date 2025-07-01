// services/ride.ts
import api from './api';
import { ErrorHandler, getFallbackData } from '../utils/errorHandler';

export interface CreateRideForm {
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
  car_type: string;
  passenger_slots: number;
  match_social: boolean;
  time_to_reach: string;
  payment_method: string;
  promo_code?: string;
  group_join?: boolean;
  fare: number;
  distance: number;
  sector?: string;
  driver_type?: 'self' | 'company';
}

export interface JoinRideForm {
  ride_id: string;
  pickup_location: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  group_join?: boolean;
  seat_count?: number;
  is_group_leader?: boolean;
}

export interface CreatorInfo {
  name: string;
  email: string;
  university?: string;
  gender?: string;
  sector?: string;
}

export interface EnhancedRide {
  _id: string;
  ride_id: string;
  creator_user_id: string;
  creator_info: CreatorInfo;
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
  car_type: string;
  passenger_slots: number;
  available_slots: number;
  current_passengers: number;
  group_join: boolean;
  fare: number;
  distance: number;
  sector: string;
  status: string;
  created_at: string;
  match_social: boolean;
  user_already_joined: boolean;
  can_join: boolean;
}

export interface AvailableRidesResponse {
  rides: EnhancedRide[];
  count: number;
}

export const RideService = {
  async createRide(data: CreateRideForm) {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.post('/rides/create', data);
        return response.data;
      },
      { success: false, message: 'Ride creation temporarily unavailable' },
      'Create Ride'
    );
  },
  
  async getAvailableRides(sector?: string): Promise<AvailableRidesResponse> {
    return ErrorHandler.withFallback(
      async () => {
        const params = sector ? { sector } : {};
        const response = await api.get('/rides/available', { params });
        return ErrorHandler.safeApiResponse(
          response,
          getFallbackData('rides') as AvailableRidesResponse,
          'data'
        );
      },
      getFallbackData('rides') as AvailableRidesResponse,
      'Get Available Rides'
    );
  },

  async leaveRide(rideId: string): Promise<void> {
    return ErrorHandler.silentOperation(
      async () => {
        const response = await api.post('/rides/leave', { ride_id: rideId });
        return response.data;
      },
      undefined
    );
  },
  
  async joinRide(data: JoinRideForm) {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.post('/rides/join', data);
        return response.data;
      },
      { success: false, message: 'Join ride temporarily unavailable' },
      'Join Ride'
    );
  },

  async getPendingDriverRides() {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.get('/rides/pending-driver');
        return ErrorHandler.ensureArray(response.data?.rides, []);
      },
      [],
      'Get Pending Driver Rides'
    );
  },

  async acceptRide(ride_id: string) {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.post('/rides/accept', { ride_id });
        return response.data;
      },
      { success: false, message: 'Accept ride temporarily unavailable' },
      'Accept Ride'
    );
  },

  async cancelRide(ride_id: string) {
    return ErrorHandler.silentOperation(
      async () => {
        const response = await api.post('/rides/cancel', { ride_id });
        return response.data;
      },
      { success: true, message: 'Ride cancelled' }
    );
  },
  
  async setArrivalStatus(ride_id: string, has_arrived: boolean = true) {
    return ErrorHandler.silentOperation(
      async () => {
        const response = await api.post('/rides/arrival', { ride_id, has_arrived });
        return response.data;
      },
      { success: true }
    );
  },
  
  async updateRideStatus(ride_id: string, status: string) {
    return ErrorHandler.silentOperation(
      async () => {
        const response = await api.post('/rides/status', { ride_id, status });
        return response.data;
      },
      { success: true }
    );
  },

  async updateDriverLocation(ride_id: string, location: { address: string; coordinates: { latitude: number; longitude: number } }) {
    return ErrorHandler.silentOperation(
      async () => {
        const response = await api.post('/rides/location', { ride_id, location });
        return response.data;
      },
      { success: true }
    );
  },

  async getDriverStatus(ride_id: string) {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.get(`/rides/${ride_id}/driver-status`);
        return response.data;
      },
      { status: 'unknown', arrived: false, location: null },
      'Get Driver Status'
    );
  },

  async completeRide(ride_id: string) {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.post('/rides/complete', { ride_id });
        return response.data;
      },
      { success: true, message: 'Ride completed' },
      'Complete Ride'
    );
  },

  async getRideRoute(ride_id: string, currentLocation: { latitude: number; longitude: number }) {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.get(`/rides/${ride_id}/route`, { 
          params: { 
            lat: currentLocation.latitude, 
            lng: currentLocation.longitude 
          } 
        });
        return response.data;
      },
      { route: [], distance: 0, duration: 0 },
      'Get Ride Route'
    );
  },
  
  async getRideDetails(ride_id: string) {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.get(`/rides/${ride_id}`);
        return response.data;
      },
      {
        _id: ride_id,
        creator_name: 'Unknown Driver',
        pickup_location: { address: 'Location not available' },
        destination: { address: 'Destination not available' },
        status: 'unknown',
        passengers: []
      },
      'Get Ride Details'
    );
  }
};