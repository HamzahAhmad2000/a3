// screens/JoinRide.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useAppNavigation } from '../navigationUtils';
import { useNavigation } from '@react-navigation/native';
import { RideService } from '../services/ride';
import Navbar from '../components/Navbar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Ride {
  _id: string;
  ride_id: string;
  creator_name?: string; // Keep for backward compatibility
  creator_info?: { // New structure from backend
    name: string;
    email: string;
    university?: string;
    gender?: string;
    sector?: string;
  };
  creator_user_id: string;
  car_type: string;
  passenger_slots: number;
  available_slots?: number;
  current_passengers?: number;
  active?: boolean;
  fare: number | null;
  distance: number | null;
  group_join: boolean;
  location?: { // Keep for backward compatibility
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  pickup_location?: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  dropoff_location?: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  sector?: string;
  status?: string;
  created_at: string;
  match_social?: boolean;
  user_already_joined?: boolean;
  is_creator?: boolean;
  can_join?: boolean;
  can_leave?: boolean;
  can_end?: boolean;
}

const JoinRide: React.FC = () => {
  const navigation = useAppNavigation(); 
  const [rides, setRides] = useState<Ride[]>([]);
  const [filteredRides, setFilteredRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  // Removed sector filtering - no longer needed

  useEffect(() => {
    // Load available rides
    loadRides();
  }, []); // Remove selectedSector dependency

  const loadRides = async () => {
    setIsLoading(true);
    try {
      // Remove sector filtering - get all available rides
      const response = await RideService.getAvailableRides();
      const ridesArray = response.rides || []; // Extract rides array from response
      setRides(ridesArray);
      setFilteredRides(ridesArray);
    } catch (error) {
      console.error('Error loading rides:', error);
      Alert.alert('Error', 'Failed to load available rides. Please try again.');
      setRides([]); // Set empty array on error to prevent crashes
      setFilteredRides([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterRides = (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      setFilteredRides(rides);
      return;
    }

    const filtered = rides.filter(
      (ride) =>
        (ride.creator_info?.name || ride.creator_name || '').toLowerCase().includes(text.toLowerCase()) ||
        (ride.pickup_location?.address || ride.location?.address || '').toLowerCase().includes(text.toLowerCase()) ||
        ride.car_type.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredRides(filtered);
  };

  const handleJoinRide = (ride: Ride) => {
    navigation.navigate('JoinRideConfirm', { 
      rideId: ride.ride_id 
    } as any);
  };

  const handleLeaveRide = async (ride: Ride) => {
    Alert.alert(
      'Leave Ride',
      'Are you sure you want to leave this ride?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await RideService.leaveRide(ride.ride_id);
              Alert.alert('Success', 'You have left the ride successfully.');
              loadRides(); // Refresh the list
            } catch (error) {
              console.error('Error leaving ride:', error);
              Alert.alert('Error', 'Failed to leave the ride. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleEndRide = (ride: Ride) => {
    if (ride.is_creator) {
      // Navigate to ride details or end ride flow
      navigation.navigate('RideStarted', { rideId: ride.ride_id } as any);
    } else {
      // For passengers, this acts as "leave ride"
      handleLeaveRide(ride);
    }
  };
  const handleRefresh = () => {
    loadRides();
  };

  const renderRideItem = ({ item }: { item: Ride }) => (
    <View style={styles.rideCard}>
      <View style={styles.rideHeader}>
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{item.creator_info?.name || item.creator_name || 'Unknown Driver'}</Text>
          <Text style={styles.carType}>{item.car_type}</Text>
        </View>
        <View style={styles.ratingContainer}>
          <Image
            source={require('../assets/images/Yellow Star Icon.png')}
            style={styles.starIcon}
            resizeMode="contain"
          />
          <Text style={styles.ratingText}>4.8</Text>
        </View>
      </View>

      <View style={styles.rideDetails}>
        <View style={styles.detailItem}>
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.detailIcon}
            resizeMode="contain"
          />
          <Text style={styles.detailText}>
            {item.distance ? `${item.distance} km` : 'N/A'}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Image
            source={require('../assets/images/Blue Fare Icon.png')}
            style={styles.detailIcon}
            resizeMode="contain"
          />
          <Text style={styles.detailText}>
            {item.fare ? `${item.fare} Rs.` : 'N/A'}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Image
            source={require('../assets/images/Location Icon.png')}
            style={styles.detailIcon}
            resizeMode="contain"
          />
          <Text style={styles.detailText} numberOfLines={1}>
            {item.pickup_location?.address || item.location?.address || 'Location not available'}
          </Text>
        </View>
      </View>

      <View style={styles.seatsContainer}>
        <Text style={styles.seatsText}>
          {item.passenger_slots} {item.passenger_slots === 1 ? 'seat' : 'seats'} available
        </Text>
        {item.group_join && <Text style={styles.groupText}>Group ride</Text>}
      </View>

      {/* Dynamic button based on user's relationship to the ride */}
      {item.can_join ? (
        <TouchableOpacity 
          style={[
            styles.joinButton,
            item.passenger_slots <= 0 && styles.disabledButton
          ]} 
          onPress={() => handleJoinRide(item)}
          disabled={item.passenger_slots <= 0}
        >
          <Text style={[
            styles.joinButtonText,
            item.passenger_slots <= 0 && styles.disabledButtonText
          ]}>
            Join Ride
          </Text>
        </TouchableOpacity>
      ) : item.can_leave || item.can_end ? (
        <TouchableOpacity 
          style={[
            styles.leaveButton
          ]} 
          onPress={() => handleEndRide(item)}
        >
          <Text style={styles.leaveButtonText}>
            {item.is_creator ? 'Manage Ride' : 'Leave Ride'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.disabledButton}
          disabled
        >
          <Text style={styles.disabledButtonText}>
            {item.is_creator ? 'Your Ride' : 'Unavailable'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Rides</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search rides..."
          placeholderTextColor="#aaa"
          value={searchText}
          onChangeText={filterRides}
        />
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Image
            source={require('../assets/images/White Ride Button.png')}
            style={styles.refreshIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>



      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#113a78" />
        </View>
      ) : filteredRides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No rides available</Text>
          <TouchableOpacity 
            style={styles.createRideButton} 
            onPress={() => navigation.navigate('CreateTripStep1' as never)}
          >
            <Text style={styles.createRideButtonText}>Create a Ride</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRides}
          renderItem={renderRideItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.rideList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Navbar */}
      <Navbar currentRoute="JoinRide" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  header: {
    padding: 15,
    alignItems: 'center',
    marginTop: 30,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '600',
    color: '#113a78',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    fontFamily: 'Inter',
    marginRight: 10,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#113a78',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    width: 20,
    height: 20,
  },
  sectorContainer: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  sectorLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 5,
  },
  sectorList: {
    paddingVertical: 5,
  },
  sectorButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#e6effc',
    borderRadius: 15,
    marginRight: 10,
  },
  selectedSectorButton: {
    backgroundColor: '#113a78',
  },
  sectorButtonText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#113a78',
  },
  selectedSectorButtonText: {
    color: '#ffffff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  createRideButton: {
    backgroundColor: '#113a78',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createRideButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  rideList: {
    padding: 15,
    paddingBottom: 120, // Add padding for navbar
  },
  rideCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#113a78',
  },
  carType: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    width: 16,
    height: 16,
    marginRight: 5,
  },
  ratingText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#113a78',
  },
  rideDetails: {
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailIcon: {
    width: 16,
    height: 16,
    marginRight: 5,
  },
  detailText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#555',
  },
  seatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  seatsText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#113a78',
  },
  groupText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#ffffff',
    backgroundColor: '#ff9020',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  joinButton: {
    backgroundColor: '#113a78',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaveButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  leaveButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  disabledButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
  },
});

export default JoinRide;