import React, { useState, useMemo, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  Pressable, 
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  MapPin, 
  Target, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Map as MapIcon,
  CheckCircle2,
  ArrowLeft,
  Activity
} from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

// Hierarchical Data (Simplified for Demo / Indian Context)
// In a real app, these would come from the same JSON files or an API
const INDIAN_STATES = ["Tamil Nadu", "Karnataka", "Kerala", "Maharashtra", "Delhi"];
const DISTRICTS = {
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem"],
  "Karnataka": ["Bangalore", "Mysore", "Hubli"],
};
const CITIES = {
  "Coimbatore": ["Coimbatore North", "Coimbatore South", "RS Puram", "Gandhipuram"],
  "Chennai": ["Adyar", "Anna Nagar", "T. Nagar"],
};

export default function SmartVenueSetup() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  
  const [venue, setVenue] = useState({
    name: '',
    address: '',
    country: 'India',
    state: '',
    district: '',
    city: '',
    pincode: '',
    latitude: 11.0168,
    longitude: 76.9558
  });

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Auto-fetch Pincode when City changes
  useEffect(() => {
    if (venue.city && venue.country === 'India') {
      const fetchPincode = async () => {
        const { data } = await supabase
          .from('location_master')
          .select('pincode')
          .eq('city', venue.city)
          .limit(1);
        
        if (data && data.length > 0) {
          setVenue(prev => ({ ...prev, pincode: data[0].pincode }));
        }
      };
      fetchPincode();
    }
  }, [venue.city]);

  const detectLocation = async () => {
    setGeoLoading(true);
    try {
      // Note: expo-location would be used here in a real environment
      // const { status } = await Location.requestForegroundPermissionsAsync();
      // const loc = await Location.getCurrentPositionAsync({});
      
      // Simulating reverse geocoding for now
      setTimeout(() => {
        setVenue(prev => ({
          ...prev,
          address: "123, Avinashi Road, Coimbatore, Tamil Nadu, 641018",
          state: "Tamil Nadu",
          district: "Coimbatore",
          city: "Coimbatore North",
          pincode: "641018"
        }));
        setGeoLoading(false);
        Alert.alert("Location Detected", "Address fields have been auto-filled based on your GPS.");
      }, 1500);
    } catch (error) {
      setGeoLoading(false);
      Alert.alert("Error", "Could not fetch live location.");
    }
  };

  const renderDropdown = (label: string, field: string, options: string[]) => {
    const isOpen = activeDropdown === field;
    
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <Pressable 
          style={[styles.dropdownTrigger, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setActiveDropdown(isOpen ? null : field)}
        >
          <Text style={[styles.dropdownValue, { color: (venue as any)[field] ? colors.text : colors.muted }]}>
            {(venue as any)[field] || `Select ${label}`}
          </Text>
          <ChevronDown size={18} color={colors.muted} />
        </Pressable>

        <AnimatePresence>
          {isOpen && (
            <MotiView 
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={styles.dropdownList}
            >
              {options.map((opt) => (
                <Pressable 
                  key={opt}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setVenue(prev => ({ ...prev, [field]: opt }));
                    setActiveDropdown(null);
                  }}
                >
                  <Text style={[styles.dropdownItemText, { color: colors.text }]}>{opt}</Text>
                  {(venue as any)[field] === opt && <CheckCircle2 size={16} color="#f844a4" />}
                </Pressable>
              ))}
            </MotiView>
          )}
        </AnimatePresence>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#f844a4', '#a855f7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Venue Setup</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color="#f844a4" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Smart Location</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Venue Name*</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={venue.name}
              onChangeText={(t) => setVenue({...venue, name: t})}
              placeholder="e.g. Nehru Stadium"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Address*</Text>
            <TextInput 
              style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={venue.address}
              onChangeText={(t) => setVenue({...venue, address: t})}
              placeholder="Building, Street, Area"
              placeholderTextColor={colors.muted}
              multiline
            />
          </View>

          <Pressable 
            style={[styles.detectButton, geoLoading && styles.disabledButton]}
            onPress={detectLocation}
            disabled={geoLoading}
          >
            {geoLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Target size={18} color="#fff" />
                <Text style={styles.detectButtonText}>Detect Current Location</Text>
              </>
            )}
          </Pressable>

          <View style={styles.grid}>
            {renderDropdown("State", "state", INDIAN_STATES)}
            {renderDropdown("District", "district", (DISTRICTS as any)[venue.state] || [])}
          </View>

          {renderDropdown("City", "city", (CITIES as any)[venue.district] || [])}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Pincode / Zip Code</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={venue.pincode}
              onChangeText={(t) => setVenue({...venue, pincode: t})}
              placeholder="Auto-fills on City select"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.mapPlaceholder}>
            <MapIcon size={32} color={colors.muted} />
            <Text style={[styles.mapPlaceholderText, { color: colors.muted }]}>Live Map Pin Integration</Text>
            <Text style={[styles.mapCoords, { color: colors.muted }]}>Lat: {venue.latitude}, Lng: {venue.longitude}</Text>
          </View>
        </View>

        <Pressable 
          style={styles.saveButton}
          onPress={() => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              Alert.alert("Success", "Venue details saved and synced to cloud.");
              router.back();
            }, 1000);
          }}
        >
          <Text style={styles.saveButtonText}>{loading ? "Syncing..." : "Save Venue Details"}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#6366f1',
    height: 50,
    borderRadius: 16,
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  detectButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    gap: 15,
  },
  dropdownTrigger: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownList: {
    backgroundColor: '#f8fafc',
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dropdownItem: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '700',
  },
  mapPlaceholder: {
    height: 150,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  mapPlaceholderText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mapCoords: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#000',
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});
