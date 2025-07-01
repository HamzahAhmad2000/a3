// constants/Config.ts
export const Config = {
  // API Configuration
  API_BASE_URL: 'http://localhost:5000/api',
  
  // Stripe Configuration
  STRIPE_PUBLISHABLE_KEY: 'pk_test_51RFCpaPSQCeKD7Gs2k1nxJecs6UTutmFNsU7PBD247g1FmXNz4SMiq7dzxg0Mj2sUpokrV7x2v436w4w8VTAWS4f00Zn9daK6y',
  
  // Payment Configuration
  MINIMUM_WALLET_TOPUP: 10,
  MAXIMUM_WALLET_TOPUP: 10000,
  LOW_BALANCE_THRESHOLD: 100,
  
  // Group Ride Configuration
  MAX_GROUP_SIZE: 8,
  
  // Emergency Configuration
  EMERGENCY_CONTACTS: {
    police: '911',
    medical: '911',
    support: '+1-555-0123'
  },
  
  // Map Configuration
  GOOGLE_MAPS_API_KEY: 'AIzaSyCjCqI_0pku1U6AZuib0bKk32jDJTXWyso',
  
  // App Configuration
  APP_NAME: 'RideMatch',
  APP_VERSION: '1.0.0',
  
  // Feature Flags
  FEATURES: {
    GROUP_RIDES: true,
    STRIPE_PAYMENTS: true,
    EMERGENCY_ALERTS: true,
    REAL_TIME_RATINGS: true,
    LOCATION_SHARING: true
  }
};

export default Config; 