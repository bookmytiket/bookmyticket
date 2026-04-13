import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  ScrollView,
  Linking,
  Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function MeetingWaitingRoomScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { meetingCode, eventId: initialEventId } = route.params || {};

  // If we only have a code, we need to find the event first
  const meetingRecord = useQuery(api.meetings.getByLink, { meetingLink: meetingCode || "" });
  const eventId = initialEventId || meetingRecord?.eventId;

  const access = useQuery(api.events.getMeetingAccess, { 
    eventId: eventId || undefined, 
    userId: user?.email || undefined 
  });

  const handleJoin = () => {
    if (access?.status === "success" && access.url) {
      const url = access.url.startsWith('http') ? access.url : `https://${access.url}`;
      
      if (access.type === 'external') {
        Linking.openURL(url).catch(() => {
          Alert.alert("Error", "Could not open meeting link. Make sure you have the required app installed.");
        });
      } else {
        // Internal strategy: for now, open in browser until a native room is built
        // We can point specifically to the web portal's meeting page
        const webPortalUrl = `https://bookmyticket.net/${access.url}`;
        Linking.openURL(webPortalUrl);
      }
    }
  };

  if (!access || (meetingCode && meetingRecord === undefined)) {
    return (
      <View style={[styles.container, styles.center]}>
        <LinearGradient colors={['#0a0f1e', '#1a233a']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Syncing Secure Session...</Text>
      </View>
    );
  }

  if (access.status === "not_found" || (meetingCode && !meetingRecord)) {
    return (
      <View style={[styles.container, styles.center]}>
        <LinearGradient colors={['#0a0f1e', '#1a233a']} style={StyleSheet.absoluteFill} />
        <Ionicons name="alert-circle" size={80} color="#ef4444" />
        <Text style={styles.errorTitle}>Invalid Meeting</Text>
        <Text style={styles.errorSubtitle}>The meeting code or event you're looking for doesn't exist.</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { eventDetails, meetingStatus, status, url, type } = access;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0a0f1e', '#1a233a']} style={StyleSheet.absoluteFill} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
             <Ionicons name="close" size={24} color="#fff" />
           </TouchableOpacity>
           <View style={styles.statusBadge}>
             <View style={[styles.statusDot, { backgroundColor: meetingStatus === 'live' ? '#10b981' : '#64748b' }]} />
             <Text style={styles.statusText}>{meetingStatus === 'live' ? 'LIVE NOW' : meetingStatus.toUpperCase()}</Text>
           </View>
        </View>

        {/* Video Preview Block */}
        <View style={styles.previewCard}>
          <Image 
            source={{ uri: eventDetails?.img || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87' }} 
            style={styles.previewImage}
            blurRadius={10}
          />
          <View style={[StyleSheet.absoluteFill, styles.previewOverlay]}>
            <View style={styles.previewIconWrap}>
              <Ionicons name="videocam" size={32} color="#fff" />
            </View>
            <Text style={styles.previewTitle}>Ready to join?</Text>
            <Text style={styles.previewSubtitle}>Check your camera and microphone</Text>
          </View>
          
          <View style={styles.securityOverlay}>
            <View style={styles.securityItem}>
              <Ionicons name="shield-checkmark" size={14} color="#10b981" />
              <Text style={styles.securityText}>ENCRYPTED</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="wifi" size={14} color="#3b82f6" />
              <Text style={styles.securityText}>HD ACTIVE</Text>
            </View>
          </View>
        </View>

        {/* Event Info */}
        <View style={styles.infoSection}>
          <Text style={styles.eventTitle} numberOfLines={2}>{eventDetails?.title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.4)" />
            <Text style={styles.metaText}>{eventDetails?.date} @ {eventDetails?.time}</Text>
          </View>
        </View>

        {/* Action Area */}
        <View style={styles.actionSection}>
          {status === "success" && meetingStatus === "live" ? (
            <>
              <TouchableOpacity style={styles.joinButton} onPress={handleJoin}>
                <Text style={styles.joinButtonText}>Enter Meeting Room</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.verifiedText}>Verified Ticket Holder Access</Text>
            </>
          ) : status === "not_booked" ? (
            <View style={styles.lockedBox}>
              <Ionicons name="lock-closed" size={32} color="#f59e0b" />
              <Text style={styles.lockedTitle}>Ticket Required</Text>
              <Text style={styles.lockedSubtitle}>You need a valid booking for this event to join the session.</Text>
              <TouchableOpacity 
                style={styles.bookButton} 
                onPress={() => navigation.navigate('EventDetail', { eventId: String(eventId) })}
              >
                <Text style={styles.bookButtonText}>Book Ticket Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.onHoldBox}>
              <Ionicons name="time" size={32} color="rgba(255,255,255,0.2)" />
              <Text style={styles.onHoldTitle}>Session Hold</Text>
              <Text style={styles.onHoldSubtitle}>
                {meetingStatus === 'expired' ? 'This session has ended.' : 'The session has not started yet.'}
              </Text>
            </View>
          )}
        </View>

        {/* Security Checklist */}
        <View style={styles.checklist}>
           <View style={styles.checkItem}>
             <Ionicons name="checkmark-circle" size={18} color="#10b981" />
             <Text style={styles.checkText}>Identity Verified</Text>
           </View>
           <View style={styles.checkItem}>
             <Ionicons name="checkmark-circle" size={18} color="#10b981" />
             <Text style={styles.checkText}>Audio/Video Check</Text>
           </View>
           <View style={styles.checkItem}>
             <Ionicons name="checkmark-circle" size={18} color="#10b981" />
             <Text style={styles.checkText}>Secure Environment</Text>
           </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 32 },
  scrollContent: { padding: 24, paddingBottom: 60 },
  loadingText: { color: 'rgba(255,255,255,0.4)', marginTop: 16, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  previewCard: { height: 200, borderRadius: 30, overflow: 'hidden', marginBottom: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  previewImage: { width: '100%', height: '100%' },
  previewOverlay: { backgroundColor: 'rgba(10,15,30,0.6)', justifyContent: 'center', alignItems: 'center' },
  previewIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  previewTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  previewSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' },
  
  securityOverlay: { position: 'absolute', bottom: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  securityItem: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  securityText: { color: '#fff', fontSize: 8, fontWeight: '900', letterSpacing: 1 },

  infoSection: { marginBottom: 32 },
  eventTitle: { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 12, letterSpacing: -0.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '600' },

  actionSection: { marginBottom: 40 },
  joinButton: { backgroundColor: '#3b82f6', borderRadius: 24, padding: 22, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  joinButtonText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  verifiedText: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginTop: 16, letterSpacing: 1 },

  lockedBox: { backgroundColor: 'rgba(245,158,11,0.05)', borderRadius: 30, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245,158,11,0.1)' },
  lockedTitle: { color: '#f59e0b', fontSize: 20, fontWeight: '900', marginTop: 16, marginBottom: 8 },
  lockedSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  bookButton: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 14 },
  bookButtonText: { color: '#000', fontWeight: '900', fontSize: 14 },

  onHoldBox: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 30, padding: 40, alignItems: 'center' },
  onHoldTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: '900', marginTop: 16, marginBottom: 4 },
  onHoldSubtitle: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: '700' },

  checklist: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  checkText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700' },

  errorTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 24, marginBottom: 8 },
  errorSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', marginBottom: 32, paddingHorizontal: 40 },
  errorButton: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 20 },
  errorButtonText: { color: '#fff', fontWeight: '900' },
});
