import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Alert, Modal, Dimensions } from 'react-native';
import { MapPin, Search, ChevronRight, X as CloseIcon, Navigation, Check, LocateFixed } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useLocation } from '@/context/LocationContext';
import * as Location from 'expo-location';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { MotiView } from 'moti';

const { width, height } = Dimensions.get('window');

interface HierarchicalLocationSelectorProps {
  onClose: () => void;
}

export default function HierarchicalLocationSelector({ onClose }: HierarchicalLocationSelectorProps) {
  const { location, setLocation } = useLocation();
  const [step, setStep] = useState<'country' | 'state' | 'district' | 'city' | 'map'>('country');
  
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedState, setSelectedState] = useState<any>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [mapRegion, setMapRegion] = useState({
    latitude: 11.0168,
    longitude: 76.9558,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    fetchCountries();
    handleDetectLocation(); // Auto-detect on mount
  }, []);

  const fetchCountries = async () => {
    setLoading(true);
    const { data } = await supabase.from('countries').select('*').order('name');
    if (data) setCountries(data);
    setLoading(false);
  };

  const fetchStates = async (countryId: string) => {
    setLoading(true);
    const { data } = await supabase.from('states').select('*').eq('country_id', countryId).order('name');
    if (data) setStates(data);
    setLoading(false);
  };

  const fetchDistricts = async (stateId: string) => {
    setLoading(true);
    const { data } = await supabase.from('districts').select('*').eq('state_id', stateId).order('name');
    if (data) setDistricts(data);
    setLoading(false);
  };

  const fetchCities = async (districtId: string) => {
    setLoading(true);
    const { data } = await supabase.from('cities').select('*').eq('district_id', districtId).order('name');
    if (data) setCities(data);
    setLoading(false);
  };

  const handleDetectLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions to use this feature.');
        return;
      }

      let userLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = userLoc.coords;
      
      setMapRegion({
        ...mapRegion,
        latitude,
        longitude,
      });
      setStep('map');
    } catch (error) {
      Alert.alert('Error', 'Could not detect location.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocation = async () => {
    const finalLocation = {
      country: selectedCountry?.name,
      state: selectedState?.name,
      district: selectedDistrict?.name,
      city: selectedCity?.name,
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
      address: `${selectedCity?.name}, ${selectedDistrict?.name}, ${selectedState?.name}`,
    };
    
    await setLocation(finalLocation);
    onClose();
  };

  const filteredItems = () => {
    const list = step === 'country' ? countries : 
                 step === 'state' ? states : 
                 step === 'district' ? districts : 
                 step === 'city' ? cities : [];
    
    return list.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const renderItem = (item: any) => (
    <Pressable 
      key={item.id} 
      style={styles.item}
      onPress={() => {
        setSearchQuery('');
        if (step === 'country') {
          setSelectedCountry(item);
          fetchStates(item.id);
          setStep('state');
        } else if (step === 'state') {
          setSelectedState(item);
          fetchDistricts(item.id);
          setStep('district');
        } else if (step === 'district') {
          setSelectedDistrict(item);
          fetchCities(item.id);
          setStep('city');
        } else if (step === 'city') {
          setSelectedCity(item);
          setStep('map');
        }
      }}
    >
      <View style={styles.itemLeft}>
        <MapPin size={20} color="#64748b" />
        <Text style={styles.itemName}>{item.name}</Text>
      </View>
      <ChevronRight size={20} color="#cbd5e1" />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Select Location</Text>
          <Text style={styles.subtitle}>
            {step === 'country' ? 'Worldwide' : 
             step === 'state' ? selectedCountry?.name : 
             step === 'district' ? `${selectedState?.name}, ${selectedCountry?.name}` : 
             step === 'city' ? `${selectedDistrict?.name}, ${selectedState?.name}` : 'Confirm on Map'}
          </Text>
        </View>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <CloseIcon size={24} color="#1e293b" />
        </Pressable>
      </View>

      {step !== 'map' && (
        <View style={styles.searchContainer}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            placeholder={`Search ${step}...`}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Auto-Detection Indicator */}
      <View style={styles.detectStatus}>
        <View style={styles.pulseDot} />
        <Text style={styles.detectStatusText}>Auto-Detection Active</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f844a4" />
        </View>
      ) : step === 'map' ? (
        <View style={{ flex: 1 }}>
          <MapView
            style={styles.map}
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
            mapType="none" // Disable native base layer
          >
            <UrlTile
              urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />
            <Marker coordinate={mapRegion} draggable />
          </MapView>
          <View style={styles.mapOverlay}>
             <Text style={styles.addressPreview}>
               {selectedCity?.name}, {selectedDistrict?.name}, {selectedState?.name}
             </Text>
             <Pressable style={styles.confirmBtn} onPress={handleSaveLocation}>
               <Text style={styles.confirmText}>Confirm Location</Text>
             </Pressable>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {filteredItems().map(renderItem)}
        </ScrollView>
      )}

      {/* Breadcrumbs */}
      {step !== 'country' && step !== 'map' && (
        <View style={styles.breadcrumbs}>
          <Pressable onPress={() => setStep('country')}><Text style={styles.breadcrumbText}>Countries</Text></Pressable>
          {selectedCountry && <ChevronRight size={14} color="#94a3b8" />}
          {selectedCountry && step !== 'state' && (
            <Pressable onPress={() => setStep('state')}><Text style={styles.breadcrumbText}>{selectedCountry.name}</Text></Pressable>
          )}
          {selectedState && step !== 'state' && step !== 'district' && <ChevronRight size={14} color="#94a3b8" />}
          {selectedState && step === 'city' && (
            <Pressable onPress={() => setStep('district')}><Text style={styles.breadcrumbText}>{selectedState.name}</Text></Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  closeBtn: { padding: 8 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginHorizontal: 24, marginTop: 24, height: 50, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  detectStatus: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginTop: 16, paddingVertical: 12, gap: 10 },
  detectStatusText: { fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  list: { flex: 1, marginTop: 8 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  itemName: { marginLeft: 16, fontSize: 15, fontWeight: '600', color: '#334155' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { flex: 1 },
  mapOverlay: { position: 'absolute', bottom: 24, left: 24, right: 24, backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  addressPreview: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 16, textAlign: 'center' },
  confirmBtn: { backgroundColor: '#f84464', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  breadcrumbs: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  breadcrumbText: { fontSize: 12, fontWeight: '700', color: '#f844a4', marginHorizontal: 4 },
});
