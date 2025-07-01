import { FALLBACK_DATA } from '../constants/fallbackData';

/**
 * Enhanced error handler that provides graceful degradation with fallback data
 * Instead of showing errors to users, it logs them for development and returns safe fallback data
 */
export class ErrorHandler {
  private static isDevelopment = __DEV__;

  /**
   * Handle API errors gracefully - log for development but return fallback data
   */
  static handleApiError<T>(
    error: any,
    fallbackData: T,
    context: string = 'API call'
  ): T {
    // Log error details for development/debugging
    if (this.isDevelopment) {
      console.group(`🔥 ${context} Error (Hidden from User)`);
      console.error('Error details:', error);
      console.error('Error message:', error?.message);
      console.error('Error response:', error?.response?.data);
      console.log('📦 Using fallback data instead');
      console.groupEnd();
    }

    // Return fallback data instead of throwing error
    return fallbackData;
  }

  /**
   * Handle async operations with automatic fallback
   */
  static async withFallback<T>(
    operation: () => Promise<T>,
    fallbackData: T,
    context: string = 'Operation'
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      return this.handleApiError(error, fallbackData, context);
    }
  }

  /**
   * Handle sync operations with automatic fallback
   */
  static withSyncFallback<T>(
    operation: () => T,
    fallbackData: T,
    context: string = 'Operation'
  ): T {
    try {
      return operation();
    } catch (error) {
      return this.handleApiError(error, fallbackData, context);
    }
  }

  /**
   * Safe API response handler - extracts data or returns fallback
   */
  static safeApiResponse<T>(
    response: any,
    fallbackData: T,
    dataPath: string = 'data'
  ): T {
    try {
      // Navigate the data path (e.g., 'data.rides' or 'response.data')
      const pathParts = dataPath.split('.');
      let result = response;
      
      for (const part of pathParts) {
        if (result && typeof result === 'object' && part in result) {
          result = result[part];
        } else {
          throw new Error(`Path ${dataPath} not found in response`);
        }
      }

      // If result is null, undefined, or empty array, use fallback
      if (result === null || result === undefined || 
          (Array.isArray(result) && result.length === 0)) {
        if (this.isDevelopment) {
          console.log(`📦 API returned empty data, using fallback for ${dataPath}`);
        }
        return fallbackData;
      }

      return result as T;
    } catch (error) {
      return this.handleApiError(error, fallbackData, `API response parsing (${dataPath})`);
    }
  }

  /**
   * Get user-friendly fallback data for different contexts
   */
  static getFallbackData(type: 'rides' | 'user' | 'friends' | 'messages' | 'history' | 'wallet' | 'applications') {
    switch (type) {
      case 'rides':
        return { rides: FALLBACK_DATA.rides, total: FALLBACK_DATA.rides.length };
      case 'user':
        return FALLBACK_DATA.user;
      case 'friends':
        return { 
          friends: FALLBACK_DATA.friends, 
          requests: FALLBACK_DATA.friendRequests 
        };
      case 'messages':
        return FALLBACK_DATA.conversations;
      case 'history':
        return { rides: FALLBACK_DATA.rideHistory, total: FALLBACK_DATA.rideHistory.length };
      case 'wallet':
        return { 
          balance: FALLBACK_DATA.user.wallet_balance,
          transactions: FALLBACK_DATA.walletTransactions
        };
      case 'applications':
        return FALLBACK_DATA.driverApplications;
      default:
        return {};
    }
  }

  /**
   * Network status aware handler - adjusts behavior based on connectivity
   */
  static async handleWithNetworkAwareness<T>(
    operation: () => Promise<T>,
    fallbackData: T,
    context: string = 'Network operation'
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      // Check if it's a network error
      if (error?.code === 'ERR_NETWORK' || 
          error?.message?.includes('Network') ||
          error?.message?.includes('timeout')) {
        
        if (this.isDevelopment) {
          console.log(`📶 Network issue detected in ${context}, using offline data`);
        }
        
        return fallbackData;
      }
      
      // For other errors, still use fallback but log differently
      return this.handleApiError(error, fallbackData, context);
    }
  }

  /**
   * Validation helper - ensures data structure integrity
   */
  static validateData<T>(data: any, validator: (data: any) => boolean, fallback: T): T {
    try {
      if (validator(data)) {
        return data as T;
      } else {
        if (this.isDevelopment) {
          console.log('📋 Data validation failed, using fallback');
        }
        return fallback;
      }
    } catch (error) {
      return this.handleApiError(error, fallback, 'Data validation');
    }
  }

  /**
   * Array data handler - ensures arrays are always valid
   */
  static ensureArray<T>(data: any, fallbackArray: T[] = []): T[] {
    if (Array.isArray(data)) {
      return data;
    }
    
    if (this.isDevelopment) {
      console.log('📋 Expected array but got:', typeof data, 'Using fallback array');
    }
    
    return fallbackArray;
  }

  /**
   * Object data handler - ensures objects are always valid
   */
  static ensureObject<T extends Record<string, any>>(data: any, fallbackObject: T): T {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as T;
    }
    
    if (this.isDevelopment) {
      console.log('📋 Expected object but got:', typeof data, 'Using fallback object');
    }
    
    return fallbackObject;
  }

  /**
   * Silent operation - performs operation but never throws or shows errors
   */
  static async silentOperation<T>(
    operation: () => Promise<T>,
    defaultValue: T
  ): Promise<T> {
    try {
      return await operation();
    } catch {
      // Completely silent - no logging, just return default
      return defaultValue;
    }
  }

  /**
   * Convert errors to user-friendly messages (for cases where we do need to show something)
   */
  static getUserFriendlyMessage(error: any): string {
    if (error?.message?.includes('Network')) {
      return 'Please check your internet connection';
    }
    if (error?.message?.includes('timeout')) {
      return 'Request timed out, please try again';
    }
    if (error?.response?.status === 401) {
      return 'Please log in again';
    }
    if (error?.response?.status === 403) {
      return 'Access denied';
    }
    if (error?.response?.status >= 500) {
      return 'Service temporarily unavailable';
    }
    
    return 'Something went wrong, please try again';
  }
}

// Convenience export for common patterns
export const withFallback = ErrorHandler.withFallback;
export const handleApiError = ErrorHandler.handleApiError;
export const safeApiResponse = ErrorHandler.safeApiResponse;
export const getFallbackData = ErrorHandler.getFallbackData;
export const ensureArray = ErrorHandler.ensureArray;
export const ensureObject = ErrorHandler.ensureObject;
export const silentOperation = ErrorHandler.silentOperation;

export default ErrorHandler; 