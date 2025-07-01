// components/MapLocationPicker.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

interface MapLocationPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onLocationSelect: (address: string, coordinates: LocationCoordinates) => void;
  initialLocation?: LocationCoordinates | null;
  initialAddress?: string;
  placeholderText?: string;
}

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  isVisible,
  onClose,
  onLocationSelect,
  initialLocation,
  initialAddress,
  placeholderText = 'Search location...',
}) => {
  const [location, setLocation] = useState<LocationCoordinates | null>(
    initialLocation || {
      latitude: 37.4221,
      longitude: -122.0841
    }
  );
  const [address, setAddress] = useState<string>(initialAddress || '');
  const [searchText, setSearchText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (isVisible && !initialLocation) {
      getCurrentLocation();
    }
  }, [isVisible]);

  const getCurrentLocation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Location permission not granted');
        setIsLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      
      setLocation(newLocation);
      await reverseGeocode(newLocation);
      
      // Update map location
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'updateLocation',
          location: newLocation
        }));
      }
    } catch (err) {
      setError('Failed to get current location');
      console.error('Error getting location:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const reverseGeocode = async (coordinates: LocationCoordinates) => {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });
      
      if (result.length > 0) {
        const loc = result[0];
        const addressComponents = [
          loc.name,
          loc.street,
          loc.city,
          loc.region,
          loc.country,
        ].filter(Boolean);
        
        const formattedAddress = addressComponents.join(', ');
        setAddress(formattedAddress);
      }
    } catch (err) {
      console.error('Error reverse geocoding:', err);
    }
  };

  const searchLocation = async () => {
    if (!searchText.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await Location.geocodeAsync(searchText);
      
      if (result.length > 0) {
        const newLocation = {
          latitude: result[0].latitude,
          longitude: result[0].longitude,
        };
        
        setLocation(newLocation);
        await reverseGeocode(newLocation);
        
        // Update map location
        if (webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({
            type: 'updateLocation',
            location: newLocation
          }));
        }
      } else {
        setError('Location not found');
      }
    } catch (err) {
      setError('Failed to search location');
      console.error('Error searching location:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLocation = () => {
    if (location && address) {
      onLocationSelect(address, location);
      onClose();
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'mapClick') {
        const newLocation = {
          latitude: data.lat,
          longitude: data.lng
        };
        setLocation(newLocation);
        reverseGeocode(newLocation);
      } else if (data.type === 'mapLoaded') {
        setMapLoaded(true);
      }
    } catch (err) {
      console.error('Error parsing WebView message:', err);
    }
  };

  // Create HTML content for the map
  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Map</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
            body { margin: 0; padding: 0; }
            #map { height: 100vh; width: 100vw; }
            .custom-marker {
                background-color: #ff4444;
                border: 3px solid white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
            let map;
            let marker;
            
            function initMap() {
                map = L.map('map').setView([${location?.latitude || 37.4221}, ${location?.longitude || -122.0841}], 13);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);
                
                // Add initial marker
                marker = L.circleMarker([${location?.latitude || 37.4221}, ${location?.longitude || -122.0841}], {
                    color: '#fff',
                    fillColor: '#ff4444',
                    fillOpacity: 1,
                    radius: 8,
                    weight: 3
                }).addTo(map);
                
                // Handle map clicks
                map.on('click', function(e) {
                    const lat = e.latlng.lat;
                    const lng = e.latlng.lng;
                    
                    // Update marker position
                    marker.setLatLng([lat, lng]);
                    
                    // Send location to React Native
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'mapClick',
                        lat: lat,
                        lng: lng
                    }));
                });
                
                // Notify React Native that map is loaded
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'mapLoaded'
                }));
            }
            
            // Listen for location updates from React Native
            document.addEventListener('message', function(event) {
                const data = JSON.parse(event.data);
                if (data.type === 'updateLocation' && map && marker) {
                    const newLatLng = [data.location.latitude, data.location.longitude];
                    map.setView(newLatLng, 13);
                    marker.setLatLng(newLatLng);
                }
            });
            
            window.addEventListener('message', function(event) {
                const data = JSON.parse(event.data);
                if (data.type === 'updateLocation' && map && marker) {
                    const newLatLng = [data.location.latitude, data.location.longitude];
                    map.setView(newLatLng, 13);
                    marker.setLatLng(newLatLng);
                }
            });
            
            // Initialize map when page loads
            initMap();
        </script>
    </body>
    </html>
  `;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Location</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={placeholderText}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={searchLocation}
            returnKeyType="search"
          />
          <TouchableOpacity 
            style={styles.searchButton} 
            onPress={searchLocation}
            disabled={isLoading}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.mapContainer}>
          {!mapLoaded && (
            <View style={styles.mapLoadingOverlay}>
              <ActivityIndicator size="large" color="#113a78" />
              <Text style={styles.loadingText}>Loading map...</Text>
            </View>
          )}
          
          <WebView
            ref={webViewRef}
            source={{ html: mapHTML }}
            style={styles.webView}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            onLoad={() => setMapLoaded(true)}
          />
          
          {location && (
            <View style={styles.coordinatesOverlay}>
              <Text style={styles.coordinatesText}>
                📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.addressText} numberOfLines={2}>
            {address || 'Tap on the map or search for a location'}
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.currentLocationButton} 
              onPress={getCurrentLocation}
              disabled={isLoading}
            >
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.currentLocationText}>Current Location</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.selectButton, (!location || !address) && styles.disabledButton]} 
              onPress={handleSelectLocation}
              disabled={!location || !address}
            >
              <Text style={styles.selectButtonText}>Select This Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#113a78',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#113a78',
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  errorText: {
    color: 'red',
    padding: 10,
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#113a78',
  },
  coordinatesOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(17, 58, 120, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 100,
  },
  coordinatesText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e6e6e6',
  },
  addressText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  currentLocationText: {
    fontSize: 14,
    color: '#113a78',
    fontWeight: '500',
  },
  selectButton: {
    backgroundColor: '#113a78',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MapLocationPicker;