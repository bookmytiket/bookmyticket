import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/Theme';

const CITIES = [
  { name: 'Bengaluru', icon: 'business-outline' },
  { name: 'Mumbai', icon: 'location-outline' },
  { name: 'Delhi', icon: 'trail-sign-outline' },
  { name: 'Chennai', icon: 'sunny-outline' },
  { name: 'Hyderabad', icon: 'home-outline' },
  { name: 'Coimbatore', icon: 'map-outline' },
  { name: 'Kochi', icon: 'boat-outline' },
  { name: 'Kolkata', icon: 'color-palette-outline' },
];

export default function LocationScreen({ navigation }) {
  const { selectedCity, updateCity } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCities = CITIES.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCity = (cityName) => {
    updateCity(cityName);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Select Location</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a city..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.textLight}
        />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Popular Cities</Text>
        <View style={styles.grid}>
          {filteredCities.map((city) => (
            <TouchableOpacity
              key={city.name}
              style={[
                styles.cityCard,
                selectedCity === city.name && styles.activeCityCard,
              ]}
              onPress={() => handleSelectCity(city.name)}
            >
              <View style={[
                styles.iconWrap,
                selectedCity === city.name && styles.activeIconWrap
              ]}>
                <Ionicons 
                  name={city.icon} 
                  size={24} 
                  color={selectedCity === city.name ? '#fff' : Colors.textLight} 
                />
              </View>
              <Text style={[
                styles.cityName,
                selectedCity === city.name && styles.activeCityName
              ]}>
                {city.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginTop: Platform.OS === 'android' ? 30 : 0,
  },
  backBtn: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cityCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  activeCityCard: {
    borderColor: Colors.primary,
    backgroundColor: '#fff',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  activeIconWrap: {
    backgroundColor: Colors.primary,
  },
  cityName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  activeCityName: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
