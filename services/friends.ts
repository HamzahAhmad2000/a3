import api from './api';
import { ErrorHandler, getFallbackData } from '../utils/errorHandler';

export interface Friend {
  friendship_id: string;
  user_id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  sender_id?: string;
  receiver_id?: string;
  sender_name?: string;
  receiver_name?: string;
  sender_email?: string;
  receiver_email?: string;
  created_at: string;
  status: string;
}

export interface SearchResult {
  user_id: string;
  name: string;
  email: string;
  can_add: boolean;
}

export interface SearchResultWithSimilarity {
  user_id: string;
  name: string;
  email: string;
  likeness_score: number;
  likes: string;
  dislikes: string;
  can_add: boolean;
}

export interface FriendForMessaging {
  user_id: string;
  name: string;
  email: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  has_conversation: boolean;
  friendship_created: string;
}

export interface RideInvitation {
  id: string;
  ride_id: string;
  inviter_name: string;
  ride_from: string;
  ride_to: string;
  ride_date: string;
  ride_time: string;
  created_at: string;
}

export interface FriendRequestsResponse {
  received_requests: FriendRequest[];
  sent_requests: FriendRequest[];
}

export interface FriendsListResponse {
  friends: Friend[];
  count: number;
}

export interface SearchResponse {
  results: SearchResult[];
  count: number;
}

export interface SimilaritySearchResponse {
  results: SearchResultWithSimilarity[];
  count: number;
}

export interface InvitationsResponse {
  invitations: RideInvitation[];
  count: number;
}

export interface MessagingFriendsResponse {
  friends: FriendForMessaging[];
  count: number;
}

class FriendsService {
  // Friend Requests
  async sendFriendRequest(receiverId: string): Promise<{ message: string; request_id: string }> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.post('/friends/requests/send', {
          receiver_id: receiverId
        });
        return response.data;
      },
      { message: 'Friend request sent', request_id: 'temp_request' },
      'Send Friend Request'
    );
  }

  async getFriendRequests(): Promise<FriendRequestsResponse> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.get('/friends/requests');
        return ErrorHandler.ensureObject(response.data, {
          received_requests: [],
          sent_requests: []
        });
      },
      {
        received_requests: getFallbackData('friends').requests,
        sent_requests: []
      },
      'Get Friend Requests'
    );
  }

  async respondToFriendRequest(requestId: string, response: 'accepted' | 'declined'): Promise<{ message: string; friendship_id?: string }> {
    return ErrorHandler.withFallback(
      async () => {
        const apiResponse = await api.put(`/friends/requests/${requestId}/respond`, {
          response
        });
        return apiResponse.data;
      },
      { message: `Friend request ${response}`, friendship_id: 'temp_friendship' },
      'Respond to Friend Request'
    );
  }

  // Friends Management
  async getFriendsList(): Promise<FriendsListResponse> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.get('/friends/');
        return ErrorHandler.ensureObject(response.data, {
          friends: [],
          count: 0
        });
      },
      {
        friends: getFallbackData('friends').friends.map(friend => ({
          friendship_id: friend._id,
          user_id: friend._id,
          name: friend.name,
          email: friend.email,
          created_at: new Date().toISOString()
        })),
        count: getFallbackData('friends').friends.length
      },
      'Get Friends List'
    );
  }

  async removeFriend(friendId: string): Promise<{ message: string }> {
    return ErrorHandler.silentOperation(
      async () => {
        const response = await api.delete(`/friends/${friendId}`);
        return response.data;
      },
      { message: 'Friend removed' }
    );
  }

  async searchUsers(query: string): Promise<SearchResponse> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.get(`/friends/search?q=${encodeURIComponent(query)}`);
        return ErrorHandler.ensureObject(response.data, {
          results: [],
          count: 0
        });
      },
      {
        results: getFallbackData('friends').friends.map(friend => ({
          user_id: friend._id,
          name: friend.name,
          email: friend.email,
          can_add: true
        })),
        count: getFallbackData('friends').friends.length
      },
      'Search Users'
    );
  }

  async searchUsersWithSimilarity(): Promise<SimilaritySearchResponse> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.get('/friends/search/similarity');
        return ErrorHandler.ensureObject(response.data, {
          results: [],
          count: 0
        });
      },
      {
        results: getFallbackData('friends').friends.map(friend => ({
          user_id: friend._id,
          name: friend.name,
          email: friend.email,
          likeness_score: friend.similarity_score,
          likes: 'Traveling, music, reading',
          dislikes: 'Traffic, loud noises',
          can_add: true
        })),
        count: getFallbackData('friends').friends.length
      },
      'Search Users with Similarity'
    );
  }

  // Companions
  async getCompanionsList(): Promise<FriendsListResponse> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.get('/friends/companions');
        return ErrorHandler.ensureObject(response.data, {
          friends: [],
          count: 0
        });
      },
      {
        friends: getFallbackData('friends').friends.map(friend => ({
          friendship_id: friend._id,
          user_id: friend._id,
          name: friend.name,
          email: friend.email,
          created_at: new Date().toISOString()
        })),
        count: getFallbackData('friends').friends.length
      },
      'Get Companions List'
    );
  }

  async inviteCompanionToRide(companionId: string, rideId: string): Promise<{ message: string; invitation_id: string }> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.post('/friends/companions/invite', {
          companion_id: companionId,
          ride_id: rideId
        });
        return response.data;
      },
      { message: 'Invitation sent', invitation_id: 'temp_invitation' },
      'Invite Companion to Ride'
    );
  }

  async getRideInvitations(): Promise<InvitationsResponse> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.get('/friends/invitations');
        return ErrorHandler.ensureObject(response.data, {
          invitations: [],
          count: 0
        });
      },
      {
        invitations: [],
        count: 0
      },
      'Get Ride Invitations'
    );
  }

  async respondToRideInvitation(invitationId: string, response: 'accepted' | 'declined'): Promise<{ message: string; joined_ride?: boolean }> {
    return ErrorHandler.withFallback(
      async () => {
        const apiResponse = await api.put(`/friends/invitations/${invitationId}/respond`, {
          response
        });
        return apiResponse.data;
      },
      { message: `Invitation ${response}`, joined_ride: response === 'accepted' },
      'Respond to Ride Invitation'
    );
  }

  async getFriendsForMessaging(): Promise<MessagingFriendsResponse> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.get('/friends/messaging');
        return ErrorHandler.ensureObject(response.data, {
          friends: [],
          count: 0
        });
      },
      {
        friends: getFallbackData('friends').friends.map(friend => ({
          user_id: friend._id,
          name: friend.name,
          email: friend.email,
          last_message: 'Hey! How are you?',
          last_message_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          unread_count: 0,
          has_conversation: true,
          friendship_created: new Date().toISOString()
        })),
        count: getFallbackData('friends').friends.length
      },
      'Get Friends for Messaging'
    );
  }
}

export const friendsService = new FriendsService(); 