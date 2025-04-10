// screens/Wallet.tsx
import React, { useEffect, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { WalletService, Transaction, WalletInfo } from '../services/wallet';
import Navbar from '../components/Navbar';

const Wallet: React.FC = () => {
  const navigation = useNavigation();
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadWalletInfo();
  }, []);

  const loadWalletInfo = async () => {
    setIsLoading(true);
    try {
      const info = await WalletService.getWalletInfo();
      setWalletInfo(info);
    } catch (error) {
      console.error('Error loading wallet info:', error);
      Alert.alert('Error', 'Failed to load wallet information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadWalletInfo();
    setIsRefreshing(false);
  };

  const handleTopUp = () => {
    navigation.navigate('WalletTopUp' as never);
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isCredit = item.type === 'topup' || item.type === 'refund';
    const date = new Date(item.timestamp);
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionIconContainer}>
          {item.type === 'topup' && (
            <Image
              source={require('../assets/images/Money Icon.png')}
              style={styles.transactionIcon}
              resizeMode="contain"
            />
          )}
          {item.type === 'payment' && (
            <Image
              source={require('../assets/images/Blue Fare Icon.png')}
              style={styles.transactionIcon}
              resizeMode="contain"
            />
          )}
          {item.type === 'refund' && (
            <Image
              source={require('../assets/images/Recieved Icon.png')}
              style={styles.transactionIcon}
              resizeMode="contain"
            />
          )}
        </View>

        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>{formattedDate}</Text>
        </View>

        <Text style={[
          styles.transactionAmount,
          isCredit ? styles.creditAmount : styles.debitAmount
        ]}>
          {isCredit ? '+' : ''}{item.amount} Rs.
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#113a78" />
        </View>
        <Navbar />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>{walletInfo?.balance || 0} Rs.</Text>
        <TouchableOpacity style={styles.topUpButton} onPress={handleTopUp}>
          <Text style={styles.topUpButtonText}>Top Up Wallet</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        
        {!walletInfo?.transactions.length ? (
          <View style={styles.emptyTransactions}>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          <FlatList
            data={walletInfo.transactions}
            keyExtractor={(item) => item.id}
            renderItem={renderTransactionItem}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            }
            contentContainerStyle={styles.transactionsList}
          />
        )}
      </View>

      <Navbar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 15,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '600',
    color: '#113a78',
  },
  balanceCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#113a78',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  balanceAmount: {
    fontFamily: 'Inter',
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    marginVertical: 10,
  },
  topUpButton: {
    backgroundColor: '#ff9020',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 5,
  },
  topUpButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  transactionsSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 120, // Add padding for navbar
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 15,
  },
  emptyTransactions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#999',
  },
  transactionsList: {
    paddingBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6effc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIcon: {
    width: 20,
    height: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#113a78',
  },
  transactionDate: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  transactionAmount: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  creditAmount: {
    color: '#519e15',
  },
  debitAmount: {
    color: '#c60000',
  },
});

export default Wallet;