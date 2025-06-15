// // screens/Wallet.tsx
// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   View,
//   Text,
//   SafeAreaView,
//   StyleSheet,
//   FlatList,
//   TouchableOpacity,
//   Image,
//   ActivityIndicator,
//   RefreshControl,
//   Alert,
// } from 'react-native';
// // --- Ensure both hooks are imported ---
// import { useNavigation, useFocusEffect } from '@react-navigation/native';
// import { WalletService, Transaction, WalletInfo } from '../services/wallet';
// import Navbar from '../components/Navbar';

// const Wallet: React.FC = () => {
//   // --- Ensure useNavigation is called ---
//   const navigation = useNavigation();
//   const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   // Wrap loadWalletInfo in useCallback
//   const loadWalletInfo = useCallback(async (showLoadingIndicator = true) => {
//     if (showLoadingIndicator) {
//         setIsLoading(true);
//     }
//     try {
//       // Ensure WalletService.getWalletInfo exists and works
//       const info = await WalletService.getWalletInfo();
//       setWalletInfo(info);
//     } catch (error) {
//       console.error('Error loading wallet info:', error);
//       // Avoid showing alert multiple times if called from focus and refresh
//       // Alert.alert('Error', 'Failed to load wallet information.');
//     } finally {
//        if (showLoadingIndicator) {
//             setIsLoading(false);
//        }
//     }
//   }, []); // Empty dependency array

//   // Initial load
//   useEffect(() => {
//     loadWalletInfo();
//   }, [loadWalletInfo]); // Dependency on the memoized function

//   // --- Re-enable useFocusEffect ---
//   useFocusEffect(
//     useCallback(() => {
//       // This runs when the screen comes into focus
//       console.log('Wallet screen focused, reloading data...');
//       // Don't show the main loading indicator on focus refresh,
//       // rely on pull-to-refresh indicator if needed
//       loadWalletInfo(false);

//       // Optional: return a cleanup function if needed
//       // return () => console.log('Wallet screen unfocused');
//     }, [loadWalletInfo]) // Depend on the memoized loadWalletInfo
//   );
//   // --- End useFocusEffect ---

//   const handleRefresh = async () => {
//     setIsRefreshing(true);
//     await loadWalletInfo(false); // Don't show main loader on refresh
//     setIsRefreshing(false);
//   };

//   const handleTopUp = () => {
//     // Ensure 'WalletTopUp' matches the screen name in your navigator
//     navigation.navigate('WalletTopUp' as never);
//   };

//   const renderTransactionItem = ({ item }: { item: Transaction }) => {
//      // Basic check for item validity
//      if (!item || !item.timestamp || !item.type) {
//          console.warn("Invalid transaction item data:", item);
//          return null; // Don't render invalid items
//      }

//      const isCredit = item.type === 'topup' || item.type === 'refund';

//      // Date formatting with safety check
//      let formattedDate = 'Invalid Date';
//      try {
//          const date = new Date(item.timestamp);
//          if (!isNaN(date.getTime())) { // Check if date is valid
//              formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
//          }
//      } catch (e) {
//          console.error("Error formatting date for item:", item, e);
//      }


//      return (
//        <View style={styles.transactionItem}>
//          <View style={styles.transactionIconContainer}>
//            {/* Use optional chaining for safety if source could be dynamic/missing */}
//            {item.type === 'topup' && (
//              <Image
//                source={require('../assets/images/Money Icon.png')}
//                style={styles.transactionIcon}
//                resizeMode="contain"
//              />
//            )}
//            {item.type === 'payment' && (
//              <Image
//                source={require('../assets/images/Blue Fare Icon.png')}
//                style={styles.transactionIcon}
//                resizeMode="contain"
//              />
//            )}
//            {item.type === 'refund' && (
//              <Image
//                source={require('../assets/images/Recieved Icon.png')}
//                style={styles.transactionIcon}
//                resizeMode="contain"
//              />
//            )}
//            {/* Consider a default icon */}
//            {!['topup', 'payment', 'refund'].includes(item.type) && (
//                 <View style={[styles.transactionIcon, { backgroundColor: '#ccc' }]} /> // Placeholder for unknown types
//            )}
//          </View>

//          <View style={styles.transactionInfo}>
//             {/* Safely access properties */}
//            <Text style={styles.transactionDescription} numberOfLines={2} ellipsizeMode="tail">
//                {item.description ?? 'No description'} {item.payment_method === 'stripe' ? '(Card)' : item.payment_method === 'bank' ? '(Bank)' : ''}
//             </Text>
//            <Text style={styles.transactionDate}>{formattedDate}</Text>
//          </View>

//          <Text style={[
//            styles.transactionAmount,
//            isCredit ? styles.creditAmount : styles.debitAmount
//          ]}>
//            {/* Ensure amount is a number or format safely */}
//            {isCredit ? '+' : ''}{typeof item.amount === 'number' ? item.amount.toFixed(2) : item.amount} Rs.
//          </Text>
//        </View>
//      );
//    };


//   if (isLoading) {
//      return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#113a78" />
//         </View>
//         {/* Render Navbar even during load? Ensure it doesn't cause issues */}
//         <Navbar />
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.title}>Wallet</Text>
//       </View>

//       <View style={styles.balanceCard}>
//         <Text style={styles.balanceLabel}>Available Balance</Text>
//         {/* Use toFixed for consistent decimal display */}
//         <Text style={styles.balanceAmount}>{typeof walletInfo?.balance === 'number' ? walletInfo.balance.toFixed(2) : '0.00'} Rs.</Text>
//         <TouchableOpacity style={styles.topUpButton} onPress={handleTopUp}>
//           <Text style={styles.topUpButtonText}>Top Up Wallet</Text>
//         </TouchableOpacity>
//       </View>


//       <View style={styles.transactionsSection}>
//          <Text style={styles.sectionTitle}>Transaction History</Text>

//          {/* Improved check for empty transactions */}
//         {!walletInfo?.transactions || walletInfo.transactions.length === 0 ? (
//           <View style={styles.emptyTransactions}>
//             <Text style={styles.emptyText}>No transactions yet</Text>
//           </View>
//         ) : (
//           <FlatList
//             data={walletInfo.transactions}
//             // Add basic check for valid item id
//             keyExtractor={(item) => item?.id ?? Math.random().toString()} // Fallback key, less ideal
//             renderItem={renderTransactionItem}
//             refreshControl={
//               <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#113a78']} tintColor={'#113a78'}/>
//             }
//             contentContainerStyle={styles.transactionsList}
//             // Optional: Add performance optimization for FlatList
//             initialNumToRender={10}
//             maxToRenderPerBatch={5}
//             windowSize={10}
//           />
//         )}
//       </View>

//       <Navbar />
//     </SafeAreaView>
//   );
// };

// // --- Styles (assuming these are correct and complete) ---
// const styles = StyleSheet.create({
//     container: {
//     flex: 1,
//     backgroundColor: '#fefefe',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   header: {
//     padding: 15,
//     alignItems: 'center',
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   title: {
//     fontFamily: 'Inter', // Ensure this font is loaded
//     fontSize: 24,
//     fontWeight: '600',
//     color: '#113a78',
//   },
//   balanceCard: {
//     margin: 16,
//     padding: 20,
//     backgroundColor: '#113a78',
//     borderRadius: 12,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   balanceLabel: {
//     fontFamily: 'Inter',
//     fontSize: 14,
//     color: '#ffffff',
//     opacity: 0.9,
//   },
//   balanceAmount: {
//     fontFamily: 'Inter',
//     fontSize: 36,
//     fontWeight: '700',
//     color: '#ffffff',
//     marginVertical: 10,
//   },
//   topUpButton: {
//     backgroundColor: '#ff9020',
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 20,
//     marginTop: 5,
//   },
//   topUpButtonText: {
//     fontFamily: 'Inter',
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#ffffff',
//   },
//   transactionsSection: {
//     flex: 1,
//     paddingHorizontal: 16,
//   },
//   sectionTitle: {
//     fontFamily: 'Inter',
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#113a78',
//     marginBottom: 15,
//     marginTop: 10,
//   },
//   emptyTransactions: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 50,
//   },
//   emptyText: {
//     fontFamily: 'Inter',
//     fontSize: 16,
//     color: '#999',
//   },
//   transactionsList: {
//     paddingBottom: 100, // Padding for Navbar
//   },
//   transactionItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#ffffff',
//     padding: 16,
//     marginBottom: 8,
//     borderRadius: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 1,
//     borderWidth: 1,
//     borderColor: '#f0f0f0',
//   },
//   transactionIconContainer: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#e6effc',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   transactionIcon: {
//     width: 20,
//     height: 20,
//   },
//   transactionInfo: {
//     flex: 1,
//     marginRight: 8,
//   },
//   transactionDescription: {
//     fontFamily: 'Inter',
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#113a78',
//     flexShrink: 1,
//   },
//   transactionDate: {
//     fontFamily: 'Inter',
//     fontSize: 12,
//     color: '#888',
//     marginTop: 4,
//   },
//   transactionAmount: {
//     fontFamily: 'Inter',
//     fontSize: 16,
//     fontWeight: '600',
//     textAlign: 'right',
//     minWidth: 80,
//   },
//   creditAmount: {
//     color: '#519e15',
//   },
//   debitAmount: {
//     color: '#c60000',
//   },
// });

// export default Wallet;


import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { WalletService, Transaction, WalletInfo } from '../services/wallet'; // Ensure types match service/backend
import Navbar from '../components/Navbar';

const Wallet: React.FC = () => {
  const navigation = useNavigation();
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading initially
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // --- Data Loading Function ---
  const loadWalletInfo = useCallback(async (showLoadingIndicator = true) => {
    console.log(`Loading wallet info... ${showLoadingIndicator ? 'with' : 'without'} indicator.`);
    if (showLoadingIndicator) {
        setIsLoading(true);
    }
    try {
      const info = await WalletService.getWalletInfo();
      // Simple validation before setting state
      if (typeof info?.balance === 'number' && Array.isArray(info?.transactions)) {
          setWalletInfo(info);
      } else {
           console.warn("Received invalid wallet info structure:", info);
           // Set default empty state on invalid data
           setWalletInfo({ balance: 0, transactions: [] });
           Alert.alert('Error', 'Received invalid wallet data from server.');
      }
    } catch (error: any) {
      console.error('Error loading wallet info:', error);
      // Avoid alert spamming if focus/refresh fails repeatedly
      // Alert.alert('Error', error.message || 'Failed to load wallet information.');
      // Optionally set empty state on error too
      // setWalletInfo({ balance: 0, transactions: [] });
    } finally {
       if (showLoadingIndicator) {
            setIsLoading(false);
       }
       // Ensure refreshing indicator is always turned off after load attempt
       setIsRefreshing(false);
    }
  }, []); // Empty dependency array: function is memoized
  // --- End Data Loading ---

  // --- Effects ---
  // Initial load on component mount
  useEffect(() => {
    loadWalletInfo(true); // Show loader on initial mount
  }, [loadWalletInfo]); // Depend on the memoized function

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Wallet screen focused, reloading data silently...');
      loadWalletInfo(false); // Don't show main loader, only potential refresh indicator
    }, [loadWalletInfo])
  );
  // --- End Effects ---

  // --- Handlers ---
  const handleRefresh = useCallback(() => {
    console.log('Pull-to-refresh triggered.');
    setIsRefreshing(true); // Show RefreshControl indicator
    // loadWalletInfo will set isRefreshing back to false in its finally block
    loadWalletInfo(false);
  }, [loadWalletInfo]);

  const handleTopUp = () => {
    navigation.navigate('WalletTopUp' as never); // Ensure 'WalletTopUp' is correct screen name
  };
  // --- End Handlers ---

  // --- Transaction Item Renderer ---
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
     // Basic check for essential item data
     if (!item || !item.id || !item.timestamp || !item.type) {
         console.warn("Rendering skipped for invalid transaction item:", item);
         return null; // Don't render invalid items
     }

     const isCredit = item.type === 'topup' || item.type === 'refund';
     let formattedDate = 'Processing date...';
     try {
         const date = new Date(item.timestamp);
         if (!isNaN(date.getTime())) { // Check if date is valid
             formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`; // Use 12hr format
         }
     } catch (e) {
         console.error("Error formatting date for transaction:", item.id, e);
     }

     let iconSource = require('../assets/images/Money Icon.png'); // Default or other icon
     if (item.type === 'topup') iconSource = require('../assets/images/Money Icon.png');
     if (item.type === 'payment') iconSource = require('../assets/images/Blue Fare Icon.png');
     if (item.type === 'refund') iconSource = require('../assets/images/Recieved Icon.png');

     return (
       <View style={styles.transactionItem}>
         {/* Icon */}
         <View style={styles.transactionIconContainer}>
            <Image source={iconSource} style={styles.transactionIcon} resizeMode="contain" />
         </View>

         {/* Info */}
         <View style={styles.transactionInfo}>
           <Text style={styles.transactionDescription} numberOfLines={2} ellipsizeMode="tail">
               {item.description || item.type.charAt(0).toUpperCase() + item.type.slice(1)} {/* Fallback description */}
               {item.payment_method === 'stripe' ? ' (Card)' : item.payment_method === 'bank' ? ' (Bank)' : ''}
            </Text>
           <Text style={styles.transactionDate}>{formattedDate}</Text>
         </View>

         {/* Amount */}
         <Text style={[ styles.transactionAmount, isCredit ? styles.creditAmount : styles.debitAmount ]}>
           {isCredit ? '+' : ''}{typeof item.amount === 'number' ? item.amount.toFixed(2) : item.amount} Rs.
         </Text>
       </View>
     );
   };
  // --- End Transaction Item Renderer ---

  // --- Loading State ---
  if (isLoading) {
     return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#113a78" />
          <Text style={styles.loadingText}>Loading Wallet...</Text>
        </View>
        <Navbar />
      </SafeAreaView>
    );
  }
  // --- End Loading State ---

  // --- Main Render ---
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>
            {/* Ensure balance is a number and format */}
            {(typeof walletInfo?.balance === 'number' ? walletInfo.balance : 0).toFixed(2)} Rs.
        </Text>
        <TouchableOpacity style={styles.topUpButton} onPress={handleTopUp}>
          <Text style={styles.topUpButtonText}>Top Up Wallet</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction History Section */}
      <View style={styles.transactionsSection}>
         <Text style={styles.sectionTitle}>Transaction History</Text>
         {/* Conditional rendering for list or empty message */}
        {!walletInfo?.transactions || walletInfo.transactions.length === 0 ? (
          <View style={styles.emptyTransactions}>
            <Text style={styles.emptyText}>No transactions yet.</Text>
            <Text style={styles.emptySubText}>Pull down to refresh.</Text>
          </View>
        ) : (
          <FlatList
            data={walletInfo.transactions}
            keyExtractor={(item) => item?.id ?? Math.random().toString()} // Use unique ID, fallback needed if ID can be missing
            renderItem={renderTransactionItem}
            refreshControl={ // Pull to refresh setup
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={['#113a78', '#ff9020']} // Customize indicator colors
                tintColor={'#113a78'} // iOS indicator color
              />
            }
            contentContainerStyle={styles.transactionsList}
            ListFooterComponent={<View style={{ height: 40 }} />} // Add space at bottom
            initialNumToRender={10} // FlatList Performance
            maxToRenderPerBatch={5}
            windowSize={10}
          />
        )}
      </View>

      {/* Fixed Navbar */}
      <Navbar />
    </SafeAreaView>
  );
  // --- End Main Render ---
};

// --- Styles ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' }, // Light gray background
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
    header: { paddingVertical: 15, paddingHorizontal: 20, alignItems: 'center', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    title: { fontFamily: 'Inter', fontSize: 24, fontWeight: '600', color: '#113a78' },
    balanceCard: { margin: 16, padding: 20, backgroundColor: '#113a78', borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
    balanceLabel: { fontFamily: 'Inter', fontSize: 14, color: '#ffffff', opacity: 0.9, marginBottom: 4 },
    balanceAmount: { fontFamily: 'Inter', fontSize: 36, fontWeight: '700', color: '#ffffff', marginVertical: 5 },
    topUpButton: { backgroundColor: '#ff9020', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 20, marginTop: 15 },
    topUpButtonText: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: '#ffffff' },
    transactionsSection: { flex: 1, paddingHorizontal: 16 },
    sectionTitle: { fontFamily: 'Inter', fontSize: 18, fontWeight: '600', color: '#113a78', marginBottom: 15, marginTop: 10 },
    emptyTransactions: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 50 }, // Added padding
    emptyText: { fontFamily: 'Inter', fontSize: 16, color: '#999', marginBottom: 5 },
    emptySubText: { fontFamily: 'Inter', fontSize: 14, color: '#aaa' },
    transactionsList: { paddingTop: 5, paddingBottom: 100 }, // Add padding for Navbar overlap
    transactionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, marginBottom: 10, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0' },
    transactionIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e6effc', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    transactionIcon: { width: 20, height: 20, tintColor: '#113a78' }, // Add tint color for consistency if needed
    transactionInfo: { flex: 1, marginRight: 8 },
    transactionDescription: { fontFamily: 'Inter', fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 3 }, // Darker text
    transactionDate: { fontFamily: 'Inter', fontSize: 12, color: '#777', marginTop: 2 }, // Slightly darker gray
    transactionAmount: { fontFamily: 'Inter', fontSize: 16, fontWeight: '600', textAlign: 'right', minWidth: 80 },
    creditAmount: { color: '#28a745' }, // Standard green
    debitAmount: { color: '#dc3545' }, // Standard red
});

export default Wallet;