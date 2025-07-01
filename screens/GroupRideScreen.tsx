// screens/GroupRideScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GroupRideService, GroupRideDetails } from '../services/groupRide';

const GroupRideScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupRideId } = route.params as { groupRideId: string };
  
  const [groupDetails, setGroupDetails] = useState<GroupRideDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    loadGroupDetails();
  }, [groupRideId]);

  const loadGroupDetails = async () => {
    try {
      setIsLoading(true);
      const response = await GroupRideService.getGroupDetails(groupRideId);
      if (response.success) {
        setGroupDetails(response.group_ride);
      } else {
        Alert.alert('Error', 'Failed to load group ride details');
      }
    } catch (error) {
      console.error('Error loading group details:', error);
      Alert.alert('Error', 'Failed to load group ride details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFareSplitChange = async (method: 'equal' | 'by_distance' | 'custom') => {
    if (!groupDetails) return;
    
    try {
      setIsUpdating(true);
      const response = await GroupRideService.setFareSplitMethod(groupRideId, { method });
      if (response.success) {
        Alert.alert('Success', 'Fare split method updated successfully');
        loadGroupDetails(); // Reload to get updated details
      } else {
        Alert.alert('Error', response.message || 'Failed to update fare split method');
      }
    } catch (error) {
      console.error('Error updating fare split:', error);
      Alert.alert('Error', 'Failed to update fare split method');
    } finally {
      setIsUpdating(false);
    }
  };

  const calculateFareSplits = async () => {
    if (!groupDetails) return;
    
    try {
      setIsUpdating(true);
      const response = await GroupRideService.calculateFareSplits(
        groupRideId, 
        groupDetails.ride_details.fare
      );
      if (response.success) {
        const splitDetails = Object.entries(response.splits)
          .map(([userId, amount]) => `User ${userId}: Rs. ${amount}`)
          .join('\n');
        
        Alert.alert(
          'Fare Split Calculation',
          `Total Fare: Rs. ${response.total_fare}\nMethod: ${response.method}\n\nSplits:\n${splitDetails}`
        );
      } else {
        Alert.alert('Error', 'Failed to calculate fare splits');
      }
    } catch (error) {
      console.error('Error calculating fare splits:', error);
      Alert.alert('Error', 'Failed to calculate fare splits');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading group ride details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!groupDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load group ride details</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadGroupDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.title}>Group Ride</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Details</Text>
          <Text style={styles.detailText}>Status: {groupDetails.status}</Text>
          <Text style={styles.detailText}>
            Members: {groupDetails.current_size}/{groupDetails.max_group_size}
          </Text>
          <Text style={styles.detailText}>
            Fare Split Method: {groupDetails.fare_split_method}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ride Information</Text>
          <Text style={styles.detailText}>
            From: {groupDetails.ride_details.pickup_location?.address || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            To: {groupDetails.ride_details.dropoff_location?.address || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            Total Fare: Rs. {groupDetails.ride_details.fare}
          </Text>
          <Text style={styles.detailText}>
            Car Type: {groupDetails.ride_details.car_type}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Members</Text>
          {groupDetails.members.map((member, index) => (
            <View key={member.id} style={styles.memberItem}>
              <Text style={styles.memberName}>
                {member.name} {member.is_leader ? '(Leader)' : ''}
              </Text>
              <Text style={styles.memberEmail}>{member.email}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fare Split Options</Text>
          <TouchableOpacity
            style={[
              styles.optionButton,
              groupDetails.fare_split_method === 'equal' && styles.selectedOption
            ]}
            onPress={() => handleFareSplitChange('equal')}
            disabled={isUpdating}
          >
            <Text style={styles.optionText}>Equal Split</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.optionButton,
              groupDetails.fare_split_method === 'by_distance' && styles.selectedOption
            ]}
            onPress={() => handleFareSplitChange('by_distance')}
            disabled={isUpdating}
          >
            <Text style={styles.optionText}>Split by Distance</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.optionButton,
              groupDetails.fare_split_method === 'custom' && styles.selectedOption
            ]}
            onPress={() => handleFareSplitChange('custom')}
            disabled={isUpdating}
          >
            <Text style={styles.optionText}>Custom Split</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.calculateButton}
          onPress={calculateFareSplits}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.calculateButtonText}>Calculate Fare Splits</Text>
          )}
        </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  memberItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
  },
  optionButton: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedOption: {
    backgroundColor: '#007AFF',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  calculateButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  calculateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default GroupRideScreen; 