// // screens/WalletTopUp.tsx
// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View,
//   Text,
//   SafeAreaView,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity, // Keep TouchableOpacity for now
//   Pressable,        // Import Pressable as an alternative
//   Image,
//   ScrollView,
//   ActivityIndicator,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   Linking,
// } from 'react-native';
// import { useNavigation, useFocusEffect } from '@react-navigation/native';
// import { WalletService } from '../services/wallet';
// import Navbar from '../components/Navbar';

// // --- Interfaces and Constants (Keep as before) ---
// interface PresetAmount { value: number; label: string; }
// const presetAmounts: PresetAmount[] = [
//   { value: 500, label: '500 Rs.' },
//   { value: 1000, label: '1000 Rs.' },
//   { value: 2000, label: '2000 Rs.' },
//   { value: 5000, label: '5000 Rs.' },
// ];
// const MINIMUM_STRIPE_AMOUNT_PKR = 200;

// const WalletTopUp: React.FC = () => {
//   const navigation = useNavigation();
//   const [amount, setAmount] = useState<string>('');
//   const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
//   const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'bank'>('stripe');
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [isVerifying, setIsVerifying] = useState<boolean>(false);

//   // --- Hooks (Keep handleDeepLink, useEffect, useFocusEffect as before) ---
//   const handleDeepLink = useCallback(async (event: { url: string }) => {
//     // ... (Keep the implementation from the previous step) ...
//     console.log('Deep link received:', event.url);
//     if (isVerifying) return;
//     setIsLoading(true); setIsVerifying(true);
//     try {
//         const url = new URL(event.url); const sessionId = url.searchParams.get('session_id');
//         if (event.url.includes('/success') && sessionId) {
//             const result = await WalletService.verifyPayment({ checkout_session_id: sessionId });
//             if (result.success) Alert.alert('Success', result.message || 'Wallet topped up!', [{ text: 'OK', onPress: () => navigation.navigate('Wallet' as never) }]);
//             else Alert.alert('Verification Failed', result.message || 'Could not confirm status.');
//         } else if (event.url.includes('/cancel')) {
//             Alert.alert('Payment Cancelled', 'Top-up was cancelled.');
//         } else { console.log('Ignored deep link:', event.url); setIsLoading(false); }
//     } catch (error: any) { console.error("Deep link / Verify error:", error); Alert.alert('Error', error.message || 'Error processing payment result.'); setIsLoading(false);
//     } finally { if (!event.url.includes('/success')) setIsLoading(false); setIsVerifying(false); }
//   }, [navigation, isVerifying]);

//   useEffect(() => { // Deep link listener setup
//     const sub = Linking.addEventListener('url', handleDeepLink);
//     Linking.getInitialURL().then(url => { if (url) handleDeepLink({ url }); });
//     return () => { sub.remove(); };
//   }, [handleDeepLink]);

//   useFocusEffect( // Reset loading on focus
//     useCallback(() => { if (!isVerifying) setIsLoading(false); }, [isVerifying])
//   );
//   // --- End Hooks ---

//   // --- Input Handlers (Keep as before) ---
//   const handlePresetSelect = (presetAmount: PresetAmount) => { /* ... */
//      setSelectedPreset(presetAmount.value); setAmount(presetAmount.value.toString());
//   };
//   const handleAmountChange = (text: string) => { /* ... */
//     const numVal = text.replace(/[^0-9]/g, ''); setAmount(numVal);
//     if (numVal === '' || parseInt(numVal, 10) >= MINIMUM_STRIPE_AMOUNT_PKR) setSelectedPreset(null);
//   };
//   // --- End Input Handlers ---


//   // --- handleProceed (Keep the version with detailed logs) ---
//   const handleProceed = async () => {
//     console.log("handleProceed triggered."); // Log 1
//     const numericAmount = parseInt(amount, 10);
//     if (!amount || isNaN(numericAmount) || numericAmount <= 0) { console.log("Validation Failed: Invalid amount."); Alert.alert('Invalid Amount', '...'); return; } // Log 2a
//     console.log(`Amount entered: ${numericAmount}`); // Log 2b
//     if (selectedPaymentMethod === 'stripe') {
//       console.log("Stripe selected."); // Log 3
//       if (numericAmount < MINIMUM_STRIPE_AMOUNT_PKR) { console.log(`Validation Failed: Amount < Minimum`); Alert.alert('Minimum Amount', `...`); return; } // Log 4
//       setIsLoading(true); setIsVerifying(false); console.log("isLoading=true. Calling API..."); // Log 5
//       try {
//         const payload = { amount: numericAmount }; console.log("Calling createCheckoutSession:", payload); // Log 6
//         const response = await WalletService.createCheckoutSession(payload); console.log("Response:", response); // Log 7
//         if (response && response.checkout_url) {
//           console.log(`URL received: ${response.checkout_url}. Opening...`); // Log 8, 9
//           try { await Linking.openURL(response.checkout_url); console.log("Linking.openURL called."); } // Log 10
//           catch (linkError) { console.error("Linking.openURL failed:", linkError); Alert.alert('Error Opening Page', '...'); setIsLoading(false); } // Log 11
//         } else { console.error("Error: checkout_url not found:", response); throw new Error("Checkout URL not received."); } // Log 12
//       } catch (error: any) { console.error('Error during Stripe initiation:', error); const msg = error?.response?.data?.message || error.message || '...'; Alert.alert('Error', msg); setIsLoading(false); } // Log 13
//     } else if (selectedPaymentMethod === 'bank') { console.log("Bank Transfer selected."); Alert.alert("Bank Transfer", "Instructions..."); } // Log 14
//     else { console.warn("Unknown payment method:", selectedPaymentMethod); } // Log 15
//   };
//   // --- End handleProceed ---

//   // --- Calculate disabled state BEFORE return ---
//   const isButtonDisabled = isLoading ||
//                            !amount || parseInt(amount, 10) <= 0 ||
//                            (selectedPaymentMethod === 'stripe' && parseInt(amount, 10) < MINIMUM_STRIPE_AMOUNT_PKR);

//   // --- RENDER-TIME LOGS ---
//   console.log('--- COMPONENT RENDER ---');
//   console.log('isLoading:', isLoading);
//   console.log('isVerifying:', isVerifying);
//   console.log('amount:', amount);
//   console.log('selectedPaymentMethod:', selectedPaymentMethod);
//   console.log('Calculated isButtonDisabled:', isButtonDisabled);
//   console.log('------------------------');
//   // --- END RENDER-TIME LOGS ---

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Consider commenting out KeyboardAvoidingView/ScrollView for testing if needed */}
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.keyboardAvoidingView} >
//         {/* Try adding keyboardShouldPersistTaps='always' or removing it */}
//         <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
//           {/* Header */}
//           <View style={styles.header}>
//              <TouchableOpacity style={styles.backButton} onPress={() => !isLoading && navigation.goBack()} disabled={isLoading}>
//                <Image source={require('../assets/images/White Back icon.png')} style={styles.backIcon} resizeMode="contain" />
//              </TouchableOpacity>
//              <Text style={styles.title}>Top Up Wallet</Text>
//            </View>

//           {/* --- Other Sections (Amount, Payment Method, Bank Instructions - Keep as before) --- */}
//            {/* Amount Section */}
//            <View style={styles.amountSection}>
//               <Text style={styles.sectionTitle}>Enter Amount</Text>
//              <View style={styles.amountInputContainer}>
//                  <Text style={styles.currencySymbol}>Rs.</Text>
//                  <TextInput style={styles.amountInput} value={amount} onChangeText={handleAmountChange} keyboardType="numeric" placeholder={MINIMUM_STRIPE_AMOUNT_PKR.toString()} placeholderTextColor="#aaa" editable={!isLoading} />
//              </View>
//              <View style={styles.presetAmountsContainer}>
//                {presetAmounts.map((preset) => { const isDisabledPreset = preset.value < MINIMUM_STRIPE_AMOUNT_PKR || isLoading; return (
//                      <TouchableOpacity key={preset.value} style={[ styles.presetButton, selectedPreset === preset.value && styles.selectedPresetButton, isDisabledPreset && styles.disabledPresetButton ]} onPress={() => handlePresetSelect(preset)} disabled={isDisabledPreset} >
//                        <Text style={[ styles.presetButtonText, selectedPreset === preset.value && styles.selectedPresetButtonText, isDisabledPreset && styles.disabledPresetText ]} > {preset.label} </Text>
//                      </TouchableOpacity> ); })}
//              </View>
//            </View>

//            {/* Payment Method Section */}
//            <View style={styles.paymentMethodSection}>
//              <Text style={styles.sectionTitle}>Payment Method</Text>
//              <View style={styles.paymentOptions}>
//                   <TouchableOpacity style={[ styles.paymentOption, selectedPaymentMethod === 'stripe' && styles.selectedPaymentOption ]} onPress={() => !isLoading && setSelectedPaymentMethod('stripe')} disabled={isLoading}>
//                      <Image source={require('../assets/images/Master Card Icon.png')} style={styles.paymentOptionIcon} resizeMode="contain"/> <Text style={styles.paymentOptionText}>Credit/Debit Card (Secure)</Text> {selectedPaymentMethod === 'stripe' && <View style={styles.selectedIndicator} />}
//                   </TouchableOpacity>
//                   <TouchableOpacity style={[ styles.paymentOption, selectedPaymentMethod === 'bank' && styles.selectedPaymentOption ]} onPress={() => !isLoading && setSelectedPaymentMethod('bank')} disabled={isLoading}>
//                      <Image source={require('../assets/images/Money Icon.png')} style={styles.paymentOptionIcon} resizeMode="contain"/> <Text style={styles.paymentOptionText}>Bank Transfer</Text> {selectedPaymentMethod === 'bank' && <View style={styles.selectedIndicator} />}
//                   </TouchableOpacity>
//              </View>
//            </View>

//            {/* Bank Instructions */}
//            {selectedPaymentMethod === 'bank' && ( <View style={styles.bankInstructionsSection}> {/* ... Bank instructions JSX ... */} </View> )}
//            {/* --- End Other Sections --- */}


//           {/* --- Bottom Buttons Area --- */}
//           {/* Try adding backgroundColor: 'rgba(255,0,0,0.3)' to this View for layout debug */}
//           <View style={[styles.buttonContainer /*, {backgroundColor: 'rgba(255,0,0,0.3)'}*/]}>
//             {isLoading ? ( <ActivityIndicator size="large" color="#113a78" style={styles.loader} /> ) : (
//               <>
//                 <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} >
//                   <Text style={styles.cancelButtonText}>Cancel</Text>
//                 </TouchableOpacity>

//                 {/* --- Main Button (TouchableOpacity) --- */}
//                 <TouchableOpacity
//                   style={[
//                     styles.topUpButton,
//                     isButtonDisabled && styles.disabledButton
//                     /*, {backgroundColor: 'rgba(0, 255, 0, 0.5)'} */ // Visual Debug
//                   ]}
//                   // -- Direct onPress log and Alert --
//                   onPress={() => {
//                       console.log("Proceed Button (TouchableOpacity) PRESSED! State -> isLoading:", isLoading, "amount:", amount, "isDisabled:", isButtonDisabled);
//                       Alert.alert("Button Pressed! Check Console.");
//                       // --- Call handleProceed ONLY AFTER confirming the press works ---
//                       // handleProceed();
//                   }}
//                   disabled={isButtonDisabled} >
//                   <Text style={styles.topUpButtonText}>
//                     {selectedPaymentMethod === 'stripe' ? 'Proceed to Payment' : 'Submit Bank Transfer'}
//                   </Text>
//                 </TouchableOpacity>

//                  {/* --- Alternative Button (Pressable - Commented Out) ---
//                  <Pressable
//                       style={({ pressed }) => [
//                           styles.topUpButton,
//                           isButtonDisabled && styles.disabledButton,
//                           pressed && { opacity: 0.7 }
//                       ]}
//                       onPress={() => {
//                           console.log("Proceed Button (Pressable) PRESSED! State -> isLoading:", isLoading, "amount:", amount, "isDisabled:", isButtonDisabled);
//                           Alert.alert("Pressable Pressed! Check Console.");
//                           // handleProceed(); // Call handleProceed ONLY AFTER confirming the press works
//                       }}
//                       disabled={isButtonDisabled} >
//                       <Text style={styles.topUpButtonText}>
//                         {selectedPaymentMethod === 'stripe' ? 'Proceed to Payment' : 'Submit Bank Transfer'}
//                       </Text>
//                  </Pressable>
//                  */}

//               </>
//             )}
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//       <Navbar />
//     </SafeAreaView>
//   );
// };

// // --- Styles (Keep the full styles definition from previous versions) ---
// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#fefefe' },
//     keyboardAvoidingView: { flex: 1 },
//     scrollContent: { flexGrow: 1, paddingBottom: 80 },
//     header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingHorizontal: 20, backgroundColor: '#113a78' },
//     backButton: { position: 'absolute', left: 15, top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: 10, zIndex: 1 },
//     backIcon: { width: 20, height: 20, tintColor: '#fff' },
//     title: { fontFamily: 'Inter', fontSize: 20, fontWeight: '600', color: '#ffffff', textAlign: 'center', flex: 1, marginLeft: 40, marginRight: 40 },
//     amountSection: { padding: 20 },
//     sectionTitle: { fontFamily: 'Inter', fontSize: 18, fontWeight: '600', color: '#113a78', marginBottom: 15 },
//     amountInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 15, marginBottom: 20 },
//     currencySymbol: { fontFamily: 'Inter', fontSize: 24, fontWeight: '500', color: '#113a78', marginRight: 10 },
//     amountInput: { flex: 1, fontFamily: 'Inter', fontSize: 24, color: '#113a78', paddingVertical: 15, height: 55 },
//     presetAmountsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
//     presetButton: { width: '48%', backgroundColor: '#e6effc', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10, height: 50, justifyContent: 'center' },
//     selectedPresetButton: { backgroundColor: '#113a78' },
//     disabledPresetButton: { backgroundColor: '#e0e0e0', opacity: 0.6 },
//     presetButtonText: { fontFamily: 'Inter', fontSize: 16, color: '#113a78', fontWeight: '500' },
//     selectedPresetButtonText: { color: '#ffffff' },
//     disabledPresetText: { color: '#999' },
//     paymentMethodSection: { padding: 20, borderTopWidth: 10, borderTopColor: '#f0f0f0' },
//     paymentOptions: { marginTop: 10 },
//     paymentOption: { flexDirection: 'row', alignItems: 'center', padding: 15, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 15, backgroundColor: '#f9f9f9', minHeight: 60 },
//     selectedPaymentOption: { borderColor: '#113a78', backgroundColor: '#e6effc' },
//     paymentOptionIcon: { width: 30, height: 30, marginRight: 15 },
//     paymentOptionText: { fontFamily: 'Inter', fontSize: 16, fontWeight: '500', color: '#113a78', flex: 1 },
//     selectedIndicator: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#113a78' },
//     bankInstructionsSection: { padding: 20, borderTopWidth: 10, borderTopColor: '#f0f0f0' },
//     instructionText: { fontFamily: 'Inter', fontSize: 14, color: '#333', marginBottom: 10, lineHeight: 20 },
//     bankDetails: { backgroundColor: '#f0f6ff', padding: 15, borderRadius: 8, marginVertical: 10, borderWidth: 1, borderColor: '#d6eaff' },
//     bankDetailText: { fontFamily: 'Inter', fontSize: 14, color: '#113a78', marginBottom: 5 },
//     noteText: { fontFamily: 'Inter', fontSize: 12, fontStyle: 'italic', color: '#666', marginTop: 10 },
//     buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fefefe', marginTop: 20 },
//     loader: { flex: 1, alignSelf: 'center', height: 55 },
//     cancelButton: { flex: 1, backgroundColor: '#f0f0f0', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginRight: 10, height: 55, justifyContent: 'center' },
//     cancelButtonText: { fontFamily: 'Inter', fontSize: 16, fontWeight: '500', color: '#666' },
//     topUpButton: { flex: 1, backgroundColor: '#113a78', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginLeft: 10, height: 55, justifyContent: 'center' },
//     disabledButton: { backgroundColor: '#ccc', opacity: 0.7 },
//     topUpButtonText: { fontFamily: 'Inter', fontSize: 16, fontWeight: '500', color: '#ffffff' },
// });

// export default WalletTopUp;



// screens/WalletTopUp.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, SafeAreaView, StyleSheet, TextInput, TouchableOpacity,
  Pressable, Image, ScrollView, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { WalletService } from '../services/wallet';
import Navbar from '../components/Navbar';

// --- Interfaces and Constants (Keep as before) ---
interface PresetAmount { value: number; label: string; }
const presetAmounts: PresetAmount[] = [
    { value: 500, label: '500 Rs.' }, { value: 1000, label: '1000 Rs.' },
    { value: 2000, label: '2000 Rs.' }, { value: 5000, label: '5000 Rs.' }, ];
const MINIMUM_STRIPE_AMOUNT_PKR = 200;

const WalletTopUp: React.FC = () => {
  const navigation = useNavigation();
  const [amount, setAmount] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'bank'>('stripe');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // --- Hooks (Keep handleDeepLink, useEffect, useFocusEffect as before) ---
  const handleDeepLink = useCallback(async (event: { url: string }) => { /* ... no changes needed ... */
    console.log('Deep link received:', event.url); if (isVerifying) return; setIsLoading(true); setIsVerifying(true); try { const url = new URL(event.url); const sessionId = url.searchParams.get('session_id'); if (event.url.includes('/success') && sessionId) { const result = await WalletService.verifyPayment({ checkout_session_id: sessionId }); if (result.success) Alert.alert('Success', result.message || 'Wallet topped up!', [{ text: 'OK', onPress: () => navigation.navigate('Wallet' as never) }]); else Alert.alert('Verification Failed', result.message || 'Could not confirm status.'); } else if (event.url.includes('/cancel')) { Alert.alert('Payment Cancelled', 'Top-up was cancelled.'); } else { console.log('Ignored deep link:', event.url); setIsLoading(false); } } catch (error: any) { console.error("Deep link / Verify error:", error); Alert.alert('Error', error.message || 'Error processing payment result.'); setIsLoading(false); } finally { if (!event.url.includes('/success')) setIsLoading(false); setIsVerifying(false); }
   }, [navigation, isVerifying]);
  useEffect(() => { const sub = Linking.addEventListener('url', handleDeepLink); Linking.getInitialURL().then(url => { if (url) handleDeepLink({ url }); }); return () => { sub.remove(); }; }, [handleDeepLink]);
  useFocusEffect( useCallback(() => { if (!isVerifying) setIsLoading(false); }, [isVerifying]) );
  // --- End Hooks ---

  // --- Input Handlers (Keep as before) ---
  const handlePresetSelect = (presetAmount: PresetAmount) => { setSelectedPreset(presetAmount.value); setAmount(presetAmount.value.toString()); };
  const handleAmountChange = (text: string) => { const numVal = text.replace(/[^0-9]/g, ''); setAmount(numVal); if (numVal === '' || parseInt(numVal, 10) >= MINIMUM_STRIPE_AMOUNT_PKR) setSelectedPreset(null); };
  // --- End Input Handlers ---

  // --- handleProceed (Keep version with logs, BUT IT WON'T BE CALLED YET) ---
  const handleProceed = async () => { console.log("handleProceed triggered."); /* ... rest of function ... */ };
  // --- End handleProceed ---

  // --- Calculate disabled state BEFORE return ---
  const isButtonDisabled = isLoading || !amount || parseInt(amount, 10) <= 0 || (selectedPaymentMethod === 'stripe' && parseInt(amount, 10) < MINIMUM_STRIPE_AMOUNT_PKR);

  // --- RENDER-TIME LOGS (Keep these) ---
  console.log('--- COMPONENT RENDER ---');
  console.log('isLoading:', isLoading); console.log('isVerifying:', isVerifying); console.log('amount:', amount); console.log('selectedPaymentMethod:', selectedPaymentMethod); console.log('Calculated isButtonDisabled:', isButtonDisabled); console.log('------------------------');
  // --- END RENDER-TIME LOGS ---

  return (
    <SafeAreaView style={styles.container}>

      {/* --- LAYOUT SIMPLIFICATION FOR DEBUGGING --- */}
      {/* --- Comment out KeyboardAvoidingView and ScrollView --- */}
      {/* <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView} > */}
      {/* <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled"> */}

          {/* Header (Keep) */}
          <View style={styles.header}>
             <TouchableOpacity style={styles.backButton} onPress={() => !isLoading && navigation.goBack()} disabled={isLoading}>
               <Image source={require('../assets/images/White Back icon.png')} style={styles.backIcon} resizeMode="contain" />
             </TouchableOpacity>
             <Text style={styles.title}>Top Up Wallet</Text>
           </View>

           {/* Amount Section (Keep) */}
           <View style={styles.amountSection}>
             <Text style={styles.sectionTitle}>Enter Amount</Text>
             <View style={styles.amountInputContainer}>
                 <Text style={styles.currencySymbol}>Rs.</Text>
                 <TextInput style={styles.amountInput} value={amount} onChangeText={handleAmountChange} keyboardType="numeric" placeholder={MINIMUM_STRIPE_AMOUNT_PKR.toString()} placeholderTextColor="#aaa" editable={!isLoading} />
             </View>
             {/* Preset buttons can be kept or commented out for extreme simplification */}
             <View style={styles.presetAmountsContainer}>
                {/* ... preset buttons ... */}
             </View>
           </View>

           {/* Payment Method Section (Keep) */}
           <View style={styles.paymentMethodSection}>
             {/* ... payment method options ... */}
           </View>
           {/* Bank Instructions (Keep conditional render) */}
           {selectedPaymentMethod === 'bank' && ( <View style={styles.bankInstructionsSection}> {/* ... */} </View> )}

          {/* --- Bottom Buttons Area (Rendered directly under sections) --- */}
          {/* Add a background color to visually check its position/overlap */}
          <View style={[styles.buttonContainer, { backgroundColor: 'rgba(255, 255, 0, 0.3)' }]}>
            {isLoading ? ( <ActivityIndicator size="large" color="#113a78" style={styles.loader} /> ) : (
              <>
                <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                {/* --- Test Button (TouchableOpacity) --- */}
                <TouchableOpacity
                  style={[ styles.topUpButton, isButtonDisabled && styles.disabledButton, {backgroundColor: 'rgba(0, 255, 0, 0.5)'} ]} // Added green background
                  // -- Direct onPress log and Alert --
                  onPress={() => {
                      // *** THIS IS THE KEY TEST ***
                      console.log("Proceed Button (TouchableOpacity - Simplified Layout) PRESSED!");
                      Alert.alert("Button Pressed!", `Is Button Disabled? ${isButtonDisabled}`);
                      // --- DO NOT CALL handleProceed() yet ---
                  }}
                  disabled={isButtonDisabled} >
                  <Text style={styles.topUpButtonText}> Proceed to Payment </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
      {/* </ScrollView> */}
      {/* </KeyboardAvoidingView> */}

      {/* Keep Navbar outside the commented wrappers */}
      <Navbar />
    </SafeAreaView>
  );
};

// --- Styles (Keep the full styles definition from previous versions) ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fefefe' },
    // keyboardAvoidingView: { flex: 1 }, // Commented out for debug
    // scrollContent: { flexGrow: 1, paddingBottom: 80 }, // Commented out for debug
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingHorizontal: 20, backgroundColor: '#113a78' },
    backButton: { position: 'absolute', left: 15, top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: 10, zIndex: 1 },
    backIcon: { width: 20, height: 20, tintColor: '#fff' },
    title: { fontFamily: 'Inter', fontSize: 20, fontWeight: '600', color: '#ffffff', textAlign: 'center', flex: 1, marginLeft: 40, marginRight: 40 },
    amountSection: { padding: 20 },
    sectionTitle: { fontFamily: 'Inter', fontSize: 18, fontWeight: '600', color: '#113a78', marginBottom: 15 },
    amountInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 15, marginBottom: 20 },
    currencySymbol: { fontFamily: 'Inter', fontSize: 24, fontWeight: '500', color: '#113a78', marginRight: 10 },
    amountInput: { flex: 1, fontFamily: 'Inter', fontSize: 24, color: '#113a78', paddingVertical: 15, height: 55 },
    presetAmountsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    presetButton: { width: '48%', backgroundColor: '#e6effc', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10, height: 50, justifyContent: 'center' },
    selectedPresetButton: { backgroundColor: '#113a78' },
    disabledPresetButton: { backgroundColor: '#e0e0e0', opacity: 0.6 },
    presetButtonText: { fontFamily: 'Inter', fontSize: 16, color: '#113a78', fontWeight: '500' },
    selectedPresetButtonText: { color: '#ffffff' },
    disabledPresetText: { color: '#999' },
    paymentMethodSection: { padding: 20, borderTopWidth: 10, borderTopColor: '#f0f0f0' },
    paymentOptions: { marginTop: 10 },
    paymentOption: { flexDirection: 'row', alignItems: 'center', padding: 15, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 15, backgroundColor: '#f9f9f9', minHeight: 60 },
    selectedPaymentOption: { borderColor: '#113a78', backgroundColor: '#e6effc' },
    paymentOptionIcon: { width: 30, height: 30, marginRight: 15 },
    paymentOptionText: { fontFamily: 'Inter', fontSize: 16, fontWeight: '500', color: '#113a78', flex: 1 },
    selectedIndicator: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#113a78' },
    bankInstructionsSection: { padding: 20, borderTopWidth: 10, borderTopColor: '#f0f0f0' },
    instructionText: { fontFamily: 'Inter', fontSize: 14, color: '#333', marginBottom: 10, lineHeight: 20 },
    bankDetails: { backgroundColor: '#f0f6ff', padding: 15, borderRadius: 8, marginVertical: 10, borderWidth: 1, borderColor: '#d6eaff' },
    bankDetailText: { fontFamily: 'Inter', fontSize: 14, color: '#113a78', marginBottom: 5 },
    noteText: { fontFamily: 'Inter', fontSize: 12, fontStyle: 'italic', color: '#666', marginTop: 10 },
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fefefe', marginTop: 20 },
    loader: { flex: 1, alignSelf: 'center', height: 55 },
    cancelButton: { flex: 1, backgroundColor: '#f0f0f0', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginRight: 10, height: 55, justifyContent: 'center' },
    cancelButtonText: { fontFamily: 'Inter', fontSize: 16, fontWeight: '500', color: '#666' },
    topUpButton: { flex: 1, backgroundColor: '#113a78', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginLeft: 10, height: 55, justifyContent: 'center' },
    disabledButton: { backgroundColor: '#ccc', opacity: 0.7 },
    topUpButtonText: { fontFamily: 'Inter', fontSize: 16, fontWeight: '500', color: '#ffffff' },
});

export default WalletTopUp;