// screens/WalletTopUp.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { WalletService, TopUpRequest } from '../services/wallet';
import Navbar from '../components/Navbar';

interface PresetAmount {
  value: number;
  label: string;
}

const presetAmounts: PresetAmount[] = [
  { value: 500, label: '500 Rs.' },
  { value: 1000, label: '1000 Rs.' },
  { value: 2000, label: '2000 Rs.' },
  { value: 5000, label: '5000 Rs.' },
];

const WalletTopUp: React.FC = () => {
  const navigation = useNavigation();
  const [amount, setAmount] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'bank'>('card');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
  });
  
  const handlePresetSelect = (presetAmount: PresetAmount) => {
    setSelectedPreset(presetAmount.value);
    setAmount(presetAmount.value.toString());
  };
  
  const handleAmountChange = (text: string) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    setAmount(numericValue);
    setSelectedPreset(null);
  };
  
  const handleTopUp = async () => {
    if (!amount || parseInt(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to add to your wallet.');
      return;
    }
    
    if (selectedPaymentMethod === 'card') {
      // Validate card details
      if (!cardDetails.cardNumber || cardDetails.cardNumber.length < 16) {
        Alert.alert('Invalid Card', 'Please enter a valid card number.');
        return;
      }
      
      if (!cardDetails.expiryDate || !cardDetails.expiryDate.includes('/')) {
        Alert.alert('Invalid Expiry Date', 'Please enter a valid expiry date (MM/YY).');
        return;
      }
      
      if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
        Alert.alert('Invalid CVV', 'Please enter a valid CVV code.');
        return;
      }
      
      if (!cardDetails.nameOnCard) {
        Alert.alert('Invalid Name', 'Please enter the name on the card.');
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      const topupData: TopUpRequest = {
        amount: parseInt(amount),
        payment_method: selectedPaymentMethod,
      };
      
      if (selectedPaymentMethod === 'card') {
        const [month, year] = cardDetails.expiryDate.split('/');
        topupData.card_details = {
          card_number: cardDetails.cardNumber,
          expiry: `${month.trim()}/${year.trim()}`,
          cvv: cardDetails.cvv,
          name_on_card: cardDetails.nameOnCard,
        };
      }
      
      const result = await WalletService.topUpWallet(topupData);
      
      if (result.success) {
        Alert.alert(
          'Success',
          `Your wallet has been topped up with ${amount} Rs.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Wallet' as never),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to top up your wallet. Please try again.');
      }
    } catch (error) {
      console.error('Error topping up wallet:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCardNumber = (text: string) => {
    // Remove any spaces and non-digits
    const cleaned = text.replace(/\s+/g, '').replace(/\D/g, '');
    
    // Add a space after every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    return formatted;
  };
  
  const formatExpiryDate = (text: string) => {
    // Remove any non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Format as MM/YY
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    
    return cleaned;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Image
                source={require('../assets/images/White Back icon.png')}
                style={styles.backIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.title}>Top Up Wallet</Text>
          </View>
          
          <View style={styles.amountSection}>
            <Text style={styles.sectionTitle}>Enter Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>Rs.</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#aaa"
              />
            </View>
            
            <View style={styles.presetAmountsContainer}>
              {presetAmounts.map((preset) => (
                <TouchableOpacity
                  key={preset.value}
                  style={[
                    styles.presetButton,
                    selectedPreset === preset.value && styles.selectedPresetButton,
                  ]}
                  onPress={() => handlePresetSelect(preset)}
                >
                  <Text
                    style={[
                      styles.presetButtonText,
                      selectedPreset === preset.value && styles.selectedPresetButtonText,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.paymentMethodSection}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentOptions}>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  selectedPaymentMethod === 'card' && styles.selectedPaymentOption,
                ]}
                onPress={() => setSelectedPaymentMethod('card')}
              >
                <Image
                  source={require('../assets/images/Master Card Icon.png')}
                  style={styles.paymentOptionIcon}
                  resizeMode="contain"
                />
                <Text style={styles.paymentOptionText}>Credit/Debit Card</Text>
                {selectedPaymentMethod === 'card' && (
                  <View style={styles.selectedIndicator} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  selectedPaymentMethod === 'bank' && styles.selectedPaymentOption,
                ]}
                onPress={() => setSelectedPaymentMethod('bank')}
              >
                <Image
                  source={require('../assets/images/Money Icon.png')}
                  style={styles.paymentOptionIcon}
                  resizeMode="contain"
                />
                <Text style={styles.paymentOptionText}>Bank Transfer</Text>
                {selectedPaymentMethod === 'bank' && (
                  <View style={styles.selectedIndicator} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          {selectedPaymentMethod === 'card' && (
            <View style={styles.cardDetailsSection}>
              <Text style={styles.sectionTitle}>Card Details</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput
                  style={styles.input}
                  value={cardDetails.cardNumber}
                  onChangeText={(text) => setCardDetails({
                    ...cardDetails,
                    cardNumber: formatCardNumber(text).substring(0, 19), // Limit to 16 digits + 3 spaces
                  })}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.input}
                    value={cardDetails.expiryDate}
                    onChangeText={(text) => setCardDetails({
                      ...cardDetails,
                      expiryDate: formatExpiryDate(text).substring(0, 5), // MM/YY format
                    })}
                    placeholder="MM/YY"
                    placeholderTextColor="#aaa"
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    value={cardDetails.cvv}
                    onChangeText={(text) => setCardDetails({
                      ...cardDetails,
                      cvv: text.replace(/\D/g, '').substring(0, 3),
                    })}
                    placeholder="123"
                    placeholderTextColor="#aaa"
                    keyboardType="numeric"
                    secureTextEntry
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name on Card</Text>
                <TextInput
                  style={styles.input}
                  value={cardDetails.nameOnCard}
                  onChangeText={(text) => setCardDetails({
                    ...cardDetails,
                    nameOnCard: text,
                  })}
                  placeholder="John Doe"
                  placeholderTextColor="#aaa"
                />
              </View>
            </View>
          )}
          
          {selectedPaymentMethod === 'bank' && (
            <View style={styles.bankInstructionsSection}>
              <Text style={styles.sectionTitle}>Bank Transfer Instructions</Text>
              <Text style={styles.instructionText}>
                1. Make a bank transfer to the following account:
              </Text>
              <View style={styles.bankDetails}>
                <Text style={styles.bankDetailText}>Account Name: RideMatch Wallet</Text>
                <Text style={styles.bankDetailText}>Account Number: 1234-5678-9012-3456</Text>
                <Text style={styles.bankDetailText}>Bank Name: Example Bank</Text>
                <Text style={styles.bankDetailText}>IBAN: PK00EXMB0000123456789012</Text>
              </View>
              <Text style={styles.instructionText}>
                2. Use your phone number as reference.
              </Text>
              <Text style={styles.instructionText}>
                3. Click "Process Top Up" after making the transfer.
              </Text>
              <Text style={styles.noteText}>
                Note: Bank transfers may take 1-2 business days to process.
              </Text>
            </View>
          )}
          
          <View style={styles.buttonContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#113a78" style={styles.loader} />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.topUpButton,
                    (!amount || parseInt(amount) <= 0) && styles.disabledButton,
                  ]}
                  onPress={handleTopUp}
                  disabled={!amount || parseInt(amount) <= 0}
                >
                  <Text style={styles.topUpButtonText}>
                    {selectedPaymentMethod === 'card' ? 'Pay Now' : 'Process Top Up'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <Navbar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120, // Add padding for navbar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#113a78',
  },
  backButton: {
    position: 'absolute',
    left: 20,
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  amountSection: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 15,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  currencySymbol: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '500',
    color: '#113a78',
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 24,
    color: '#113a78',
    paddingVertical: 15,
  },
  presetAmountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  presetButton: {
    width: '48%',
    backgroundColor: '#e6effc',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedPresetButton: {
    backgroundColor: '#113a78',
  },
  presetButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#113a78',
    fontWeight: '500',
  },
  selectedPresetButtonText: {
    color: '#ffffff',
  },
  paymentMethodSection: {
    padding: 20,
    borderTopWidth: 10,
    borderTopColor: '#f0f0f0',
  },
  paymentOptions: {
    marginTop: 10,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  selectedPaymentOption: {
    borderColor: '#113a78',
    backgroundColor: '#e6effc',
  },
  paymentOptionIcon: {
    width: 30,
    height: 30,
    marginRight: 15,
  },
  paymentOptionText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#113a78',
    flex: 1,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#113a78',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDetailsSection: {
    padding: 20,
    borderTopWidth: 10,
    borderTopColor: '#f0f0f0',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#113a78',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#333',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bankInstructionsSection: {
    padding: 20,
    borderTopWidth: 10,
    borderTopColor: '#f0f0f0',
  },
  instructionText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  bankDetails: {
    backgroundColor: '#f0f6ff',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  bankDetailText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#113a78',
    marginBottom: 5,
  },
  noteText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    marginTop: 'auto',
  },
  loader: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  topUpButton: {
    flex: 1,
    backgroundColor: '#113a78',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  topUpButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
});

export default WalletTopUp;