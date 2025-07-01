// services/messaging.ts
import api from './api';
import { socketService, SocketMessage } from './socketService';
import { ErrorHandler, getFallbackData } from '../utils/errorHandler';

export interface Conversation {
  id: string;
  user_id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

export interface Message {
  id: string;
  text: string;
  sent: boolean;
  timestamp: Date;
  failed?: boolean;
}

export const MessagingService = {
  async getConversations(): Promise<Conversation[]> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.get('/messaging/conversations');
        return ErrorHandler.ensureArray(response.data, []);
      },
      getFallbackData('messages').map(conv => ({
        id: conv._id,
        user_id: conv.participant_info.name,
        name: conv.participant_info.name,
        lastMessage: conv.last_message.content,
        timestamp: conv.last_message.timestamp,
        unread: conv.unread_count > 0
      })),
      'Get Conversations'
    );
  },
  
  async getMessages(userId: string): Promise<Message[]> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.get(`/messaging/${userId}`);
        return ErrorHandler.ensureArray(response.data, []);
      },
      getFallbackData('messages')[0]?.messages?.map(msg => ({
        id: msg._id,
        text: msg.content,
        sent: msg.sender_name === 'You',
        timestamp: new Date(msg.timestamp),
        failed: false
      })) || [],
      'Get Messages'
    );
  },
  
  async sendMessage(userId: string, text: string): Promise<Message> {
    return ErrorHandler.withFallback(
      async () => {
        // Try socket first for real-time delivery
        if (socketService.isConnected()) {
          console.log('📤 Sending message via Socket.IO');
          socketService.sendMessage(userId, text);
          
          // Return optimistic response for socket
          return {
            id: `socket_${Date.now()}`,
            text: text,
            sent: true,
            timestamp: new Date()
          };
        }
        
        // Fallback to REST API
        console.log('📤 Sending message via REST API');
        const response = await api.post('/messaging/send', {
          receiver_id: userId,
          content: text
        });
        return response.data;
      },
      {
        id: `fallback_${Date.now()}`,
        text: text,
        sent: true,
        timestamp: new Date(),
        failed: false
      },
      'Send Message'
    );
  },

  // Socket-related methods
  connectSocket(): Promise<boolean> {
    return socketService.connect();
  },

  disconnectSocket() {
    socketService.disconnect();
  },

  onNewMessage(callback: (message: SocketMessage) => void) {
    socketService.onNewMessage(callback);
  },

  onMessageNotification(callback: (notification: any) => void) {
    socketService.onMessageNotification(callback);
  },

  joinConversation(conversationId: string) {
    socketService.joinConversation(conversationId);
  },

  markAsRead(conversationId: string) {
    socketService.markConversationAsRead(conversationId);
  },

  removeSocketListeners() {
    socketService.removeAllListeners();
  },

  isSocketConnected(): boolean {
    return socketService.isConnected();
  }
};