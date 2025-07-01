import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthService } from '../services/auth';
import Navbar from '../components/Navbar';

interface SettingsItem {
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  color?: string;
}

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              // Clear all authentication data
              await AuthService.logout();
              
              // Reset navigation stack to login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' as never }],
              });
              
              console.log('✅ User successfully logged out from settings');
            } catch (error) {
              console.error('❌ Settings logout error:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const accountSettings: SettingsItem[] = [
    {
      title: 'Profile',
      subtitle: 'Edit your personal information',
      onPress: () => navigation.navigate('Profile' as never),
      showArrow: true,
    },
    {
      title: 'Friends',
      subtitle: 'Manage your friends and social connections',
      onPress: () => navigation.navigate('Friends' as never),
      showArrow: true,
    },
    {
      title: 'Wallet',
      subtitle: 'Manage payments and transactions',
      onPress: () => navigation.navigate('Wallet' as never),
      showArrow: true,
    },
    {
      title: 'Ride History',
      subtitle: 'View your past rides',
      onPress: () => navigation.navigate('RideHistory' as never),
      showArrow: true,
    },
  ];

  const driverSettings: SettingsItem[] = [
    {
      title: 'Become a Driver',
      subtitle: 'Apply to become a driver',
      onPress: () => navigation.navigate('DriverApplication' as never),
      showArrow: true,
    },
    {
      title: 'Admin Dashboard',
      subtitle: 'Access admin features (admin only)',
      onPress: () => navigation.navigate('AdminDashboard' as never),
      showArrow: true,
    },
  ];

  const appSettings: SettingsItem[] = [
    {
      title: 'Notifications',
      subtitle: 'Receive push notifications',
      onPress: () => {},
      showSwitch: true,
      switchValue: notificationsEnabled,
      onSwitchChange: setNotificationsEnabled,
    },
    {
      title: 'Location Services',
      subtitle: 'Allow location access for better experience',
      onPress: () => {},
      showSwitch: true,
      switchValue: locationEnabled,
      onSwitchChange: setLocationEnabled,
    },
    {
      title: 'Dark Mode',
      subtitle: 'Use dark theme',
      onPress: () => {},
      showSwitch: true,
      switchValue: darkModeEnabled,
      onSwitchChange: setDarkModeEnabled,
    },
  ];

  const supportSettings: SettingsItem[] = [
    {
      title: 'Emergency',
      subtitle: 'Access emergency features',
      onPress: () => navigation.navigate('Emergency' as never),
      showArrow: true,
      color: '#ff4444',
    },
    {
      title: 'Report Issue',
      subtitle: 'Report problems or safety concerns',
      onPress: () => navigation.navigate('Report' as never),
      showArrow: true,
    },
    {
      title: 'Integration Tests',
      subtitle: 'Test app functionality (development)',
      onPress: () => navigation.navigate('IntegrationTest' as never),
      showArrow: true,
    },
    {
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      onPress: () => Alert.alert('Help & Support', 'Contact support at support@ridematch.com'),
      showArrow: true,
    },
    {
      title: 'About',
      subtitle: 'App version and information',
      onPress: () => Alert.alert('About RideMatch', 'RideMatch v1.0.0\nBuilt for university students'),
      showArrow: true,
    },
  ];

  const renderSettingsItem = (item: SettingsItem) => (
    <TouchableOpacity
      key={item.title}
      style={styles.settingsItem}
      onPress={item.onPress}
      disabled={item.showSwitch}
    >
      <View style={styles.settingsItemContent}>
        <Text style={[styles.settingsItemTitle, item.color && { color: item.color }]}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={styles.settingsItemSubtitle}>{item.subtitle}</Text>
        )}
      </View>
      <View style={styles.settingsItemAction}>
        {item.showSwitch && (
          <Switch
            value={item.switchValue}
            onValueChange={item.onSwitchChange}
            trackColor={{ false: '#767577', true: '#113a78' }}
            thumbColor={item.switchValue ? '#ffffff' : '#f4f3f4'}
          />
        )}
        {item.showArrow && (
          <Text style={styles.arrow}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title: string, items: SettingsItem[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {items.map(renderSettingsItem)}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderSection('Account', accountSettings)}
        {renderSection('Driver & Admin', driverSettings)}
        {renderSection('App Settings', appSettings)}
        {renderSection('Support & Help', supportSettings)}

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Navbar currentRoute="Settings" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  header: {
    backgroundColor: '#fefefe',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 18,
    color: '#113a78',
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#113a78',
    textAlign: 'center',
    fontFamily: 'Inter',
    flex: 1,
  },
  headerSpacer: {
    width: 50,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    marginHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 10,
    marginLeft: 5,
    fontFamily: 'Inter',
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
    fontFamily: 'Inter',
  },
  settingsItemSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter',
  },
  settingsItemAction: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 20,
    color: '#cccccc',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginHorizontal: 15,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  bottomPadding: {
    height: 120,
  },
});

export default SettingsScreen;