// constants/fallbackData.ts
export const FALLBACK_DATA = {
  // Sample user data
  user: {
    id: 'sample_user_001',
    name: 'Sample User',
    email: 'user@ridematch.com',
    phone: '+60123456789',
    role: 'user',
    profile_image: null,
    wallet_balance: 25.50,
    rating: 4.7,
    total_rides: 12,
    joined_date: '2024-01-15'
  },

  // Sample rides data
  rides: [
    {
      _id: 'ride_001',
      creator_name: 'John Smith',
      creator_info: {
        name: 'John Smith',
        rating: 4.8,
        total_rides: 45
      },
      car_type: 'Honda Civic',
      pickup_location: {
        address: 'IIUM Gombak Campus, Selangor',
        coordinates: [3.2516, 101.7314]
      },
      destination: {
        address: 'Pavilion KL, Bukit Bintang',
        coordinates: [3.1490, 101.7010]
      },
      departure_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      passenger_slots: 3,
      price: 15.00,
      group_join: false,
      status: 'active'
    },
    {
      _id: 'ride_002',
      creator_name: 'Sarah Lee',
      creator_info: {
        name: 'Sarah Lee',
        rating: 4.9,
        total_rides: 67
      },
      car_type: 'Toyota Vios',
      pickup_location: {
        address: 'KL Sentral, Kuala Lumpur',
        coordinates: [3.1345, 101.6869]
      },
      destination: {
        address: 'Sunway Pyramid, Petaling Jaya',
        coordinates: [3.0738, 101.6069]
      },
      departure_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
      passenger_slots: 2,
      price: 12.50,
      group_join: true,
      status: 'active'
    },
    {
      _id: 'ride_003',
      creator_name: 'Ahmad Rahman',
      creator_info: {
        name: 'Ahmad Rahman',
        rating: 4.6,
        total_rides: 23
      },
      car_type: 'Perodua Myvi',
      pickup_location: {
        address: 'Mid Valley Megamall, Kuala Lumpur',
        coordinates: [3.1181, 101.6767]
      },
      destination: {
        address: 'KLCC, Kuala Lumpur',
        coordinates: [3.1570, 101.7123]
      },
      departure_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
      passenger_slots: 1,
      price: 8.00,
      group_join: false,
      status: 'active'
    }
  ],

  // Sample ride history
  rideHistory: [
    {
      _id: 'history_001',
      creator_name: 'Emily Chen',
      pickup_location: { address: 'Bangsar, Kuala Lumpur' },
      destination: { address: 'KLCC, Kuala Lumpur' },
      departure_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      status: 'completed',
      price: 10.00,
      rating: 5
    },
    {
      _id: 'history_002',
      creator_name: 'David Wong',
      pickup_location: { address: 'IOI City Mall, Putrajaya' },
      destination: { address: 'The Gardens Mall, Mid Valley' },
      departure_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      status: 'completed',
      price: 18.50,
      rating: 4
    }
  ],

  // Sample friends data
  friends: [
    {
      _id: 'friend_001',
      name: 'Alex Johnson',
      email: 'alex@ridematch.com',
      mutual_friends: 3,
      similarity_score: 85,
      status: 'friends'
    },
    {
      _id: 'friend_002',
      name: 'Maria Santos',
      email: 'maria@ridematch.com',
      mutual_friends: 1,
      similarity_score: 72,
      status: 'friends'
    }
  ],

  // Sample friend requests
  friendRequests: [
    {
      _id: 'request_001',
      sender: {
        _id: 'user_003',
        name: 'Chris Taylor',
        email: 'chris@ridematch.com'
      },
      status: 'pending'
    }
  ],

  // Sample messages/conversations
  conversations: [
    {
      _id: 'conv_001',
      participant_info: {
        name: 'John Smith',
        profile_image: null
      },
      last_message: {
        content: 'Thanks for the ride!',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        sender_name: 'John Smith'
      },
      unread_count: 0
    },
    {
      _id: 'conv_002',
      participant_info: {
        name: 'Sarah Lee',
        profile_image: null
      },
      last_message: {
        content: 'See you at the pickup point',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        sender_name: 'You'
      },
      unread_count: 1
    }
  ],

  // Sample chat messages
  chatMessages: [
    {
      _id: 'msg_001',
      content: 'Hi! I\'m on my way to the pickup point',
      sender_id: 'sample_user_001',
      sender_name: 'You',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      type: 'text'
    },
    {
      _id: 'msg_002',
      content: 'Great! I\'ll be there in 5 minutes',
      sender_id: 'other_user_001',
      sender_name: 'John Smith',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      type: 'text'
    }
  ],

  // Sample wallet transactions
  walletTransactions: [
    {
      _id: 'txn_001',
      type: 'ride_payment',
      amount: -15.00,
      description: 'Ride to Pavilion KL',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed'
    },
    {
      _id: 'txn_002',
      type: 'top_up',
      amount: 50.00,
      description: 'Wallet top-up via card',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed'
    }
  ],

  // Sample driver applications for admin
  driverApplications: [
    {
      _id: 'app_001',
      user_name: 'Michael Tan',
      user_email: 'michael@ridematch.com',
      license_number: 'D1234567',
      license_expiry: '2026-12-31',
      car_make: 'Honda',
      car_model: 'Civic',
      car_year: '2020',
      car_color: 'Silver',
      plate_number: 'ABC1234',
      status: 'pending',
      submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],

  // Sample emergency contacts
  emergencyContacts: [
    {
      name: 'Emergency Services',
      number: '999'
    },
    {
      name: 'RideMatch Support',
      number: '+601234567890'
    }
  ],

  // Sample location suggestions
  locationSuggestions: [
    {
      id: 'loc_001',
      address: 'IIUM Gombak Campus, Selangor',
      coordinates: [3.2516, 101.7314]
    },
    {
      id: 'loc_002', 
      address: 'Pavilion KL, Bukit Bintang',
      coordinates: [3.1490, 101.7010]
    },
    {
      id: 'loc_003',
      address: 'KL Sentral, Kuala Lumpur',
      coordinates: [3.1345, 101.6869]
    },
    {
      id: 'loc_004',
      address: 'Sunway Pyramid, Petaling Jaya',
      coordinates: [3.0738, 101.6069]
    },
    {
      id: 'loc_005',
      address: 'Mid Valley Megamall, Kuala Lumpur',
      coordinates: [3.1181, 101.6767]
    }
  ]
};

export default FALLBACK_DATA; 