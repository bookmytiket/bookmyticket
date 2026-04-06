import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  StatusBar
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/Theme';
import { COUNTRIES, POPULAR_CITIES } from '../data/locationData';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LocationScreen({ navigation }) {
  const { selectedCity, updateCity, locationHierarchy } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [activeCountry, setActiveCountry] = useState("India");

  const searchInputRef = useRef(null);

  // Photon API Autocomplete
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 1) {
        setLoading(true);
        try {
          const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=8`);
          const data = await res.json();
          const suggestions = data.features.map(f => ({
            id: f.properties.osm_id + "-" + Math.random(),
            name: f.properties.name,
            state: f.properties.state,
            country: f.properties.country,
            display: `${f.properties.name}${f.properties.state ? `, ${f.properties.state}` : ''}, ${f.properties.country}`,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0]
          }));
          setResults(suggestions);
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDetectLocation = async () => {
    setGeoLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
      const data = await res.json();
      const addr = data?.address || {};
      const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || 'Detected Location';
      
      updateCity(city, {
        city: city,
        lat: latitude,
        lng: longitude,
        country: addr.country,
        state: addr.state
      });
      navigation.goBack();
    } catch (err) {
      console.error(err);
      alert('Failed to detect location');
    } finally {
      setGeoLoading(false);
    }
  };

  const getCityIcon = (iconName, isActive) => {
    const color = isActive ? '#6366f1' : '#94a3b8';
    switch (iconName) {
      case 'Bengaluru': return <MaterialCommunityIcons name="office-building" size={36} color={color} />;
      case 'Mumbai': return <MaterialCommunityIcons name="bridge" size={36} color={color} />;
      case 'Delhi': return <FontAwesome5 name="fort-awesome" size={30} color={color} />;
      case 'Chennai': return <MaterialCommunityIcons name="castle" size={36} color={color} />;
      case 'Coimbatore': return <MaterialCommunityIcons name="clock-outline" size={36} color={color} />;
      case 'Hyderabad': return <MaterialCommunityIcons name="mosque" size={36} color={color} />;
      default: return <MaterialCommunityIcons name="city-variant-outline" size={36} color={color} />;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={26} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Your Location</Text>
        <View style={{ width: 26 }} />
    </View>
  );

  const renderSearch = () => (
    <View style={styles.searchContainer}>
        <View style={[styles.searchBar, searchQuery.length > 0 && styles.searchBarActive]}>
            <Ionicons name="search" size={20} color="#f84464" style={styles.searchIcon} />
            <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search For A Location..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#cbd5e1" />
                </TouchableOpacity>
            )}
            <View style={styles.vDivider} />
            <TouchableOpacity onPress={handleDetectLocation} style={styles.geoBtn}>
                {geoLoading ? (
                    <ActivityIndicator size="small" color="#f84464" />
                ) : (
                    <Ionicons name="location-outline" size={24} color="#f84464" />
                )}
            </TouchableOpacity>
        </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        {renderHeader()}
        {renderSearch()}

        <View style={styles.content}>
            {/* Search Results Overlay */}
            {searchQuery.length > 1 && (
                <View style={styles.resultsOverlay}>
                    {loading ? (
                        <ActivityIndicator style={{ marginTop: 20 }} color="#f84464" />
                    ) : (
                        <FlatList
                            data={results}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.resultItem}
                                    onPress={() => {
                                        updateCity(item.name, { city: item.name, state: item.state, country: item.country, lat: item.lat, lng: item.lng });
                                        navigation.goBack();
                                    }}
                                >
                                    <Ionicons name="location-sharp" size={20} color="#f84464" style={styles.resultIcon} />
                                    <View>
                                        <Text style={styles.resultName}>{item.name}</Text>
                                        <Text style={styles.resultDisplay}>{item.display}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={() => !loading && <Text style={styles.emptyText}>No locations found</Text>}
                        />
                    )}
                </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Country Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.countryTabs}>
                    {COUNTRIES.map(c => (
                        <TouchableOpacity 
                            key={c.label} 
                            style={[styles.countryTab, activeCountry === c.label && styles.activeCountryTab]}
                            onPress={() => setActiveCountry(c.label)}
                        >
                            <Text style={styles.countryFlag}>{c.flag}</Text>
                            <Text style={[styles.countryLabel, activeCountry === c.label && styles.activeCountryLabel]}>{c.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.sectionTitle}>Popular Cities</Text>
                
                <View style={styles.citiesGrid}>
                    {(POPULAR_CITIES[activeCountry] || POPULAR_CITIES["India"]).map(city => {
                        const isActive = selectedCity === city.name;
                        return (
                            <TouchableOpacity 
                                key={city.name} 
                                style={styles.cityCard}
                                onPress={() => {
                                    updateCity(city.name);
                                    navigation.goBack();
                                }}
                            >
                                <View style={[styles.cityIconBox, isActive && styles.activeCityIconBox]}>
                                    {city.image ? (
                                        <Image 
                                            source={city.image} 
                                            style={styles.cityImage}
                                            resizeMode="contain"
                                        />
                                    ) : (
                                        getCityIcon(city.icon, isActive)
                                    )}
                                </View>
                                <Text style={[styles.cityName, isActive && styles.activeCityName]} numberOfLines={1}>{city.name}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Footer Premium Illustration with Logo */}
                <View style={styles.footerWrap}>
                    <View style={styles.illustration}>
                         {/* Refined Skyline Illustration using subtle Views */}
                        <View style={styles.illusBarWrap}>
                            <View style={[styles.illusBar, { height: 35, width: 28 }]} />
                            <View style={[styles.illusBar, { height: 50, width: 22 }]} />
                            <View style={[styles.illusBar, { height: 75, width: 40 }]} />
                            <View style={[styles.illusBar, { height: 45, width: 32 }]} />
                            <View style={[styles.illusBar, { height: 90, width: 45 }]} />
                            <View style={[styles.illusBar, { height: 60, width: 25 }]} />
                            <View style={[styles.illusBar, { height: 40, width: 30 }]} />
                        </View>
                        <View style={styles.illusFloor} />
                        
                        {/* Branded Logo Overlay */}
                        <View style={styles.brandOverlay}>
                            <Image 
                                source={require('../../assets/logo.png')} 
                                style={styles.footerLogo}
                                resizeMode="contain"
                            />
                        </View>
                    </View>
                </View>


            </ScrollView>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  closeBtn: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 15,
  },
  searchBarActive: {
    borderColor: '#6366f1',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    height: '100%',
  },
  vDivider: {
    width: 1.5,
    height: 24,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  resultsOverlay: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: 400,
    zIndex: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  resultIcon: {
    marginRight: 15,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  resultDisplay: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  emptyText: {
    padding: 20,
    textAlign: 'center',
    color: '#94a3b8',
    fontWeight: '600',
  },
  countryTabs: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  countryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    marginRight: 10,
  },
  activeCountryTab: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  countryFlag: {
    fontSize: 18,
    marginRight: 8,
  },
  countryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  activeCountryLabel: {
    color: '#6366f1',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94a3b8',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  citiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  cityCard: {
    width: (SCREEN_WIDTH - 20) / 4,
    alignItems: 'center',
    marginBottom: 10,
  },
  cityIconBox: {
    width: '65%',
    aspectRatio: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    padding: 18,
  },
  activeCityIconBox: {
    borderColor: '#6366f1',
    borderWidth: 2,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  cityImage: {
    width: '100%',
    height: '100%',
    opacity: 0.95,
  },
  cityName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    textAlign: 'center',
  },
  activeCityName: {
    color: '#6366f1',
  },
  footerWrap: {
    paddingBottom: 40,
    marginTop: 20,
    alignItems: 'center',
  },
  illustration: {
    width: '100%',
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  illusBarWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    opacity: 0.25,
  },
  illusBar: {
    backgroundColor: '#94a3b8',
    borderRadius: 5,
    marginHorizontal: 2.5,
  },
  illusFloor: {
    width: '90%',
    height: 2,
    backgroundColor: '#f1f5f9',
    marginTop: -1,
  },
  brandOverlay: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
    width: '100%',
  },
  footerLogo: {
    width: 140,
    height: 45,
    opacity: 0.8,
  }
});
