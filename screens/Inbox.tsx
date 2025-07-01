// screens/Inbox.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput, // Added TextInput for search
} from 'react-native';
import { useAppNavigation } from '../navigationUtils';
import Navbar from '../components/Navbar';
import { MessagingService, Conversation } from '../services/messaging';
import { friendsService, FriendForMessaging, FriendRequest } from '../services/friends';

const Inbox: React.FC = () => {
  const navigation = useAppNavigation();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<FriendForMessaging[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]); // State for filtered list
  const [filteredFriends, setFilteredFriends] = useState<FriendForMessaging[]>([]);
  const [searchText, setSearchText] = useState<string>(''); // State for search query
  const [activeTab, setActiveTab] = useState<'conversations' | 'friends' | 'requests'>('conversations');
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!isRefreshing) setIsLoading(true);
    setError(null);

    try {
      const data = await MessagingService.getConversations();
      setConversations(data);
      // Initially, filtered list is the same as the full list
      // Apply current search text if any exists (e.g., after refresh)
      filterConversations(searchText, data);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load conversations.';
      setError(errorMsg);
      console.error('Error loading conversations:', error);
      setConversations([]); // Clear conversations on error
      setFilteredConversations([]); // Clear filtered conversations on error
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing, searchText]); // Added searchText dependency

  const loadFriendsForMessaging = useCallback(async () => {
    try {
      const data = await friendsService.getFriendsForMessaging();
      setFriends(data.friends);
      filterFriends(searchText, data.friends);
    } catch (error) {
      console.error('Error loading friends for messaging:', error);
      setFriends([]);
      setFilteredFriends([]);
    }
  }, [searchText]);

  const loadFriendRequests = useCallback(async () => {
    try {
      const data = await friendsService.getFriendRequests();
      setFriendRequests(data.received_requests);
    } catch (error) {
      console.error('Error loading friend requests:', error);
      setFriendRequests([]);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    loadFriendsForMessaging();
    loadFriendRequests();
  }, [loadConversations, loadFriendsForMessaging, loadFriendRequests]);

  const onRefresh = () => {
    setIsRefreshing(true);
    setSearchText(''); // Optionally clear search on refresh
    loadConversations();
    loadFriendsForMessaging();
    loadFriendRequests();
  };

  // Function to filter conversations based on search text
  const filterConversations = (text: string, sourceData: Conversation[]) => {
    setSearchText(text);
    if (!text.trim()) {
      setFilteredConversations(sourceData); // Show all if search is empty
    } else {
      const filtered = sourceData.filter((conv) =>
        conv.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  };

  // Function to filter friends based on search text
  const filterFriends = (text: string, sourceData: FriendForMessaging[]) => {
    if (!text.trim()) {
      setFilteredFriends(sourceData);
    } else {
      const filtered = sourceData.filter((friend) =>
        friend.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  };

  // Handler for search input changes
  const handleSearchChange = (text: string) => {
    filterConversations(text, conversations); // Filter the original list
    filterFriends(text, friends); // Filter friends list too
  };

  const handleChatPress = (conversation: Conversation) => {
    navigation.navigate('Chat', {
      userId: conversation.user_id,
      name: conversation.name,
    }); // Removed 'as any' by ensuring params match RootStackParamList definition
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleChatPress(item)}
    >
      <View style={styles.profileImageContainer}>
        <Image
          source={require('../assets/images/Blue Profule icon.png')} // Placeholder profile icon
          style={styles.profileImage}
          resizeMode="contain"
        />
        {item.unread && <View style={styles.unreadIndicator} />}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.userName}>{item.name}</Text>
          {/* Consider formatting the timestamp more friendly e.g., using a library like date-fns */}
          <Text style={styles.timestamp}>
             {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text
          style={[styles.lastMessage, item.unread && styles.unreadMessage]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFriendItem = ({ item }: { item: FriendForMessaging }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => navigation.navigate('Chat', { userId: item.user_id, name: item.name })}
    >
      <View style={styles.profileImageContainer}>
        <Image
          source={require('../assets/images/Blue Profule icon.png')}
          style={styles.profileImage}
          resizeMode="contain"
        />
        {item.unread_count > 0 && <View style={styles.unreadIndicator} />}
        {!item.has_conversation && <View style={styles.newFriendIndicator} />}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text
          style={[styles.lastMessage, item.unread_count > 0 && styles.unreadMessage]}
          numberOfLines={1}
        >
          {item.last_message}
        </Text>
        {item.unread_count > 0 && (
          <View style={styles.unreadCountBadge}>
            <Text style={styles.unreadCountText}>{item.unread_count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFriendRequestItem = ({ item }: { item: FriendRequest }) => (
    <View style={styles.friendRequestItem}>
      <View style={styles.profileImageContainer}>
        <Image
          source={require('../assets/images/Blue Profule icon.png')}
          style={styles.profileImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.userName}>{item.sender_name}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.lastMessage}>Friend request</Text>
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => handleFriendRequestResponse(item.id, 'accepted')}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.declineButton}
          onPress={() => handleFriendRequestResponse(item.id, 'declined')}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleFriendRequestResponse = async (requestId: string, response: 'accepted' | 'declined') => {
    try {
      await friendsService.respondToFriendRequest(requestId, response);
      loadFriendRequests(); // Reload friend requests
      if (response === 'accepted') {
        loadFriendsForMessaging(); // Reload friends if accepted
      }
    } catch (error) {
      console.error('Error responding to friend request:', error);
    }
  };

  const renderEmptyState = () => {
    if (isLoading && !isRefreshing) return null; // Don't show empty state while initially loading

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadConversations}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Different empty states for different tabs
    if (activeTab === 'conversations') {
      if (searchText && filteredConversations.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No results found for "{searchText}"</Text>
            <Text style={styles.emptySubtext}>Try searching for a different name.</Text>
          </View>
        );
      }

      if (!searchText && conversations.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>Your messages with carpool companions will appear here</Text>
          </View>
        );
      }
    } else if (activeTab === 'friends') {
      if (searchText && filteredFriends.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No friends found for "{searchText}"</Text>
          </View>
        );
      }

      if (!searchText && friends.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No friends yet</Text>
            <Text style={styles.emptySubtext}>Add friends to start conversations</Text>
          </View>
        );
      }
    } else if (activeTab === 'requests') {
      if (friendRequests.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No friend requests</Text>
          </View>
        );
      }
    }

    return null;
  };

  const renderTabButton = (tab: 'conversations' | 'friends' | 'requests', title: string, badge?: number) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
        {title}
      </Text>
      {badge !== undefined && badge > 0 && (
        <View style={styles.tabBadge}>
          <Text style={styles.tabBadgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'conversations':
        return (
          <FlatList
            data={filteredConversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.conversationList,
              filteredConversations.length === 0 && styles.emptyList
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
          />
        );
      
      case 'friends':
        return (
          <FlatList
            data={filteredFriends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.user_id}
            contentContainerStyle={[
              styles.conversationList,
              filteredFriends.length === 0 && styles.emptyList
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
          />
        );
      
      case 'requests':
        return (
          <FlatList
            data={friendRequests}
            renderItem={renderFriendRequestItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.conversationList,
              friendRequests.length === 0 && styles.emptyList
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
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
        <Text style={styles.title}>Messages</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton('conversations', 'Chats', filteredConversations.length)}
        {renderTabButton('friends', 'Friends', friends.length)}
        {renderTabButton('requests', 'Requests', friendRequests.length)}
      </View>

      {/* Search Bar - only show for conversations and friends tabs */}
      {(activeTab === 'conversations' || activeTab === 'friends') && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name..."
            placeholderTextColor="#aaa"
            value={searchText}
            onChangeText={handleSearchChange}
          />
        </View>
      )}

      {/* Tab Content */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#113a78" />
        </View>
      ) : (
        renderTabContent()
      )}

      {/* Navbar */}
      <Navbar currentRoute="Inbox" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  header: {
    paddingTop: 15,
    paddingBottom: 5, // Reduced bottom padding
    alignItems: 'center',
    marginTop: 30,
    // Removed borderBottom here, maybe add to search container if needed
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '600',
    color: '#113a78',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1, // Added border here
    borderBottomColor: '#e6e6e6',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    fontFamily: 'Inter',
    fontSize: 14,
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
    paddingHorizontal: 30,
    marginTop: 50, // Add some margin from the top
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#113a78',
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  conversationList: {
    paddingTop: 10, // Add padding top to separate from search
    paddingBottom: 120, // Add padding for navbar
  },
  emptyList: {
    flexGrow: 1, // Ensure empty container takes space
  },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: 15, // Use horizontal padding
    paddingVertical: 12,   // Use vertical padding
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
    alignItems: 'center', // Align items vertically
  },
  profileImageContainer: {
    position: 'relative',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e6effc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileImage: {
    width: 30,
    height: 30,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff9020',
    borderWidth: 2,
    borderColor: '#fefefe',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Align name and timestamp
    marginBottom: 5,
  },
  userName: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#113a78',
  },
  timestamp: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#666',
    marginLeft: 8, // Add space between name and timestamp
  },
  lastMessage: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
  },
  unreadMessage: {
    fontWeight: '500', // Use 500 for semi-bold
    color: '#333', // Darker color for unread
  },
  newFriendIndicator: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff9020',
    borderWidth: 2,
    borderColor: '#fefefe',
  },
  unreadCountBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff9020',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCountText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  friendRequestItem: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
    alignItems: 'center',
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  acceptButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    marginRight: 10,
  },
  declineButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#F44336',
    borderRadius: 5,
  },
  acceptButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  declineButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#e6e6e6',
  },
  activeTabButton: {
    borderBottomColor: '#113a78',
  },
  tabButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#113a78',
  },
  activeTabButtonText: {
    fontWeight: '600',
  },
  tabBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff9020',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  tabBadgeText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});

export default Inbox;