// services/auth.ts
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  name: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  password: string;
  phone?: string; // Added phone as it might be required by the backend
}

export interface ProfileForm {
  university: string;
  emergencyContact: string;
  genderPreference: string;
  likes: string;
  dislikes: string;
  studentCardURL?: string | null;
  user_id?: string; // This gets added later
}

export interface RegisterResponse {
  message: string;
  user_id: string;
}

export interface ProfileResponse {
  message: string;
  profile_id: string;
}

export const AuthService = {
  async login(data: LoginForm) {
    try {
      const response = await api.post('/auth/login', data);
      const { access_token, refresh_token, user_id, name } = response.data;
      
      // Store tokens
      await AsyncStorage.setItem('accessToken', access_token);
      await AsyncStorage.setItem('refreshToken', refresh_token);
      await AsyncStorage.setItem('userId', user_id);
      await AsyncStorage.setItem('userName', name);
      
      return response.data;
    } catch (error) {
      const err = error as any;
      console.error('Login error details:', err);
      throw err;
    }
  },
  
  async register(data: SignupForm): Promise<RegisterResponse> {
    try {
      // Log the data being sent for debugging
      console.log('Sending registration data:', JSON.stringify(data));
      
      // Format the data according to what the backend expects
      // This is where we might need to adjust field names or formats
      const formattedData = {
        name: data.name,
        email: data.email,
        password: data.password,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        phone: data.phone || '0000000000'  // Provide a default if backend requires it
      };
      
      const response = await api.post('/auth/register', formattedData);
      console.log('Registration response:', response.data);
      return response.data;
    } catch (error) {
      const err = error as any;
      console.error('Register error details:', err.response?.data || err);
      throw err;
    }
  },
  
  async registerProfile(data: ProfileForm): Promise<ProfileResponse> {
    try {
      // Log the data being sent for debugging
      console.log('Sending profile data:', JSON.stringify(data));
      
      // Format the data according to what the backend expects
      const formattedData = {
        user_id: data.user_id,  // The backend might expect userId instead of user_id
        university: data.university,
        emergencyContact: data.emergencyContact,
        genderPreference: data.genderPreference,
        likes: data.likes,
        dislikes: data.dislikes,
        studentCardURL: data.studentCardURL || ''
      };
      
      const response = await api.post('/auth/register-profile', formattedData);
      console.log('Profile registration response:', response.data);
      return response.data;
    } catch (error) {
      const err = error as any;
      console.error('Profile registration error details:', err.response?.data || err);
      throw err;
    }
  },
  
  async logout() {
    // Clear stored tokens
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userName');
  },
  
  async isAuthenticated() {
    const token = await AsyncStorage.getItem('accessToken');
    return !!token;
  },
  
  async getUserInfo() {
    const userId = await AsyncStorage.getItem('userId');
    const userName = await AsyncStorage.getItem('userName');
    
    return {
      userId,
      userName
    };
  }
};