import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  // Fetch specific event if needed, or get from list query as fallback
  const events = useQuery(api.events.getActiveEvents) || [];
  const event = events.find(e => e._id === id);

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading event details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} bounces={false}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: event.img || event.bannerPreview }} 
            style={styles.image} 
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.category || 'Event'}</Text>
          </View>
          <Text style={styles.title}>{event.title}</Text>
          
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="calendar" size={20} color="#f84464" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Date and Time</Text>
                <Text style={styles.infoValue}>{event.date} at {event.time || 'TBA'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="location" size={20} color="#f84464" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Venue</Text>
                <Text style={styles.infoValue}>{event.venue || event.location || 'TBA'}</Text>
                <Text style={styles.infoSubValue}>{event.city || event.address}</Text>
              </View>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About this Event</Text>
            <Text style={styles.description}>
              {event.description || "Join us for an unforgettable experience! This event brings together the best in entertainment and lifestyle. Don't miss out on this incredible opportunity to be part of something special."}
            </Text>
          </View>

          <View style={styles.organizerSection}>
            <Text style={styles.sectionTitle}>Organizer</Text>
            <View style={styles.organizerCard}>
              <View style={styles.organizerAvatar}>
                <Ionicons name="business" size={24} color="#64748b" />
              </View>
              <View>
                <Text style={styles.organizerName}>BookMyTicket Professional</Text>
                <Text style={styles.organizerInfo}>Verified Organizer</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>₹{event.price || event.normalTicketPrice || 'TBA'}</Text>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={() => router.push(`/event/${id}/book`)}>
          <LinearGradient
            colors={['#f84464', '#c026d3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookGradient}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: width,
    height: 350,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    backgroundColor: '#fff',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8446415',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  categoryText: {
    color: '#f84464',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  infoSection: {
    marginVertical: 25,
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  infoTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  infoSubValue: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  descriptionSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
  },
  organizerSection: {
    marginBottom: 20,
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 15,
    borderRadius: 16,
  },
  organizerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  organizerInfo: {
    fontSize: 13,
    color: '#64748b',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  bookButton: {
    flex: 1.5,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#f84464',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bookGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
