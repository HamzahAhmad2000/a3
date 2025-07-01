// services/user.ts
import api from './api';
import { ErrorHandler, getFallbackData } from '../utils/errorHandler';

export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  role: string;
  university: string;
  gender: string;
  gender_preference: string;
  emergency_contact: string;
  likes: string;
  dislikes: string;
  profile_image?: string;
  date_of_birth: string;
}

export interface UpdateProfileResponse {
  message: string;
}

export const UserService = {
  getBaseURL(): string {
    // Get the base URL from the api instance
    return api.defaults.baseURL || 'http://localhost:5000';
  },

  async getProfile(): Promise<UserProfile> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.get('/users/profile');
        return ErrorHandler.ensureObject(response.data, getFallbackData('user') as UserProfile);
      },
      getFallbackData('user') as UserProfile,
      'Get User Profile'
    );
  },
  
  async updateProfile(data: Partial<UserProfile>): Promise<UpdateProfileResponse> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.put('/users/profile', data);
        return response.data;
      },
      { message: 'Profile update completed' },
      'Update User Profile'
    );
  },

  async uploadProfileImage(imageUri: string): Promise<string> {
    return ErrorHandler.withFallback(
      async () => {
        const formData = new FormData();
        
        // Create file object for React Native
        const fileExtension = imageUri.split('.').pop() || 'jpg';
        const fileName = `profile_image.${fileExtension}`;
        
        formData.append('profile_image', {
          uri: imageUri,
          type: `image/${fileExtension}`,
          name: fileName,
        } as any);

        const response = await api.post('/users/profile/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        return response.data.image_url;
      },
      imageUri, // Return the original URI as fallback
      'Upload Profile Image'
    );
  },

  async deleteProfileImage(): Promise<void> {
    return ErrorHandler.silentOperation(
      async () => {
        await api.delete('/users/profile/image');
      },
      undefined
    );
  }
};