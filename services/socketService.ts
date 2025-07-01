import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SocketMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
  conversation_id: string;
}

export interface MessageNotification {
  conversation_id: string;
  message: SocketMessage;
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  private getBaseUrl(): string {
    // Try different URLs based on environment
    const urls = [
      'http://10.0.2.2:5000', // Android emulator (most common)
      'http://192.168.2.111:5000', // Your local network IP from logs
      'http://localhost:5000',
      'http://127.0.0.1:5000'
    ];
    
    // Use Android emulator URL as default (matches your setup)
    return 'http://10.0.2.2:5000';
  }

  async connect(): Promise<boolean> {
    if (this.socket?.connected || this.isConnecting) {
      return this.socket?.connected || false;
    }

    this.isConnecting = true;

    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.warn('No auth token found for socket connection');
        this.isConnecting = false;
        return false;
      }

      const baseUrl = this.getBaseUrl();
      console.log('🔌 Connecting to Socket.IO server at:', baseUrl);

      this.socket = io(baseUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        auth: {
          token: token
        }
      });

      return new Promise((resolve) => {
        if (!this.socket) {
          this.isConnecting = false;
          resolve(false);
          return;
        }

        this.socket.on('connect', () => {
          console.log('✅ Socket connected successfully');
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          
          // Authenticate with token
          this.socket?.emit('authenticate', { token });
          
          resolve(true);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 Socket disconnected:', reason);
          this.isConnecting = false;
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error);
          this.isConnecting = false;
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.socket?.disconnect();
            resolve(false);
          }
        });

        this.socket.on('authenticated', (data) => {
          console.log('🔐 Socket authenticated for user:', data.user_id);
        });

        this.socket.on('auth_error', (error) => {
          console.error('🔐 Socket authentication error:', error);
          this.disconnect();
          resolve(false);
        });

        // Timeout fallback
        setTimeout(() => {
          if (this.isConnecting) {
            console.warn('Socket connection timeout');
            this.isConnecting = false;
            resolve(false);
          }
        }, 10000);
      });

    } catch (error) {
      console.error('Socket service connection error:', error);
      this.isConnecting = false;
      return false;
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // Message handling
  sendMessage(receiverId: string, content: string) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot send message');
      return;
    }

    console.log('📤 Sending message via socket:', { receiverId, content });
    this.socket.emit('send_message', {
      receiver_id: receiverId,
      content: content
    });
  }

  // Event listeners
  onNewMessage(callback: (message: SocketMessage) => void) {
    if (!this.socket) return;
    
    this.socket.on('new_message', (message: SocketMessage) => {
      console.log('📨 Received new message:', message);
      callback(message);
    });
  }

  onMessageNotification(callback: (notification: MessageNotification) => void) {
    if (!this.socket) return;
    
    this.socket.on('message_notification', (notification: MessageNotification) => {
      console.log('🔔 Received message notification:', notification);
      callback(notification);
    });
  }

  joinConversation(conversationId: string) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot join conversation');
      return;
    }

    console.log('🏠 Joining conversation:', conversationId);
    this.socket.emit('join_conversation', {
      conversation_id: conversationId
    });
  }

  markConversationAsRead(conversationId: string) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot mark as read');
      return;
    }

    this.socket.emit('mark_conversation_read', {
      conversation_id: conversationId
    });
  }

  // Typing indicators
  sendTypingStatus(conversationId: string, isTyping: boolean) {
    if (!this.socket?.connected) return;

    this.socket.emit('typing', {
      conversation_id: conversationId,
      is_typing: isTyping
    });
  }

  onUserTyping(callback: (data: { user_id: string; is_typing: boolean; conversation_id: string }) => void) {
    if (!this.socket) return;
    
    this.socket.on('user_typing', callback);
  }

  // Cleanup
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService(); 