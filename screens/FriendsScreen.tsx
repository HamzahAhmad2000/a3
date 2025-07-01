import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { friendsService, Friend, FriendRequest, SearchResult, SearchResultWithSimilarity, RideInvitation } from '../services/friends';
import Navbar from '../components/Navbar';

type TabType = 'friends' | 'requests' | 'search' | 'similarity' | 'invitations';

const FriendsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Friends data
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<{ received: FriendRequest[]; sent: FriendRequest[] }>({ received: [], sent: [] });
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [similarityResults, setSimilarityResults] = useState<SearchResultWithSimilarity[]>([]);
  const [rideInvitations, setRideInvitations] = useState<RideInvitation[]>([]);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'similarity' && similarityResults.length === 0) {
      loadSimilarityResults();
    }
  }, [activeTab]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadFriends(),
        loadFriendRequests(),
        loadRideInvitations()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadInitialData();
    setIsRefreshing(false);
  };

  const loadFriends = async () => {
    try {
      const response = await friendsService.getFriendsList();
      setFriends(response.friends);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const response = await friendsService.getFriendRequests();
      setFriendRequests({
        received: response.received_requests,
        sent: response.sent_requests
      });
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const loadRideInvitations = async () => {
    try {
      const response = await friendsService.getRideInvitations();
      setRideInvitations(response.invitations);
    } catch (error) {
      console.error('Error loading ride invitations:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await friendsService.searchUsers(searchQuery);
      setSearchResults(response.results);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSimilarityResults = async () => {
    setIsLoading(true);
    try {
      const response = await friendsService.searchUsersWithSimilarity();
      setSimilarityResults(response.results);
    } catch (error) {
      console.error('Error loading similarity results:', error);
      Alert.alert('Error', 'Failed to load similarity results');
    } finally {
      setIsLoading(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      await friendsService.sendFriendRequest(userId);
      Alert.alert('Success', 'Friend request sent!');
      await searchUsers(); // Refresh search results
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send friend request');
    }
  };

  const respondToFriendRequest = async (requestId: string, response: 'accepted' | 'declined') => {
    try {
      await friendsService.respondToFriendRequest(requestId, response);
      Alert.alert('Success', `Friend request ${response}!`);
      await loadFriendRequests();
      if (response === 'accepted') {
        await loadFriends();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to respond to friend request');
    }
  };

  const removeFriend = async (friendId: string) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendsService.removeFriend(friendId);
              Alert.alert('Success', 'Friend removed');
              await loadFriends();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove friend');
            }
          }
        }
      ]
    );
  };

  const respondToRideInvitation = async (invitationId: string, response: 'accepted' | 'declined') => {
    try {
      await friendsService.respondToRideInvitation(invitationId, response);
      Alert.alert('Success', `Ride invitation ${response}!`);
      await loadRideInvitations();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to respond to ride invitation');
    }
  };

  const renderTabButton = (tab: TabType, title: string, badge?: number) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
        {title}
      </Text>
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFriend = ({ item }: { item: Friend }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemEmail}>{item.email}</Text>
        <Text style={styles.itemDate}>Friends since: {new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.messageButton}
          onPress={() => navigation.navigate('Chat' as never, { userId: item.user_id, name: item.name })}
        >
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFriend(item.friendship_id)}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFriendRequest = ({ item }: { item: FriendRequest }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.sender_name || item.receiver_name}</Text>
        <Text style={styles.itemEmail}>{item.sender_email || item.receiver_email}</Text>
        <Text style={styles.itemDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      {item.sender_id && (
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => respondToFriendRequest(item.id, 'accepted')}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.declineButton}
            onPress={() => respondToFriendRequest(item.id, 'declined')}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemEmail}>{item.email}</Text>
      </View>
      <View style={styles.itemActions}>
        {item.can_add ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => sendFriendRequest(item.user_id)}
          >
            <Text style={styles.addButtonText}>Add Friend</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.cannotAddText}>Already friends or request sent</Text>
        )}
      </View>
    </View>
  );

  const renderSimilarityResult = ({ item }: { item: SearchResultWithSimilarity }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <View style={styles.nameScoreContainer}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={[styles.scoreContainer, { backgroundColor: getScoreColor(item.likeness_score) }]}>
            <Text style={styles.scoreText}>{item.likeness_score}</Text>
          </View>
        </View>
        <Text style={styles.itemEmail}>{item.email}</Text>
        {item.likes && (
          <Text style={styles.preferencesText}>
            <Text style={styles.preferencesLabel}>Likes: </Text>
            {item.likes}
          </Text>
        )}
        {item.dislikes && (
          <Text style={styles.preferencesText}>
            <Text style={styles.preferencesLabel}>Dislikes: </Text>
            {item.dislikes}
          </Text>
        )}
      </View>
      <View style={styles.itemActions}>
        {item.can_add ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => sendFriendRequest(item.user_id)}
          >
            <Text style={styles.addButtonText}>Add Friend</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.cannotAddText}>Already friends or request sent</Text>
        )}
      </View>
    </View>
  );

  const getScoreColor = (score: number): string => {
    if (score >= 4.5) return '#4CAF50'; // Green
    if (score >= 3.5) return '#8BC34A'; // Light Green
    if (score >= 2.5) return '#FFC107'; // Yellow
    if (score >= 1.5) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const renderRideInvitation = ({ item }: { item: RideInvitation }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>Ride from {item.inviter_name}</Text>
        <Text style={styles.itemEmail}>{item.ride_from} → {item.ride_to}</Text>
        <Text style={styles.itemDate}>{item.ride_date} at {item.ride_time}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => respondToRideInvitation(item.id, 'accepted')}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => respondToRideInvitation(item.id, 'declined')}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'friends':
        return (
          <FlatList
            data={friends}
            renderItem={renderFriend}
            keyExtractor={(item) => item.friendship_id}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No friends yet. Start by searching for users!</Text>
            }
          />
        );

      case 'requests':
        const allRequests = [...friendRequests.received, ...friendRequests.sent];
        return (
          <FlatList
            data={allRequests}
            renderItem={renderFriendRequest}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No friend requests</Text>
            }
          />
        );

      case 'search':
        return (
          <View style={{ flex: 1 }}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchUsers}
              />
              <TouchableOpacity style={styles.searchButton} onPress={searchUsers}>
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.user_id}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                searchQuery ? (
                  <Text style={styles.emptyText}>No users found</Text>
                ) : (
                  <Text style={styles.emptyText}>Enter a name or email to search for users</Text>
                )
              }
            />
          </View>
        );

      case 'similarity':
        return (
          <View style={{ flex: 1 }}>
            <View style={styles.similarityHeader}>
              <View style={styles.similarityHeaderContent}>
                <Text style={styles.similarityTitle}>Find people with similar interests</Text>
                <Text style={styles.similaritySubtitle}>Scores based on your likes and dislikes (1-5 scale)</Text>
              </View>
              <TouchableOpacity style={styles.refreshButton} onPress={loadSimilarityResults}>
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={similarityResults}
              renderItem={renderSimilarityResult}
              keyExtractor={(item) => item.user_id}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={loadSimilarityResults} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No similar users found</Text>
                  <Text style={styles.emptySubtext}>Make sure you have filled out your likes and dislikes in your profile</Text>
                </View>
              }
            />
          </View>
        );

      case 'invitations':
        return (
          <FlatList
            data={rideInvitations}
            renderItem={renderRideInvitation}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No ride invitations</Text>
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Friends</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton('friends', 'Friends', friends.length)}
        {renderTabButton('requests', 'Requests', friendRequests.received.length)}
        {renderTabButton('search', 'Search')}
        {renderTabButton('similarity', 'Similarity')}
        {renderTabButton('invitations', 'Invitations', rideInvitations.length)}
      </View>

      <View style={styles.content}>
        {isLoading && !isRefreshing ? (
          <ActivityIndicator size="large" color="#113a78" style={styles.loader} />
        ) : (
          <View style={styles.tabContentContainer}>
            {renderTabContent()}
          </View>
        )}
      </View>

      <Navbar currentRoute="Friends" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  header: {
    backgroundColor: '#fefefe',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 18,
    color: '#113a78',
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#113a78',
    textAlign: 'center',
    fontFamily: 'Inter',
    flex: 1,
  },
  headerSpacer: {
    width: 50,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#113a78',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  activeTabButtonText: {
    color: '#113a78',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  badge: {
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingBottom: 120,
  },
  tabContentContainer: {
    flex: 1,
    padding: 15,
  },
  loader: {
    marginTop: 50,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#113a78',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  itemEmail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  itemDate: {
    fontSize: 12,
    color: '#999999',
    fontFamily: 'Inter',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  messageButton: {
    backgroundColor: '#113a78',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  messageButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  removeButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  declineButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  declineButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  addButton: {
    backgroundColor: '#113a78',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  cannotAddText: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
    marginTop: 50,
    fontFamily: 'Inter',
  },
  nameScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginLeft: 5,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
  },
  preferencesText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter',
  },
  preferencesLabel: {
    fontWeight: 'bold',
  },
  similarityHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  similarityHeaderContent: {
    flex: 1,
    paddingRight: 15,
  },
  similarityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#113a78',
    fontFamily: 'Inter',
    marginBottom: 5,
  },
  similaritySubtitle: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter',
  },
  refreshButton: {
    backgroundColor: '#113a78',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  refreshButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySubtext: {
    color: '#666666',
    fontSize: 14,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
});

export default FriendsScreen;