import api from './api';

export interface EmergencyAlert {
  user_id: string;
  ride_id: string;
  emergency_type: 'medical' | 'safety' | 'accident' | 'harassment' | 'other';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  description?: string;
}

export interface EmergencyAlertResponse {
  success: boolean;
  alert_id: string;
  message: string;
  emergency_contacts: {
    police: string;
    medical: string;
    support: string;
  };
}

export interface EmergencyContact {
  name: string;
  type: 'phone' | 'email';
  value: string;
}

export interface LocationSharingRequest {
  ride_id: string;
  duration_minutes?: number;
}

export interface LocationSharingResponse {
  success: boolean;
  session_id: string;
  message: string;
  duration_minutes: number;
}

export interface ActiveEmergency {
  id: string;
  user: {
    id: string;
    name: string;
  };
  ride_id: string;
  emergency_type: string;
  location: any;
  description: string;
  created_at: string;
  admin_notified: boolean;
}

export interface EmergencyResponse {
  success: boolean;
  message: string;
}

export const EmergencyService = {
  async triggerEmergencyAlert(data: EmergencyAlert): Promise<EmergencyAlertResponse> {
    try {
      const response = await api.post('/safety/emergency-alert', data);
      return response.data;
    } catch (error) {
      console.error('Error triggering emergency alert:', error);
      throw error;
    }
  },

  async shareLocationWithContacts(data: LocationSharingRequest): Promise<LocationSharingResponse> {
    try {
      const response = await api.post('/safety/share-location', data);
      return response.data;
    } catch (error) {
      console.error('Error sharing location:', error);
      throw error;
    }
  },

  async addEmergencyContact(contact: EmergencyContact): Promise<EmergencyResponse> {
    try {
      const response = await api.post('/safety/emergency-contact', contact);
      return response.data;
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      throw error;
    }
  },

  async getActiveEmergencies(): Promise<{ success: boolean; alerts: ActiveEmergency[] }> {
    try {
      const response = await api.get('/safety/active-emergencies');
      return response.data;
    } catch (error) {
      console.error('Error fetching active emergencies:', error);
      throw error;
    }
  },

  async resolveEmergencyAlert(alertId: string, resolutionNotes?: string): Promise<EmergencyResponse> {
    try {
      const response = await api.post(`/safety/resolve-emergency/${alertId}`, {
        resolution_notes: resolutionNotes
      });
      return response.data;
    } catch (error) {
      console.error('Error resolving emergency alert:', error);
      throw error;
    }
  }
}; 