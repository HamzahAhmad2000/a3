import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { EmergencyService, EmergencyAlert } from '../services/emergency';

const emergencyTypes = [
  { key: 'medical', label: 'Medical Emergency' },
  { key: 'safety', label: 'Safety Concern' },
  { key: 'accident', label: 'Accident' },
  { key: 'harassment', label: 'Harassment' },
  { key: 'other', label: 'Other' },
];

const EmergencyScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { rideId } = (route.params as { rideId?: string }) || {};
  
  const [selectedType, setSelectedType] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLocationSharing, setIsLocationSharing] = useState<boolean>(false);

  const handleEmergencyAlert = async () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select an emergency type');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description of the emergency');
      return;
    }

    try {
      setIsLoading(true);
      
      const alertData: EmergencyAlert = {
        user_id: '', // This will be set by the backend from JWT
        ride_id: rideId || '',
        emergency_type: selectedType as any,
        description: description.trim(),
        location: {
          latitude: 0, // In a real app, get from GPS
          longitude: 0,
          address: 'Current Location'
        }
      };

      const response = await EmergencyService.triggerEmergencyAlert(alertData);
      
      if (response.success) {
        Alert.alert(
          'Emergency Alert Sent',
          `Your emergency alert has been sent successfully.\n\nAlert ID: ${response.alert_id}\n\nEmergency contacts have been notified:\n• Police: ${response.emergency_contacts.police}\n• Medical: ${response.emergency_contacts.medical}\n• Support: ${response.emergency_contacts.support}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to send emergency alert');
      }
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      Alert.alert('Error', 'Failed to send emergency alert. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSharing = async () => {
    if (!rideId) {
      Alert.alert('Error', 'No active ride found for location sharing');
      return;
    }

    try {
      setIsLocationSharing(true);
      
      const response = await EmergencyService.shareLocationWithContacts({
        ride_id: rideId,
        duration_minutes: 60 // Share for 1 hour
      });
      
      if (response.success) {
        Alert.alert(
          'Location Sharing Started',
          `Your location is now being shared with your emergency contacts for ${response.duration_minutes} minutes.\n\nSession ID: ${response.session_id}`
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to start location sharing');
      }
    } catch (error) {
      console.error('Error starting location sharing:', error);
      Alert.alert('Error', 'Failed to start location sharing. Please try again.');
    } finally {
      setIsLocationSharing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Emergency</Text>
        </View>

        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            🚨 This is for real emergencies only. Misuse may result in account suspension.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Type</Text>
          {emergencyTypes.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.typeButton,
                selectedType === type.key && styles.selectedTypeButton
              ]}
              onPress={() => setSelectedType(type.key)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === type.key && styles.selectedTypeButtonText
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Please describe the emergency situation..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.emergencyButton, isLoading && styles.disabledButton]}
          onPress={handleEmergencyAlert}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.emergencyButtonText}>🚨 SEND EMERGENCY ALERT</Text>
          )}
        </TouchableOpacity>

        {rideId && (
          <TouchableOpacity
            style={[styles.locationButton, isLocationSharing && styles.disabledButton]}
            onPress={handleLocationSharing}
            disabled={isLocationSharing}
          >
            {isLocationSharing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.locationButtonText}>📍 Share Location with Contacts</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What happens when you send an alert?</Text>
          <Text style={styles.infoText}>
            • Your emergency contacts will be notified immediately{'\n'}
            • Your current location will be shared{'\n'}
            • Local emergency services may be contacted{'\n'}
            • RideMatch support team will be alerted{'\n'}
            • Your ride details will be flagged for priority assistance
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  warningContainer: {
    backgroundColor: '#FFF3CD',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  typeButton: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedTypeButton: {
    backgroundColor: '#FF3B30',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedTypeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  emergencyButton: {
    backgroundColor: '#FF3B30',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  locationButton: {
    backgroundColor: '#FF9500',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  infoSection: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
});

export default EmergencyScreen; 