// services/user.ts
import api from './api';

export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  university: string;
  gender: string;
  gender_preference: string;
  emergency_contact: string;
  likes: string;
  dislikes: string;
}

export interface UpdateProfileResponse {
  message: string;
}

export const UserService = {
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },
  
  async updateProfile(data: Partial<UserProfile>): Promise<UpdateProfileResponse> {
    try {
      const response = await api.put('/users/profile', data);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
};