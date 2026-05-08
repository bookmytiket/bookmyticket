import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Alert, Dimensions, Image, Platform } from 'react-native';
import { Search, MapPin, X as CloseIcon, Navigation, Check, LocateFixed, Globe, Sparkles, ChevronRight, Loader2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useLocation } from '@/context/LocationContext';
import * as Location from 'expo-location';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
 
const CITY_IMAGES: Record<string, any> = {
  "Bengaluru": require('../assets/images/cities/bengaluru.png'),
  "Chennai": require('../assets/images/cities/chennai.png'),
  "Coimbatore": require('../assets/images/cities/coimbatore.png'),
  "Hyderabad": require('../assets/images/cities/hyderabad.png'),
  "Kochi": require('../assets/images/cities/kochi.png'),
  "Kolkata": require('../assets/images/cities/kolkata.png'),
  "Delhi": require('../assets/images/cities/delhi.png'),
  "Mumbai": require('../assets/images/cities/mumbai.png'),
};
 
const POPULAR_CITIES = [
  // India
  { name: "Bengaluru", country: "India" },
  { name: "Chennai", country: "India" },
  { name: "Coimbatore", country: "India" },
  { name: "Hyderabad", country: "India" },
  { name: "Kochi", country: "India" },
  { name: "Kolkata", country: "India" },
  { name: "Delhi", country: "India" },
  { name: "Mumbai", country: "India" },
  
  // USA (Fallback to placeholder or add images if needed)
  { name: "New York", country: "United States" },
  { name: "Los Angeles", country: "United States" },
  
  // UAE
  { name: "Dubai", country: "UAE" },
  
  // Singapore
  { name: "Singapore", country: "Singapore" },
];

const COUNTRIES = [
  { id: "india", name: "India", flag: "🇮🇳" },
  { id: "usa", name: "United States", flag: "🇺🇸" },
  { id: "uae", name: "UAE", flag: "🇦🇪" },
  { id: "singapore", name: "Singapore", flag: "🇸🇬" },
  { id: "malaysia", name: "Malaysia", flag: "🇲🇾" },
  { id: "thailand", name: "Thailand", flag: "🇹🇭" },
  { id: "germany", name: "Germany", flag: "🇩🇪" },
];

interface LocationSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationSelectionModal({ isOpen, onClose }: LocationSelectionModalProps) {
  const { location: userLocation, setLocation } = useLocation();
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("India");
  const [geoLoading, setGeoLoading] = useState(false);
  const [allCities, setAllCities] = useState<any[]>([]);
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Ported Nominatim Search Functions
  const searchLocations = async (query: string) => {
    if (!query || query.length < 3) return [];
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      return data.map((item: any) => {
        const addr = item.address || {};
        const cityName = addr.city || addr.town || addr.village || addr.suburb || item.display_name.split(',')[0];
        return {
          name: cityName,
          full: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          details: addr
        };
      });
    } catch (err) {
      console.error("[Nominatim] Search failed:", err);
      return [];
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      const addr = data?.address || {};
      return {
        fullAddress: data.display_name || "",
        city: addr.city || addr.town || addr.village || addr.municipality || "",
        district: addr.state_district || addr.county || "",
        state: addr.state || "",
        country: addr.country || "India",
      };
    } catch (err) {
      console.error("[Nominatim] Reverse geocoding failed:", err);
      return null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Fetch verified cities from Supabase (Hybrid Search)
      supabase.from('cities')
        .select('name, district:districts(name, state:states(name, country:countries(name)))')
        .order('name')
        .then(({ data }) => {
          if (data) {
            const formatted = data.map(c => ({
              name: c.name,
              full: `${c.name}, ${c.district?.name || ''}, ${c.district?.state?.name || ''}, ${c.district?.state?.country?.name || ''}`.replace(/, , /g, ', ').replace(/, $/g, '')
            }));
            setAllCities(formatted);
          }
        });
    }
  }, [isOpen]);

  // Worldwide live search with debounce
  useEffect(() => {
    if (search.length >= 3) {
      const timer = setTimeout(async () => {
        setIsSearching(true);
        try {
          const results = await searchLocations(search);
          setLiveResults(results);
        } catch (err) {
          console.error("Live search failed:", err);
        } finally {
          setIsSearching(false);
        }
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setLiveResults([]);
    }
  }, [search]);

  const handleGeoLocation = async () => {
    if (geoLoading) return;
    setGeoLoading(true);
    
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Location access denied. Please enable permissions in your settings.");
        setGeoLoading(false);
        return;
      }

      let userLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = userLoc.coords;
      
      const geo = await reverseGeocode(latitude, longitude);
      if (geo && geo.city) {
        await setLocation({
          city: geo.city,
          state: geo.state,
          country: geo.country,
          latitude,
          longitude,
          address: geo.fullAddress
        });
        onClose();
      } else {
        Alert.alert("Location Detected", "We found your location but couldn't identify the city. Please select manually.");
      }
    } catch (error) {
      Alert.alert("Error", "Detecting location failed. Please search manually.");
    } finally {
      setGeoLoading(false);
    }
  };

  const filteredPopularCities = useMemo(() => {
    return POPULAR_CITIES.filter(c => 
      c.country === selectedCountry && 
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, selectedCountry]);

  const combinedResults = useMemo(() => {
    if (!search) return [];
    
    const dbMatches = allCities
      .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
      .map(c => ({ ...c, type: 'database' }));

    const apiMatches = liveResults
      .filter(lr => !dbMatches.some(dm => dm.name.toLowerCase() === lr.name.toLowerCase()))
      .map(lr => ({ ...lr, type: 'live' }));

    return [...dbMatches, ...apiMatches].slice(0, 10);
  }, [search, allCities, liveResults]);

  if (!isOpen) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
      <Pressable 
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)' }]} 
        onPress={onClose} 
      />
      <MotiView
        from={{ opacity: 0, scale: 0.9, translateY: 50 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        style={styles.modalContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.closeBtnPlaceholder} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>SELECT YOUR CITY</Text>
            <View style={styles.titleUnderline} />
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <CloseIcon size={20} color="#f844a4" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Search Engine */}
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Search size={20} color="#f844a4" />
              <TextInput 
                placeholder="Search for your city..."
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#94a3b8"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch("")} style={styles.clearBtn}>
                  <CloseIcon size={16} color="#64748b" />
                </Pressable>
              )}
              <View style={styles.searchDivider} />
              <Pressable 
                onPress={handleGeoLocation}
                disabled={geoLoading}
                style={({ pressed }) => [
                  styles.geoBtn,
                  pressed && { opacity: 0.7, scale: 0.95 }
                ]}
              >
                <View style={styles.geoIconContainer}>
                  {geoLoading && (
                    <MotiView
                      from={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      transition={{ loop: true, duration: 1000, type: 'timing' }}
                      style={styles.geoRadar}
                    />
                  )}
                  <MotiView
                    animate={{
                      rotate: geoLoading ? '360deg' : '0deg',
                      scale: geoLoading ? [1, 1.2, 1] : 1
                    }}
                    transition={{
                      rotate: { loop: true, duration: 2000, type: 'timing' },
                      scale: { loop: true, duration: 1000, type: 'timing' }
                    }}
                  >
                    <LocateFixed size={20} color={geoLoading ? "#f844a4" : "#f844a4"} />
                  </MotiView>
                </View>
              </Pressable>
            </View>

            {/* Live Search Results Overlay-like List */}
            {search.length >= 2 && (
              <View style={styles.resultsContainer}>
                {isSearching && combinedResults.length === 0 && (
                  <View style={styles.searchingState}>
                    <ActivityIndicator size="small" color="#f844a4" />
                    <Text style={styles.searchingText}>SCANNING...</Text>
                  </View>
                )}
                {combinedResults.map((city, idx) => (
                  <Pressable
                    key={`${city.type}-${idx}`}
                    onPress={async () => {
                      await setLocation({ 
                        city: city.name,
                        address: city.full,
                        latitude: city.lat,
                        longitude: city.lng
                      });
                      onClose();
                    }}
                    style={styles.resultItem}
                  >
                    <View style={styles.resultItemLeft}>
                      <View style={[styles.resultIcon, { backgroundColor: city.type === 'database' ? '#fdf2f8' : '#f8fafc' }]}>
                        <MapPin size={16} color={city.type === 'database' ? '#f844a4' : '#94a3b8'} />
                      </View>
                      <View>
                        <Text style={styles.resultName}>{city.name}</Text>
                        <Text style={styles.resultFull} numberOfLines={1}>{city.full}</Text>
                      </View>
                    </View>
                    <View style={[styles.typeBadge, { backgroundColor: city.type === 'database' ? '#f0fdf4' : '#f1f5f9' }]}>
                      <Text style={[styles.typeBadgeText, { color: city.type === 'database' ? '#10b981' : '#64748b' }]}>
                        {city.type === 'database' ? 'VERIFIED' : 'GLOBAL'}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Regional Filters */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.countryScroll}
          >
            {COUNTRIES.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setSelectedCountry(c.name)}
                style={[
                  styles.countryBtn,
                  selectedCountry === c.name && styles.countryBtnActive
                ]}
              >
                {selectedCountry === c.name ? (
                  <LinearGradient
                    colors={['#f844a4', '#a855f7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                ) : null}
                <Text style={styles.countryFlag}>{c.flag}</Text>
                <Text style={[
                  styles.countryName,
                  selectedCountry === c.name && styles.countryNameActive
                ]}>{c.name.toUpperCase()}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Popular Destinations Grid */}
          <View style={styles.popularSection}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.titleLine} />
              <Text style={styles.sectionTitle}>TOP DESTINATIONS</Text>
            </View>
            
            <View style={styles.citiesGrid}>
              {filteredPopularCities.map((city) => (
                <Pressable
                  key={city.name}
                  onPress={async () => {
                    await setLocation({ city: city.name });
                    onClose();
                  }}
                  style={styles.cityCard}
                >
                  <View style={[
                    styles.cityImageContainer,
                    userLocation.city === city.name && styles.cityImageActive
                  ]}>
                    <Image 
                      source={CITY_IMAGES[city.name] || { uri: `https://picsum.photos/seed/${city.name}/400/400` }} 
                      style={styles.cityImage}
                    />
                    <View style={styles.imagePlaceholder}>
                      <MapPin size={20} color="#f844a4" opacity={0.2} />
                    </View>
                    {userLocation.city === city.name && (
                      <View style={styles.checkBadge}>
                        <Check size={12} color="#fff" strokeWidth={4} />
                      </View>
                    )}
                  </View>
                  <Text style={[
                    styles.cityName,
                    userLocation.city === city.name && styles.cityNameActive
                  ]}>{city.name.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Footer Branding */}
          <View style={styles.footer}>
            <Image 
              source={require('../assets/images/logo_brand.png')} 
              style={styles.footerLogo}
              resizeMode="contain"
            />
            <View style={styles.footerDividerRow}>
              <View style={styles.footerLine} />
              <Text style={styles.footerText}>WORLDWIDE EXPERIENCE</Text>
              <View style={styles.footerLine} />
            </View>
          </View>
        </ScrollView>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    width: width * 0.95,
    height: height * 0.85,
    backgroundColor: '#fff',
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#f844a4',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(248, 68, 164, 0.1)',
    alignSelf: 'center',
    marginTop: Platform.OS === 'ios' ? 40 : 20, // Avoid notch
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#f844a4',
    letterSpacing: 1,
  },
  titleUnderline: {
    height: 3,
    width: 40,
    backgroundColor: '#a855f7',
    borderRadius: 2,
    marginTop: 4,
  },
  closeBtn: {
    padding: 12,
    backgroundColor: '#fff5f7',
    borderRadius: 22,
    zIndex: 99,
  },
  closeBtnPlaceholder: {
    width: 36, // Same as closeBtn width to balance the title
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginTop: 10,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 2,
    borderColor: '#f1f5f9',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  clearBtn: {
    padding: 4,
  },
  searchDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
  },
   geoBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  geoIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  geoRadar: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f844a4',
  },
  resultsContainer: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    maxHeight: 300,
    overflow: 'hidden',
  },
  searchingState: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  searchingText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  resultItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  resultFull: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 8,
    fontWeight: '900',
  },
  countryScroll: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f1f5f9',
    backgroundColor: '#fff',
    gap: 8,
    overflow: 'hidden',
  },
  countryBtnActive: {
    borderColor: 'transparent',
  },
  countryFlag: {
    fontSize: 18,
  },
  countryName: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  countryNameActive: {
    color: '#fff',
  },
  popularSection: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  titleLine: {
    width: 24,
    height: 2,
    backgroundColor: '#f844a4',
    borderRadius: 1,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 2,
  },
  citiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  cityCard: {
    width: (width * 0.95 - 60) / 3, // Precise 3-column width
    marginBottom: 24,
    alignItems: 'center',
    gap: 8,
  },
  cityImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#f1f5f9',
    backgroundColor: '#fff',
    padding: 4,
  },
  cityImageActive: {
    borderColor: '#f844a4',
    shadowColor: '#f844a4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  cityImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    zIndex: 2,
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  cityName: {
    fontSize: 8,
    fontWeight: '900',
    color: '#64748b',
    textAlign: 'center',
  },
  cityNameActive: {
    color: '#f844a4',
  },
  checkBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f844a4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    gap: 12,
  },
  footerLogo: {
    height: 32,
    width: 120,
  },
  footerDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerLine: {
    width: 40,
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  footerText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#cbd5e1',
    letterSpacing: 4,
  },
});
