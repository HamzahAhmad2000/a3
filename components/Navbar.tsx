// components/Navbar.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface NavbarProps {
  currentRoute?: string;
}

const Navbar: React.FC<NavbarProps> = ({ currentRoute }) => {
  const navigation = useNavigation();

  const handleHomePress = () => {
    navigation.navigate('Homepage' as never);
  };

  const handleSearchPress = () => {
    navigation.navigate('JoinRide' as never);
  };

  const handleMessagingPress = () => {
    navigation.navigate('Inbox' as never);
  };

  const handleFriendsPress = () => {
    navigation.navigate('Friends' as never);
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile' as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.rectangle}>
        <TouchableOpacity onPress={handleHomePress} style={styles.iconButton}>
          <Image
            source={currentRoute === 'Homepage' 
              ? require('../assets/images/Blue Home Nav Bar.png')
              : require('../assets/images/Blue Home Nav Bar.png')
            }
            style={[
              styles.navIcon,
              currentRoute !== 'Homepage' && styles.inactiveIcon
            ]}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleSearchPress} style={styles.iconButton}>
          <Image
            source={currentRoute === 'JoinRide' 
              ? require('../assets/images/Blue Search Icon.png')
              : require('../assets/images/Blue Search Icon.png')
            }
            style={[
              styles.navIcon,
              currentRoute !== 'JoinRide' && styles.inactiveIcon
            ]}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('CreateTripStep1' as never)} style={styles.rideButton}>
          <Image
            source={require('../assets/images/White Ride Button.png')}
            style={styles.rideButtonIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleMessagingPress} style={styles.iconButton}>
          <Image
            source={currentRoute === 'Inbox' || currentRoute === 'Chat'
              ? require('../assets/images/Blue Messaging Icon.png')
              : require('../assets/images/Grey Messaging Icon.png')
            }
            style={styles.navIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleFriendsPress} style={styles.iconButton}>
          <Image
            source={currentRoute === 'Friends'
              ? require('../assets/images/Peers.png')
              : require('../assets/images/Peers.png')
            }
            style={styles.navIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleProfilePress} style={styles.iconButton}>
          <Image
            source={currentRoute === 'Profile'
              ? require('../assets/images/Blue Profule icon.png')
              : require('../assets/images/Grey Profile Icon.png')
            }
            style={styles.navIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: 80,
    bottom: 0,
    left: 0,
    right: 0,
  },
  rectangle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#fefefe',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  iconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  rideButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    backgroundColor: '#113a78',
    borderRadius: 22,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
  },
  rideButtonIcon: {
    width: 50,
    height: 50,
  },
  navIcon: {
    width: 28,
    height: 28,
  },
  inactiveIcon: {
    opacity: 0.6,
  },
});

export default Navbar;