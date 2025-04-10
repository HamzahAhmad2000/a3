// screens/CreateTripStep1.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import Navbar from '../components/Navbar';

type CreateTripStep1NavigationProp = StackNavigationProp<
  RootStackParamList,
  'CreateTripStep1'
>;

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface TripForm {
  pickup: string;
  pickupCoordinates: LocationCoordinates | null;
  dropOff: string;
  dropOffCoordinates: LocationCoordinates | null;
  matchSocial: boolean;
  selectedSeats: number;
  timeToReach: string;
  sector?: string;
  distance?: number;
  fare?: number;
}

const CreateTripStep1: React.FC = () => {
  const navigation = useNavigation<CreateTripStep1NavigationProp>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(false);

  const [form, setForm] = useState<TripForm>({
    pickup: '',
    pickupCoordinates: null,
    dropOff: '',
    dropOffCoordinates: null,
    matchSocial: false,
    selectedSeats: 1,
    timeToReach: '',
    sector: 'G8', // Default sector
  });

  const [errors, setErrors] = useState({
    pickup: '',
    dropOff: '',
    timeToReach: '',
  });

  // Time options for dropdown
  const timeOptions = ['15 minutes', '30 minutes', '45 minutes', '1 hour', '2 hours'];

  useEffect(() => {
    // Check if there's already form data in AsyncStorage
    const checkFormData = async () => {
      try {
        const savedFormData = await AsyncStorage.getItem('tripForm');
        if (savedFormData) {
          const parsedData = JSON.parse(savedFormData);
          setForm(parsedData);
        } else {
          // If no saved data, try to get current location
          getCurrentLocation();
        }
      } catch (error) {
        console.error('Error checking form data:', error);
        // If error, still try to get current location
        getCurrentLocation();
      }
    };

    checkFormData();
  }, []);

  const getCurrentLocation = async () => {
    setIsLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required for this feature.',
          [{ text: 'OK' }]
        );
        setIsLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (location) {
        const { latitude, longitude } = location.coords;
        
        // Try to get a human-readable address
        const addressResponse = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        let addressText = 'Current Location';
        
        // If we get an address, use it
        if (addressResponse && addressResponse.length > 0) {
          const address = addressResponse[0];
          const parts = [
            address.street,
            address.city,
            address.region,
          ].filter(Boolean);
          
          addressText = parts.join(', ');
        }

        const sector = determineSector({ latitude, longitude });

        // Update form with current location data
        setForm(prevForm => ({
          ...prevForm,
          pickup: addressText,
          pickupCoordinates: { latitude, longitude },
          sector,
        }));
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Location Error',
        'Could not determine your current location. Please enter it manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLocationLoading(false);
    }
  };

  const determineSector = (coordinates: LocationCoordinates): string => {
    // This is a simplified mapping for demo purposes
    // In a real app, you would use more accurate geofencing or backend API
    const { latitude, longitude } = coordinates;
    
    // Crude mapping based on coordinates - just for demo
    if (latitude > 33.7100 && latitude < 33.7300 && longitude > 73.0500 && longitude < 73.0700) {
      return 'G8';
    } else if (latitude > 33.6900 && latitude < 33.7100 && longitude > 73.0500 && longitude < 73.0700) {
      return 'G9';
    } else if (latitude > 33.6700 && latitude < 33.6900 && longitude > 73.0500 && longitude < 73.0700) {
      return 'G10';
    } else if (latitude > 33.7100 && latitude < 33.7300 && longitude > 73.0300 && longitude < 73.0500) {
      return 'F8';
    } else {
      return 'G8'; // Default if no match
    }
  };

  const handleChange = (field: keyof TripForm, value: string | boolean | number) => {
    setForm({ ...form, [field]: value });
    
    // Reset error for the field
    if (typeof value === 'string' && field in errors) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleTimeSelect = (time: string) => {
    handleChange('timeToReach', time);
  };

  const validate = () => {
    let valid = true;
    const newErrors = {
      pickup: '',
      dropOff: '',
      timeToReach: '',
    };

    if (!form.pickup.trim()) {
      newErrors.pickup = 'Pickup location is required';
      valid = false;
    }

    if (!form.dropOff.trim()) {
      newErrors.dropOff = 'Drop-off location is required';
      valid = false;
    }

    if (!form.timeToReach.trim()) {
      newErrors.timeToReach = 'Time to reach is required';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleContinue = async () => {
    if (validate()) {
      setIsLoading(true);
      try {
        // If we don't have coordinates for the drop-off location,
        // we would normally geocode it here using a service like Google Maps
        // For demo purposes, we'll generate mock coordinates if they're missing

        const formData = { ...form };
        
        if (!formData.dropOffCoordinates) {
          // For demo, create drop-off coordinates based on pickup
          formData.dropOffCoordinates = {
            latitude: (formData.pickupCoordinates?.latitude || 33.7150) + (Math.random() * 0.01),
            longitude: (formData.pickupCoordinates?.longitude || 73.0600) + (Math.random() * 0.01),
          };
        }

        // Calculate fare based on distance
        const distanceKm = calculateDistance(
          formData.pickupCoordinates,
          formData.dropOffCoordinates
        );
        
        formData.distance = distanceKm;
        formData.fare = Math.round(distanceKm * 15); // Rs. 15 per km

        // Store the form data in AsyncStorage for the next steps
        await AsyncStorage.setItem('tripForm', JSON.stringify(formData));

        // Navigate to the next step
        navigation.navigate('CreateTripStep2');
      } catch (error) {
        console.error('Error saving form data:', error);
        Alert.alert('Error', 'Failed to save form data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      Alert.alert('Please check your input', 'All fields are required to continue.');
    }
  };

  const calculateDistance = (
    point1: LocationCoordinates | null,
    point2: LocationCoordinates | null
  ): number => {
    if (!point1 || !point2) {
      return 10; // Default distance
    }

    // Haversine formula for distance calculation
    const earthRadius = 6371; // km
    const dLat = degreesToRadians(point2.latitude - point1.latitude);
    const dLon = degreesToRadians(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(degreesToRadians(point1.latitude)) * Math.cos(degreesToRadians(point2.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = earthRadius * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };

  const degreesToRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  const handleCancel = () => {
    // Clear form and navigate back to homepage
    AsyncStorage.removeItem('tripForm')
      .then(() => {
        navigation.navigate('Homepage');
      })
      .catch(error => {
        console.error('Error clearing form data:', error);
        navigation.navigate('Homepage');
      });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.container}>
          {/* Title & Step Indicator */}
          <View style={styles.titleContainer}>
            <View style={styles.logoContainer}>
              <Text style={styles.titleText}>Create Trip</Text>
            </View>
            <View style={styles.stepIndicatorContainer}>
              {[1, 2, 3, 4].map((step) => (
                <View
                  key={step}
                  style={[
                    styles.stepCircle,
                    step === 1 && styles.stepCircleActive,
                  ]}
                >
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.stepInfo}>Step 1 of 4</Text>
          </View>

          {/* Pick Up Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pick Up</Text>
            <View style={styles.inputWithIcon}>
              <Image
                source={require('../assets/images/Address Icon.png')}
                style={styles.inputIcon}
                resizeMode="contain"
              />
              <TextInput
                style={styles.input}
                placeholder="Enter pickup location"
                placeholderTextColor="#bac3d1"
                value={form.pickup}
                onChangeText={(text) => handleChange('pickup', text)}
                editable={!isLocationLoading}
              />
              {isLocationLoading && (
                <ActivityIndicator size="small" color="#113a78" style={styles.inputLoader} />
              )}
            </View>
            {errors.pickup ? <Text style={styles.errorText}>{errors.pickup}</Text> : null}
            
            <TouchableOpacity 
              style={styles.locationButton} 
              onPress={getCurrentLocation}
              disabled={isLocationLoading}
            >
              <Image
                source={require('../assets/images/Location Icon.png')}
                style={styles.locationIcon}
                resizeMode="contain"
              />
              <Text style={styles.locationButtonText}>Use current location</Text>
            </TouchableOpacity>
          </View>

          {/* Drop Off Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Drop Off</Text>
            <View style={styles.inputWithIcon}>
              <Image
                source={require('../assets/images/Address Icon.png')}
                style={styles.inputIcon}
                resizeMode="contain"
              />
              <TextInput
                style={styles.input}
                placeholder="Enter drop-off location"
                placeholderTextColor="#bac3d1"
                value={form.dropOff}
                onChangeText={(text) => handleChange('dropOff', text)}
              />
            </View>
            {errors.dropOff ? <Text style={styles.errorText}>{errors.dropOff}</Text> : null}
          </View>

          {/* Social Preferences Checkbox */}
          <View style={styles.inputGroup}>
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[styles.checkbox, form.matchSocial && styles.checkboxChecked]}
                onPress={() => handleChange('matchSocial', !form.matchSocial)}
              >
                {form.matchSocial && <View style={styles.checkboxInner} />}
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>Match with companions based on interests</Text>
            </View>
          </View>

          {/* Number of Seats */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Number of Passengers</Text>
            <View style={styles.seatButtonContainer}>
              {[1, 2, 3, 4].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.seatButton,
                    form.selectedSeats === num && styles.seatButtonSelected,
                  ]}
                  onPress={() => handleChange('selectedSeats', num)}
                >
                  <Text style={[
                    styles.seatButtonText,
                    form.selectedSeats === num && styles.seatButtonTextSelected
                  ]}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Time to Reach */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Time to Reach</Text>
            
            <View style={styles.timeOptionsContainer}>
              {timeOptions.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeOption,
                    form.timeToReach === time && styles.timeOptionSelected,
                  ]}
                  onPress={() => handleTimeSelect(time)}
                >
                  <Text style={[
                    styles.timeOptionText,
                    form.timeToReach === time && styles.timeOptionTextSelected,
                  ]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {errors.timeToReach ? <Text style={styles.errorText}>{errors.timeToReach}</Text> : null}
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#113a78" style={styles.loader} />
            ) : (
              <>
                <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                  <Text style={styles.buttonText}>Continue</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Navbar */}
      <Navbar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 120, // Add padding for navbar
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#113a78',
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#5a87c9',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  stepCircleActive: {
    backgroundColor: '#ff9020',
  },
  stepText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  stepInfo: {
    fontSize: 14,
    color: '#113a78',
    marginTop: 5,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#113a78',
    marginBottom: 5,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#113a78',
  },
  inputLoader: {
    marginLeft: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  locationIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  locationButtonText: {
    fontSize: 14,
    color: '#ff9020',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#113a78',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#113a78',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    backgroundColor: '#ffffff',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#113a78',
  },
  seatButtonContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  seatButton: {
    width: 40,
    height: 40,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginRight: 10,
  },
  seatButtonSelected: {
    backgroundColor: '#ff9020',
    borderColor: '#ff9020',
  },
  seatButtonText: {
    fontSize: 16,
    color: '#113a78',
  },
  seatButtonTextSelected: {
    color: '#ffffff',
  },
  timeOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  timeOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  timeOptionSelected: {
    backgroundColor: '#113a78',
    borderColor: '#113a78',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#113a78',
  },
  timeOptionTextSelected: {
    color: '#ffffff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#113a78',
    padding: 15,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#cccccc',
    padding: 15,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
});

export default CreateTripStep1;