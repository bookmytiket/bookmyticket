import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/Theme';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Linking, Alert } from 'react-native';

export default function WebHeader() {
  const { user, logout, selectedCity } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation();

  const userBookings = useQuery(api.bookings.getByUser, user?.identifier ? { userId: user.identifier } : "skip") || [];
  const activeMeeting = userBookings.find(b => (b.virtual || b.eventType === "Online" || b.meetingUrl) && b.status !== 'Cancelled');

  const isStaff = user?.role === 'staff';

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {/* Left placeholder for centering */}
        <View style={styles.leftPlaceholder} />

        {/* Centered Logo */}
        <TouchableOpacity 
          onPress={() => !isStaff && navigation.navigate('MainTabs', { screen: 'Home' })} 
          activeOpacity={isStaff ? 1 : 0.7}
          style={styles.logoWrapper}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
          />
        </TouchableOpacity>

        {/* Right Menu Icon */}
        <TouchableOpacity 
          style={styles.menuBtn}
          onPress={() => setMenuVisible(!menuVisible)}
          activeOpacity={0.7}
        >
          <Ionicons name={menuVisible ? "close-outline" : "menu-outline"} size={30} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu */}
      {menuVisible && (
        <View style={styles.dropdown}>
          {user ? (
            <>
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('MainTabs', { screen: 'Profile' });
                }}
              >
                <Ionicons name="person-outline" size={20} color={Colors.text} />
                <Text style={styles.menuItemText}>Profile</Text>
              </TouchableOpacity>
              
              {activeMeeting && (
                <TouchableOpacity 
                  style={[styles.menuItem, { backgroundColor: '#f0fdf4' }]} 
                  onPress={() => {
                    setMenuVisible(false);
                    const url = activeMeeting.meetingUrl;
                    const isInternal = url?.toLowerCase().includes("organiser") || url?.toLowerCase().includes("admin") || url?.toLowerCase().includes("vendor");
                    
                    if (!url || isInternal) {
                      Alert.alert("Notice", "Meeting has not started yet or the link is still being prepared. Please check back in a few minutes.");
                      return;
                    }
                    
                    const baseUrl = "https://bookmyticket.net";
                    const target = (url.startsWith("http://") || url.startsWith("https://")) ? url : `${baseUrl}/${url}`;
                    Linking.openURL(target).catch(err => console.error("Couldn't load meeting page", err));
                  }}
                >
                  <Ionicons name="videocam" size={20} color="#059669" />
                  <Text style={[styles.menuItemText, { color: '#059669' }]}>Join Session</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  logout();
                }}
              >
                <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                <Text style={[styles.menuItemText, { color: Colors.error }]}>Sign Out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('SignIn');
              }}
            >
              <Ionicons name="log-in-outline" size={20} color={Colors.text} />
              <Text style={styles.menuItemText}>Sign in</Text>
            </TouchableOpacity>
          )}
          
          {!isStaff && (
            <>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('BecomePartner');
                }}
              >
                <Ionicons name="business-outline" size={20} color={Colors.text} />
                <Text style={styles.menuItemText}>Become a Partner</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Bottom Row: City Selector (Hidden for staff) */}
      {!isStaff && (
        <View style={styles.bottomRow}>
          <TouchableOpacity 
            style={styles.cityBtn} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Location')}
          >
            <Ionicons name="location" size={18} color={Colors.secondary} />
            <Text style={styles.cityText}>{selectedCity || "Select Location"}</Text>
            <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    zIndex: 1000,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  leftPlaceholder: {
    width: 60,
  },
  logoWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 70,
    resizeMode: 'contain',
  },
  menuBtn: {
    width: 60,
    alignItems: 'flex-end',
  },
  dropdown: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 60,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    width: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 2000,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  cityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cityText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
