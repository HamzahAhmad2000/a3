import api from './api';

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  is_leader: boolean;
}

export interface GroupRideDetails {
  id: string;
  ride_id: string;
  leader_id: string;
  max_group_size: number;
  current_size: number;
  members: GroupMember[];
  pending_invitations_count: number;
  fare_split_method: 'equal' | 'by_distance' | 'custom';
  pickup_coordination: {
    single_location: boolean;
    pickup_locations: any[];
  };
  status: 'forming' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  ride_details: {
    pickup_location: any;
    dropoff_location: any;
    fare: number;
    car_type: string;
    status: string;
  };
}

export interface CreateGroupRideRequest {
  ride_id: string;
  max_group_size?: number;
}

export interface FareSplitRequest {
  method: 'equal' | 'by_distance' | 'custom';
  custom_splits?: { [user_id: string]: number };
}

export interface FareSplitResult {
  success: boolean;
  splits: { [user_id: string]: number };
  total_fare: number;
  method: string;
}

export interface GroupRideResponse {
  success: boolean;
  message: string;
  group_ride_id?: string;
}

export const GroupRideService = {
  async createGroupRide(data: CreateGroupRideRequest): Promise<GroupRideResponse> {
    try {
      const response = await api.post('/group-rides/create', data);
      return response.data;
    } catch (error) {
      console.error('Error creating group ride:', error);
      throw error;
    }
  },

  async getGroupDetails(groupRideId: string): Promise<{ success: boolean; group_ride: GroupRideDetails }> {
    try {
      const response = await api.get(`/group-rides/${groupRideId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching group details:', error);
      throw error;
    }
  },

  async setFareSplitMethod(groupRideId: string, data: FareSplitRequest): Promise<GroupRideResponse> {
    try {
      const response = await api.put(`/group-rides/${groupRideId}/fare-split`, data);
      return response.data;
    } catch (error) {
      console.error('Error setting fare split method:', error);
      throw error;
    }
  },

  async calculateFareSplits(groupRideId: string, totalFare: number): Promise<FareSplitResult> {
    try {
      const response = await api.post(`/group-rides/${groupRideId}/calculate-splits`, { total_fare: totalFare });
      return response.data;
    } catch (error) {
      console.error('Error calculating fare splits:', error);
      throw error;
    }
  }
}; 