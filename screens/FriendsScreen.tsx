import React, { useEffect, useState, useCallback } from 'react';
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
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { friendsService, Friend, FriendRequest, SearchResult, RideInvitation } from '../services/friends';
import Navbar from '../components/Navbar';
import { useAppNavigation } from '../navigationUtils';

const FriendCard: React.FC<{
  friend: Friend;
  onMessage: (friend: Friend) => void;
  onRemove: (friend: Friend) => void;
}> = ({ friend, onMessage, onRemove }) => {
  return (
    <View style={styles.friendCard}>
      <View style={styles.cardHeader}>
        <View style={styles.profileImageContainer}>
          <Image
            source={require('../assets/images/Blue Profule icon.png')}
            style={styles.profileImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{friend.name}</Text>
          <Text style={styles.userEmail}>{friend.email}</Text>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.messageButton} onPress={() => onMessage(friend)}>
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.removeButton} onPress={() => onRemove(friend)}>
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const FriendRequestCard: React.FC<{
  request: FriendRequest;
  type: 'received' | 'sent';
  onRespond?: (requestId: string, response: 'accepted' | 'declined') => void;
}> = ({ request, type, onRespond }) => {
  const displayName = type === 'received' ? request.sender_name : request.receiver_name;
  const displayEmail = type === 'received' ? request.sender_email : request.receiver_email;

  return (
    <View style={styles.requestCard}>
      <View style={styles.cardHeader}>
        <View style={styles.profileImageContainer}>
          <Image
            source={require('../assets/images/Blue Profule icon.png')}
            style={styles.profileImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{displayEmail}</Text>
          <Text style={styles.requestDate}>
            {type === 'received' ? 'Sent' : 'Requested'} {new Date(request.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      {type === 'received' && onRespond && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.acceptButton} 
            onPress={() => onRespond(request.id, 'accepted')}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.declineButton} 
            onPress={() => onRespond(request.id, 'declined')}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {type === 'sent' && (
        <View style={styles.buttonContainer}>
          <Text style={styles.pendingText}>Pending...</Text>
        </View>
      )}
    </View>
  );
};

const SearchUserCard: React.FC<{
  user: SearchResult;
  onAddFriend: (userId: string) => void;
}> = ({ user, onAddFriend }) => {
  return (
    <View style={styles.searchCard}>
      <View style={styles.cardHeader}>
        <View style={styles.profileImageContainer}>
          <Image
            source={require('../assets/images/Blue Profule icon.png')}
            style={styles.profileImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => onAddFriend(user.user_id)}
        >
          <Text style={styles.addButtonText}>Add Friend</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const RideInvitationCard: React.FC<{
  invitation: RideInvitation;
  onRespond: (invitationId: string, response: 'accepted' | 'declined') => void;
}> = ({ invitation, onRespond }) => {
  return (
    <View style={styles.invitationCard}>
      <View style={styles.cardContent}>
        <Text style={styles.inviterName}>{invitation.inviter_name} invited you to a ride</Text>
        <Text style={styles.rideDetails}>
          From: {invitation.ride_from} → To: {invitation.ride_to}
        </Text>
        <Text style={styles.rideTime}>
          {invitation.ride_date} at {invitation.ride_time}
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.acceptButton} 
          onPress={() => onRespond(invitation.id, 'accepted')}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.declineButton} 
          onPress={() => onRespond(invitation.id, 'declined')}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const FriendsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search' | 'invitations'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<{ received: FriendRequest[]; sent: FriendRequest[] }>({ received: [], sent: [] });
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [rideInvitations, setRideInvitations] = useState<RideInvitation[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  const navigation = useAppNavigation();

  const loadFriends = useCallback(async () => {
    try {
      const data = await friendsService.getFriendsList();
      setFriends(data.friends);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  }, []);

  const loadFriendRequests = useCallback(async () => {
    try {
      const data = await friendsService.getFriendRequests();
      setFriendRequests({
        received: data.received_requests,
        sent: data.sent_requests
      });
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  }, []);

  const loadRideInvitations = useCallback(async () => {
    try {
      const data = await friendsService.getRideInvitations();
      setRideInvitations(data.invitations);
    } catch (error) {
      console.error('Error loading ride invitations:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!isRefreshing) setIsLoading(true);
    
    try {
      await Promise.all([
        loadFriends(),
        loadFriendRequests(),
        loadRideInvitations()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing, loadFriends, loadFriendRequests, loadRideInvitations]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleSearch = async (text: string) => {
    setSearchText(text);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await friendsService.searchUsers(text);
      setSearchResults(data.results);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      await friendsService.sendFriendRequest(userId);
      Alert.alert('Success', 'Friend request sent!');
      // Remove from search results
      setSearchResults(prev => prev.filter(user => user.user_id !== userId));
      // Reload friend requests to show the sent request
      loadFriendRequests();
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const handleRespondToFriendRequest = async (requestId: string, response: 'accepted' | 'declined') => {
    try {
      await friendsService.respondToFriendRequest(requestId, response);
      Alert.alert('Success', `Friend request ${response}!`);
      // Reload data to reflect changes
      loadData();
    } catch (error) {
      console.error('Error responding to friend request:', error);
      Alert.alert('Error', `Failed to ${response} friend request`);
    }
  };

  const handleRemoveFriend = (friend: Friend) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.name} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendsService.removeFriend(friend.user_id);
              Alert.alert('Success', 'Friend removed');
              loadFriends();
            } catch (error) {
              console.error('Error removing friend:', error);
              Alert.alert('Error', 'Failed to remove friend');
            }
          }
        }
      ]
    );
  };

  const handleMessageFriend = (friend: Friend) => {
    navigation.navigate('Chat', { 
      userId: friend.user_id, 
      name: friend.name 
    });
  };

  const handleRespondToRideInvitation = async (invitationId: string, response: 'accepted' | 'declined') => {
    try {
      await friendsService.respondToRideInvitation(invitationId, response);
      Alert.alert('Success', `Ride invitation ${response}!`);
      loadRideInvitations();
    } catch (error) {
      console.error('Error responding to ride invitation:', error);
      Alert.alert('Error', `Failed to ${response} ride invitation`);
    }
  };

  const renderTabContent = () => {
    if (isLoading && !isRefreshing) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#113a78" />
        </View>
      );
    }

    switch (activeTab) {
      case 'friends':
        return (
          <FlatList
            data={friends}
            renderItem={({ item }) => (
              <FriendCard
                friend={item}
                onMessage={handleMessageFriend}
                onRemove={handleRemoveFriend}
              />
            )}
            keyExtractor={(item) => item.friendship_id}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No friends yet</Text>
                <Text style={styles.emptySubtext}>Search for users to add as friends</Text>
              </View>
            }
          />
        );

      case 'requests':
        return (
          <ScrollView
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          >
            <Text style={styles.sectionTitle}>Received Requests</Text>
            {friendRequests.received.length > 0 ? (
              friendRequests.received.map((request) => (
                <FriendRequestCard
                  key={request.id}
                  request={request}
                  type="received"
                  onRespond={handleRespondToFriendRequest}
                />
              ))
            ) : (
              <Text style={styles.noRequestsText}>No pending requests</Text>
            )}

            <Text style={styles.sectionTitle}>Sent Requests</Text>
            {friendRequests.sent.length > 0 ? (
              friendRequests.sent.map((request) => (
                <FriendRequestCard
                  key={request.id}
                  request={request}
                  type="sent"
                />
              ))
            ) : (
              <Text style={styles.noRequestsText}>No sent requests</Text>
            )}
          </ScrollView>
        );

      case 'search':
        return (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search users by name or email..."
              placeholderTextColor="#aaa"
              value={searchText}
              onChangeText={handleSearch}
            />
            
            {isSearching ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#113a78" />
              </View>
            ) : (
              <FlatList
                data={searchResults}
                renderItem={({ item }) => (
                  <SearchUserCard
                    user={item}
                    onAddFriend={handleSendFriendRequest}
                  />
                )}
                keyExtractor={(item) => item.user_id}
                ListEmptyComponent={
                  searchText.length >= 2 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No users found</Text>
                    </View>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>Search for users</Text>
                      <Text style={styles.emptySubtext}>Type at least 2 characters to search</Text>
                    </View>
                  )
                }
              />
            )}
          </View>
        );

      case 'invitations':
        return (
          <FlatList
            data={rideInvitations}
            renderItem={({ item }) => (
              <RideInvitationCard
                invitation={item}
                onRespond={handleRespondToRideInvitation}
              />
            )}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No ride invitations</Text>
                <Text style={styles.emptySubtext}>Friends can invite you to rides</Text>
              </View>
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
        <Text style={styles.title}>Friends</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests
          </Text>
          {(friendRequests.received.length > 0) && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{friendRequests.received.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
            Search
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'invitations' && styles.activeTab]}
          onPress={() => setActiveTab('invitations')}
        >
          <Text style={[styles.tabText, activeTab === 'invitations' && styles.activeTabText]}>
            Invites
          </Text>
          {rideInvitations.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{rideInvitations.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {renderTabContent()}
      </View>

      <Navbar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#113a78',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#113a78',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
  },
  activeTabText: {
    color: '#113a78',
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invitationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardContent: {
    marginBottom: 12,
  },
  profileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileImage: {
    width: 30,
    height: 30,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6c757d',
  },
  requestDate: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  inviterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  rideDetails: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
  rideTime: {
    fontSize: 14,
    color: '#6c757d',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  removeButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  acceptButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  declineButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  declineButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pendingText: {
    color: '#6c757d',
    fontSize: 14,
    fontStyle: 'italic',
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#113a78',
    marginTop: 20,
    marginBottom: 12,
  },
  noRequestsText: {
    color: '#6c757d',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6c757d',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
  },
});

export default FriendsScreen; 