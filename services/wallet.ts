// // services/wallet.ts
// import api from './api';

// export interface Transaction {
//   id: string;
//   user_id: string;
//   amount: number;
//   type: 'topup' | 'payment' | 'refund';
//   description: string;
//   payment_method?: string;
//   ride_id?: string;
//   timestamp: string;
//   status: 'completed' | 'pending' | 'failed';
// }

// export interface WalletInfo {
//   balance: number;
//   transactions: Transaction[];
// }

// export interface TopUpRequest {
//   amount: number;
//   payment_method: string;
//   card_details?: {
//     card_number: string;
//     expiry: string;
//     cvv: string;
//     name_on_card: string;
//   };
// }

// export interface PaymentRequest {
//   ride_id: string;
//   amount: number;
// }

// export interface WalletResponse {
//   success: boolean;
//   message: string;
//   transaction_id?: string;
// }

// export const WalletService = {
//   async getWalletInfo(): Promise<WalletInfo> {
//     try {
//       const response = await api.get('/wallet/info');
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching wallet info:', error);
//       throw error;
//     }
//   },

//   async verifyPayment(sessionID){
//     try { 
//       const response = await api.post('/wallet/verify-payment', sessionID);
//       return response.data;

//     }
//     catch (error){
//       console.error ("wallet not verified", error);
//       throw error;
//     }


//   },
  
// async createCheckoutSession(sessionID)
// {
//   try
//   {
    
//   }

//   catch(error)
//   {

//   }

// },

//   async topUpWallet(data: TopUpRequest): Promise<WalletResponse> {
//     try {
//       const response = await api.post('/wallet/topup', data);
//       return response.data;
//     } catch (error) {
//       console.error('Error topping up wallet:', error);
//       throw error;
//     }
//   },
  
//   async payForRide(data: PaymentRequest): Promise<WalletResponse> {
//     try {
//       const response = await api.post('/wallet/pay', data);
//       return response.data;
//     } catch (error) {
//       console.error('Error paying for ride:', error);
//       throw error;
//     }
//   }
// };


// services/wallet.ts
import api from './api'; // Assuming 'api' is your pre-configured axios instance or similar

// --- Interfaces (Keep existing ones) ---
export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'topup' | 'payment' | 'refund' | string; // Allow flexibility
  description: string;
  payment_method?: string;
  ride_id?: string;
  timestamp: string; // Expecting ISO string format
  status: 'completed' | 'pending' | 'failed' | string; // Allow flexibility
}

export interface WalletInfo {
  balance: number;
  transactions: Transaction[];
}

// Interface for non-Stripe top-up methods (if you keep them)
export interface TopUpRequest {
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'card' | 'stripe'; // Only list supported non-stripe methods
  // Remove card_details if it was here
}

// Interface for ride payment
export interface PaymentRequest {
  ride_id: string;
  amount: number;
}

// Generic success/failure response for some wallet actions
export interface WalletResponse {
  success: boolean;
  message: string;
  transaction_id?: string;
  status?: string; // For methods like bank transfer status
}

// --- Interfaces for Stripe Checkout Flow ---

// Payload for creating a checkout session
interface CreateCheckoutSessionPayload {
    amount: number; // Amount in PKR
}

// Expected response from the backend after creating a session
interface CreateCheckoutSessionResponse {
    checkout_url: string; // The full URL for Stripe Checkout
}

// Payload for verifying the payment after redirect
interface VerifyPaymentPayload {
    checkout_session_id: string;
}

// Expected response from the backend after verification
interface VerifyPaymentResponse {
    success: boolean;
    message: string;
}
// --- End Interfaces ---


export const WalletService = {

  // --- Get Wallet Info (Keep as is) ---
  async getWalletInfo(): Promise<WalletInfo> {
    try {
      console.log("WalletService: Calling GET /wallet/info");
      const response = await api.get<WalletInfo>('/wallet/info'); // Use WalletInfo type for response
      console.log("WalletService: Received wallet info", response.data);
      // Add minimal validation
      if (typeof response.data?.balance !== 'number' || !Array.isArray(response.data?.transactions)) {
          console.error("WalletService: Invalid data structure received for wallet info.");
          // Return default or throw specific error
          return { balance: 0, transactions: [] };
      }
      return response.data;
    } catch (error: any) {
      console.error('Error fetching wallet info:', error);
      // Extract backend error message if available
      const message = error?.response?.data?.message || error?.response?.data?.error || 'Failed to fetch wallet information.';
      throw new Error(message); // Throw a new error with a readable message
    }
  },

  // --- Verify Stripe Payment (Corrected signature and implementation) ---
  async verifyPayment(payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> {
    // The payload should be an object like { checkout_session_id: 'cs_test_...' }
    if (!payload || !payload.checkout_session_id) {
        console.error("WalletService: verifyPayment called with invalid payload:", payload);
        throw new Error("Missing checkout session ID for verification.");
    }
    try {
      console.log("WalletService: Calling POST /wallet/verify-payment with payload:", payload);
      const response = await api.post<VerifyPaymentResponse>('/wallet/verify-payment', payload);
      console.log("WalletService: Received verification response:", response.data);
      // Backend should return { success: boolean, message: string }
      return response.data;
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      const message = error?.response?.data?.message || error?.response?.data?.error || 'Failed to verify payment status with server.';
      // Return a specific failure structure or throw
      // throw new Error(message);
       return { success: false, message: message }; // Return failure object
    }
  },

  // --- Create Stripe Checkout Session (New Implementation) ---
  async createCheckoutSession(payload: CreateCheckoutSessionPayload): Promise<CreateCheckoutSessionResponse> {
    if (!payload || typeof payload.amount !== 'number' || payload.amount <= 0) {
        console.error("WalletService: createCheckoutSession called with invalid payload:", payload);
        throw new Error("Invalid amount specified for checkout session.");
    }
    try {
        console.log("WalletService: Calling POST /wallet/create-checkout-session with payload:", payload);
        const response = await api.post<CreateCheckoutSessionResponse>('/wallet/create-checkout-session', payload);
        console.log("WalletService: Received create session response:", response.data);

        if (!response.data || typeof response.data.checkout_url !== 'string' || !response.data.checkout_url.startsWith('http')) {
             console.error("WalletService: Invalid checkout_url received from backend:", response.data?.checkout_url);
             throw new Error("Received an invalid payment URL from the server.");
        }
        return response.data; // Should contain { checkout_url: '...' }
    } catch (error: any) {
        console.error("Error creating checkout session:", error);
        const message = error?.response?.data?.message || error?.response?.data?.error || 'Could not initiate the secure payment process.';
        throw new Error(message);
    }
  },

  // --- Top up via non-Stripe methods (Keep if needed) ---
  async topUpWallet(data: TopUpRequest): Promise<WalletResponse> {
    // Ensure data.payment_method is not 'stripe' or 'card' here
    
    if (data.payment_method === 'stripe' || data.payment_method === 'card') {
        console.error("WalletService: topUpWallet called with unsupported card/stripe method.");
        throw new Error("Card payments must use the secure checkout flow.");
    }
    try {
      console.log(`WalletService: Calling POST /wallet/topup for ${data.payment_method}`);
      const response = await api.post<WalletResponse>('/wallet/topup', data);
      console.log("WalletService: Received topup response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error topping up wallet (non-stripe):', error);
      const message = error?.response?.data?.message || error?.response?.data?.error || `Failed to process ${data.payment_method} top-up request.`;
      throw new Error(message);
    }
  },

  // --- Pay for Ride (Keep if needed) ---
  async payForRide(data: PaymentRequest): Promise<WalletResponse> {
    try {
      console.log("WalletService: Calling POST /wallet/pay");
      const response = await api.post<WalletResponse>('/wallet/pay', data);
      console.log("WalletService: Received ride payment response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error paying for ride:', error);
      const message = error?.response?.data?.message || error?.response?.data?.error || 'Failed to process ride payment.';
      throw new Error(message);
    }
  }
};

// Make sure your 'api' instance is correctly configured:
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage'; // or your storage solution

// const api = axios.create({
//   baseURL: 'http://YOUR_BACKEND_IP_OR_URL/api', // Use IP for device testing! e.g. http://192.168.1.100:5000/api
//   timeout: 10000, // 10 seconds timeout
// });

// // Add JWT token interceptor
// api.interceptors.request.use(async (config) => {
//   try {
//     const token = await AsyncStorage.getItem('userToken'); // Adjust key as needed
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//   } catch (e) {
//     console.error("Error retrieving token for API request", e);
//   }
//   return config;
// }, (error) => {
//   return Promise.reject(error);
// });

// export default api; // Export the configured instance