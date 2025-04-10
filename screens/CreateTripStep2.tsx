// screens/CreateTripStep2.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Navbar from '../components/Navbar';

// Get device dimensions for responsive scaling
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CreateTripStep2NavigationProp = StackNavigationProp<
  RootStackParamList,
  'CreateTripStep2'
>;

// Dummy car data
const cars = [
  {
    id: 'basic',
    title: 'Basic',
    description: 'Easy and convenient without A/C',
    image: require('../assets/images/Basic Icon.png'),
  },
  {
    id: 'premium',
    title: 'Premium',
    description: 'Comfortable ride with A/C',
    image: require('../assets/images/Premium Icon.png'),
  },
  {
    id: 'premium_plus',
    title: 'Premium +',
    description: 'Luxury ride with A/C',
    image: require('../assets/images/Premium Plus Icon.png'),
  },
];

// Component for selecting a car type
const SelectCar = ({
  selectedCar,
  onSelect,
}: {
  selectedCar: string | null;
  onSelect: (id: string) => void;
}) => {
  return (
    <View style={styles.carOptionsContainer}>
      {cars.map((car) => (
        <TouchableOpacity
          key={car.id}
          style={[
            styles.carOption,
            selectedCar === car.id && styles.selectedCarOption,
          ]}
          onPress={() => onSelect(car.id)}
        >
          <Image source={car.image} style={styles.carImage} resizeMode="contain" />
          <Text style={styles.carTitle}>{car.title}</Text>
          <Text style={styles.carDescription}>{car.description}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Component for displaying ride info (distance, time, fare)
const RideInfoItem = ({
  icon,
  label,
}: {
  icon: any;
  label: string;
}) => (
  <View style={styles.rideInfoItem}>
    <Image source={icon} style={styles.infoIcon} resizeMode="contain" />
    <Text style={styles.infoLabel}>{label}</Text>
  </View>
);

// Component for displaying location information
const LocationItem = ({
  type,
  address,
}: {
  type: 'Pick' | 'Drop Off';
  address: string;
}) => (
  <View style={styles.locationRow}>
    <View style={styles.locationTextContainer}>
      <Text style={styles.locationType}>{type}</Text>
      <Text style={styles.locationAddress}>{address}</Text>
    </View>
    <TouchableOpacity style={styles.editIconContainer}>
      <Image
        source={require('../assets/images/Blue Edit Icon.png')}
        style={styles.editIcon}
        resizeMode="contain"
      />
    </TouchableOpacity>
  </View>
);

const CreateTripStep2: React.FC = () => {
  const navigation = useNavigation<CreateTripStep2NavigationProp>();
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tripData, setTripData] = useState<any>({
    pickup: '',
    dropOff: '',
  });
  
  // Dummy ride details - in a real app, these would be calculated
  const rideDetails = {
    distance: '25km',
    time: '8 min',
    fare: '600 Rs.',
  };

  useEffect(() => {
    // Load trip data from previous step
    const loadTripData = async () => {
      try {
        const storedData = await AsyncStorage.getItem('tripForm');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setTripData(parsedData);
        }
      } catch (error) {
        console.error('Error loading trip data:', error);
        Alert.alert('Error', 'Failed to load trip information.');
      }
    };

    loadTripData();
  }, []);

  const handleContinue = async () => {
    if (!selectedCar) {
      Alert.alert('Selection Required', 'Please select a car type to continue.');
      return;
    }

    setIsLoading(true);
    try {
      // Save car selection to trip data
      const updatedTripData = {
        ...tripData,
        carType: selectedCar,
        distance: rideDetails.distance,
        time: rideDetails.time,
        fare: rideDetails.fare,
      };

      await AsyncStorage.setItem('tripForm', JSON.stringify(updatedTripData));
      
      // Navigate to next step
      navigation.navigate('CreateTripStep3');
    } catch (error) {
      console.error('Error saving car selection:', error);
      Alert.alert('Error', 'Failed to save car selection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header with step indicator */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Trip</Text>
          <View style={styles.stepsContainer}>
            <View style={[styles.stepCircle, styles.completedStep]}>
              <Text style={styles.stepText}>1</Text>
            </View>
            <View style={[styles.stepCircle, styles.currentStep]}>
              <Text style={styles.stepText}>2</Text>
            </View>
            <View style={styles.stepCircle}>
              <Text style={styles.stepText}>3</Text>
            </View>
            <View style={styles.stepCircle}>
              <Text style={styles.stepText}>4</Text>
            </View>
          </View>
        </View>

        {/* Main content */}
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Select Car</Text>
          <SelectCar selectedCar={selectedCar} onSelect={setSelectedCar} />

          {/* Ride details: distance, time, fare */}
          <View style={styles.rideInfoContainer}>
            <RideInfoItem
              icon={require('../assets/images/icon.png')}
              label={rideDetails.distance}
            />
            <RideInfoItem
              icon={require('../assets/images/Blue time Icon.png')}
              label={rideDetails.time}
            />
            <RideInfoItem
              icon={require('../assets/images/Blue Fare Icon.png')}
              label={rideDetails.fare}
            />
          </View>

          {/* Location section */}
          <View style={styles.locationContainer}>
            <LocationItem type="Pick" address={tripData.pickup} />
            <LocationItem type="Drop Off" address={tripData.dropOff} />
          </View>

          {/* Navigation buttons */}
          <View style={styles.buttonContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#113a78" style={styles.loader} />
            ) : (
              <>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Text style={styles.buttonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.continueButton, !selectedCar && styles.disabledButton]} 
                  onPress={handleContinue}
                  disabled={!selectedCar}
                >
                  <Text style={styles.buttonText}>Continue</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
      
      {/* Navbar */}
      <Navbar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 120, // Add padding for navbar
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 10,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '80%',
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e6effc',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  completedStep: {
    backgroundColor: '#ff9020',
  },
  currentStep: {
    backgroundColor: '#5a87c9',
  },
  stepText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 16,
  },
  carOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  carOption: {
    width: SCREEN_WIDTH * 0.28,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  selectedCarOption: {
    borderWidth: 2,
    borderColor: '#113a78',
    backgroundColor: '#e7f0ff',
  },
  carImage: {
    width: 60,
    height: 40,
    marginBottom: 5,
  },
  carTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#113a78',
    textAlign: 'center',
  },
  carDescription: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '300',
    color: '#113a78',
    textAlign: 'center',
  },
  rideInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  rideInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  infoLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#113a78',
  },
  locationContainer: {
    marginBottom: 30,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#cccccc',
  },
  locationTextContainer: {
    flex: 1,
  },
  locationType: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: '#bac3d1',
  },
  locationAddress: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#113a78',
  },
  editIconContainer: {
    padding: 4,
  },
  editIcon: {
    width: 20,
    height: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    flex: 0.45,
    backgroundColor: '#cccccc',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  continueButton: {
    flex: 0.45,
    backgroundColor: '#113a78',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
  },
  buttonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
});

export default CreateTripStep2;