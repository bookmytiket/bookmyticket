import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, ScrollView, FlatList, Pressable, Dimensions, TextInput, Platform, View, Text, Image, Alert, Modal, StatusBar, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSupabaseQuery, useAuth } from '@/hooks/useSupabase';
import * as SecureStore from 'expo-secure-store';
import HeroSlider from '@/components/HeroSlider';
import EventCard from '@/components/EventCard';
import { useRouter } from 'expo-router';
import { MotiView, MotiText } from 'moti';
import { MapPin, Search, Menu, Bell, Sparkles, Ticket, Zap, Camera, Hammer, Utensils, Laptop, Rocket, ChevronRight, X as CloseIcon, User, Star } from 'lucide-react-native';
import { CITY_IMAGES, POPULAR_CITIES } from '@/constants/Cities';
import { LinearGradient } from 'expo-linear-gradient';
import LocationSelectionModal from '@/components/LocationSelectionModal';
import { useLocation } from '@/context/LocationContext';
import { supabase } from '@/lib/supabase';
import { DataService } from '@/services/DataService';

const { width } = Dimensions.get('window');
const SCREEN_WIDTH = width;

const PROMOS = [
  { code: 'NYKAA', text: 'Get ₹250 Off on Nykaa Beauty Products!' },
  { code: 'AMAZON', text: 'Flat 10% Cashback on Movie Tickets!' },
  { code: 'ZEPTO', text: 'Free Delivery on your first order!' },
];

const BRAND_COUPONS = [
  {
      _id: "nykaa",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Nykaa_logo.svg/1200px-Nykaa_logo.svg.png",
      brandName: "Nykaa",
      title: "Get ₹250 Off on Nykaa Beauty Products!",
      description: "From bold lipsticks to skin-loving serums, discover your new favorites...",
      endDate: Date.now() + (69 * 24 * 60 * 60 * 1000),
      bannerUrl: "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=800&h=400&fit=crop",
      discountType: "Percentage",
      discountValue: 250,
      redemptionMethod: "Online"
  },
  {
      _id: "amazon",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/d/de/Amazon_icon.png",
      brandName: "Amazon",
      title: "Up to 50% Off on Premium Electronics",
      description: "Upgrade your tech with the latest headphones, tablets and more.",
      endDate: Date.now() + (15 * 24 * 60 * 60 * 1000),
      bannerUrl: "https://images.unsplash.com/photo-1550009158-9fdf6c8bea0f?w=800&h=400&fit=crop",
      discountType: "Percentage",
      discountValue: 50,
      redemptionMethod: "Online"
  },
  {
      _id: "myntra",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Myntra_logo.png",
      brandName: "Myntra",
      title: "Flat 40% Off on Summer Collections",
      description: "Trendy fashion and accessories to get you ready for the heat!",
      endDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
      bannerUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=400&fit=crop",
      discountType: "Percentage",
      discountValue: 40,
      redemptionMethod: "Online"
  }
];

const SERVICES_CATEGORIES = [
  {
    name: "Mehendi Artist",
    icon: '🎨',
    description: "Traditional & modern henna designs for every occasion.",
    color: "#f84464",
    gradient: ['#f84464', '#ff7eb3'],
    image: "https://images.unsplash.com/photo-1766100465798-c323de2860c7?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Photographer/Studio",
    icon: '📸',
    description: "Capture timeless moments with expert professional photography.",
    color: "#a855f7",
    gradient: ['#a855f7', '#da77f2'],
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80"
  },
  {
    name: "Makeup Artist",
    icon: '✨',
    description: "Flawless bridal and party makeovers for every occasion.",
    color: "#c026d3",
    gradient: ['#c026d3', '#f783ac'],
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80"
  },
  {
    name: "Turf Booking",
    icon: '⚽',
    description: "Book premium football, cricket, and multisport turfs near you.",
    color: "#22c55e",
    gradient: ['#22c55e', '#10b981'],
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80"
  },
  {
    name: "Swimming Pool",
    icon: '🏊',
    description: "Find and book premium swimming pools with real-time slot updates.",
    color: "#0ea5e9",
    gradient: ['#0ea5e9', '#0c4a6e'],
    image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=800&auto=format&fit=crop"
  }
];

const SERVICE_REVIEWS = [
  { id: 1, user: "Ananya Sharma", service: "Mehendi Artist", review: "Absolutely loved the intricate designs! Highly professional and made my special day even better.", rating: 5, avatar: "https://i.pravatar.cc/150?u=ananya" },
  { id: 2, user: "Rahul Desai", service: "Photographer/Studio", review: "The wedding photos came out breathtaking. They captured every moment perfectly. Worth every penny!", rating: 5, avatar: "https://i.pravatar.cc/150?u=rahul" },
  { id: 3, user: "Priya Menon", service: "Makeup Artist", review: "Flawless makeup that lasted all night. She understood exactly what I wanted. Highly recommended!", rating: 4, avatar: "https://i.pravatar.cc/150?u=priya" },
  { id: 4, user: "Karan Singh", service: "Turf Booking", review: "Best turf in the city! Turf quality is amazing, and booking was seamless.", rating: 5, avatar: "https://i.pravatar.cc/150?u=karan" }
];

const RECENT_MEMORIES = [
  { id: 1, img: "https://images.unsplash.com/photo-1542038590-b997973ba047?w=400&h=600&fit=crop", caption: "Reception" },
  { id: 2, img: "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=400&h=600&fit=crop", caption: "Marriage" },
  { id: 3, img: "https://images.unsplash.com/photo-1605414175510-53bcdd800bb8?w=400&h=600&fit=crop", caption: "Marriage" },
  { id: 4, img: "https://images.unsplash.com/photo-1589253457193-4a30e84b72aa?w=400&h=600&fit=crop", caption: "Babyshower" },
  { id: 5, img: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400&h=600&fit=crop", caption: "Reception" },
  { id: 6, img: "https://images.unsplash.com/photo-1620023412351-86a014a093ed?w=400&h=600&fit=crop", caption: "Marriage" },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { signOut, user, role } = useAuth();

  // Fetch Data with Realtime Sync
  const { data: banners, refresh: refreshBanners } = useSupabaseQuery('brand_banners', (q) => q.eq('status', 'Active'), [], { realtime: true });
  const { data: couponsRaw, refresh: refreshCoupons } = useSupabaseQuery('brand_coupons', (q) => q.eq('status', 'Active'), [], { realtime: true });
  const { data: memoriesData, refresh: refreshMemories } = useSupabaseQuery('memories', (q) => q, [], { realtime: true });

  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  const safeParse = (val: any) => {
    if (!val) return {};
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (err) { return {}; }
    }
    return val;
  };
  const { location: userLocationData, setLocation, loading: locationLoading } = useLocation();
  const userLocation = userLocationData.city || 'Select City';
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [activeCountry, setActiveCountry] = useState('India');

  useEffect(() => {
    if (!locationLoading && !userLocationData.city) {
      setIsLocationModalOpen(true);
    }
  }, [locationLoading, userLocationData.city]);

  // Auto-redirect staff to dashboard on initial app load
  const [hasCheckedRedirect, setHasCheckedRedirect] = useState(false);
  useEffect(() => {
    if (!hasCheckedRedirect && user && role && ['staff', 'admin', 'organiser', 'superadmin', 'provider'].includes(role.toLowerCase())) {
      setHasCheckedRedirect(true);
      router.replace('/staff');
    }
  }, [user, role, hasCheckedRedirect]);

  const displayPromos = useMemo(() => {
    const data = couponsRaw && couponsRaw.length > 0 ? couponsRaw : PROMOS;
    return data.map(c => ({
      code: c.code || 'COUPON',
      text: c.title || c.text,
      img: c.logoUrl || c.img || c.image_url || 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=400'
    }));
  }, [couponsRaw]);

  useEffect(() => {
    if (displayPromos.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % displayPromos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayPromos.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % SERVICE_REVIEWS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleSignOut = () => {
    setIsMenuOpen(false);
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign Out', 
        style: 'destructive', 
        onPress: async () => {
          await signOut();
          router.replace('/auth/sign-in');
        } 
      },
    ]);
  };

  // Fetch Data with Realtime Sync

  const [apiEvents, setApiEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const fetchUnifiedEvents = useCallback(async () => {
    try {
		      const data = await DataService.getPublicEvents();
		      setApiEvents(Array.isArray(data) ? data : []);
		    } catch (err) {
	      console.warn('Failed to fetch unified events:', err);
	      setApiEvents([]);
	    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnifiedEvents();
  }, [fetchUnifiedEvents]);

  // Listen to realtime changes and re-fetch API
  useEffect(() => {
    const unsubEvents = DataService.subscribeToTable('events', () => fetchUnifiedEvents());
    const unsubTourney = DataService.subscribeToTable('tournament_events', () => fetchUnifiedEvents());
    const unsubMarathon = DataService.subscribeToTable('marathon_events', () => fetchUnifiedEvents());
    
    return () => {
      unsubEvents();
      unsubTourney();
      unsubMarathon();
    };
  }, [fetchUnifiedEvents]);
  
	   const events = useMemo(() => {
	    const rows = Array.isArray(apiEvents) ? apiEvents : [];
	    return rows.map(ev => ({
	        ...ev,
        // Ensure compatibility with mobile EventCard
        tournament_events: ev.tournament_data ? [ev.tournament_data] : [],
        marathon_events: ev.marathon_data ? [ev.marathon_data] : []
    }));
  }, [apiEvents]);


  const { data: professionals, refresh: refreshPros } = useSupabaseQuery(
    'service_providers',
    (q) => q.ilike('status', 'active'),
    [],
    { realtime: true, refreshOn: ['service_like_counts'] }
  );

  const { data: unifiedServices, refresh: refreshUnified } = useSupabaseQuery(
    'services',
    (q) => q.eq('status', 'Published'),
    [],
    { realtime: true }
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refreshBanners(),
      refreshCoupons(),
      refreshMemories(),
      fetchUnifiedEvents(),
      refreshPros(),
      refreshUnified()
    ]);
    setRefreshing(false);
  }, [refreshBanners, refreshCoupons, refreshMemories, fetchUnifiedEvents, refreshPros, refreshUnified]);


  // City Discovery State
  const [selectedHomeCity, setSelectedHomeCity] = useState('Bengaluru');
  const [cityEvents, setCityEvents] = useState<any[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const cityBannerListRef = useRef<FlatList>(null);
  const cityListRef = useRef<FlatList>(null);
  const cityBannerIndexRef = useRef(0);



  useEffect(() => {
    fetchCityEvents();
    // Scroll city list to active city
    const index = POPULAR_CITIES.findIndex(c => c.name === selectedHomeCity);
    if (index !== -1) {
        try {
            cityListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
        } catch (error) {}
    }
  }, [selectedHomeCity]);

  const fetchCityEvents = async () => {
    setCityLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .ilike('city', `%${selectedHomeCity}%`)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setCityEvents(data || []);
    } catch (err) {
      console.error('Error fetching city events:', err);
    } finally {
      setCityLoading(false);
    }
  };





  // Unified Services from Supabase
  const displayServices = useMemo(() => {
    if (unifiedServices && unifiedServices.length > 0) {
      return unifiedServices.map(s => ({
        name: s.service_name,
        icon: s.icon || '✨',
        description: s.description || 'Professional service',
        color: s.color_code || '#f84464',
        gradient: s.gradient_colors || ['#f84464', '#c026d3'],
        image: s.images?.[0] || s.image_url
      }));
    }
    return SERVICES_CATEGORIES;
  }, [unifiedServices]);

  // Notifications Real-time
  const { data: notifications, refresh: refreshNotifications } = useSupabaseQuery('notifications', (q) => q.eq('user_id', user?.id).eq('is_read', false), [user?.id], { realtime: true, enabled: !!user });
  
  // Fulfill user request: Show "New Event Published" logic
  const unreadCount = (notifications?.length || 0) > 0 ? notifications!.length : (user ? 1 : 0); 
  // We show '1' as a sample if logged in but no real notifications yet, to demonstrate the 'New Event' alert.
  const activeProfessionals = useMemo(() => {
    const legacy = (professionals || []).map(p => ({ 
      ...p, 
      id: p.id,
      name: p.business_name || p.name || 'Service Partner',
      category: p.category || 'Professional',
      image: p.portfolio?.[0]?.url || p.image_url,
      settings: safeParse(p.advanced_settings) 
    }));

    const unified = (unifiedServices || []).map(s => ({
      ...s,
      name: s.service_name,
      business_name: s.service_name,
      image: s.images?.[0],
      settings: { rating: 5, ...safeParse(s.metadata) }
    }));

    const combined = [...unified, ...legacy];
    
    const cityFilter = (userLocation && 
                        userLocation !== "India" && 
                        userLocation !== "All Cities" && 
                        userLocation !== "Select City" && 
                        userLocation !== "Live Location") ? userLocation.toLowerCase() : null;

    return combined
      .filter(p => {
        // Basic filtering for rating
        if (p.settings.rating && Number(p.settings.rating) < 4) return false;

        // City/District filtering
        if (cityFilter) {
          const pLoc = String(p.city || p.location || p.district || '').toLowerCase();
          if (!pLoc.includes(cityFilter)) return false;
        }

        return true;
      })
      .sort((a, b) => Number(b.settings.rating || 5) - Number(a.settings.rating || 5))
      .slice(0, 10);
  }, [professionals, unifiedServices, userLocation]);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const allLiveEvents = useMemo(() => {
    return (Array.isArray(events) ? events : []).filter(ev => {
      const s = String(ev.status || '').toLowerCase();
      if (s === "inactive" || s === "draft" || s === "expired") return false;

      const dynamicConfig = safeParse(ev.dynamic_config) || {};
      const configBasic = dynamicConfig.basicInfo || {};
      const configExpiry = configBasic.expiryDate || ev.expiry_date;
      let dateStr = ev.end_date || ev.endDate || configBasic.endDate || configExpiry || ev.date || ev.startDate || new Date().toISOString().split('T')[0];
      
      // Special check: If it's a marathon, it might have a date in dynamic_config.basicInfo.date
      if (!dateStr && configBasic.date) dateStr = configBasic.date;

      try {
        // Standardize dateStr to YYYY-MM-DD
        if (typeof dateStr === 'string' && (dateStr.includes('/') || dateStr.includes('-'))) {
          const separator = dateStr.includes('/') ? '/' : '-';
          const parts = dateStr.split(separator);
          if (parts[0].length <= 2) {
            const [d, m, y] = parts;
            dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          }
        }

        const timeStr = ev.end_time || ev.endTime || configBasic.endTime || ev.time || ev.startTime || '23:59';
        const eventDateTime = new Date(`${dateStr}T${timeStr}`);
        const isToday = eventDateTime.toDateString() === now.toDateString();

        if (!isNaN(eventDateTime.getTime()) && eventDateTime < now && !isToday) {
          return false; // Expired
        }
      } catch (err) {
        return false; // Error parsing means we hide it for safety
      }

      return true;
    });
  }, [events, now]);

  const activeEvents = useMemo(() => {
    const cityFilter = userLocation && userLocation !== "India" && userLocation !== "All Cities" && userLocation !== "Select City" ? userLocation.toLowerCase() : null;

    if (!cityFilter) return allLiveEvents;

    const cityVariations: Record<string, string[]> = {
      'bengaluru': ['bangalore', 'bengaluru'],
      'bangalore': ['bangalore', 'bengaluru'],
      'new delhi': ['delhi', 'new delhi', 'ncr'],
      'delhi': ['delhi', 'new delhi', 'ncr'],
      'mumbai': ['bombay', 'mumbai'],
      'chennai': ['madras', 'chennai'],
      'kochi': ['cochin', 'kochi'],
      'coimbatore': ['coimbatore', 'pollachi', 'podanur'],
    };
    
    const targetCities = cityVariations[cityFilter] || [cityFilter];

	    const localEvents = allLiveEvents.filter(ev => {
	      const isVirtual = ev.virtual === true || ev.virtual === "Yes";
	      if (isVirtual) return true;

      const evCity = String(ev.city || '').toLowerCase().trim();
      const evLoc = String(ev.location || '').toLowerCase().trim();
      const evVenue = String(ev.venue || '').toLowerCase().trim();
      const evDistrict = String(ev.district || '').toLowerCase().trim();
      
      const dynamicConfig = safeParse(ev.dynamic_config) || {};
      const configCity = String(dynamicConfig.location?.city || dynamicConfig.city || '').toLowerCase().trim();

      // If no location info at all, show it anyway
      if (!evCity && !evLoc && !evVenue && !evDistrict && !configCity) return true;

	      return targetCities.some(tc => 
	        evCity.includes(tc) || 
	        evLoc.includes(tc) || 
	        evVenue.includes(tc) || 
	        evDistrict.includes(tc) ||
	        configCity.includes(tc)
	      );
	    });
	
	    return localEvents.length > 0 ? localEvents : allLiveEvents;
	  }, [allLiveEvents, userLocation]);

  const heroSlides = useMemo(() => {
    if (!banners || banners.length === 0) return [];
    return banners.map((b: any) => ({
      id: b.id,
      img: b.imageUrl || b.img || b.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      title: b.title || 'Live Events',
      sub: b.redirect_type === 'event' ? 'BOOK NOW' : 'OFFER',
      url: b.redirectUrl || b.link || b.redirect_url,
      redirect_type: b.redirect_type,
      redirect_id: b.redirect_id
    }));
  }, [banners]);

  const allCoupons = useMemo(() => {
    if (couponsRaw && couponsRaw.length > 0) return couponsRaw;
    return BRAND_COUPONS;
  }, [couponsRaw]);

  const featuredEvents = useMemo(() => {
    const featured = activeEvents.filter(e => e.is_exclusive || e.is_spotlight || e.featured);
    return featured.length > 0 ? featured : activeEvents.slice(0, 5);
  }, [activeEvents]);

  const spotlightEvents = useMemo(() => {
    return activeEvents.filter(e => e.is_spotlight).slice(0, 5);
  }, [activeEvents]);

	  const justInEventsList = useMemo(() => {
	    return [...allLiveEvents]
	      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
	      .slice(0, 5);
	  }, [allLiveEvents]);

  const comingSoonEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter coming soon events by city as well
    return [...activeEvents]
      .filter(ev => {
        const dynamicConfig = safeParse(ev.dynamic_config) || {};
        const dt = ev.start_date || ev.date || dynamicConfig.date || dynamicConfig.basicInfo?.date || dynamicConfig.basicInfo?.expiryDate;
        if (!dt) return false;

        let eventDate: Date | null = null;
        if (typeof dt === 'string' && dt.includes('/')) {
          const [d, m, y] = dt.split('/');
          eventDate = new Date(`${y}-${m}-${d}T00:00:00`);
        } else {
          eventDate = new Date(dt);
        }
        
        // Show events starting tomorrow or later
        return eventDate > today;
      })
      .sort((a, b) => {
        // Prioritize featured/trending, then by date
        const aScore = (a.is_spotlight ? 10 : 0) + (a.featured ? 5 : 0) + (a.trending ? 3 : 0);
        const bScore = (b.is_spotlight ? 10 : 0) + (b.featured ? 5 : 0) + (b.trending ? 3 : 0);
        if (aScore !== bScore) return bScore - aScore;
        
        return new Date(a.date || a.start_date || 0).getTime() - new Date(b.date || b.start_date || 0).getTime();
      })
      .slice(0, 5);
  }, [activeEvents]);

  const popularEvents = useMemo(() => {
    return activeEvents.slice(0, 10);
  }, [activeEvents]);

  const tournamentEvents = useMemo(() => {
    return allLiveEvents.filter(e => e.type === "Tournament Event" || e.type === "Tournament" || (e.tournament_events && e.tournament_events.length > 0));
  }, [allLiveEvents]);

  const sportsChampionships = useMemo(() => {
    return tournamentEvents.filter(e => e.category === "Sports");
  }, [tournamentEvents]);

  const comingSoonListRef = useRef(null);
  const servicesListRef = useRef(null);
  const memoriesListRef = useRef(null);
  const heroSliderRef = useRef(null);
  const popularEventsRef = useRef(null);
  
  const heroIndexRef = useRef(0);
  const popularIndexRef = useRef(0);
  const comingSoonIndexRef = useRef(0);
  const servicesIndexRef = useRef(0);
  const memoriesIndexRef = useRef(0);

  useEffect(() => {
    if (comingSoonEvents.length <= 1) return;
    const timer = setInterval(() => {
      comingSoonIndexRef.current = (comingSoonIndexRef.current + 1) % comingSoonEvents.length;
      try {
        comingSoonListRef.current?.scrollToIndex({ index: comingSoonIndexRef.current, animated: true });
      } catch (error) {}
    }, 4000);
    return () => clearInterval(timer);
  }, [comingSoonEvents.length]);

  useEffect(() => {
    if (displayServices.length <= 1) return;
    const timer = setInterval(() => {
      servicesIndexRef.current = (servicesIndexRef.current + 1) % displayServices.length;
      try {
        servicesListRef.current?.scrollToIndex({ index: servicesIndexRef.current, animated: true });
      } catch (error) {}
    }, 5000);
    return () => clearInterval(timer);
  }, [displayServices.length]);

  useEffect(() => {
    const itemsCount = memoriesData && memoriesData.length > 0 ? memoriesData.length : RECENT_MEMORIES.length;
    if (itemsCount <= 1) return;
    const timer = setInterval(() => {
      memoriesIndexRef.current = (memoriesIndexRef.current + 1) % itemsCount;
      try {
        memoriesListRef.current?.scrollToIndex({ index: memoriesIndexRef.current, animated: true });
      } catch (error) {}
    }, 3500);
    return () => clearInterval(timer);
  }, [memoriesData]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      heroIndexRef.current = (heroIndexRef.current + 1) % heroSlides.length;
      try {
        heroSliderRef.current?.scrollToIndex({ index: heroIndexRef.current, animated: true });
      } catch (error) {}
    }, 4500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    if (popularEvents.length <= 1) return;
    const timer = setInterval(() => {
      popularIndexRef.current = (popularIndexRef.current + 1) % popularEvents.length;
      try {
        popularEventsRef.current?.scrollToIndex({ index: popularIndexRef.current, animated: true });
      } catch (error) {}
    }, 6000);
    return () => clearInterval(timer);
  }, [popularEvents.length]);

  return (
    <>
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffda00" />
      {/* 1. Custom Header */}
      {!isLocationModalOpen && (
        <View style={styles.header}>
          <View style={[styles.headerTopYellow, { backgroundColor: '#ffda00', height: 70, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 0 }]}>
          {/* 1. Left Section: Logo */}
          <View style={{ position: 'absolute', left: 16, zIndex: 10 }}>
            <Image 
              source={require('../../assets/images/logo_brand.png')} 
              style={{ width: 110, height: 40 }}
              resizeMode="contain"
            />
          </View>
          
          {/* 2. Center Section: Location */}
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <Pressable 
                onPress={() => setIsLocationModalOpen(true)}
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                  opacity: pressed ? 0.9 : 1
                })}
              >
                <LinearGradient
                  colors={['#ffffff', '#f8fafc']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 16,
                    gap: 6,
                    borderWidth: 1,
                    borderColor: 'rgba(248, 68, 100, 0.1)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2
                  }}
                >
                  <MapPin size={12} color="#f84464" strokeWidth={3} />
                  <View>
                    <Text style={{ fontSize: 7, fontWeight: '700', color: '#94a3b8', marginBottom: -1 }}>YOUR CITY</Text>
                    <Text style={{ fontWeight: '900', fontSize: 12, color: '#1e293b' }} numberOfLines={1}>
                      {userLocation?.city || userLocation || 'Select City'}
                    </Text>
                  </View>
                  <ChevronRight size={10} color="#64748b" style={{ opacity: 0.4 }} />
                </LinearGradient>
              </Pressable>
            </MotiView>
          </View>

          {/* 3. Right Section: Icons */}
          <View style={{ position: 'absolute', right: 20, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 10 }}>
            <Pressable 
              onPress={() => router.push('/notifications')}
              style={{ position: 'relative', padding: 4 }}
            >
              <Bell size={24} color="#1e293b" strokeWidth={2.5} />
              {unreadCount > 0 && (
                <View style={{ position: 'absolute', top: 0, right: 0, backgroundColor: '#f84464', borderRadius: 8, minWidth: 14, height: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#ffda00' }}>
                  <Text style={{ color: '#fff', fontSize: 7, fontWeight: '900' }}>{unreadCount}</Text>
                </View>
              )}
            </Pressable>

            {user ? (
              <View style={[styles.avatar, { backgroundColor: '#f84464', width: 32, height: 32, borderRadius: 16 }]}>
                <Text style={[styles.avatarText, { fontSize: 13 }]}>{user.email?.slice(0, 1).toUpperCase() || 'U'}</Text>
              </View>
            ) : (
              <Pressable onPress={() => router.push('/auth/sign-in')}>
                <View style={[styles.avatar, { backgroundColor: '#e2e8f0', width: 32, height: 32, borderRadius: 16 }]}>
                  <User size={18} color="#64748b" />
                </View>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    )}

        {/* 2. Promo Ticker - Landscape Box Style */}
        {displayPromos.length > 0 && (
          <View style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.background }}>
            <Pressable 
              style={{ 
                height: 70, 
                backgroundColor: colors.card, 
                borderRadius: 16, 
                flexDirection: 'row', 
                overflow: 'hidden', 
                borderWidth: 1, 
                borderColor: colors.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 3
              }}
              onPress={() => {
                if (!user) {
                  router.push('/auth/sign-in');
                } else {
                  router.push('/coupons');
                }
              }}
            >
              <MotiView
                key={currentPromoIndex}
                from={{ rotateX: '-90deg', opacity: 0 }}
                animate={{ rotateX: '0deg', opacity: 1 }}
                transition={{ type: 'timing', duration: 600 }}
                style={{ flex: 1, flexDirection: 'row' }}
              >
                {/* Left Image */}
                <View style={{ width: 80, height: '100%', backgroundColor: '#f1f5f9' }}>
                  <Image 
                    source={{ uri: displayPromos[currentPromoIndex]?.img }} 
                    style={{ width: '100%', height: '100%' }} 
                    resizeMode="cover"
                  />
                </View>
                
                {/* Right Content */}
                <View style={{ flex: 1, paddingHorizontal: 12, justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: '#f844a4' }}>{displayPromos[currentPromoIndex]?.code}</Text>
                    <View style={{ backgroundColor: '#f0fdf4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 8, fontWeight: '900', color: '#16a34a' }}>LIMITED DEAL</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: colors.text, marginTop: 2 }} numberOfLines={1}>
                    {displayPromos[currentPromoIndex]?.text}
                  </Text>
                </View>

                {/* Action */}
                <View style={{ width: 30, backgroundColor: '#f844a4', justifyContent: 'center', alignItems: 'center' }}>
                  <ChevronRight size={16} color="#fff" />
                </View>
              </MotiView>
            </Pressable>
          </View>
        )}

        {/* 3. Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.background, paddingTop: 15 }]}>
          <View style={[styles.searchBarInner, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Search size={18} color={colors.muted} />
            <TextInput
              placeholder="Find events..."
              placeholderTextColor={colors.muted}
              style={[styles.searchInput, { color: colors.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => router.push({ pathname: '/events', params: { q: searchQuery } })}
            />
            <Pressable 
              style={styles.searchBtn}
              onPress={() => router.push({ pathname: '/events', params: { q: searchQuery } })}
            >
              <LinearGradient
                colors={['#f844a4', '#a855f7']}
                style={styles.searchBtnGradient}
              >
                <Text style={styles.searchBtnText}>Search</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
 

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {heroSlides.length > 0 && (
          <HeroSlider 
            ref={heroSliderRef}
            slides={heroSlides} 
            onPress={(slide) => {
               if (slide.redirect_type === 'event' && slide.redirect_id) {
                 router.push({ pathname: "/events/[id]", params: { id: slide.redirect_id } });
               } else if (slide.redirect_type === 'url' && slide.url) {
                 Linking.openURL(slide.url).catch(err => console.error("Couldn't load page", err));
               }
            }} 
          />
        )}

        {/* 0.5) Sports Championships */}
        {sportsChampionships.length > 0 && (
          <View style={[styles.section, { marginTop: 20 }]}>
            <View style={[styles.sectionHeader, { marginBottom: 16 }]}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Sports <Text style={{ color: '#f59e0b' }}>Championships</Text> 🏆</Text>
                <Text style={{ fontSize: 11, color: colors.muted, fontWeight: '600', marginTop: 2 }}>Join the most competitive leagues</Text>
              </View>
            </View>
            <FlatList
              data={sportsChampionships}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `tourney-${item.id}`}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 20, gap: 16 }}
              renderItem={({ item }) => (
                <EventCard 
                  event={item} 
                  onPress={() => router.push({ pathname: "/events/[id]", params: { id: item.id } })} 
                />
              )}
            />
          </View>
        )}

        {/* 1) Featured Events (Popular) */}
        {popularEvents.length > 0 && (
          <View style={[styles.section, { marginTop: 10, paddingBottom: 20 }]}>
            <View style={[styles.sectionHeader, { flexDirection: 'column', alignItems: 'flex-start', gap: 4, marginBottom: 16 }]}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 24, letterSpacing: -0.5 }]}>
                Featured <Text style={{ color: '#f844a4' }}>Events</Text>
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '600' }}>Discover what everyone is talking about</Text>
            </View>

            <FlatList
              ref={popularEventsRef}
              data={popularEvents}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `popular-${item.id}`}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 20, gap: 16 }}
              renderItem={({ item }) => {
                const dynamicConfig = safeParse(item.dynamic_config) || {};
                const eventVenue = item.venue || item.location || dynamicConfig.location?.venueName || dynamicConfig.venue?.name || dynamicConfig.basicInfo?.venue || item.city || 'Venue TBA';
                const eventDate = item.start_date || item.date || dynamicConfig.date || dynamicConfig.basicInfo?.date || dynamicConfig.basicInfo?.expiryDate || 'TBA';
                const eventTime = item.time || dynamicConfig.time || dynamicConfig.basicInfo?.time || '';

                return (
                <Pressable 
                  style={{ width: 180, backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}
                  onPress={() => router.push({ pathname: "/events/[id]", params: { id: item.id } })}
                >
                  <Image source={{ uri: item.img || item.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800' }} style={{ width: '100%', height: 120 }} />
                  
                  <View style={{ padding: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text, flex: 1 }} numberOfLines={1}>{item.title || item.name || dynamicConfig?.basicInfo?.eventName || dynamicConfig?.title || 'Event'}</Text>
                      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginLeft: 4 }}>
                        <Text style={{ color: '#fff', fontSize: 8, fontWeight: 'bold' }}>✓</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                      <Text style={{ fontSize: 10, color: '#f84464' }}>📍</Text>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: colors.muted }} numberOfLines={1}>{eventVenue}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 10, color: '#10b981' }}>📅</Text>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: colors.muted }}>{eventDate} {eventTime}</Text>
                      </View>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: colors.text }}>{item.type === 'Free' ? 'Free' : 'Paid'}</Text>
                    </View>
                  </View>
                </Pressable>
                );
              }}
            />
          </View>
        )}

        {/* 2) Spotlight Events */}
        {spotlightEvents.length > 0 && (
          <View style={[styles.section, { paddingBottom: 20 }]}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={20} color="#ffda00" />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Spotlight ✨</Text>
              </View>
            </View>
            <FlatList
              data={spotlightEvents}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `spotlight-${item.id}`}
              contentContainerStyle={{ paddingLeft: 20, gap: 12 }}
              renderItem={({ item }) => (
                <Pressable 
                  onPress={() => router.push({ pathname: "/events/[id]", params: { id: item.id } })}
                  style={{ width: 280, height: 160, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
                >
                  <Image source={{ uri: item.img || item.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800' }} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
                  <View style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }} numberOfLines={1}>{item.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <MapPin size={12} color="#fff" />
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{item.city || 'Location TBA'}</Text>
                    </View>
                  </View>
                  <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: '#ffda00', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: '#000', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>Exclusive</Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        )}

        {/* Partner Deals Section removed */}


        {/* Professional Services Section removed as requested */}

        {/* Ad Banner Slot */}
        {banners && banners.some(b => {
          const m = typeof b.metadata === 'string' ? JSON.parse(b.metadata) : b.metadata;
          return m?.is_ad;
        }) && (
          <View style={{ paddingHorizontal: 20, marginVertical: 10 }}>
            {banners.filter(b => {
              const m = typeof b.metadata === 'string' ? JSON.parse(b.metadata) : b.metadata;
              return m?.is_ad;
            }).slice(0, 1).map((ad, i) => (
              <Pressable 
                key={i}
                style={{ height: 100, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#f844a4' }}
                onPress={() => {
                  const m = typeof ad.metadata === 'string' ? JSON.parse(ad.metadata) : ad.metadata;
                  if (m?.url) router.push(m.url);
                }}
              >
                <Image source={{ uri: ad.image_url }} style={StyleSheet.absoluteFill} />
                <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={StyleSheet.absoluteFill} />
                <View style={{ padding: 16 }}>
                  <Text style={{ color: '#fde047', fontSize: 8, fontWeight: '900', letterSpacing: 1 }}>SPONSORED</Text>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 4 }}>{ad.title}</Text>
                  <Text style={{ color: '#fff', fontSize: 10, opacity: 0.8 }}>{ad.sub_text}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Redundant Featured Events Section removed */}


        {/* Coming Soon Section */}
        {comingSoonEvents.length > 0 && (
          <View style={[styles.section, { marginTop: 20, paddingBottom: 20 }]}>
            <View style={[styles.sectionHeader, { marginBottom: 20 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Coming</Text>
                <Text style={[styles.sectionTitle, { color: '#f844a4' }]}>Soon</Text>
                <Text style={{ fontSize: 20 }}>🎯</Text>
              </View>
            </View>
            
            <FlatList
              ref={comingSoonListRef}
              data={comingSoonEvents}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 20, gap: 16 }}
              renderItem={({ item }) => {
                // Calculate countdown
                let eventDate = new Date();
                const dConfig = safeParse(item.dynamic_config) || {};
                const rawDate = item.start_date || item.date || dConfig.date || dConfig.basicInfo?.date || dConfig.basicInfo?.expiryDate;
                const rawTime = item.time || dConfig.time || dConfig.basicInfo?.time || '18:00';
                
                if (rawDate) {
                    if (typeof rawDate === 'string' && rawDate.includes('/')) {
                        const [d, m, y] = rawDate.split('/');
                        eventDate = new Date(`${y}-${m}-${d}T${rawTime.includes(':') ? rawTime : '18:00'}:00`);
                    } else {
                        eventDate = new Date(rawDate);
                    }
                }
                const timeDiff = eventDate.getTime() - new Date().getTime();
                const days = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
                const hours = Math.max(0, Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
                const mins = Math.max(0, Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60)));


                const dynamicConfig = safeParse(item.dynamic_config) || {};
                const eventVenue = item.venue || item.location || dynamicConfig.location?.venueName || dynamicConfig.venue?.name || dynamicConfig.basicInfo?.venue || item.city || 'Venue TBA';
                const displayDate = item.start_date || item.date || dynamicConfig.date || dynamicConfig.basicInfo?.date || dynamicConfig.basicInfo?.expiryDate || 'To be announced';
                const eventTime = item.time || dynamicConfig.time || dynamicConfig.basicInfo?.time || '18:00';

                return (
                  <Pressable 
                    style={{ width: width - 40, backgroundColor: colors.card, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 5 }}
                    onPress={() => router.push({ pathname: "/events/[id]", params: { id: item.id } })}
                  >
                    {/* Top Image */}
                    <View style={{ height: 180, position: 'relative' }}>
                      <Image source={{ uri: item.img || item.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800' }} style={{ width: '100%', height: '100%' }} />
                      <View style={{ position: 'absolute', top: 16, right: 16, backgroundColor: '#22c55e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                        <Text style={{ fontSize: 10, fontWeight: '900', color: '#fff', textTransform: 'uppercase' }}>Trending</Text>
                      </View>
                    </View>

                    {/* Content */}
                    <View style={{ padding: 20 }}>
                      <Text style={{ fontSize: 22, fontWeight: '900', color: colors.text, marginBottom: 16, letterSpacing: -0.5 }} numberOfLines={1}>{item.title || item.name || dynamicConfig?.basicInfo?.eventName || dynamicConfig?.title || 'Event'}</Text>
                      
                      {/* Countdown */}
                      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20, justifyContent: 'center' }}>
                        {[
                          { label: 'DAYS', val: days.toString().padStart(2, '0') },
                          { label: 'HOURS', val: hours.toString().padStart(2, '0') },
                          { label: 'MINS', val: mins.toString().padStart(2, '0') }
                        ].map((t, idx) => (
                          <View key={idx} style={{ alignItems: 'center', backgroundColor: colors.background, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, minWidth: 60, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' }}>
                            <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>{t.val}</Text>
                            <Text style={{ fontSize: 8, fontWeight: '800', color: colors.muted, marginTop: 2 }}>{t.label}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Details */}
                      <View style={{ gap: 8, marginBottom: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 14 }}>📅</Text>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.muted }}>{displayDate} • {eventTime}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 14 }}>📍</Text>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.muted }} numberOfLines={1}>{eventVenue}</Text>
                        </View>
                      </View>

                      {/* Button */}
                      <LinearGradient
                        colors={['#f844a4', '#a855f7']}
                        style={{ width: '100%', height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}
                      >
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Book Now</Text>
                      </LinearGradient>
                    </View>
                  </Pressable>
                );
              }}
            />
          </View>
        )}

        {/* New Section: Just In (Unfiltered latest events) */}
        <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>Just <Text style={{ color: '#f844a4' }}>In</Text> <Text style={{ color: '#a855f7' }}>⚡</Text></Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>The latest events added to BookMyTicket</Text>
              </View>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 16 }}
            >
              {justInEventsList && justInEventsList.length > 0 ? (
                justInEventsList.map((item, idx) => (
                  <EventCard 
                    key={item.id || idx} 
                    event={item} 
                    onPress={() => router.push({
                      pathname: "/events/[id]",
                      params: { id: item.id }
                    })}
                  />
                ))
              ) : (
                <View style={{ width: width - 40, height: 150, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.card, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: colors.border }}>
                   <Zap size={24} color={colors.muted} />
                   <Text style={{ marginTop: 12, color: colors.muted, fontWeight: '700', fontSize: 14 }}>Curating the latest events...</Text>
                   <Text style={{ marginTop: 4, color: colors.muted, fontSize: 12 }}>Check back in a few moments!</Text>
                </View>
              )}
            </ScrollView>
          </View>

        {/* New Section: Events Near You (ALL events) */}
        <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>Events Near <Text style={{ color: '#f844a4' }}>You</Text> <Text style={{ color: '#a855f7' }}>📍</Text></Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Handpicked for you in {userLocation}</Text>
              </View>
              <Pressable onPress={() => router.push('/events')}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.tint }}>See All</Text>
              </Pressable>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 16 }}
            >
              {activeEvents.length > 0 ? (
                activeEvents.map((item, idx) => (
                  <EventCard 
                    key={item.id || idx} 
                    event={item} 
                    onPress={() => router.push({
                      pathname: "/events/[id]",
                      params: { id: item.id }
                    })}
                  />
                ))
              ) : (
                <View style={{ width: width - 40, height: 150, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.card, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: colors.border }}>
                   <MapPin size={24} color={colors.muted} />
                   <Text style={{ marginTop: 12, color: colors.muted, fontWeight: '700', fontSize: 14 }}>No events in your city yet</Text>
                   <Text style={{ marginTop: 4, color: colors.muted, fontSize: 12 }}>Check back soon for local updates!</Text>
                </View>
              )}
            </ScrollView>
          </View>

        {/* Old Explore Popular Events position removed */}


        {/* Newsletter Subscription Section */}
        <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 40 }}>
          <LinearGradient
            colors={['#ec4899', '#a855f7']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ borderRadius: 24, padding: 24, shadowColor: '#ec4899', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700', marginBottom: 8 }}>
              Don't Miss Our Future Updates!
            </Text>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 24 }}>
              Get Subscribed Today!
            </Text>
            
            <View style={{ backgroundColor: '#fff', borderRadius: 30, padding: 6, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
              <TextInput 
                placeholder="your e-mail address"
                placeholderTextColor="#9ca3af"
                style={{ flex: 1, paddingHorizontal: 16, fontSize: 14, color: '#111827', height: 44 }}
              />
              <Pressable style={{ backgroundColor: '#ffda00', borderRadius: 24, paddingHorizontal: 20, height: 44, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#111827', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>Subscribe</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>

        {/* Recent Service Reviews */}
        <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text, letterSpacing: -0.5 }}>Recent <Text style={{ color: '#f844a4' }}>Reviews</Text></Text>
              <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '600' }}>What people are saying about our experts</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
               {[1,2,3,4,5].map(i => <Text key={i} style={{ fontSize: 12, color: '#ffda00' }}>★</Text>)}
            </View>
          </View>

          <View style={{ height: 160 }}>
            {SERVICE_REVIEWS.map((review, index) => {
              if (index !== currentReviewIndex) return null;
              return (
                <MotiView
                  key={review.id}
                  from={{ opacity: 0, translateY: 30, rotateX: '45deg', scale: 0.9 }}
                  animate={{ opacity: 1, translateY: 0, rotateX: '0deg', scale: 1 }}
                  transition={{ type: 'timing', duration: 600 }}
                  style={[StyleSheet.absoluteFill, { backgroundColor: '#111827', borderRadius: 24, padding: 20, shadowColor: '#f844a4', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, borderWidth: 1, borderColor: 'rgba(248, 68, 164, 0.3)' }]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Image source={{ uri: review.avatar }} style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#f844a4' }} />
                      <View>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{review.user}</Text>
                        <Text style={{ color: '#a855f7', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }}>{review.service}</Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255, 218, 0, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ color: '#ffda00', fontSize: 12, fontWeight: '900' }}>{review.rating}.0</Text>
                      <Text style={{ fontSize: 10, color: '#ffda00' }}>★</Text>
                    </View>
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontStyle: 'italic', lineHeight: 22 }}>
                    "{review.review}"
                  </Text>
                  
                  {/* Blinking indicator at bottom right */}
                  <MotiView
                    from={{ opacity: 0.2 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'timing', duration: 800, loop: true }}
                    style={{ position: 'absolute', bottom: 20, right: 20, width: 8, height: 8, borderRadius: 4, backgroundColor: '#f844a4', shadowColor: '#f844a4', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6 }}
                  />
                </MotiView>
              );
            })}
          </View>
        </View>

        {/* Recent Memories Gallery */}
        <View style={{ marginBottom: 60, marginTop: 10 }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 32, paddingHorizontal: 20 }}>
            <Text style={{ color: '#f97316', fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              ✦ Our Gallery
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -0.5 }}>
                Recent Memories{' '}
              </Text>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#f844a4' }}>
                2026
              </Text>
            </View>
          </View>

          {/* Gallery List */}
          <FlatList
            ref={memoriesListRef}
            data={memoriesData && memoriesData.length > 0 ? memoriesData.map(m => ({ id: m.id, img: m.image_url || m.img || m.imageUrl, caption: m.alt_text || m.alt || m.altText || 'Memory' })) : RECENT_MEMORIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
            renderItem={({ item, index }) => {
              const rotation = index % 2 === 0 ? '-3deg' : '3deg';
              const translateY = index % 2 === 0 ? 0 : 6;
              
              return (
                <View style={{ alignItems: 'center', transform: [{ rotate: rotation }, { translateY }], width: 110 }}>
                  <View style={{ width: 110, height: 150, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6, borderWidth: 2, borderColor: '#fff' }}>
                    <Image source={{ uri: item.img }} style={{ width: '100%', height: '100%' }} />
                  </View>
                  <Text style={{ marginTop: 12, fontSize: 11, fontWeight: '800', color: colors.text, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
                    {item.caption}
                  </Text>
                </View>
              );
            }}
          />

          {/* Button */}
          <Pressable style={{ alignSelf: 'center', marginTop: 40, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 30, borderWidth: 1.5, borderColor: '#f97316', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: '#f97316', fontSize: 14, fontWeight: '800' }}>Explore Full Gallery →</Text>
          </Pressable>
        </View>

        {/* City Discovery Section (Circular Cities + Auto Banner) */}
        <View style={{ marginBottom: 40 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>Explore by <Text style={{ color: '#f844a4' }}>City</Text></Text>
            <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '600' }}>Events happening in your favorite destinations</Text>
          </View>

          {/* Circular Cities List */}
          <FlatList
            ref={cityListRef}
            data={POPULAR_CITIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
            getItemLayout={(_, index) => ({
                length: 80, // 64 (width) + 16 (gap)
                offset: 80 * index,
                index,
            })}
            onScrollToIndexFailed={(info) => {
                const wait = new Promise(resolve => setTimeout(resolve, 500));
                wait.then(() => {
                    cityListRef.current?.scrollToIndex({ index: info.index, animated: true });
                });
            }}
            renderItem={({ item }) => {
              const isSelected = selectedHomeCity === item.name;
              return (
                <Pressable 
                  onPress={() => setSelectedHomeCity(item.name)}
                  style={{ alignItems: 'center', gap: 8 }}
                >
                  <View style={[
                    { width: 64, height: 64, borderRadius: 32, overflow: 'hidden', backgroundColor: colors.border, borderWidth: 2, borderColor: isSelected ? '#f844a4' : colors.border },
                    isSelected && { shadowColor: '#f844a4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }
                  ]}>
                    <Image 
                        source={CITY_IMAGES[item.name] || { uri: item.image || `https://picsum.photos/seed/${item.name}/100/100` }} 
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={500}
                    />
                  </View>
                  <Text style={{ fontSize: 10, fontWeight: isSelected ? '900' : '700', color: isSelected ? '#f844a4' : colors.text, textTransform: 'uppercase' }}>
                    {item.name}
                  </Text>
                </Pressable>
              );
            }}
          />

          {/* Auto-scrolling City Banner */}
          <View style={{ marginTop: 30 }}>
            {cityLoading ? (
              <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color="#f844a4" />
              </View>
            ) : cityEvents.length > 0 ? (
              <FlatList
                ref={cityBannerListRef}
                data={cityEvents}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <Pressable 
                    onPress={() => router.push({ pathname: "/events/[id]", params: { id: item.id } })}
                    style={{ width: SCREEN_WIDTH, paddingHorizontal: 20 }}
                  >
                    <View style={{ borderRadius: 24, overflow: 'hidden', height: 200, position: 'relative' }}>
                      <Image source={{ uri: item.image_url || item.img }} style={StyleSheet.absoluteFill} contentFit="cover" />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                        <View style={{ backgroundColor: 'rgba(248, 68, 164, 0.9)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 }}>
                          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>{item.category?.toUpperCase() || 'EVENT'}</Text>
                        </View>
                        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 4 }} numberOfLines={1}>{item.title || item.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MapPin size={12} color="#fff" />
                          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' }}>{item.city}</Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                )}
              />
            ) : (
              <View style={{ height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: 20, borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.border }}>
                <MapPin size={32} color={colors.muted} style={{ marginBottom: 10 }} />
                <Text style={{ color: colors.muted, fontWeight: '700' }}>No events in {selectedHomeCity} yet</Text>
                <Text style={{ color: colors.muted, fontSize: 10 }}>Check back later or try another city</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Side Menu Overlay */}
      {isMenuOpen && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
          <Pressable 
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} 
            onPress={() => setIsMenuOpen(false)} 
          />
          <MotiView
            from={{ translateX: 300 }}
            animate={{ translateX: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            style={[styles.sideMenu, { backgroundColor: colors.background }]}
          >
            <View style={styles.menuHeader}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Menu</Text>
              <Pressable onPress={() => setIsMenuOpen(false)}>
                <CloseIcon size={28} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.menuContent}>

              
              {user && role && ['staff', 'admin', 'organiser', 'superadmin'].includes(role.toLowerCase()) && (
                <>
                  <Pressable style={styles.menuItem} onPress={() => { 
                    setIsMenuOpen(false); 
                    router.push('/staff');
                  }}>
                    <Text style={[styles.menuItemText, { color: '#a855f7' }]}>⚡ Staff Dashboard</Text>
                  </Pressable>
                  <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
                </>
              )}

              {user && (
                <View style={{ marginTop: 40 }}>
                  <Pressable onPress={handleSignOut}>
                    <LinearGradient
                      colors={['#f844a4', '#a855f7']}
                      style={styles.signOutBtn}
                    >
                      <Text style={styles.signOutText}>Sign Out</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              )}
            </View>
          </MotiView>
        </View>
      )}

      {/* Location Modal Overlay */}
      <LocationSelectionModal 
        isOpen={isLocationModalOpen} 
        onClose={() => setIsLocationModalOpen(false)} 
      />
    </View>
    </>
  );
}

function CategoryPill({ icon, label, active }: any) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  return (
    <Pressable 
      style={[
        styles.categoryPill, 
        { 
          backgroundColor: active ? (colorScheme === 'dark' ? '#fff' : '#f1f5f9') : colors.card, 
          borderColor: active ? colors.text : colors.border 
        }
      ]}
    >
      {icon}
      <Text style={[styles.categoryPillLabel, { color: active ? colors.text : colors.muted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#ffda00',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTopYellow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffda00',
  },
  logoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    backgroundColor: 'transparent',
  },
  logoImage: { width: 140, height: 45, backgroundColor: 'transparent' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'transparent' },
  locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'transparent' },
  locationText: { fontSize: 13, fontWeight: '700' },
  avatar: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  menuBtn: { padding: 4 },
  promoTicker: { 
    height: 35, 
    justifyContent: 'center',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  promoTickerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    height: '100%',
  },
  promoEmoji: { fontSize: 14, marginRight: 10, zIndex: 10 },
  promoText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#1e293b' },
  getDealBadge: { backgroundColor: '#f844a4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  getDealText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },
  searchBtn: { borderRadius: 20, overflow: 'hidden' },
  searchBtnGradient: { paddingHorizontal: 18, paddingVertical: 8 },
  searchBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  scrollContent: { paddingTop: 10 },
  categoryScroll: { paddingHorizontal: 20, gap: 10, marginBottom: 25 },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillLabel: { fontSize: 13, fontWeight: '700' },
  featuredBanner: { marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', marginBottom: 30 },
  featuredBannerGradient: { padding: 20, gap: 15 },
  bannerBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 15,
    alignSelf: 'flex-start'
  },
  bannerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  bannerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  bannerDate: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', marginTop: 4 },
  bookNowBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#fff', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 12 
  },
  bookNowBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },
  heroSection: { height: 450, position: 'relative', marginBottom: 30 },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 300, justifyContent: 'flex-end', padding: 25 },
  heroContent: { gap: 8 },
  heroTitleMain: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  heroTitleAccent: { color: '#f84464', fontSize: 28, fontWeight: '900', letterSpacing: -1, marginTop: -10 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', lineHeight: 22 },
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  seeAll: { fontSize: 14, fontWeight: '700' },
  comingSoonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  comingSoonImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  comingSoonInfo: {
    flex: 1,
    marginLeft: 16,
    gap: 4,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  comingSoonBadge: {
    backgroundColor: '#f1f5f9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  comingSoonBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  sideMenu: { 
    position: 'absolute', 
    right: 0, 
    top: 0, 
    bottom: 0, 
    width: 300, 
    padding: 25, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  menuHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 40 
  },
  menuTitle: { fontSize: 24, fontWeight: '900' },
  menuContent: { gap: 10 },
  menuItem: { paddingVertical: 15 },
  menuItemText: { fontSize: 18, fontWeight: '800' },
  menuDivider: { height: 1, width: '100%' },
  signOutBtn: { 
    width: '100%', 
    height: 55, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#f844a4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  signOutText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
