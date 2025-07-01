import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserService } from '../services/user';
import * as ImagePicker from 'expo-image-picker';

interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  university: string;
  gender: string;
  gender_preference: string;
  emergency_contact: string;
  likes: string;
  dislikes: string;
  profile_image?: string;
  date_of_birth: string;
}

const EditProfile: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfile>({
    user_id: '',
    name: '',
    email: '',
    university: '',
    gender: '',
    gender_preference: '',
    emergency_contact: '',
    likes: '',
    dislikes: '',
    profile_image: '',
    date_of_birth: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const userProfile = await UserService.getProfile();
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validate required fields
      if (!profile.name.trim()) {
        Alert.alert('Validation Error', 'Name is required');
        return;
      }

      await UserService.updateProfile(profile);
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Select Profile Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => pickImage('camera') },
        { text: 'Gallery', onPress: () => pickImage('gallery') },
        { text: 'Remove Image', onPress: () => removeImage(), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
        return;
      }

      let result;
      if (source === 'camera') {
        const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus.status !== 'granted') {
          Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      setIsUploadingImage(true);
      const imageUrl = await UserService.uploadProfileImage(imageUri);
      setProfile(prev => ({ ...prev, profile_image: imageUrl }));
      Alert.alert('Success', 'Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = async () => {
    try {
      setIsUploadingImage(true);
      await UserService.deleteProfileImage();
      setProfile(prev => ({ ...prev, profile_image: '' }));
      Alert.alert('Success', 'Profile image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      Alert.alert('Error', 'Failed to remove image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const updateField = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#113a78" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#113a78" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View style={styles.imageSection}>
          <TouchableOpacity 
            style={styles.profileImageContainer} 
            onPress={handleImagePicker}
            disabled={isUploadingImage}
          >
            {isUploadingImage ? (
              <ActivityIndicator size="large" color="#113a78" />
            ) : profile.profile_image ? (
              <Image
                source={{ uri: `${UserService.getBaseURL()}${profile.profile_image}` }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={require('../assets/images/icon.png')}
                style={styles.profileImage}
                resizeMode="contain"
              />
            )}
            <View style={styles.imageOverlay}>
              <Text style={styles.imageOverlayText}>Tap to change</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={profile.name}
              onChangeText={(text) => updateField('name', text)}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={profile.email}
              editable={false}
              placeholder="Email address"
              placeholderTextColor="#999"
            />
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>University</Text>
            <TextInput
              style={styles.input}
              value={profile.university}
              onChangeText={(text) => updateField('university', text)}
              placeholder="Enter your university"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              {['Male', 'Female', 'Other'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderButton,
                    profile.gender === gender && styles.selectedGenderButton
                  ]}
                  onPress={() => updateField('gender', gender)}
                >
                  <Text style={[
                    styles.genderButtonText,
                    profile.gender === gender && styles.selectedGenderButtonText
                  ]}>
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender Preference</Text>
            <View style={styles.genderContainer}>
              {['Male', 'Female', 'No Preference'].map((preference) => (
                <TouchableOpacity
                  key={preference}
                  style={[
                    styles.genderButton,
                    profile.gender_preference === preference && styles.selectedGenderButton
                  ]}
                  onPress={() => updateField('gender_preference', preference)}
                >
                  <Text style={[
                    styles.genderButtonText,
                    profile.gender_preference === preference && styles.selectedGenderButtonText
                  ]}>
                    {preference}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <TextInput
              style={styles.input}
              value={profile.date_of_birth}
              onChangeText={(text) => updateField('date_of_birth', text)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Emergency Contact</Text>
            <TextInput
              style={styles.input}
              value={profile.emergency_contact}
              onChangeText={(text) => updateField('emergency_contact', text)}
              placeholder="Enter emergency contact number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Likes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={profile.likes}
              onChangeText={(text) => updateField('likes', text)}
              placeholder="What do you like? (music, hobbies, etc.)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dislikes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={profile.dislikes}
              onChangeText={(text) => updateField('dislikes', text)}
              placeholder="What do you dislike?"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  saveButton: {
    padding: 5,
    minWidth: 50,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#113a78',
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#f8f9fa',
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e6effc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#113a78',
    position: 'relative',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(17, 58, 120, 0.8)',
    paddingVertical: 5,
    alignItems: 'center',
  },
  imageOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  formSection: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter',
    backgroundColor: '#fff',
    color: '#333',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontFamily: 'Inter',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectedGenderButton: {
    backgroundColor: '#113a78',
    borderColor: '#113a78',
  },
  genderButtonText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  selectedGenderButtonText: {
    color: '#fff',
  },
  bottomPadding: {
    height: 50,
  },
});

export default EditProfile; 