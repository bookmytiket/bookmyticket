import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View as RNView,
  StatusBar,
  Linking,
  Share,
  Alert,
  TextInput,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Text } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { DataService } from '../../services/DataService';
import { isFreeEvent } from '@/lib/eventUtils';
import { useAuth } from '@/hooks/useSupabase';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Share2,
  Heart,
  Ticket,
  ChevronRight,
  Users,
  Globe,
  Search,
  Tag,
  Activity,
  HeartPulse,
  FileText,
  Award,
  Shirt,
  Coffee,
  Utensils,
  Home,
  Car,
  ShieldCheck,
  Smile,
  DollarSign,
  Trophy,
  Target,
  Camera,
  CheckCircle2,
  HelpCircle,
  Timer
} from 'lucide-react-native';

export default function EventDetailScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [event, setEvent] = useState<any>(null);
  const [marathonV2, setMarathonV2] = useState<any>(null);
  const [isOrganiser, setIsOrganiser] = useState(false);
  const [marathonCategories, setMarathonCategories] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [benefits, setBenefits] = useState<any[]>([]);
  const [selectedKM, setSelectedKM] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (id) fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const data = await DataService.getEventDetail(id);
      if (!data) throw new Error('Event not found');

      setEvent(data);

      if (data.marathon_events && data.marathon_events.length > 0) {
        setMarathonV2(data.marathon_events[0]);
      }
      
      if (user && data.organiser_id === user.id) {
        setIsOrganiser(true);
      }

      if (data.marathon_categories && data.marathon_categories.length > 0) {
        setMarathonCategories(data.marathon_categories);
        const kms = [...new Set(data.marathon_categories.map((c: any) => Number(c.distance_km)))].sort((a, b) => a - b);
        if (kms.length > 0) {
          setSelectedKM(kms[0]);
        }
      }

      if (data.marathon_sponsors) {
        setSponsors(data.marathon_sponsors);
      }
      
      if (data.marathon_benefits) {
        setBenefits(data.marathon_benefits);
      }

      // Fetch About Event descriptions, faqs and highlights directly
      try {
        const [descResult, faqResult, highlightResult] = await Promise.all([
          supabase.from('event_descriptions').select('*').eq('event_id', id).maybeSingle(),
          supabase.from('event_faqs').select('*').eq('event_id', id).order('display_order'),
          supabase.from('event_highlights').select('*').eq('event_id', id).order('display_order')
        ]);
        
        if (descResult.data) {
          data.event_descriptions = descResult.data;
        }
        if (faqResult.data && faqResult.data.length > 0) {
          data.event_faqs = faqResult.data;
        }
        if (highlightResult.data && highlightResult.data.length > 0) {
          data.event_highlights = highlightResult.data;
        }
        
        // Update state with newly attached data
        setEvent(data);
      } catch (e) {
        console.warn('Could not fetch rich about event data:', e);
      }
      
    } catch (err) {
      console.error('Error fetching event:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    
    // Use unique channel IDs to avoid "callback after subscribe" errors during Fast Refresh
    const uniqueId = Math.random().toString(36).substring(7);
    
    // Listen for changes to the event itself
    const eventChannel = supabase
      .channel(`event-sync-${id}-${uniqueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          console.log('[Supabase] Event updated:', payload.eventType);
          if (payload.eventType === 'DELETE') {
            Alert.alert('Event Removed', 'This event is no longer available.');
            router.back();
          } else {
            fetchEvent();
          }
        }
      )
      .subscribe();

    // Listen for changes to marathon categories
    const catChannel = supabase
      .channel(`marathon-cats-${id}-${uniqueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marathon_categories',
          filter: `marathon_id=eq.${id}`,
        },
        () => fetchEvent()
      )
      .subscribe();

    // Listen for changes to marathon V2 details
    const v2Channel = supabase
      .channel(`marathon-v2-${id}-${uniqueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marathon_events',
          filter: `id=eq.${id}`,
        },
        () => fetchEvent()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventChannel);
      supabase.removeChannel(catChannel);
      supabase.removeChannel(v2Channel);
    };
  }, [id]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${event?.title}" on BookMyTicket!`,
        title: event?.title,
      });
    } catch {}
  };

  const handleBook = () => {
    const deadline = dynamicConfig.countdown?.deadline;
    if (deadline && new Date(deadline).getTime() < new Date().getTime()) {
      Alert.alert('Registration Closed', 'The registration deadline for this event has passed.');
      return;
    }

    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to book this event.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/auth/sign-in') },
        ]
      );
      return;
    }
    if (event.type === 'Tournament') {
      router.push({ pathname: '/events/book', params: { id: event.id, type: 'tournament' } });
      return;
    }

    router.push({ pathname: '/events/book', params: { id: event.id } });
  };

  if (loading || !event) {
    return (
      <RNView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        {/* Skeleton */}
        <RNView style={[styles.skeletonHero, { backgroundColor: colors.border }]} />
        <RNView style={{ padding: 20, gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <RNView
              key={i}
              style={[
                styles.skeletonLine,
                { backgroundColor: colors.border, width: `${100 - i * 15}%` as any },
              ]}
            />
          ))}
        </RNView>
      </RNView>
    );
  }

  // Safe JSON parse helper
  const safeParse = (val: any) => {
    if (!val) return null;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return null; }
    }
    return val;
  };

  const dynamicConfig = safeParse(event.dynamic_config) || {};
  
  const ticketTiers = (() => {
    if (event?.dynamic_config?.categories?.length > 0) return event.dynamic_config.categories;
    if (event?.event_ticket_categories?.length > 0) {
      return event.event_ticket_categories.map((c: any) => ({
        id: c.id, title: c.category_name, price: c.price, description: c.description || 'General Admission Ticket'
      }));
    }
    if (event?.ticket_categories?.length > 0) return event.ticket_categories;
    if (event?.seat_categories?.length > 0) return event.seat_categories;
    const ticketsData = safeParse(event?.tickets);
    if (Array.isArray(ticketsData) && ticketsData.length > 0) return ticketsData;
    if (Array.isArray(dynamicConfig.tickets) && dynamicConfig.tickets.length > 0) return dynamicConfig.tickets;
    if (Array.isArray(dynamicConfig.categories) && dynamicConfig.categories.length > 0) return dynamicConfig.categories;
    if (Array.isArray(dynamicConfig.marathonCategories) && dynamicConfig.marathonCategories.length > 0) return dynamicConfig.marathonCategories;
    if (Array.isArray(dynamicConfig.marathon_categories) && dynamicConfig.marathon_categories.length > 0) return dynamicConfig.marathon_categories;
    if (Array.isArray(dynamicConfig.seatingSections) && dynamicConfig.seatingSections.length > 0) {
      return dynamicConfig.seatingSections.map((sec: any) => ({
        id: sec.id,
        title: sec.name,
        price: sec.basePrice,
        description: sec.isGeneral ? 'General Admission' : 'Reserved Seating'
      }));
    }
    return [];
  })();
  
  // Sync sponsors and benefits from dynamic_config if they are empty
  const displaySponsors = sponsors.length > 0 ? sponsors : (dynamicConfig.sponsors || []);
  const displayBenefits = benefits.length > 0 ? benefits : (dynamicConfig.benefits || []);
  const displayAmenities = dynamicConfig.amenities || displayBenefits.map((b: any) => b.icon_key || b.benefit_name) || [];
  
  // Robust price calculation for dynamic events
  const getMinPrice = () => {
    const allTiers = [...ticketTiers, ...marathonCategories];
    if (allTiers.length === 0) return Number(event.price || 0);
    
    const prices = allTiers.map((t: any) => {
      const rawRates = t.ageRates || t.agePricing || t.age_rates || t.age_pricing || [];
      if (Array.isArray(rawRates) && rawRates.length > 0) {
        return Math.min(...rawRates.map((r: any) => Number(r.price || 0)));
      }
      return Number(t.price || 0);
    });
    
    return Math.min(...prices);
  };

  const minPrice = getMinPrice();
  
  const isFree = isFreeEvent(event);
  const priceLabel = isFree ? 'FREE' : `₹${minPrice.toLocaleString('en-IN')} + fees`;
  const venueName = event.venue || event.location || dynamicConfig.location?.venueName || dynamicConfig.venue?.name || dynamicConfig.basicInfo?.venue || 'TBA';
  const venueAddress = event.address || dynamicConfig.location?.address || dynamicConfig.venue?.address || '';
  const city = event.city || dynamicConfig.location?.city || dynamicConfig.venue?.city || dynamicConfig.basicInfo?.city || '';
  
  const startDate = event.start_date || event.date || dynamicConfig.date || dynamicConfig.basicInfo?.date || dynamicConfig.basicInfo?.expiryDate || 'TBA';
  const endDate = event.end_date || dynamicConfig.basicInfo?.endDate;
  const date = (startDate && endDate && startDate !== endDate) ? `${startDate} - ${endDate}` : startDate;
  
  const startTime = event.start_time || event.time || dynamicConfig.time || dynamicConfig.basicInfo?.time || '';
  const endTime = event.end_time || dynamicConfig.basicInfo?.endTime || '';
  const time = (startTime && endTime) ? `${startTime} - ${endTime}` : startTime;

  const eventLat = dynamicConfig.location?.coordinates?.lat || event.latitude;
  const eventLng = dynamicConfig.location?.coordinates?.lng || event.longitude;

  return (
    <RNView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} bounces>
        {/* Hero Image */}
        <RNView style={styles.heroContainer}>
          <Image
            source={{
              uri:
                event.img ||
                event.image_url ||
                'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
            }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
            style={styles.heroGradient}
          />

          {/* Nav overlay */}
          <RNView style={styles.heroNav}>
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
              style={styles.navBtn}
              hitSlop={8}
            >
              <ArrowLeft size={22} color="#fff" />
            </Pressable>
            <RNView style={styles.navActions}>
              <Pressable onPress={handleShare} style={styles.navBtn} hitSlop={8}>
                <Share2 size={20} color="#fff" />
              </Pressable>
              <Pressable
                onPress={() => setLiked((v) => !v)}
                style={styles.navBtn}
                hitSlop={8}
              >
                <Heart
                  size={20}
                  color="#fff"
                  fill={liked ? '#f84464' : 'none'}
                />
              </Pressable>
            </RNView>
          </RNView>

          {/* Category badge */}
          {event.category && (
            <RNView style={styles.heroCategoryBadge}>
              <Tag size={12} color="#fff" />
              <Text style={styles.heroCategoryText}>{event.category}</Text>
            </RNView>
          )}
        </RNView>

        {/* Content */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={[styles.content, { backgroundColor: colors.background }]}
        >
          {/* Title + Price */}
          <RNView style={styles.titleRow}>
            <RNView style={{ flex: 1 }}>
              <Text style={[styles.eventTitle, { color: colors.text }]}>
                {marathonV2?.title || event.name || event.title || dynamicConfig?.basicInfo?.eventName || dynamicConfig?.title || 'Event Details'}
              </Text>
              {(marathonV2?.subtitle || marathonV2?.awareness_text) && (
                <Text style={[styles.eventSubtitle, { color: colors.muted }]}>
                  {marathonV2.awareness_text || marathonV2.subtitle}
                </Text>
              )}
            </RNView>
            <RNView
              style={[
                styles.pricePill,
                { backgroundColor: isFree ? colors.success + '20' : colors.tint + '15' },
              ]}
            >
              <Text
                style={[
                  styles.priceText,
                  { color: isFree ? colors.success : colors.tint },
                ]}
              >
                {priceLabel}
              </Text>
            </RNView>
          </RNView>

          {/* Meta info */}
          <RNView style={[styles.metaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MetaRow icon={<Calendar size={16} color={colors.tint} />} value={date} label="Date" colors={colors} />
            {time ? <MetaRow icon={<Clock size={16} color={colors.secondary} />} value={time} label="Time" colors={colors} /> : null}
            <MetaRow 
              icon={<MapPin size={16} color={colors.error} />} 
              value={venueName} 
              subValue={venueAddress ? `${venueAddress}${city ? ', ' + city : ''}` : ''}
              label="Venue" 
              colors={colors} 
              isLast 
            />
          </RNView>

          {/* Event Map Section */}
          {(eventLat && eventLng) && (
            <RNView style={styles.mapSection}>
              <RNView style={[styles.mapContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <WebView 
                  scrollEnabled={false}
                  source={{ html: `
                    <html>
                      <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
                        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                        <style>
                          body { margin: 0; padding: 0; background: #000; }
                          #map { height: 100vh; width: 100vw; }
                          .leaflet-control-attribution { display: none !important; }
                        </style>
                      </head>
                      <body>
                        <div id="map"></div>
                        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                        <script>
                          var map = L.map('map', { 
                            zoomControl: false,
                            dragging: false,
                            touchZoom: false,
                            doubleClickZoom: false,
                            scrollWheelZoom: false,
                            boxZoom: false,
                            keyboard: false
                          }).setView([${eventLat}, ${eventLng}], 17);
                          
                          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            maxZoom: 19,
                            attribution: '© OpenStreetMap'
                          }).addTo(map);
                          
                          var markerIcon = L.divIcon({
                            className: 'custom-div-icon',
                            html: '<div style="background-color:#f84464;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 15px rgba(248,68,100,0.8);"></div>',
                            iconSize: [14, 14],
                            iconAnchor: [7, 7]
                          });
                          L.marker([${eventLat}, ${eventLng}], { icon: markerIcon }).addTo(map);
                        </script>
                      </body>
                    </html>
                  `}}
                  style={styles.webView}
                />
                <Pressable 
                  onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${eventLat},${eventLng}`)}
                  style={styles.mapDirectionsBtn}
                >
                  <Text style={styles.mapDirectionsText}>GET DIRECTIONS</Text>
                </Pressable>
              </RNView>

              {(marathonV2?.starting_point || dynamicConfig.location?.startingPoint || dynamicConfig.starting_point) && (
                <RNView style={[styles.marathonDetails, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {(marathonV2?.starting_point || dynamicConfig.location?.startingPoint || dynamicConfig.starting_point) && (
                    <RNView style={styles.marathonRow}>
                      <RNView style={styles.marathonIcon}>
                        <MapPin size={16} color={colors.tint} />
                      </RNView>
                      <RNView style={{ flex: 1 }}>
                        <Text style={[styles.marathonLabel, { color: colors.muted }]}>STARTING POINT</Text>
                        <Text style={[styles.marathonValue, { color: colors.text }]}>{marathonV2?.starting_point || dynamicConfig.location?.startingPoint || dynamicConfig.starting_point}</Text>
                      </RNView>
                    </RNView>
                  )}
                  {(marathonV2?.route_map_image || dynamicConfig.location?.routeMapUrl || dynamicConfig.route_map_image) && (
                    <Pressable 
                      onPress={() => {
                        const url = marathonV2?.route_map_image || dynamicConfig.location?.routeMapUrl || dynamicConfig.route_map_image;
                        if (url) Linking.openURL(url);
                      }}
                      style={[styles.routeBtn, { backgroundColor: colors.tint + '10' }]}
                    >
                      <Globe size={14} color={colors.tint} />
                      <Text style={[styles.routeBtnText, { color: colors.tint }]}>VIEW ROUTE MAP</Text>
                    </Pressable>
                  )}
                </RNView>
              )}
            </RNView>
          )}

          {/* Route Map Image (V2) */}
          {(marathonV2?.route_map_image || dynamicConfig.route_map_image) && (
            <RNView style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Route Map</Text>
              <RNView style={[styles.routeImageContainer, { borderColor: colors.border }]}>
                <Image source={{ uri: marathonV2?.route_map_image || dynamicConfig.route_map_image }} style={styles.routeImage} contentFit="contain" />
              </RNView>
            </RNView>
          )}

          {/* Countdown Timer */}
          {dynamicConfig.countdown?.enabled && dynamicConfig.countdown?.deadline && (
            <RNView style={styles.countdownContainer}>
              <LinearGradient
                colors={['#f84464', '#c026d3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.countdownGradient}
              >
                <Text style={styles.countdownTitle}>REGISTRATION DEADLINE</Text>
                <Countdown deadline={dynamicConfig.countdown.deadline} />
              </LinearGradient>
            </RNView>
          )}

          {/* Competition Specific Details */}
          {dynamicConfig.competitionAgeGroups?.length > 0 && (
            <RNView style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Competition Categories</Text>
              
              {dynamicConfig.competitionStrokes && (
                <RNView style={[styles.categoryCardV3, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 12, padding: 16 }]}>
                    <Text style={[styles.catV3Label, { color: colors.muted }]}>EVENTS / STROKES</Text>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700', marginTop: 4, lineHeight: 22 }}>
                        {dynamicConfig.competitionStrokes}
                    </Text>
                </RNView>
              )}

              <RNView style={{ gap: 8 }}>
                {dynamicConfig.competitionAgeGroups.map((ag: any, i: number) => (
                  <RNView key={i} style={[styles.categoryCardV3, { backgroundColor: colors.card, borderColor: colors.border, padding: 16, marginBottom: 0 }]}>
                    <RNView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <RNView>
                        <Text style={[styles.catV3Label, { color: colors.muted }]}>AGE GROUP</Text>
                        <Text style={[styles.catV3Name, { color: colors.text }]}>{ag.name}</Text>
                        <Text style={[styles.catV3Age, { color: colors.tint, marginTop: 2 }]}>
                          {ag.minAge}-{ag.maxAge} Years
                        </Text>
                      </RNView>
                      {ag.distances ? (
                        <RNView style={{ alignItems: 'flex-end', flex: 1, paddingLeft: 20 }}>
                           <Text style={[styles.catV3Label, { color: colors.muted, textAlign: 'right' }]}>DISTANCES</Text>
                           <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginTop: 2, textAlign: 'right', flexWrap: 'wrap' }}>
                             {ag.distances}
                           </Text>
                        </RNView>
                      ) : null}
                    </RNView>
                  </RNView>
                ))}
              </RNView>
            </RNView>
          )}

          {/* Ticket Categories - Dropdown UI */}
          {(marathonCategories.length > 0 || dynamicConfig.categories?.length > 0) && (
            <RNView style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Category</Text>
              
              {/* Distance Picker Dropdown */}
              {marathonCategories.length > 0 && (
                <Pressable
                  onPress={() => {
                    const kms = [...new Set(marathonCategories.map(c => Number(c.distance_km)))].sort((a, b) => a - b);
                    Alert.alert(
                      'Select Distance',
                      'Choose a race category to view details',
                      [
                        ...kms.map(km => ({
                          text: `${km} KM`,
                          onPress: () => setSelectedKM(km)
                        })),
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                  style={[styles.dropdownTrigger, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <RNView style={styles.dropdownInner}>
                    <RNView style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Activity size={18} color={colors.tint} />
                      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{selectedKM} KM DISTANCE</Text>
                    </RNView>
                    <ChevronRight size={20} color={colors.muted} style={{ transform: [{ rotate: '90deg' }] }} />
                  </RNView>
                </Pressable>
              )}

              <RNView style={{ marginTop: 12, gap: 12 }}>
                {(marathonCategories.length > 0 
                  ? marathonCategories.filter(c => !selectedKM || Number(c.distance_km) === selectedKM)
                  : (dynamicConfig.marathonCategories || dynamicConfig.marathon_categories || dynamicConfig.categories || [])
                ).map((cat: any, i: number) => (
                  <RNView
                    key={cat.id || i}
                    style={[
                      styles.categoryCardV3,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <RNView style={styles.catV3Main}>
                      <RNView style={{ flex: 1 }}>
                        <Text style={[styles.catV3Label, { color: colors.muted }]}>CATEGORY</Text>
                        <Text style={[styles.catV3Name, { color: colors.text }]}>{cat.category_name || cat.title || cat.name}</Text>
                        <Text style={[styles.catV3Age, { color: colors.tint }]}>
                          {cat.age_group || (cat.min_age !== undefined ? `${cat.min_age}-${cat.max_age} Yrs` : 'All Ages')}
                        </Text>
                      </RNView>
                      <RNView style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.catV3Price, { color: colors.text }]}>
                          {(() => {
                            if (cat.price !== undefined) return Number(cat.price) === 0 ? 'FREE' : `₹${cat.price}`;
                            const rawRates = cat.ageRates || cat.agePricing || cat.age_rates || cat.age_pricing || [];
                            if (Array.isArray(rawRates) && rawRates.length > 0) {
                              const prices = rawRates.map((r: any) => Number(r.price || 0));
                              return `₹${Math.min(...prices)}+`;
                            }
                            return `₹${cat.price || 0}`;
                          })()}
                        </Text>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: colors.muted, textTransform: 'uppercase' }}>{event?.type === 'Tournament' ? 'PER TEAM' : (event?.type === 'Marathon' ? 'PER RUNNER' : 'PER PERSON')}</Text>
                      </RNView>
                    </RNView>
                    
                    <RNView style={[styles.catV3Footer, { borderTopColor: colors.border + '50' }]}>
                       <Text style={{ fontSize: 10, fontWeight: '800', color: colors.muted }}>
                         {(cat.slots_total || cat.total_slots || cat.slots || cat.totalSlots || 0)} SLOTS AVAILABLE
                       </Text>
                       <Pressable 
                        onPress={handleBook}
                        style={[styles.catV3Action, { backgroundColor: colors.tint }]}
                       >
                         <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>SELECT</Text>
                       </Pressable>
                    </RNView>
                  </RNView>
                ))}
              </RNView>
            </RNView>
          )}

          {/* Benefits Section (V2) */}
          {benefits.length > 0 && (
            <RNView style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Participant Benefits</Text>
              <RNView style={styles.amenitiesGrid}>
                {benefits.map((ben, i) => (
                  <RNView key={i} style={styles.amenityItem}>
                    <RNView style={[styles.amenityIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <AmenityIcon name={ben.icon_key} color={colors.tint} />
                    </RNView>
                    <Text style={[styles.amenityLabel, { color: colors.muted }]} numberOfLines={2}>
                      {ben.benefit_name}
                    </Text>
                  </RNView>
                ))}
              </RNView>
            </RNView>
          )}

          {/* Sponsors Section (V2) */}
          {displaySponsors.length > 0 && (
            <RNView style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Our Partners</Text>
              <RNView style={styles.sponsorsContainer}>
                {['Title', 'Powered By', 'Associate', 'Partner', 'Media', 'Hydration', 'Sponsor', 'Co-Sponsor'].map(type => {
                  const filtered = displaySponsors.filter((s: any) => s.sponsor_type === type || s.type === type);
                  if (filtered.length === 0) return null;
                  return (
                    <RNView key={type} style={styles.sponsorGroup}>
                      <Text style={[styles.sponsorTypeLabel, { color: colors.muted }]}>{type.toUpperCase()}</Text>
                      <RNView style={styles.sponsorLogos}>
                        {filtered.map((s: any) => (
                          <RNView key={s.id || s.sponsor_name} style={styles.sponsorLogoCard}>
                            <Image 
                              source={{ uri: s.logo_url || s.logo || s.image_url }} 
                              style={styles.sponsorLogo} 
                              contentFit="contain" 
                              cachePolicy="memory-disk"
                            />
                            <Text style={[styles.sponsorName, { color: colors.text }]} numberOfLines={1}>{s.sponsor_name || s.name}</Text>
                          </RNView>
                        ))}
                      </RNView>
                    </RNView>
                  );
                })}
              </RNView>
            </RNView>
          )}

          {/* Amenities Grid (Legacy) */}
          {(displayAmenities.length > 0) && (
            <RNView style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Amenities</Text>
              <RNView style={styles.amenitiesGrid}>
                {displayAmenities.map((rawItem: any, i: number) => {
                  let item = rawItem;
                  if (typeof rawItem === 'string') {
                    try {
                      const parsed = JSON.parse(rawItem);
                      if (typeof parsed === 'object' && parsed !== null) {
                        item = parsed;
                      }
                    } catch (e) {}
                  }
                  const label = typeof item === 'string' ? item : (item.benefit_name || item.label || 'Amenity');
                  const iconKey = typeof item === 'string' ? item : (item.icon_key || item.icon || 'Star');
                  return (
                    <RNView key={i} style={styles.amenityItem}>
                      <RNView style={[styles.amenityIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <AmenityIcon name={iconKey} color={colors.tint} />
                      </RNView>
                      <Text style={[styles.amenityLabel, { color: colors.muted }]} numberOfLines={1}>
                        {label}
                      </Text>
                    </RNView>
                  );
                })}
              </RNView>
            </RNView>
          )}

          {/* Organiser Actions panel if user is organiser */}
          {isOrganiser && (
            <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: '#f59e0b' }]}>Organiser Actions</Text>
              <RNView style={[{ padding: 16, borderRadius: 20, borderWidth: 1, backgroundColor: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.2)' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>Event Status: {event.status === 'published' ? 'Live' : event.status}</Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>Need to cancel this event? Request cancellation for admin approval.</Text>
                  </View>
                  <Pressable 
                    style={{ backgroundColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}
                    onPress={() => {
                      Alert.alert(
                        'Request Cancellation',
                        'Are you sure you want to request cancellation? An admin must approve this.',
                        [
                          { text: 'No', style: 'cancel' },
                          { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
                            try {
                              await supabase.from('events').update({ status: 'CANCELLATION_REQUESTED' }).eq('id', event.id);
                              Alert.alert('Requested', 'Cancellation request sent to admins.');
                              fetchEvent();
                            } catch (e) {
                              Alert.alert('Error', 'Could not request cancellation');
                            }
                          }}
                        ]
                      );
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>Cancel Event</Text>
                  </Pressable>
                </View>
                {event?.type === 'Marathon' && (
                  <Pressable 
                    style={{ backgroundColor: colors.tint, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    onPress={() => router.push({ pathname: '/organiser/marathon-participants', params: { marathonId: event.id } })}
                  >
                    <Download size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Download Participants Report</Text>
                  </Pressable>
                )}
              </RNView>
            </MotiView>
          )}

          {/* Detailed About Event Section */}
          {(event.event_descriptions?.about_event || event.description || event.about || dynamicConfig.description || dynamicConfig.basicInfo?.description || (event.event_highlights && event.event_highlights.length > 0)) && (
            <RNView style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>About Event</Text>
              
              {/* Highlights */}
              {event.event_highlights && event.event_highlights.length > 0 && (
                <RNView style={{ marginBottom: 16 }}>
                  {event.event_highlights.map((h: any, idx: number) => (
                    <RNView key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                      <ShieldCheck size={16} color={colors.tint} style={{ marginTop: 2, marginRight: 8 }} />
                      <Text style={{ color: colors.text, flex: 1, fontSize: 14, fontWeight: '600' }}>{h.highlight_text}</Text>
                    </RNView>
                  ))}
                </RNView>
              )}

              {/* Description */}
              <Text style={[styles.description, { color: colors.muted, marginBottom: 16 }]}>
                {event.event_descriptions?.about_event || event.description || event.about || dynamicConfig.description || dynamicConfig.basicInfo?.description}
              </Text>

              {/* Rules */}
              {event.event_descriptions?.rules && (
                <RNView style={{ marginTop: 16, padding: 16, backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.1)' }}>
                  <Text style={{ color: '#ef4444', fontWeight: '800', marginBottom: 8, fontSize: 14, textTransform: 'uppercase' }}>Rules & Regulations</Text>
                  <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>{event.event_descriptions.rules}</Text>
                </RNView>
              )}

              {/* Terms */}
              {event.event_descriptions?.terms && (
                <RNView style={{ marginTop: 16, padding: 16, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.text, fontWeight: '800', marginBottom: 8, fontSize: 14, textTransform: 'uppercase' }}>Terms & Conditions</Text>
                  <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>{event.event_descriptions.terms}</Text>
                </RNView>
              )}

              {/* Important Instructions */}
              {event.event_descriptions?.instructions && (
                <RNView style={{ marginTop: 16, padding: 16, backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.1)' }}>
                  <Text style={{ color: '#f59e0b', fontWeight: '800', marginBottom: 8, fontSize: 14, textTransform: 'uppercase' }}>Important Instructions</Text>
                  <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>{event.event_descriptions.instructions}</Text>
                </RNView>
              )}
            </RNView>
          )}

          {/* FAQs Section */}
          {event.event_faqs && event.event_faqs.length > 0 && (
            <RNView style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
              {event.event_faqs.map((faq: any, idx: number) => (
                <RNView key={idx} style={{ marginBottom: 12, padding: 16, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14, marginBottom: 4 }}>{faq.question}</Text>
                  <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>{faq.answer}</Text>
                </RNView>
              ))}
            </RNView>
          )}

          {/* Organiser info */}
          {(event.organisers?.name || event.organiser || dynamicConfig.organiser?.name || dynamicConfig.organiser_name || dynamicConfig.basicInfo?.organizerContact) && (
            <RNView style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Organised by</Text>
              <RNView style={[styles.organiserCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Users size={18} color={colors.tint} />
                <RNView>
                  <Text style={[styles.organiserName, { color: colors.text }]}>
                    {event.organisers?.name || event.organiser || dynamicConfig.organiser?.name || dynamicConfig.organiser_name || 'Organiser'}
                  </Text>
                  {dynamicConfig.basicInfo?.organizerContact && (
                    <Text style={[styles.organiserContact, { color: colors.muted }]}>{dynamicConfig.basicInfo.organizerContact}</Text>
                  )}
                </RNView>
              </RNView>
            </RNView>
          )}

          <RNView style={{ height: 120 }} />
        </MotiView>
      </ScrollView>

      {/* Floating Book Button */}
      <RNView style={[styles.bookBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <RNView>
          <Text style={[styles.bookPriceLabel, { color: colors.muted }]}>Starting from</Text>
          <Text style={[styles.bookPrice, { color: colors.tint }]}>{priceLabel}</Text>
        </RNView>
        <Pressable onPress={handleBook} style={styles.bookBtn}>
          <LinearGradient
            colors={colors.gradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookBtnGradient}
          >
            {event?.type === 'Tournament' ? (
              <>
                <Users size={18} color="#fff" />
                <Text style={styles.bookBtnText}>Register Team</Text>
              </>
            ) : (
              <>
                <Ticket size={18} color="#fff" />
                <Text style={styles.bookBtnText}>Book Now</Text>
              </>
            )}
            <ChevronRight size={16} color="#fff" />
          </LinearGradient>
        </Pressable>
        {event?.type === 'Tournament' && dynamicConfig?.audienceFreeAccess && (
          <Pressable 
            onPress={() => router.push({ pathname: '/events/book', params: { id: event.id, type: 'audience_free' } })} 
            style={[styles.bookBtn, { marginLeft: 10, flex: 0.6 }]}
          >
            <RNView style={[styles.bookBtnGradient, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
              <Text style={[styles.bookBtnText, { color: colors.text, fontSize: 10 }]}>Free Visitor Pass</Text>
            </RNView>
          </Pressable>
        )}
      </RNView>
    </RNView>
  );
}

function Countdown({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hrs: 0, min: 0, sec: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date(deadline).getTime() - new Date().getTime();
      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hrs: 0, min: 0, sec: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hrs: Math.floor((diff / (1000 * 60 * 60)) % 24),
        min: Math.floor((diff / 1000 / 60) % 60),
        sec: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  const isClosed = new Date(deadline).getTime() < new Date().getTime();

  if (isClosed) {
    return (
      <RNView style={{ paddingVertical: 10 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 }}>REGISTRATION CLOSED</Text>
      </RNView>
    );
  }

  return (
    <RNView style={styles.countdownRow}>
      <TimeUnit value={timeLeft.days} label="DAYS" />
      <TimeUnit value={timeLeft.hrs} label="HRS" />
      <TimeUnit value={timeLeft.min} label="MIN" />
      <TimeUnit value={timeLeft.sec} label="SEC" />
    </RNView>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <RNView style={styles.timeUnit}>
      <Text style={styles.timeValue}>{value}</Text>
      <Text style={styles.timeLabel}>{label}</Text>
    </RNView>
  );
}

function AmenityIcon({ name, color }: { name: string; color: string }) {
  const iconSize = 20;
  const map: any = {
    'Ambulance': Activity, 'ambulance': Activity,
    'First Aid': HeartPulse, 'medical': HeartPulse,
    'Certificate': FileText, 'certificate': FileText,
    'Medal': Award, 'medal': Award,
    'T-Shirt': Shirt, 'tshirt': Shirt,
    'Breakfast': Coffee, 'breakfast': Coffee,
    'Refreshments': Utensils, 'refreshment': Utensils,
    'Accommodation': Home, 'accommodation': Home,
    'Parking': Car, 'parking': Car,
    'Safety': ShieldCheck, 'safety': ShieldCheck,
    'Family': Smile, 'family': Smile,
    'Cash Prize': DollarSign, 'prize': DollarSign,
    'Trophy': Trophy, 'trophy': Trophy,
    'Bib': Target, 'bib': Target,
    'Selfie': Camera, 'selfie': Camera,
    'Washroom': CheckCircle2, 'washroom': CheckCircle2,
    'timer': Timer, 'timer_chip': Timer
  };
  const IconComp = map[name] || HelpCircle;
  return <IconComp size={iconSize} color={color} />;
}

function MetaRow({ icon, value, subValue, label, colors, isLast }: any) {
  return (
    <RNView
      style={[
        styles.metaRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <RNView style={{ marginTop: 2 }}>{icon}</RNView>
      <RNView style={{ flex: 1 }}>
        <Text style={[styles.metaLabel, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.metaValue, { color: colors.text }]}>{value}</Text>
        {subValue ? (
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 1 }}>{subValue}</Text>
        ) : null}
      </RNView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1 },
  skeletonHero: { height: 320 },
  skeletonLine: { height: 18, borderRadius: 8 },
  heroContainer: { height: 320, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200 },
  heroNav: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navActions: { flexDirection: 'row', gap: 8 },
  heroCategoryBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroCategoryText: { color: '#fff', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  content: { borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, padding: 20, paddingTop: 28 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  eventTitle: { flex: 1, fontSize: 22, fontWeight: '900', lineHeight: 28 },
  pricePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  priceText: { fontSize: 14, fontWeight: '900' },
  metaCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  metaLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 16 },
  sectionHeader: { marginBottom: 16 },
  kmTabs: { paddingBottom: 8, gap: 8 },
  kmTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', backgroundColor: 'transparent' },
  kmTabText: { fontSize: 12, fontWeight: '800' },
  description: { fontSize: 14, fontWeight: '500', lineHeight: 22 },
  categoryCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 12 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  categoryCardV3: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
  },
  catV3Main: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  catV3Label: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  catV3Name: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  catV3Age: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  catV3Price: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  catV3Footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  catV3Action: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginTop: 8,
  },
  dropdownInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prizeList: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', gap: 8 },
  prizeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  prizeLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  prizeValue: { fontSize: 14, fontWeight: '800' },
  categoryFooter: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categorySlots: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  kmBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  kmBadgeText: { fontSize: 10, fontWeight: '900' },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  amenityItem: { width: '22%', alignItems: 'center', gap: 8 },
  amenityIcon: { width: 50, height: 50, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  amenityLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' },
  organiserCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, borderWidth: 1 },
  organiserName: { fontSize: 16, fontWeight: '800' },
  organiserContact: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  countdownContainer: { marginBottom: 24, borderRadius: 24, overflow: 'hidden' },
  countdownGradient: { padding: 20, alignItems: 'center' },
  countdownTitle: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 12 },
  countdownRow: { flexDirection: 'row', gap: 20 },
  timeUnit: { alignItems: 'center' },
  timeValue: { color: '#fff', fontSize: 24, fontWeight: '900' },
  timeLabel: { color: '#fff', fontSize: 8, fontWeight: '800', marginTop: 2 },
  bookBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  bookPriceLabel: { fontSize: 11, fontWeight: '600' },
  bookPrice: { fontSize: 20, fontWeight: '900' },
  bookBtn: { borderRadius: 14, overflow: 'hidden' },
  bookBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  mapSection: { marginBottom: 24 },
  mapContainer: { height: 220, borderRadius: 24, overflow: 'hidden', borderWidth: 1, position: 'relative' },
  webView: { flex: 1 },
  mapDirectionsBtn: { position: 'absolute', bottom: 12, right: 12, backgroundColor: '#f84464', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  mapDirectionsText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  marathonDetails: { marginTop: 12, padding: 16, borderRadius: 20, borderWidth: 1, gap: 12 },
  marathonRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  marathonIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(248,68,100,0.1)', alignItems: 'center', justifyContent: 'center' },
  marathonLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  marathonValue: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  routeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(248,68,100,0.3)' },
  routeBtnText: { fontSize: 11, fontWeight: '900' },
  eventSubtitle: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  routeImageContainer: { height: 300, borderRadius: 20, overflow: 'hidden', borderWidth: 1, backgroundColor: '#f8fafc' },
  routeImage: { width: '100%', height: '100%' },
  sponsorsContainer: { gap: 20 },
  sponsorGroup: { gap: 12 },
  sponsorTypeLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, opacity: 0.6 },
  sponsorLogos: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sponsorLogoCard: { width: '30%', alignItems: 'center', gap: 6 },
  sponsorLogo: { width: '100%', height: 60, borderRadius: 12 },
  sponsorName: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
});
