// screens/CreateTripStep3.tsx
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Navbar from '../components/Navbar';

type CreateTripStep3NavigationProp = StackNavigationProp<
  RootStackParamList,
  'CreateTripStep3'
>;

const CreateTripStep3: React.FC = () => {
  const navigation = useNavigation<CreateTripStep3NavigationProp>();
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'card'>('cash');
  const [promoCode, setPromoCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      // Get existing trip data
      const tripFormData = await AsyncStorage.getItem('tripForm');
      
      if (!tripFormData) {
        throw new Error('Trip data not found');
      }
      
      // Parse the data and add payment information
      const tripData = JSON.parse(tripFormData);
      const updatedTripData = {
        ...tripData,
        paymentMethod: selectedPayment,
        promoCode: promoCode,
      };
      
      // Save updated trip data
      await AsyncStorage.setItem('tripForm', JSON.stringify(updatedTripData));
      
      // Continue to next step
      navigation.navigate('CreateTripStep4');
    } catch (error) {
      console.error('Error saving payment data:', error);
      Alert.alert('Error', 'Failed to save payment information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.navigate('CreateTripStep2');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header with Title & Progress Indicator */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Trip</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressStep, styles.completedStep]}>
              <Text style={styles.progressText}>1</Text>
            </View>
            <View style={[styles.progressStep, styles.completedStep]}>
              <Text style={styles.progressText}>2</Text>
            </View>
            <View style={[styles.progressStep, styles.currentStep]}>
              <Text style={styles.progressText}>3</Text>
            </View>
            <View style={styles.progressStep}>
              <Text style={styles.progressText}>4</Text>
            </View>
          </View>
        </View>

        {/* Payment Method Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === 'cash' && styles.selectedPaymentOption,
            ]}
            onPress={() => setSelectedPayment('cash')}
          >
            <Image
              style={styles.paymentIcon}
              source={require('../assets/images/Cash Payment Icon.png')}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.paymentTitle}>Cash Payment</Text>
              <Text style={styles.paymentSubtitle}>Pay upon ride completion</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === 'card' && styles.selectedPaymentOption,
            ]}
            onPress={() => setSelectedPayment('card')}
          >
            <Image
              style={styles.paymentIcon}
              source={require('../assets/images/Master Card Icon.png')}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.paymentTitle}>Card Payment</Text>
              <Text style={styles.paymentSubtitle}>Pay with your linked card</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Promo Code Field */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promo Code</Text>
          <View style={styles.promoContainer}>
            <TextInput
              style={styles.promoInput}
              placeholder="+ Add Promo Code"
              placeholderTextColor="#acadb9"
              value={promoCode}
              onChangeText={setPromoCode}
            />
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#113a78" style={styles.loader} />
          ) : (
            <>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
      
      {/* Navbar */}
      <Navbar />
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    flexGrow: 1,
    paddingBottom: 120, // Add padding for navbar
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 10,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    alignSelf: 'center',
  },
  progressStep: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6effc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedStep: {
    backgroundColor: '#ff9020',
  },
  currentStep: {
    backgroundColor: '#5a87c9',
  },
  progressText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 10,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#e6effc',
  },
  selectedPaymentOption: {
    borderWidth: 2,
    borderColor: '#113a78',
    backgroundColor: '#dbeafe',
  },
  paymentIcon: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  paymentTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#113a78',
  },
  paymentSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#5171a1',
    marginTop: 5,
  },
  promoContainer: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#e6effc',
  },
  promoInput: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#113a78',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    flex: 1,
    backgroundColor: '#cccccc',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#113a78',
    padding: 15,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CreateTripStep3;