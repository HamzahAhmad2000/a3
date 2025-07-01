// screens/RideStarted.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import { RideService } from '../services/ride';

type RideStartedRouteProp = RouteProp<RootStackParamList, 'RideStarted'>;
type RideStartedNavigationProp = StackNavigationProp<RootStackParamList, 'RideStarted'>;

interface Passenger {
  user_id: string;
  name: string;
  pickup_location: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  has_arrived: boolean;
}

interface RideStatus {
  status: string;
  driver: {
    id?: string;
    name: string;
    rating?: number;
    carType?: string;
    accepted?: boolean;
  };
  passengers: Passenger[];
  fare: number;
  distance: number;
  is_driver: boolean;
  creator_user_id?: string;
  pickup_location: {
    address: string;
    coordinates?: { latitude: number; longitude: number };
  };
  dropoff_location: { address: string };
  dropoffTime?: string;
}

const RideStarted: React.FC = () => {
  const navigation = useNavigation<RideStartedNavigationProp>();
  const route = useRoute<RideStartedRouteProp>();
  const { rideId } = route.params || { rideId: '' };

  const [rideStatus, setRideStatus] = useState<RideStatus | null>(null);
  const [routeOrder, setRouteOrder] = useState<Passenger[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [driverEta, setDriverEta] = useState<number | null>(null);

  useEffect(() => {
    // Load ride status
    loadRideStatus();
    
    // Set up a timer to periodically refresh the ride status
    const refreshInterval = setInterval(loadRideStatus, 10000); // Refresh every 10 seconds
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [rideId]);

  const loadRideStatus = async () => {
    try {
      setIsLoading(true);

      const [rideDetails, driverStatus] = await Promise.all([
        RideService.getRideDetails(rideId),
        RideService.getDriverStatus(rideId)
      ]);

      // Ensure passengers array exists and has proper structure
      const passengers: Passenger[] = (rideDetails.passengers || []).map((p: any) => ({
        user_id: p.user_id || '',
        name: p.name || p.user_id || 'Unknown Passenger',
        pickup_location: {
          address: p.pickup_location?.address || 'Unknown location',
          coordinates: {
            latitude: p.pickup_location?.coordinates?.latitude || 0,
            longitude: p.pickup_location?.coordinates?.longitude || 0,
          }
        },
        has_arrived: p.has_arrived || false,
      }));

      // Determine driver status based on driver type and current user
      const isUserTheDriver = rideDetails.is_driver || false;
      const driverType = rideDetails.driver_type || 'self';
      const rideDriverStatus = rideDetails.driver_status || 'pending';
      const assignedDriverId = rideDetails.assigned_driver_id;
      
      // Determine if driver is accepted/ready
      let hasAcceptedDriver = false;
      let driverInfo = {
        id: '',
        name: 'Driver',
        rating: undefined as number | undefined,
        carType: rideDetails.car_type || 'Unknown',
        accepted: false,
      };

      if (driverType === 'self') {
        // Self-drive: creator is the driver
        hasAcceptedDriver = true;
        driverInfo = {
          id: rideDetails.creator_user_id,
          name: isUserTheDriver ? 'You (Driver)' : (rideDetails.creator_name || 'Driver'),
          rating: 4.5,
          carType: rideDetails.car_type || 'Unknown',
          accepted: true,
        };
      } else if (driverType === 'company') {
        // Company driver requested
        if (rideDriverStatus === 'accepted' && assignedDriverId) {
          hasAcceptedDriver = true;
          driverInfo = {
            id: assignedDriverId,
            name: 'Company Driver', // In real app, get driver name
            rating: 4.5,
            carType: rideDetails.car_type || 'Unknown',
            accepted: true,
          };
        } else {
          hasAcceptedDriver = false;
          driverInfo = {
            id: '',
            name: 'Waiting for driver acceptance...',
            rating: undefined,
            carType: rideDetails.car_type || 'Unknown',
            accepted: false,
          };
        }
      }
      
      // Create consistent ride status object
      const rideInfo: RideStatus = {
        status: driverStatus?.status || rideDetails.status || 'unknown',
        driver: driverInfo,
        passengers,
        fare: rideDetails.fare || 0,
        distance: rideDetails.distance || 0,
        is_driver: isUserTheDriver,
        creator_user_id: rideDetails.creator_user_id,
        pickup_location: {
          address: rideDetails.pickup_location?.address || 'Unknown pickup location',
          coordinates: rideDetails.pickup_location?.coordinates || { latitude: 0, longitude: 0 }
        },
        dropoff_location: { 
          address: rideDetails.dropoff_location?.address || 'Unknown dropoff location' 
        },
        dropoffTime: rideDetails.dropoffTime || 'TBD',
      };

      setRideStatus(rideInfo);
      setDriverEta(driverStatus?.eta_minutes || null);

      // Load route order
      if (rideInfo.is_driver && rideInfo.pickup_location.coordinates) {
        try {
          const route = await RideService.getRideRoute(rideId, {
            latitude: rideInfo.pickup_location.coordinates.latitude,
            longitude: rideInfo.pickup_location.coordinates.longitude,
          });
          setRouteOrder(route || []);
        } catch (err) {
          console.log('Failed to load route', err);
          setRouteOrder(passengers);
        }
      } else {
        setRouteOrder(passengers);
      }
    } catch (error) {
      console.error('Error loading ride status:', error);
      Alert.alert('Error', 'Failed to load ride status.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImHere = async () => {
    try {
      setIsLoading(true);

      await RideService.setArrivalStatus(rideId, true);
      await loadRideStatus();

      Alert.alert('Success', 'Your arrival has been confirmed!');
    } catch (error) {
      console.error('Error setting arrival status:', error);
      Alert.alert('Error', 'Failed to update arrival status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactDriver = () => {
    if (!rideStatus || !rideStatus.driver.accepted || !rideStatus.driver.id) return;
    
    navigation.navigate('Chat', {
      userId: rideStatus.driver.id,
      name: rideStatus.driver.name,
    } as any);
  };

  const handleContactPassengers = () => {
    if (!rideStatus || rideStatus.passengers.length === 0) return;
    
    // For simplicity, navigate to chat with the first passenger
    // In a real app, you might want to show a list to choose from
    const firstPassenger = rideStatus.passengers[0];
    navigation.navigate('Chat', {
      userId: firstPassenger.user_id,
      name: firstPassenger.name,
    } as any);
  };

const handleEmergency = () => {
    navigation.navigate('Report');
  };

  const handleCancelRide = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              await RideService.cancelRide(rideId);
              
              Alert.alert('Ride Cancelled', 'Your ride has been cancelled successfully.', [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('Homepage' as never),
                },
              ]);
            } catch (error) {
              console.error('Error cancelling ride:', error);
              Alert.alert('Error', 'Failed to cancel ride. Please try again.');
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEndRide = () => {
    Alert.alert(
      'End Ride',
      'Are you sure you want to end this ride?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End Ride',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              await RideService.completeRide(rideId);
              
              navigation.replace('RideDetails', { rideId });
            } catch (error) {
              console.error('Error ending ride:', error);
              Alert.alert('Error', 'Failed to end ride. Please try again.');
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading && !rideStatus) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#113a78" />
      </SafeAreaView>
    );
  }

  if (!rideStatus) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Ride information not found</Text>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Homepage' as never)}
        >
          <Text style={styles.homeButtonText}>Go to Homepage</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            {rideStatus.status === 'preparing' ? 'Preparing to start' :
              rideStatus.status === 'picking_up' ? 'Picking up passengers' :
              rideStatus.status === 'in_progress' ? 'Ride in progress' :
              'Ride completed'}
          </Text>
        </View>

        {/* Driver/Ride Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.driverInfo}>
            <View style={styles.driverImageContainer}>
              <Image
                source={require('../assets/images/Blue Profule icon.png')}
                style={styles.driverImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{rideStatus.driver.name}</Text>
              {rideStatus.driver.accepted && rideStatus.driver.rating && (
                <View style={styles.ratingContainer}>
                  <Image
                    source={require('../assets/images/Yellow Star Icon.png')}
                    style={styles.starIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.ratingText}>{rideStatus.driver.rating}</Text>
                </View>
              )}
              <Text style={styles.carType}>{rideStatus.driver.carType || 'Unknown'}</Text>
            </View>
          </View>

          <View style={styles.rideDetailsCard}>
            <View style={styles.rideDetailRow}>
              <View style={styles.rideDetailIconContainer}>
                <Image
                  source={require('../assets/images/Location Icon.png')}
                  style={styles.rideDetailIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.rideDetailTextContainer}>
                <Text style={styles.rideDetailLabel}>From</Text>
                <Text style={styles.rideDetailValue}>{rideStatus.pickup_location.address}</Text>
              </View>
            </View>

            <View style={styles.rideDetailRow}>
              <View style={styles.rideDetailIconContainer}>
                <Image
                  source={require('../assets/images/Location Icon.png')}
                  style={styles.rideDetailIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.rideDetailTextContainer}>
                <Text style={styles.rideDetailLabel}>To</Text>
                <Text style={styles.rideDetailValue}>{rideStatus.dropoff_location.address}</Text>
              </View>
            </View>

            <View style={styles.rideDetailRow}>
              <View style={styles.rideDetailIconContainer}>
                <Image
                  source={require('../assets/images/Blue time Icon.png')}
                  style={styles.rideDetailIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.rideDetailTextContainer}>
                <Text style={styles.rideDetailLabel}>Driver ETA</Text>
                <Text style={styles.rideDetailValue}>{driverEta !== null ? `${driverEta} min` : 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.rideDetailRow}>
              <View style={styles.rideDetailIconContainer}>
                <Image
                  source={require('../assets/images/Blue time Icon.png')}
                  style={styles.rideDetailIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.rideDetailTextContainer}>
                <Text style={styles.rideDetailLabel}>Dropoff Time (Est.)</Text>
                <Text style={styles.rideDetailValue}>{rideStatus.dropoffTime || 'TBD'}</Text>
              </View>
            </View>

            <View style={styles.rideDetailRow}>
              <View style={styles.rideDetailIconContainer}>
                <Image
                  source={require('../assets/images/Blue Fare Icon.png')}
                  style={styles.rideDetailIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.rideDetailTextContainer}>
                <Text style={styles.rideDetailLabel}>Fare</Text>
                <Text style={styles.rideDetailValue}>{rideStatus.fare} Rs.</Text>
              </View>
            </View>

            <View style={styles.rideDetailRow}>
              <View style={styles.rideDetailIconContainer}>
                <Image
                  source={require('../assets/images/icon.png')}
                  style={styles.rideDetailIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.rideDetailTextContainer}>
                <Text style={styles.rideDetailLabel}>Distance</Text>
                <Text style={styles.rideDetailValue}>{rideStatus.distance} km</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Passengers Section */}
        <View style={styles.passengersSection}>
          <Text style={styles.sectionTitle}>Passengers</Text>
          {routeOrder.map((passenger) => (
            <View key={passenger.user_id} style={styles.passengerCard}>
              <View style={styles.passengerInfo}>
                <View style={styles.passengerImageContainer}>
                  <Image
                    source={require('../assets/images/Blue Profule icon.png')}
                    style={styles.passengerImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.passengerDetails}>
                  <Text style={styles.passengerName}>{passenger.name || 'Unknown Passenger'}</Text>
                  <Text style={styles.passengerLocation}>{passenger.pickup_location?.address || 'Unknown location'}</Text>
                </View>
              </View>
              <View style={styles.passengerStatus}>
                <Text style={[
                  styles.passengerStatusText,
                  passenger.has_arrived ? styles.arrivedText : styles.pendingText
                ]}>
                  {passenger.has_arrived ? 'Arrived' : 'Pending'}
                </Text>
                {rideStatus.is_driver && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(passenger.pickup_location?.address || '')}`)}
                  >
                    <Text style={styles.navigateText}>Navigate</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!rideStatus.is_driver && (
            <TouchableOpacity
              style={styles.imHereButton}
              onPress={handleImHere}
              disabled={isLoading}
            >
              <Text style={styles.imHereButtonText}>I'm Here</Text>
            </TouchableOpacity>
          )}

          {/* Contact Driver Button - Only show for passengers when driver is accepted */}
          {!rideStatus.is_driver && rideStatus.driver.accepted && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleContactDriver}
              disabled={isLoading}
            >
              <Text style={styles.contactButtonText}>Contact Driver</Text>
            </TouchableOpacity>
          )}

          {/* Contact Passengers Button - Only show for drivers when there are passengers */}
          {rideStatus.is_driver && rideStatus.passengers.length > 0 && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleContactPassengers}
              disabled={isLoading}
            >
              <Text style={styles.contactButtonText}>Contact Passengers</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={handleEmergency}
            disabled={isLoading}
          >
            <Text style={styles.emergencyButtonText}>Emergency</Text>
          </TouchableOpacity>

          {/* Cancel Ride Button - Only show for ride creator */}
          {rideStatus.is_driver && rideStatus.status !== 'in_progress' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelRide}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel Ride</Text>
            </TouchableOpacity>
          )}

          {rideStatus.is_driver && (
            <TouchableOpacity
              style={styles.endRideButton}
              onPress={handleEndRide}
              disabled={isLoading}
            >
              <Text style={styles.endRideButtonText}>End Ride</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#113a78" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fefefe',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fefefe',
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '500',
    color: '#c60000',
    marginBottom: 20,
    textAlign: 'center',
  },
  homeButton: {
    backgroundColor: '#113a78',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  homeButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  statusBar: {
    backgroundColor: '#113a78',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  infoCard: {
    backgroundColor: '#f0f6ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  driverImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e6effc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverImage: {
    width: 30,
    height: 30,
  },
  driverDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  driverName: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  starIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  ratingText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#113a78',
  },
  carType: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#5a87c9',
  },
  rideDetailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
  },
  rideDetailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  rideDetailIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rideDetailIcon: {
    width: 20,
    height: 20,
  },
  rideDetailTextContainer: {
    flex: 1,
  },
  rideDetailLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#666',
  },
  rideDetailValue: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#113a78',
  },
  passengersSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 12,
  },
  passengerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  passengerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  passengerImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6effc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  passengerImage: {
    width: 20,
    height: 20,
  },
  passengerDetails: {
    justifyContent: 'center',
    flex: 1,
  },
  passengerName: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#113a78',
  },
  passengerLocation: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#666',
  },
  passengerStatus: {
    paddingHorizontal: 8,
  },
  passengerStatusText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  arrivedText: {
    backgroundColor: '#e0f7e0',
    color: '#519e15',
  },
  pendingText: {
    backgroundColor: '#fff0e0',
    color: '#ff9020',
  },
  actionButtons: {
    marginBottom: 24,
  },
  imHereButton: {
    backgroundColor: '#519e15',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  imHereButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  contactButton: {
    backgroundColor: '#113a78',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  contactButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  emergencyButton: {
    backgroundColor: '#c60000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  emergencyButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    backgroundColor: '#e6e6e6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#c60000',
  },
  endRideButton: {
    backgroundColor: '#ff9020',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  endRideButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  navigateText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#ff9020',
    marginTop: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RideStarted;