// services/wallet.ts
import api from './api';
import { ErrorHandler, getFallbackData } from '../utils/errorHandler';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'topup' | 'payment' | 'refund' | 'transfer';
  description: string;
  payment_method?: string;
  ride_id?: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface WalletInfo {
  balance: number;
  transactions: Transaction[];
}

export interface TopUpRequest {
  amount: number;
  payment_method: string;
  card_details?: {
    card_number: string;
    expiry: string;
    cvv: string;
    name_on_card: string;
  };
  payment_intent_id?: string;
}

export interface StripePaymentIntent {
  success: boolean;
  payment_intent_id: string;
  client_secret: string;
  transaction_id: string;
  amount: number;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface SetupIntent {
  success: boolean;
  setup_intent_id: string;
  client_secret: string;
  status: string;
}

export interface RefundRequest {
  ride_id: string;
  amount: number;
  reason?: string;
}

export interface PaymentRequest {
  ride_id: string;
  amount: number;
}

export interface WalletResponse {
  success: boolean;
  message: string;
  transaction_id?: string;
}

export interface TransferRequest {
  to_user_id: string;
  amount: number;
}

export interface StatementResponse {
  transactions: Transaction[];
  low_balance: boolean;
}

export const WalletService = {
  async getWalletInfo(): Promise<WalletInfo> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.get('/wallet/info');
        return ErrorHandler.ensureObject(response.data, {
          balance: 0,
          transactions: []
        });
      },
      getFallbackData('wallet') as WalletInfo,
      'Get Wallet Info'
    );
  },
  
  async topUpWallet(data: TopUpRequest): Promise<WalletResponse> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.post('/wallet/topup', data);
        return response.data;
      },
      { 
        success: true, 
        message: 'Top-up completed',
        transaction_id: 'temp_topup_' + Date.now()
      },
      'Top Up Wallet'
    );
  },
  
  async payForRide(data: PaymentRequest): Promise<WalletResponse> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.post('/wallet/pay', data);
        return response.data;
      },
      { 
        success: true, 
        message: 'Payment completed',
        transaction_id: 'temp_payment_' + Date.now()
      },
      'Pay for Ride'
    );
  },

  async transferBalance(data: TransferRequest): Promise<WalletResponse> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.post('/wallet/transfer', data);
        return response.data;
      },
      { 
        success: true, 
        message: 'Transfer completed',
        transaction_id: 'temp_transfer_' + Date.now()
      },
      'Transfer Balance'
    );
  },

  async getStatement(): Promise<StatementResponse> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.get('/wallet/statement');
        return ErrorHandler.ensureObject(response.data, {
          transactions: [],
          low_balance: false
        });
      },
      {
        transactions: getFallbackData('wallet').transactions,
        low_balance: getFallbackData('wallet').balance < 10
      },
      'Get Wallet Statement'
    );
  },

  // Stripe Payment Methods
  async createPaymentIntent(amount: number): Promise<StripePaymentIntent> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.post('/wallet/create-payment-intent', { amount });
        return response.data;
      },
      {
        success: true,
        payment_intent_id: 'temp_intent_' + Date.now(),
        client_secret: 'temp_secret',
        transaction_id: 'temp_transaction_' + Date.now(),
        amount: amount
      },
      'Create Payment Intent'
    );
  },

  async confirmPayment(payment_intent_id: string): Promise<WalletResponse> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.post('/wallet/confirm-payment', { payment_intent_id });
        return response.data;
      },
      { 
        success: true, 
        message: 'Payment confirmed',
        transaction_id: 'temp_confirm_' + Date.now()
      },
      'Confirm Payment'
    );
  },

  async getPaymentMethods(): Promise<{ success: boolean; payment_methods: PaymentMethod[] }> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.get('/wallet/payment-methods');
        return ErrorHandler.ensureObject(response.data, {
          success: true,
          payment_methods: []
        });
      },
      {
        success: true,
        payment_methods: [
          {
            id: 'sample_card_1',
            type: 'card',
            card: {
              brand: 'visa',
              last4: '4242',
              exp_month: 12,
              exp_year: 2025
            }
          }
        ]
      },
      'Get Payment Methods'
    );
  },

  async createSetupIntent(): Promise<SetupIntent> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.post('/wallet/setup-intent');
        return response.data;
      },
      {
        success: true,
        setup_intent_id: 'temp_setup_' + Date.now(),
        client_secret: 'temp_setup_secret',
        status: 'requires_payment_method'
      },
      'Create Setup Intent'
    );
  },

  async processRefund(data: RefundRequest): Promise<WalletResponse> {
    return ErrorHandler.withFallback(
      async () => {
        const response = await api.post('/wallet/refund', data);
        return response.data;
      },
      { 
        success: true, 
        message: 'Refund processed',
        transaction_id: 'temp_refund_' + Date.now()
      },
      'Process Refund'
    );
  }
};