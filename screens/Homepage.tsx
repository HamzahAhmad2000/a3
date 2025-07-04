// screens/Homepage.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Dimensions,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useAppNavigation } from '../navigationUtils';
import { useNavigation } from '@react-navigation/native';
import { AuthService } from '../services/auth';
import { UserService } from '../services/user';
import { RideService } from '../services/ride';
import Navbar from '../components/Navbar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get the device screen width for responsive sizing
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define color constants
const COLORS = {
  background: '#fefefe',
  primaryBlue: '#113a78',
  green: '#519e15',
  red: '#c60000',
  lightBlue: '#519e15',
  orange: '#ff9020',
};

// Reusable Dashboard Card Button Component
const DashboardCardButton = ({
  backgroundColor,
  title,
  iconSource,
  onPress,
}: {
  backgroundColor: string;
  title: string;
  iconSource: any;
  onPress: () => void;
}) => (
  <TouchableOpacity style={[styles.card, { backgroundColor }]} onPress={onPress}>
    <View style={styles.cardIconContainer}>
      <Image style={styles.cardIcon} source={iconSource} resizeMode="contain" />
    </View>
    <Text style={styles.cardTitle}>{title}</Text>
  </TouchableOpacity>
);

// Available Rides Component
const AvailableRidesSection = ({ rides, onPressRide }: any) => {
  // Defensive programming: ensure rides is always an array
  const safeRides = Array.isArray(rides) ? rides : [];
  
  if (safeRides.length === 0) {
    return (
      <View style={styles.emptyRidesContainer}>
        <Text style={styles.emptyRidesText}>No available rides in your area</Text>
      </View>
    );
  }

  return (
    <View style={styles.availableRidesContainer}>
      <FlatList
        data={safeRides.slice(0, 3)} // Show only first 3 rides
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.rideCard}
            onPress={() => onPressRide(item)}
          >
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
          </TouchableOpacity>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rideListContent}
      />
      <TouchableOpacity 
        style={styles.viewAllButton}
        onPress={() => onPressRide('viewAll')}
      >
        <Text style={styles.viewAllText}>View All Available Rides</Text>
      </TouchableOpacity>
    </View>
  );
};

const Homepage: React.FC = () => {
  const navigation = useAppNavigation();
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('user');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [availableRides, setAvailableRides] = useState<any[]>([]);
  const [isLoadingRides, setIsLoadingRides] = useState<boolean>(true);

  useEffect(() => {
    // Load user information when component mounts
    const fetchUserInfo = async () => {
      try {
        const { userName, userRole } = await AuthService.getUserInfo();
        if (userName) {
          setUserName(userName);
        }
        if (userRole) {
          setUserRole(userRole);
          console.log('✅ User role from AuthService:', userRole);
        }
        
        // Fetch user profile to get additional information and verify role
        try {
          const profile = await UserService.getProfile();
          if (profile) {
            if (profile.name && !userName) {
              setUserName(profile.name);
            }
            // Update role if profile has a different role (backend is source of truth)
            if (profile.role && profile.role !== userRole) {
              setUserRole(profile.role);
              // Update stored role in AsyncStorage
              await AsyncStorage.setItem('userRole', profile.role);
              console.log('✅ Updated user role from profile:', profile.role);
            }
          }
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError);
          // If profile fetch fails, still set default values
          if (!userName) {
            setUserName('User');
          }
          // Keep the role from AuthService if profile fetch fails
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        setUserName('User');
        setUserRole('user');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
    fetchAvailableRides();
  }, []);

  const fetchAvailableRides = async () => {
    setIsLoadingRides(true);
    try {
      // Get rides in the user's sector (G8 by default)
      const response = await RideService.getAvailableRides('G8');
      setAvailableRides(response.rides || []); // Extract rides array from response
    } catch (error) {
      // Error is already handled by the service layer with fallback data
      // Just log for development and continue with whatever data we received
      console.log('📦 Using fallback ride data');
      setAvailableRides([]); // Set empty array as final fallback
    } finally {
      setIsLoadingRides(false);
    }
  };

  // Updated handler for wallet press
  const handleWalletPress = () => {
    // Navigate to wallet screen
    navigation.navigate('Wallet' as never);
  };
  
  const handleRideHistoryPress = () => {
    navigation.navigate('RideList' as never);
  };
  
  const handleFindRidePress = () => {
    navigation.navigate('JoinRide' as never);
  };
  
  const handleReportPress = () => {
    navigation.navigate('Report' as never);
  };

  const handleCreateRidePress = () => {
    navigation.navigate('CreateTripStep1' as never);
  };

  const handleDriverApplicationPress = () => {
    navigation.navigate('DriverApplication' as never);
  };

  const handleFriendsPress = () => {
    navigation.navigate('Friends' as never);
  };

  const handleEmergencyPress = () => {
    navigation.navigate('Emergency' as never);
  };

  const handleAdminDashboardPress = () => {
    navigation.navigate('AdminDashboard' as never);
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings' as never);
  };

  const handleRidePress = (ride: any) => {
    if (ride === 'viewAll') {
      navigation.navigate('JoinRide');
    } else {
      navigation.navigate('JoinRideConfirm', { rideId: ride.ride_id });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.appContainer}>
          {/* Greetings */}
          <View style={styles.headerRow}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Good Morning, {userName}</Text>
              <Text style={styles.subGreeting}>
                Hope you have a nice journey today.
              </Text>
            </View>
            <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
              <Text style={styles.settingsButtonText}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search rides or users..."
              placeholderTextColor="#aaa"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* Create Ride Button */}
          <TouchableOpacity 
            style={styles.createRideButton} 
            onPress={handleCreateRidePress}
          >
            <Image
              source={require('../assets/images/White Ride Button.png')}
              style={styles.createRideIcon}
              resizeMode="contain"
            />
            <Text style={styles.createRideText}>Create a New Ride</Text>
          </TouchableOpacity>

          {/* Available Rides Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Available Rides Near You</Text>
            {isLoadingRides ? (
              <ActivityIndicator size="small" color={COLORS.primaryBlue} style={styles.ridesLoader} />
            ) : (
              <AvailableRidesSection 
                rides={availableRides} 
                onPressRide={handleRidePress} 
              />
            )}
          </View>

          {/* Dashboard Cards */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.cardsContainer}>
              <View style={styles.cardsRow}>
                <DashboardCardButton
                  backgroundColor={COLORS.green}
                  title="Wallet"
                  iconSource={require('../assets/images/White Wallet Icon.png')}
                  onPress={handleWalletPress}
                />
                <DashboardCardButton
                  backgroundColor={COLORS.lightBlue}
                  title="Ride History"
                  iconSource={require('../assets/images/White Ride History Icon.png')}
                  onPress={handleRideHistoryPress}
                />
              </View>
              <View style={styles.cardsRow}>
                <DashboardCardButton
                  backgroundColor={COLORS.primaryBlue}
                  title="Find a Ride"
                  iconSource={require('../assets/images/White Search Icon.png')}
                  onPress={handleFindRidePress}
                />
                <DashboardCardButton
                  backgroundColor={COLORS.red}
                  title="Report"
                  iconSource={require('../assets/images/White Report Icon.png')}
                  onPress={handleReportPress}
                />
              </View>
              <View style={styles.cardsRow}>
                <DashboardCardButton
                  backgroundColor="#4CAF50"
                  title="Friends"
                  iconSource={require('../assets/images/White Search Icon.png')}
                  onPress={handleFriendsPress}
                />
                <DashboardCardButton
                  backgroundColor="#FF9800"
                  title="Become Driver"
                  iconSource={require('../assets/images/White Ride Button.png')}
                  onPress={handleDriverApplicationPress}
                />
              </View>
              <View style={styles.cardsRow}>
                <DashboardCardButton
                  backgroundColor="#9C27B0"
                  title="Emergency"
                  iconSource={require('../assets/images/White Report Icon.png')}
                  onPress={handleEmergencyPress}
                />
                {userRole === 'admin' && (
                  <DashboardCardButton
                    backgroundColor="#607D8B"
                    title="Admin Panel"
                    iconSource={require('../assets/images/White Search Icon.png')}
                    onPress={handleAdminDashboardPress}
                  />
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Navbar */}
      <Navbar currentRoute="Homepage" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  appContainer: {
    width: SCREEN_WIDTH,
    padding: 20,
    paddingBottom: 120, // Add padding for navbar
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingContainer: {
    flex: 1,
    marginTop: 30,
  },
  greeting: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.primaryBlue,
    marginBottom: 5,
  },
  subGreeting: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLORS.primaryBlue,
    marginBottom: 20,
  },
  searchContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 40,
    justifyContent: 'center',
  },
  searchInput: {
    fontSize: 14,
    color: '#000',
  },
  createRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.orange,
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 20,
  },
  createRideIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  createRideText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primaryBlue,
    marginBottom: 15,
  },
  availableRidesContainer: {
    marginBottom: 5,
  },
  rideListContent: {
    paddingRight: 15,
  },
  emptyRidesContainer: {
    backgroundColor: '#f0f6ff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyRidesText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: COLORS.primaryBlue,
  },
  rideCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginRight: 12,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primaryBlue,
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
    color: COLORS.primaryBlue,
  },
  rideDetails: {
    marginBottom: 8,
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
    alignItems: 'center',
  },
  seatsText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primaryBlue,
  },
  groupText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#ffffff',
    backgroundColor: COLORS.orange,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  viewAllButton: {
    alignItems: 'center',
    padding: 10,
  },
  viewAllText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: COLORS.primaryBlue,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  ridesLoader: {
    marginVertical: 20,
  },
  cardsContainer: {
    marginBottom: 30,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  card: {
    width: '48%',
    height: 130,
    borderRadius: 13,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardIconContainer: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    width: 25,
    height: 25,
  },
  cardTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  settingsButton: {
    padding: 5,
  },
  settingsButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Homepage;