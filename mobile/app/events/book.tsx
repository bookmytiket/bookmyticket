import React, { useMemo, useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View as RNView,
  Alert,
  TextInput,
  Modal,
  Linking,
  View,
  ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Text } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useSupabase';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Ticket,
  Minus,
  Plus,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Users,
  Info,
  Sparkles,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Star,
} from 'lucide-react-native';
import { isFreeEvent } from '@/lib/eventUtils';
import UnifiedApi from '@/lib/unifiedApi';
import VisualSeatPicker from '@/components/VisualSeatPicker';
import { DataService } from '../../services/DataService';
import TournamentRegistrationWizard from '@/components/TournamentRegistrationWizard';

export default function BookEventScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { id, type } = useLocalSearchParams<{ id: string, type: string }>();
  const { user } = useAuth();
  const isTournament = type === 'tournament';
  const isAudienceFree = type === 'audience_free';

  const [event, setEvent] = useState<any>(null);
  const [marathonCategories, setMarathonCategories] = useState<any[]>([]);
  const [selectedKM, setSelectedKM] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [success, setSuccess] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [razorpayHtml, setRazorpayHtml] = useState('');
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [formResponses, setFormResponses] = useState<any>({});
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [selectionField, setSelectionField] = useState<any>(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [dob, setDob] = useState('');
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
  const [venueLayouts, setVenueLayouts] = useState<any[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<any>(null);
  
  const [pricingData, setPricingData] = useState({
    subtotal: 0,
    platformFeeBase: 0,
    taxAmount: 0,
    addonAmount: 0,
    discountAmount: 0,
    finalAmount: 0,
    loading: false
  });
  
  const [showtimes, setShowtimes] = useState<any[]>([]);
  const [selectedShowtime, setSelectedShowtime] = useState<any>(null);
  const couponList = useMemo(
    () => Array.isArray(availableCoupons) ? availableCoupons : [],
    [availableCoupons]
  );

  // Auto-apply best bulk discount
  useEffect(() => {
    if (couponList.length === 0) return;
    
    const applicableBulkCoupons = couponList.filter(c => 
      c.code?.startsWith('BULK_AUTO_') && quantity >= (c.min_tickets || 1)
    );
    
    if (applicableBulkCoupons.length > 0) {
      let bestCoupon: any = null;
      let maxDiscount = 0;
      
      // Calculate a simple base price for the check
      let currentBasePrice = event?.price || 499;
      if (selectedTier) {
          if (selectedTier.price !== undefined) {
              currentBasePrice = Number(selectedTier.price);
          } else {
              const rawRates = selectedTier.ageRates || selectedTier.agePricing || selectedTier.age_rates || selectedTier.age_pricing || [];
              if (Array.isArray(rawRates) && rawRates.length > 0) {
                  currentBasePrice = Number(rawRates[0].price || 0);
              }
          }
      }
      if (selectedAgeGroup) currentBasePrice = Number(selectedAgeGroup.price || 0);

      const base = currentBasePrice * quantity; // Simplified base for bulk checking
      
      applicableBulkCoupons.forEach(coupon => {
        let currentDiscount = 0;
        if (coupon.type === 'percent') {
          currentDiscount = (base * coupon.value) / 100;
        } else {
          currentDiscount = coupon.value;
        }
        if (currentDiscount > maxDiscount) {
          maxDiscount = currentDiscount;
          bestCoupon = coupon;
        }
      });
      
      if (bestCoupon && (!appliedCoupon || (appliedCoupon.code?.startsWith('BULK_AUTO_') && appliedCoupon.id !== bestCoupon.id))) {
        setAppliedCoupon({...bestCoupon, offerTitle: bestCoupon.offerTitle || 'Bulk Booking Discount'});
      }
    } else if (appliedCoupon?.code?.startsWith('BULK_AUTO_')) {
      setAppliedCoupon(null);
    }
  }, [couponList, quantity, event, selectedTier, selectedAgeGroup, appliedCoupon]);

  useEffect(() => {
    if (!id) return;

    // Initial fetch
    fetchEvent();

    // Real-time subscription
    fetchCoupons();
    const channel = supabase
      .channel(`event-updates-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          fetchEvent();
        }
      )
      .subscribe();

    const catChannel = supabase
      .channel(`marathon-cats-book-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'marathon_categories',
          filter: `event_id=eq.${id}`,
        },
        (payload) => {
          setMarathonCategories((prev: any[]) => 
            prev.map(cat => cat.id === payload.new.id ? { ...cat, ...payload.new } : cat)
          );
          // If the selected tier was updated, update it in state too
          setSelectedTier((prev: any) => prev?.id === payload.new.id ? { ...prev, ...payload.new } : prev);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(catChannel);
    };
  }, [id]);

  const processEventData = (data: any) => {
    const parsedConfig = safeParse(data.dynamic_config) || {};
    let tiers = [];
    if (data.competition_events?.length > 0) {
      tiers = data.competition_events.map((e: any) => ({
        id: e.id,
        title: e.event_name,
        price: e.fee,
        description: `Distance: ${e.distance} | Gender: ${e.gender}`,
        ageRates: data.competition_categories?.length > 0 ? data.competition_categories.map((c: any) => ({
           id: c.id, label: c.category_name, minAge: c.min_age, maxAge: c.max_age, price: e.fee
        })) : []
      }));
    } else if (parsedConfig.categories?.length > 0) tiers = parsedConfig.categories;
    else if (data.event_ticket_categories?.length > 0) {
      tiers = data.event_ticket_categories.map((c: any) => ({
        id: c.id, title: c.category_name, price: c.price, description: c.description || 'General Admission Ticket'
      }));
    } else if (data.ticket_categories?.length > 0) tiers = data.ticket_categories;
    else {
      const ticketsData = safeParse(data.tickets);
      if (Array.isArray(ticketsData) && ticketsData.length > 0) tiers = ticketsData;
      else if (Array.isArray(parsedConfig.marathonCategories) && parsedConfig.marathonCategories.length > 0) tiers = parsedConfig.marathonCategories;
      else if (Array.isArray(parsedConfig.marathon_categories) && parsedConfig.marathon_categories.length > 0) tiers = parsedConfig.marathon_categories;
      else if (Array.isArray(parsedConfig.tickets) && parsedConfig.tickets.length > 0) tiers = parsedConfig.tickets;
      else if (Array.isArray(parsedConfig.categories) && parsedConfig.categories.length > 0) tiers = parsedConfig.categories;
      else if (Array.isArray(parsedConfig.seatingSections) && parsedConfig.seatingSections.length > 0) {
        tiers = parsedConfig.seatingSections.map((sec: any) => ({
          id: sec.id,
          title: sec.name,
          price: sec.basePrice,
          description: sec.isGeneral ? 'General Admission' : 'Reserved Seating'
        }));
      }
      else tiers = [{ id: 'gen', title: 'Ticket', price: parsedConfig.price || data.price || 499, description: 'Standard admission for the event.' }];
    }
    if (tiers.length > 0) {
      setSelectedTier(tiers[0]);
      const rawRates = tiers[0].ageRates || tiers[0].agePricing || tiers[0].age_rates || tiers[0].age_pricing || [];
      if (Array.isArray(rawRates) && rawRates.length > 0) {
        setSelectedAgeGroup(rawRates[0]);
      }
    }
    
    // Pre-fill form with defaults
    const form = (data.registration_fields?.length > 0)
      ? data.registration_fields.sort((a: any, b: any) => a.sort_order - b.sort_order).map((f: any) => ({
          id: f.id,
          label: f.label,
          type: f.field_type === 'phone' ? 'tel' : f.field_type,
          options: f.options || [],
          required: f.is_required,
          isDefault: f.field_key === 'full_name' || f.field_key === 'email_address' || f.field_key === 'phone_number'
      }))
      : (parsedConfig.registrationForm || parsedConfig.form_fields || []);
      
    const initialResponses: any = {};
    let initialName = user?.user_metadata?.full_name || '';
    let initialEmail = user?.email || '';

    form.forEach((f: any) => {
      const label = (f.label || '').toLowerCase();
      if (f.isDefault || label.includes('name') || label.includes('email')) {
        if (label.includes('name')) {
          initialResponses[f.id] = initialName;
        }
        if (label.includes('email')) {
          initialResponses[f.id] = initialEmail;
        }
      }
    });

    setName(initialName);
    setEmail(initialEmail);
    setFormResponses(initialResponses);
  };

  const safeParse = (val: any) => {
    if (!val) return null;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return null; }
    }
    return val;
  };

  const fetchCoupons = async () => {
    try {
      const offers = await UnifiedApi.getCoupons({ event_id: String(id || '') });
      setAvailableCoupons(Array.isArray(offers) ? offers : []);
    } catch (err) {
      console.warn('Error fetching coupons:', err);
      setAvailableCoupons([]);
    }
  };

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organiser:profiles!events_organiser_id_fkey (*),
          event_ticket_categories (*),
          ticket_categories (*),
          competition_categories (*),
          competition_events (*),
          registration_fields (*)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      setEvent(data);
      processEventData(data);

      if (data.booking_mode === 'multi_show') {
          const { data: shows } = await supabase
            .from('event_showtimes')
            .select('*')
            .eq('event_id', id)
            .order('show_date', { ascending: true })
            .order('start_time', { ascending: true });
          
          if (shows && shows.length > 0) {
              setShowtimes(shows);
              setSelectedShowtime(shows[0]);
          }
      }

      // Fetch Marathon Categories
      const { data: cats, error: catError } = await supabase
        .from('marathon_categories')
        .select('*')
        .eq('marathon_id', id)
        .order('distance_km', { ascending: true });
      
      const parsedConfig = safeParse(data.dynamic_config) || {};
      const configCats = parsedConfig.marathonCategories || parsedConfig.marathon_categories || [];
      
      const allCats = [...(cats || []), ...configCats];
      if (allCats.length > 0) {
        setMarathonCategories(allCats);
        const kms = [...new Set(allCats.map(c => Number(c.distance_km)))].sort((a, b) => a - b);
        if (kms.length > 0) {
          setSelectedKM(kms[0]);
          const firstTier = allCats.find(c => Number(c.distance_km) === kms[0]);
          if (firstTier) {
            setSelectedTier(firstTier);
            const rawRates = firstTier.ageRates || firstTier.agePricing || firstTier.age_rates || firstTier.age_pricing || firstTier.pricing || [];
            if (Array.isArray(rawRates) && rawRates.length > 0) {
              setSelectedAgeGroup(rawRates[0]);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching event for booking:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchLayouts = async () => {
        if (!id) return;
        try {
            // Safety check for DataService availability
            if (DataService && typeof DataService.getVenueLayouts === 'function') {
                const data = await DataService.getVenueLayouts(id);
                setVenueLayouts(data || []);
            } else {
                console.warn('DataService.getVenueLayouts is not available in book.tsx');
                // Fallback: try to fetch directly if service is missing
                const { data, error } = await supabase
                    .from('venue_layouts')
                    .select('*, seat_blocks(*)')
                    .eq('event_id', id);
                if (!error && data) setVenueLayouts(data);
            }
        } catch (err) {
            console.error('Error fetching venue layouts in book.tsx:', err);
        }
    };
    fetchLayouts();
  }, [id]);
  const dynamicConfig = safeParse(event?.dynamic_config) || {};
  
  const ticketTiers = (() => {
    if (event?.dynamic_config?.categories?.length > 0) return event.dynamic_config.categories;
    if (event?.event_ticket_categories?.length > 0) {
      return event.event_ticket_categories.map((c: any) => ({
        id: c.id, title: c.category_name, price: c.price, description: c.description || 'General Admission Ticket'
      }));
    }
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
    return [
      { id: 'gen', title: 'Ticket', price: event?.dynamic_config?.price || event?.price || 499, description: 'Standard admission for the event.' }
    ];
  })();
  const eventBlocks = React.useMemo(() => {
      if (!event) return [];
      const seatCategories = typeof event.seat_categories === 'string' 
        ? safeParse(event.seat_categories) 
        : (event.seat_categories || event.ticket_categories || []);
      
      let validBlocks = event.blocks || [];
      if (validBlocks.length === 0 && seatCategories?.length > 0 && Number(event.cols) > 0) {
          validBlocks = seatCategories.map((cat: any, i: number) => ({
              id: cat.id || `block_${i}`,
              name: cat.name || cat.category_name || cat.title,
              category: cat.name || cat.category_name || cat.title,
              price: cat.price,
              rows: Math.max(1, Math.floor(Number(event.cols) || 10)),
              cols: Math.max(1, Number(event.cols) || 10),
              rowNaming: 'alphabetic',
              numberingDirection: 'ltr',
              startNumber: 1
          }));
      } else {
          validBlocks = validBlocks.map((b: any, i: number) => ({
              ...b,
              id: b.id || `block_${i}`,
              rows: b.rows || Math.max(1, Math.floor(Number(event.cols) || 10)),
              cols: b.cols || Math.max(1, Number(event.cols) || 10),
              rowNaming: b.rowNaming || 'alphabetic',
              numberingDirection: b.numberingDirection || 'ltr',
              startNumber: b.startNumber || 1
          }));
      }
      return validBlocks;
  }, [event]);

  const isMarathon = event?.type === 'Marathon' || marathonCategories.length > 0;
  
  const hasSeatingMap = React.useMemo(() => {
      if (!event) return false;
      if (isMarathon) return false; // Marathons never have seating maps
      if (isFreeEvent(event)) return false; // Free events shouldn't require seating
      
      // Check if event blocks are just dummy general admission blocks
      const hasOnlyGeneralBlocks = eventBlocks.length > 0 && eventBlocks.every((b: any) => 
          b.isGeneral || (Number(b.cols || 0) === 0 && Number(b.rows || 0) === 0)
      );
      
      if (hasOnlyGeneralBlocks && venueLayouts.length === 0) {
          return false;
      }

      if (event.event_type === 'general') return false;
      if (event.event_type === 'reserved') return true;

      const hasLegacySeatCategories = eventBlocks.length > 0 && Number(event.cols) > 0;
      const hasVisualBlocks = dynamicConfig?.seating_type === 'visual' && eventBlocks.length > 0;
      
      return hasLegacySeatCategories || hasVisualBlocks || (venueLayouts.length > 0);
  }, [event, isMarathon, eventBlocks, dynamicConfig, venueLayouts]);
  const marathonSteps = [
    { id: 1, title: 'Category', icon: Ticket },
    { id: 2, title: 'Identity', icon: Users },
    { id: 3, title: 'Details', icon: Info },
    { id: 4, title: 'Amenities', icon: Sparkles },
    { id: 5, title: 'Review', icon: CheckCircle },
    { id: 6, title: 'Payment', icon: CreditCard },
  ];

  
  const getVenueDetails = () => {
    const venueName = event?.venue || event?.location || dynamicConfig?.venue?.name || dynamicConfig?.basicInfo?.venue || 'TBA';
    const venueAddress = event?.address || dynamicConfig?.venue?.address || dynamicConfig?.location?.address || '';
    const city = event?.city || dynamicConfig?.venue?.city || dynamicConfig?.basicInfo?.city || '';
    
    return {
      name: venueName,
      address: [venueAddress, city].filter(Boolean).join(', ')
    };
  };
  const venue = getVenueDetails();

  const getBasePrice = () => {
    if (selectedAgeGroup) return Number(selectedAgeGroup.price || 0);
    if (selectedTier) {
      if (selectedTier.price !== undefined) return Number(selectedTier.price);
      const rawRates = selectedTier.ageRates || selectedTier.agePricing || selectedTier.age_rates || selectedTier.age_pricing || [];
      if (Array.isArray(rawRates) && rawRates.length > 0) {
        return Number(rawRates[0].price || 0);
      }
      return Number(selectedTier.price || 0);
    }
    return Number(event?.price || 0);
  };

  const basePrice = getBasePrice();
  
  // Refactored to use centralized API
  useEffect(() => {
    const fetchPricing = async () => {
      if (!event || isFreeEvent(event)) {
        setPricingData({ subtotal: 0, platformFeeBase: 0, taxAmount: 0, addonAmount: 0, discountAmount: 0, finalAmount: 0, loading: false });
        return;
      }
      
      setPricingData(prev => ({ ...prev, loading: true }));
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.2:3000';
        
        let calculatedBase = selectedSeats.length > 0 
          ? selectedSeats.reduce((acc, s) => acc + (s.price_override || selectedBlock?.base_price || basePrice), 0)
          : basePrice * quantity;
          
        // Temporary hack to handle base price passing if package is dynamic.
        // Ideally the API handles everything, but since we have dynamic seating we pass base via query or adjust package logic later
        const res = await fetch(`${apiUrl}/api/pricing/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: event.id,
            packageId: selectedTier?.id,
            quantity: quantity,
            couponCode: appliedCoupon?.code || couponCode,
            addons: []
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          // If seating map is used, override subtotal and recalculate fees if needed, or better just use the response if packageId is right
          // To ensure correctness with seating map, we might need a custom endpoint later, but for now fallback to Data
          if (selectedSeats.length > 0) {
              const resWithCustomSubtotal = await fetch(`${apiUrl}/api/pricing/calculate`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    eventId: event.id,
                    customSubtotal: calculatedBase, // A future API improvement can take customSubtotal
                    packageId: selectedTier?.id,
                    quantity: quantity,
                    couponCode: appliedCoupon?.code || couponCode,
                  })
              });
              if(resWithCustomSubtotal.ok) {
                  const d = await resWithCustomSubtotal.json();
                  setPricingData({ ...d, subtotal: calculatedBase, loading: false });
                  return;
              }
          }
          
          setPricingData({ ...data, loading: false });
        }
      } catch (err) {
        console.error('Pricing calculate error:', err);
        setPricingData(prev => ({ ...prev, loading: false }));
      }
    };
    
    // Add debounce
    const timer = setTimeout(() => {
      fetchPricing();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [event, quantity, selectedTier, appliedCoupon, couponCode, selectedSeats, basePrice]);

  const { subtotal, ticketSubtotal, platformFeeBase, taxAmount, finalAmount, discountAmount } = pricingData;
  const displaySubtotal = subtotal !== undefined ? subtotal : (ticketSubtotal || 0);
  const convenienceFee = platformFeeBase || 0;
  const gst = taxAmount || 0;
  const total = finalAmount || 0;
  const discount = discountAmount || 0;

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    
    setValidatingCoupon(true);
    try {
      const appliedData = await UnifiedApi.validateCoupon({ code, quantity, event_id: id });
      setAppliedCoupon(appliedData);
      Alert.alert('Success', `Coupon ${code} applied successfully!`);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to validate coupon.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleBook = async () => {
    let finalName = name.trim();
    let finalEmail = email.trim();
    let finalPhone = phone.trim();

    // Fallback: Check dynamic form responses if state is empty
    if (!finalName || !finalEmail) {
      Object.entries(formResponses).forEach(([fieldId, value]) => {
        const field = (dynamicConfig.registrationForm || []).find((f: any) => String(f.id) === fieldId);
        if (field && typeof value === 'string') {
          const label = field.label.toLowerCase();
          if (!finalName && (label.includes('name') || label.includes('full name'))) finalName = value.trim();
          if (!finalEmail && (label.includes('email') || label.includes('email id'))) finalEmail = value.trim();
          if (!finalPhone && (label.includes('phone') || label.includes('mobile') || label.includes('contact'))) finalPhone = value.trim();
        }
      });
    }

    if (!finalName || !finalEmail) {
      Alert.alert('Missing Info', 'Please fill in your name and email.');
      return;
    }

    // Validate Age Category against Date of Birth if competition age groups are defined
    if (dynamicConfig.competitionAgeGroups && dynamicConfig.competitionAgeGroups.length > 0) {
      const dobField = (dynamicConfig.registrationForm || []).find((f: any) => f.label.toLowerCase().includes('date of birth') || f.label.toLowerCase() === 'dob');
      const ageCatField = (dynamicConfig.registrationForm || []).find((f: any) => f.label.toLowerCase().includes('age category'));
      
      if (dobField && ageCatField && formResponses[dobField.id] && formResponses[ageCatField.id]) {
        const dobStr = formResponses[dobField.id];
        const selectedCat = formResponses[ageCatField.id];
        
        const dobYear = new Date(dobStr).getFullYear();
        if (!isNaN(dobYear)) {
          const baseYear = parseInt(dynamicConfig.baseYear) || new Date().getFullYear();
          const age = baseYear - dobYear;
          
          const ageGroup = dynamicConfig.competitionAgeGroups.find((g: any) => g.name === selectedCat);
          if (ageGroup) {
            const min = parseInt(ageGroup.minAge) || 0;
            const max = parseInt(ageGroup.maxAge) || 99;
            
            if (age < min || age > max) {
               Alert.alert('Age Verification Failed', `Based on DOB (${dobYear}), age is ${age} (Base Year: ${baseYear}). This does not match the selected category '${selectedCat}' (Allowed: ${min}-${max} years).`);
               return;
            }
          }
        }
      }
    }

    // Check other required dynamic fields
    const missingFields = (dynamicConfig.registrationForm || [])
      .filter((f: any) => f.required && !formResponses[f.id])
      .map((f: any) => f.label);
    
    if (missingFields.length > 0) {
      Alert.alert('Required Info', `Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      const bookingPayload = {
        event_id: String(event.id),
        user_id: user?.id,
        ticket_count: quantity,
        base_amount: subtotal,
        platform_charge: convenienceFee,
        gst_amount: gst,
        discount_amount: discount,
        total_price: total,
        status: (isFreeEvent(event) || total === 0) ? 'Confirmed' : 'Pending',
        scanned: false,
        event_name: event.name || event.title || dynamicConfig?.title,
        location: venue.name || event.location,
        customer_details: {
          name: finalName,
          email: finalEmail,
          phone: finalPhone || null,
          distance_km: selectedKM,
          category_id: selectedTier?.id || null,
          category_title: selectedTier?.title || selectedTier?.name || selectedTier?.type || 'General',
          age_group: selectedAgeGroup 
            ? (selectedAgeGroup.label || `${selectedAgeGroup.minAge || selectedAgeGroup.min}-${selectedAgeGroup.maxAge || selectedAgeGroup.max} Yrs`)
            : (selectedTier?.min_age !== undefined ? `${selectedTier.min_age}-${selectedTier.max_age} Yrs` : null),
          ticket_type: selectedTier?.title || selectedTier?.name || selectedTier?.type || 'General',
          selected_seats: selectedSeats.map(s => ({ id: s.id, number: s.seat_number, row: s.row_name, block: s.block_id })),
          showtimeId: selectedShowtime?.id || null,
          showtimeName: selectedShowtime?.show_name || null,
          showtimeDate: selectedShowtime?.show_date || null,
          showtimeStart: selectedShowtime?.start_time || null,
          ...formResponses
        },
      };

      const created = await UnifiedApi.createBooking(bookingPayload);
      const data = created.booking || { id: created.bookingId };

      if (isFreeEvent(event) || total === 0) {
        setSuccess(true);
      } else {
        // Paid Event - Initialize Razorpay via WebView
        setCurrentBookingId(data.id);
        
        try {
          const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.2:3000';
          const orderRes = await fetch(`${apiUrl}/api/razorpay/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: data.id,
              amount: total,
              type: "booking"
            })
          });
          
          if (!orderRes.ok) {
            const errData = await orderRes.json();
            throw new Error(errData.error || "Failed to create payment order");
          }
          
          const orderData = await orderRes.json();

          // Generate Razorpay Checkout HTML
          const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { background-color: #f8f9fa; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif; }
              .loader { border: 4px solid #f3f3f3; border-top: 4px solid #f84464; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div class="loader"></div>
            <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
            <script>
              var options = {
                key: "${process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_SkQ5MQO9dB5LuI'}",
                amount: "${orderData.amount}",
                currency: "${orderData.currency}",
                order_id: "${orderData.id}",
                name: "BookMyTicket",
                description: "Ticket for ${event.name || event.title}",
                prefill: {
                  name: "${name.trim()}",
                  email: "${email.trim()}",
                  contact: "${phone.trim()}"
                },
                theme: { color: "#f84464" },
                handler: function(response) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    event: 'success', 
                    paymentId: response.razorpay_payment_id,
                    orderId: response.razorpay_order_id,
                    signature: response.razorpay_signature
                  }));
                }
              };
              options.modal = {
                ondismiss: function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'dismissed' }));
                }
              };
              setTimeout(() => {
                var rzp = new Razorpay(options);
                rzp.open();
              }, 500);
            </script>
          </body>
        </html>
        `;
        
        setRazorpayHtml(html);
        setShowRazorpay(true);
        } catch (fetchErr: any) {
          // Cleanup pending booking if order creation fails
          await supabase.from('bookings').delete().eq('id', data.id);
          throw new Error('Could not connect to payment gateway: ' + fetchErr.message);
        }
      }
    } catch (err: any) {
      Alert.alert('Booking Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRazorpayMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.event === 'success') {
        setShowRazorpay(false);
        setSubmitting(true);
        
        try {
          const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.2:3000';
          const verifyRes = await fetch(`${apiUrl}/api/razorpay/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: data.orderId,
              razorpay_payment_id: data.paymentId,
              razorpay_signature: data.signature,
              id: currentBookingId,
              type: "booking"
            })
          });
          
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setSuccess(true);
          } else {
            // Revert pending booking on verification failure
            if (currentBookingId) await supabase.from('bookings').delete().eq('id', currentBookingId);
            Alert.alert("Verification Failed", verifyData.error || "Payment verification failed.");
          }
        } catch (err) {
          // Revert pending booking on network error
          if (currentBookingId) await supabase.from('bookings').delete().eq('id', currentBookingId);
          Alert.alert("Verification Error", "Could not verify payment with server.");
        } finally {
          setSubmitting(false);
        }
      } else if (data.event === 'dismissed') {
        setShowRazorpay(false);
        // Delete the pending booking so it doesn't leave fake bookings
        if (currentBookingId) {
          await supabase.from('bookings').delete().eq('id', currentBookingId);
        }
        Alert.alert('Payment Cancelled', 'You can retry the payment from your tickets page.');
      }
    } catch (e) {
      console.log('Error parsing Razorpay message', e);
    }
  };

  if (success) {
    return (
      <RNView style={[styles.successContainer, { backgroundColor: colors.background }]}>
        <MotiView
          from={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          style={styles.successContent}
        >
          <LinearGradient
            colors={['#22c55e20', '#22c55e10']}
            style={styles.successIcon}
          >
            <CheckCircle size={64} color="#22c55e" />
          </LinearGradient>
          <Text style={[styles.successTitle, { color: colors.text }]}>
            Booking Confirmed! 🎉
          </Text>
          <Text style={[styles.successSub, { color: colors.muted }]}>
            Your ticket for "{event?.title}" is ready
          </Text>
          <Pressable
            style={styles.successBtn}
            onPress={() => router.replace('/(tabs)/tickets')}
          >
            <LinearGradient
              colors={colors.gradient as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.successBtnGradient}
            >
              <Ticket size={18} color="#fff" />
              <Text style={styles.successBtnText}>View My Tickets</Text>
            </LinearGradient>
          </Pressable>
        </MotiView>
      </RNView>
    );
  }

  if (loading || !event) {
    return (
      <RNView style={[styles.container, { backgroundColor: colors.background }]}>
        <RNView style={[styles.skeletonHero, { backgroundColor: colors.border }]} />
      </RNView>
    );
  }

  if (isTournament) {
    return (
      <RNView style={[styles.container, { backgroundColor: colors.background }]}>
        <RNView style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Team Registration</Text>
          <RNView style={{ width: 22 }} />
        </RNView>
        <TournamentRegistrationWizard 
          event={event} 
          user={user} 
          onComplete={(team: any) => {
            setSuccess(true);
          }} 
        />
      </RNView>
    );
  }

  if (isAudienceFree) {
    return (
      <RNView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 30 }]}>
        <RNView style={{ alignItems: 'center', gap: 20 }}>
          <LinearGradient
            colors={['#fdf2f8', '#fce7f3']}
            style={{ width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' }}
          >
            <Users size={60} color="#db2777" />
          </LinearGradient>
          <View style={{ alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text, textAlign: 'center' }}>Free Visitor Pass</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.muted, textAlign: 'center' }}>
              Claim your complimentary entry to the tournament as an audience member.
            </Text>
          </View>
          <Pressable 
            onPress={handleBook} 
            disabled={submitting}
            style={{ width: '100%', height: 60, borderRadius: 20, overflow: 'hidden', marginTop: 20 }}
          >
            <LinearGradient
              colors={['#db2777', '#7c3aed']}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>CONFIRM PASS</Text>}
            </LinearGradient>
          </Pressable>
        </RNView>
      </RNView>
    );
  }

  return (
    <RNView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Razorpay Webview Modal */}
      <Modal visible={showRazorpay} animationType="slide" transparent={false}>
        <RNView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 40 }}>
          <Pressable onPress={() => setShowRazorpay(false)} style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontWeight: '800', color: colors.text }}>Cancel Payment</Text>
          </Pressable>
          {razorpayHtml ? (
            <WebView
              source={{ html: razorpayHtml }}
              onMessage={handleRazorpayMessage}
              style={{ flex: 1 }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              originWhitelist={['*']}
              scalesPageToFit={true}
              startInLoadingState={true}
            />
          ) : null}
        </RNView>
      </Modal>

      {/* Header */}
      <RNView style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => {
          if (isMarathon && bookingStep > 1) setBookingStep(bookingStep - 1);
          else router.canGoBack() ? router.back() : router.replace('/(tabs)');
        }} hitSlop={12}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isMarathon ? `Step ${bookingStep} of 6` : 'Book Tickets'}
        </Text>
        <RNView style={{ width: 22 }} />
      </RNView>

      {/* Marathon step progress rail */}
      {isMarathon && (
        <RNView style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {marathonSteps.map((s, idx) => (
            <React.Fragment key={s.id}>
              <RNView style={{ alignItems: 'center', gap: 3 }}>
                <RNView style={[
                  { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
                  bookingStep >= s.id ? { backgroundColor: colors.tint } : { backgroundColor: colors.border }
                ]}>
                  <s.icon size={12} color={bookingStep >= s.id ? '#fff' : colors.muted} />
                </RNView>
                <Text style={{ fontSize: 7, fontWeight: '900', color: bookingStep >= s.id ? colors.tint : colors.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {s.title}
                </Text>
              </RNView>
              {idx < marathonSteps.length - 1 && (
                <RNView style={{ flex: 1, height: 1.5, backgroundColor: bookingStep > s.id ? colors.tint : colors.border, marginBottom: 12 }} />
              )}
            </React.Fragment>
          ))}
        </RNView>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Event summary mini card (always visible) */}
        <RNView style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Image
            source={{ uri: event.img || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200' }}
            style={styles.eventThumb}
            contentFit="cover"
          />
          <RNView style={styles.eventInfo}>
            <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
              {event.name || event.title || dynamicConfig?.basicInfo?.eventName || dynamicConfig?.title || 'Event Booking'}
            </Text>
            <RNView style={styles.metaRow}>
              <Calendar size={12} color={colors.tint} />
              <Text style={[styles.metaText, { color: colors.muted }]}>{event.start_date || event.date || dynamicConfig?.date || dynamicConfig?.basicInfo?.date || dynamicConfig?.basicInfo?.expiryDate || 'TBA'}</Text>
            </RNView>
            <RNView style={[styles.metaRow, { alignItems: 'flex-start' }]}>
              <MapPin size={12} color={colors.error} style={{ marginTop: 2 }} />
              <RNView style={{ flex: 1 }}>
                <Text style={[styles.metaText, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>
                  {venue.name}
                </Text>
                {venue.address ? (
                  <Text style={[styles.metaText, { color: colors.muted, fontSize: 10, marginTop: 1 }]} numberOfLines={1}>
                    {venue.address}
                  </Text>
                ) : null}
              </RNView>
            </RNView>
          </RNView>
        </RNView>

        {/* Showtime Selector */}
        {showtimes.length > 0 && (
          <RNView style={{ marginHorizontal: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Select Showtime</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {showtimes.map((show) => {
                const isSelected = selectedShowtime?.id === show.id;
                return (
                  <Pressable
                    key={show.id}
                    onPress={() => {
                        setSelectedShowtime(show);
                        setSelectedSeats([]); // Clear seats on time change
                    }}
                    style={[
                      { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1.5 },
                      isSelected ? { backgroundColor: '#fdf2f8', borderColor: '#ec4899' } : { backgroundColor: colors.card, borderColor: colors.border }
                    ]}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '900', color: isSelected ? '#ec4899' : colors.text }}>
                      {new Date(`2000-01-01T${show.start_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </Text>
                    {show.show_name && (
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isSelected ? '#ec4899' : colors.muted, marginTop: 4 }}>
                        {show.show_name}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </RNView>
        )}

        {/* Interactive Seating Map */}
        {hasSeatingMap && (!isMarathon || bookingStep === 1) && (
          <VisualSeatPicker 
            eventId={String(event.id)} 
            showtimeId={selectedShowtime?.id || null}
            selectedSeats={selectedSeats}
            eventBlocks={eventBlocks}
            onSeatSelect={(seats) => {
                setSelectedSeats(seats);
                if (seats.length > 0) setQuantity(seats.length);
            }}
          />
        )}

        {/* ─── STEP 1: Category (Marathon) OR single-page category (non-marathon) ─── */}
        {(!isMarathon || bookingStep === 1) && !hasSeatingMap && (
          <>
            {/* Event Map */}
            {!isMarathon && dynamicConfig?.location?.coordinates?.lat && dynamicConfig?.location?.coordinates?.lng && (
              <RNView style={{ marginHorizontal: 20, marginBottom: 20, borderRadius: 24, overflow: 'hidden', height: 220, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
                <WebView 
                  scrollEnabled={false}
                  geolocationEnabled={true}
                  source={{ html: `
                    <html>
                      <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                        <style>
                          body { margin: 0; padding: 0; font-family: -apple-system, system-ui; }
                          #map { height: 100vh; width: 100vw; }
                          .locate-btn {
                            position: absolute; top: 12px; left: 12px; z-index: 1000;
                            background: white; border: none; border-radius: 12px;
                            width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                          }
                          .user-marker {
                            width: 14px; height: 14px; background: #3b82f6;
                            border: 3px solid white; border-radius: 50%;
                            box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
                          }
                          .leaflet-container { background: #000 !important; }
                        </style>
                      </head>
                      <body>
                        <div id="map"></div>
                        <button class="locate-btn" onclick="locateMe()">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 1-1.5 5h3Z"/><path d="m22 12-5 1.5v-3Z"/><path d="M12 23 13.5 18h-3Z"/><path d="M2 12 7 10.5v3Z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                        <script>
                          var map = L.map('map', { zoomControl: false }).setView([${dynamicConfig.location.coordinates.lat}, ${dynamicConfig.location.coordinates.lng}], 17);
                          
                          // Use Google Satellite for consistency and reliability
                          L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
                            maxZoom: 20,
                            subdomains:['mt0','mt1','mt2','mt3']
                          }).addTo(map);

                          var markerIcon = L.divIcon({
                            className: 'custom-div-icon',
                            html: '<div style="background-color:#f84464;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 15px rgba(248,68,100,0.8);"></div>',
                            iconSize: [14, 14],
                            iconAnchor: [7, 7]
                          });

                          L.marker([${dynamicConfig.location.coordinates.lat}, ${dynamicConfig.location.coordinates.lng}], { icon: markerIcon }).addTo(map);
                          
                          function locateMe() {
                            if (!navigator.geolocation) return;
                            navigator.geolocation.getCurrentPosition(function(pos) {
                              var lat = pos.coords.latitude;
                              var lng = pos.coords.longitude;
                              
                              var userIcon = L.divIcon({
                                className: 'user-marker-container',
                                html: '<div class="user-marker"></div>',
                                iconSize: [14, 14],
                                iconAnchor: [7, 7]
                              });
                              
                              L.marker([lat, lng], { icon: userIcon }).addTo(map);
                              
                              var bounds = L.latLngBounds([lat, lng], [${dynamicConfig.location.coordinates.lat}, ${dynamicConfig.location.coordinates.lng}]);
                              map.fitBounds(bounds, { padding: [50, 50] });
                            });
                          }
                        </script>
                      </body>
                    </html>
                  `}}
                  style={{ flex: 1 }}
                />
                <Pressable 
                  onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${dynamicConfig.location.coordinates.lat},${dynamicConfig.location.coordinates.lng}`)}
                  style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: colors.tint, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 }}
                >
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>GET DIRECTIONS</Text>
                </Pressable>
              </RNView>
            )}

            {(marathonCategories.length > 0 || ticketTiers.length > 0) && (
              <RNView style={styles.section}>
                <RNView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Select Category</Text>
                  
                  {marathonCategories.length > 0 && (
                    <RNView style={{ backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: colors.tint }}>{selectedKM} KM</Text>
                    </RNView>
                  )}
                </RNView>

                {marathonCategories.length > 0 && (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
                  >
                    {[...new Set(marathonCategories.map(c => Number(c.distance_km)))].sort((a, b) => a - b).map(km => (
                      <Pressable 
                        key={km}
                        onPress={() => {
                          setSelectedKM(km);
                          const currentCats = marathonCategories.length > 0 ? marathonCategories : (safeParse(event.dynamic_config)?.marathonCategories || []);
                          const firstTier = currentCats.find((c: any) => Number(c.distance_km) === km);
                          if (firstTier) {
                            setSelectedTier(firstTier);
                            const rawRates = firstTier.ageRates || firstTier.agePricing || firstTier.age_rates || firstTier.age_pricing || firstTier.pricing || [];
                            if (Array.isArray(rawRates) && rawRates.length > 0) {
                              setSelectedAgeGroup(rawRates[0]);
                            } else {
                              setSelectedAgeGroup(null);
                            }
                          }
                        }}
                        style={[
                          { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
                          selectedKM === km && { backgroundColor: colors.tint, borderColor: colors.tint }
                        ]}
                      >
                        <Text style={[
                          { fontSize: 12, fontWeight: '800', color: colors.muted },
                          selectedKM === km && { color: '#fff' }
                        ]}>{km} KM</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}


            {(marathonCategories.length > 0 
              ? marathonCategories.filter(c => !selectedKM || Number(c.distance_km) === selectedKM)
              : ticketTiers
            ).map((tier: any, i: number) => {
              const isSelected = selectedTier?.id === tier.id || (selectedTier?.name === tier.name && !tier.id);
              
              const tierPrice = (() => {
                if (tier.price !== undefined) return Number(tier.price);
                const rawRates = tier.ageRates || tier.agePricing || tier.age_rates || tier.age_pricing || tier.pricing || [];
                if (Array.isArray(rawRates) && rawRates.length > 0) {
                  return Math.min(...rawRates.map((r: any) => Number(r.price || 0)));
                }
                return Number(tier.price || 0);
              })();

              return (
                <Pressable
                  key={tier.id || i}
                  onPress={() => {
                    setSelectedTier(tier);
                    const rawRates = tier.ageRates || tier.agePricing || tier.age_rates || tier.age_pricing || tier.pricing || [];
                    if (Array.isArray(rawRates) && rawRates.length > 0) {
                      setSelectedAgeGroup(rawRates[0]);
                    } else {
                      setSelectedAgeGroup(null);
                    }
                  }}
                  style={[
                    styles.tierOption,
                    {
                      backgroundColor: isSelected ? colors.tint + '15' : colors.card,
                      borderColor: isSelected ? colors.tint : colors.border,
                    },
                  ]}
                >
                  <RNView style={styles.tierLeft}>
                    <RNView
                      style={[
                        styles.radioOuter,
                        { borderColor: isSelected ? colors.tint : colors.border },
                      ]}
                    >
                      {isSelected && (
                        <RNView style={[styles.radioInner, { backgroundColor: colors.tint }]} />
                      )}
                    </RNView>
                    <RNView>
                      <Text style={[styles.tierName, { color: colors.text }]}>
                        {tier.category_name || tier.title || tier.name || tier.type || 'General'}
                      </Text>
                        <Text style={[styles.tierDesc, { color: colors.muted }]}>
                          {[
                            tier.age_group ? `Age: ${tier.age_group}` : (tier.min_age !== undefined ? `Age ${tier.min_age}-${tier.max_age}` : null),
                            tier.gender_category || tier.gender,
                            tier.description
                          ].filter(Boolean).join(' • ')}
                        </Text>
                    </RNView>
                  </RNView>
                  <Text style={[styles.tierPrice, { color: colors.tint }]}>
                    {tierPrice === 0 ? 'FREE' : `₹${tierPrice.toLocaleString('en-IN')}`}
                  </Text>
                </Pressable>
              );
            })}
          </RNView>
        )}
          </>
        )}

        {/* Age Group selection — non-marathon only */}
        {!isMarathon && (() => {
          const rawRates = selectedTier?.ageRates || selectedTier?.agePricing || selectedTier?.age_rates || selectedTier?.age_pricing || selectedTier?.pricing || [];
          if (Array.isArray(rawRates) && rawRates.length > 0) {
            return (
              <RNView style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Age Group</Text>
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      'Select Age Group',
                      '',
                      [
                        ...rawRates.map((ap: any) => ({
                          text: `${ap.label || `${ap.minAge || ap.min}-${ap.maxAge || ap.max} Yrs`} - ₹${Number(ap.price || 0).toLocaleString('en-IN')}`,
                          onPress: () => setSelectedAgeGroup(ap)
                        })),
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                  style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, justifyContent: 'center' }]}
                >
                  <RNView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: selectedAgeGroup ? colors.text : colors.muted, fontSize: 15, fontWeight: '600' }}>
                      {selectedAgeGroup 
                        ? `${selectedAgeGroup.label || `${selectedAgeGroup.minAge || selectedAgeGroup.min}-${selectedAgeGroup.maxAge || selectedAgeGroup.max} Yrs`} (₹${Number(selectedAgeGroup.price || 0).toLocaleString('en-IN')})`
                        : 'Select age group'}
                    </Text>
                    <ChevronDown size={18} color={colors.muted} />
                  </RNView>
                </Pressable>
              </RNView>
            );
          }
          return null;
        })()}

        {/* Quantity */}
        <RNView style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quantity</Text>
          <RNView style={[styles.quantityRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              style={[styles.quantityBtn, { backgroundColor: colors.border }]}
            >
              <Minus size={18} color={colors.text} />
            </Pressable>
            <Text style={[styles.quantityValue, { color: colors.text }]}>{quantity}</Text>
            <Pressable
              onPress={() => setQuantity((q) => Math.min(10, q + 1))}
              style={[styles.quantityBtn, { backgroundColor: colors.tint }]}
            >
              <Plus size={18} color="#fff" />
            </Pressable>
          </RNView>
          {isMarathon && (
            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.muted, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              * You can book for up to 10 participants
            </Text>
          )}
        </RNView>

        {/* Coupon - Moved Up */}
        <RNView style={styles.section}>
          <RNView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 0, color: colors.text }]}>Apply Coupon</Text>
            {couponList.length > 0 && (
              <Pressable onPress={() => setShowCouponsModal(true)}>
                <Text style={{ color: colors.tint, fontWeight: '800', fontSize: 13 }}>View All</Text>
              </Pressable>
            )}
          </RNView>
          
          {!appliedCoupon ? (
            <RNView style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.fieldInput, { flex: 1, backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="ENTER CODE"
                placeholderTextColor={colors.muted}
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />
              <Pressable 
                onPress={handleApplyCoupon}
                disabled={validatingCoupon || !couponCode}
                style={[styles.applyBtn, { backgroundColor: colors.tint, opacity: (validatingCoupon || !couponCode) ? 0.5 : 1 }]}
              >
                <Text style={styles.applyBtnText}>{validatingCoupon ? '...' : 'Apply'}</Text>
              </Pressable>
            </RNView>
          ) : (
            <RNView style={[styles.couponBadge, { backgroundColor: '#22c55e15', borderColor: '#22c55e' }]}>
              <RNView style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} color="#22c55e" />
                <Text style={{ color: '#22c55e', fontWeight: '800' }}>{appliedCoupon.code} Applied</Text>
              </RNView>
              <Pressable onPress={() => setAppliedCoupon(null)}>
                <Text style={{ color: colors.muted, fontWeight: '700' }}>Remove</Text>
              </Pressable>
            </RNView>
          )}
        </RNView>

        {/* Participant Details — non-marathon only */}
        {!isMarathon && (
        <RNView style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Participant Details</Text>
          <RNView style={styles.formFields}>
            {(dynamicConfig.registrationForm || dynamicConfig.form_fields || [])
              .filter((field: any, index: number, self: any[]) => {
                const label = (field.label || '').toLowerCase();
                // Deduplicate email fields: Skip "Email ID" if "Email Address" exists
                if (label.includes('email id')) {
                  const hasEmailAddress = self.some(f => (f.label || '').toLowerCase().includes('email address'));
                  if (hasEmailAddress) return false;
                }
                return true;
              })
              .map((field: any, i: number) => (
              <RNView key={field.id || field.label || `field_${i}`} style={styles.fieldWrapper}>
                <Text style={[styles.label, { color: colors.muted }]}>
                  {field.label} {field.required ? '*' : ''}
                </Text>
                {field.type === 'select' ? (
                  <Pressable
                    onPress={() => setSelectionField(field)}
                    style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, justifyContent: 'center' }]}
                  >
                    <RNView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: formResponses[field.id] ? colors.text : colors.muted, fontSize: 15, fontWeight: '600' }}>
                        {formResponses[field.id] || `Select ${field.label.toLowerCase()}`}
                      </Text>
                      <ChevronDown size={18} color={colors.muted} />
                    </RNView>
                  </Pressable>
                ) : (
                  <TextInput
                    style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    placeholderTextColor={colors.muted}
                    value={formResponses[field.id]}
                    onChangeText={(val) => {
                      setFormResponses({ ...formResponses, [field.id]: val });
                      // Map standard fields back to top-level state for legacy compat if needed
                      if (field.isDefault) {
                        if (field.label === 'Full Name') setName(val);
                        if (field.label === 'Email Address') setEmail(val);
                        if (field.label === 'Phone Number') setPhone(val);
                      }
                    }}
                    keyboardType={field.type === 'tel' ? 'phone-pad' : field.type === 'email' ? 'email-address' : 'default'}
                    autoCapitalize={field.type === 'email' ? 'none' : 'words'}
                  />
                )}
              </RNView>
            ))}
            
            {/* Fallback if no dynamic form */}
            {(!dynamicConfig.registrationForm || dynamicConfig.registrationForm.length === 0) && (
              <>
                <RNView style={styles.fieldWrapper}>
                  <Text style={[styles.label, { color: colors.muted }]}>Full Name *</Text>
                  <TextInput
                    style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.muted}
                    value={name}
                    onChangeText={setName}
                  />
                </RNView>
                <RNView style={styles.fieldWrapper}>
                  <Text style={[styles.label, { color: colors.muted }]}>Email Address *</Text>
                  <TextInput
                    style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                    placeholder="your@email.com"
                    placeholderTextColor={colors.muted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </RNView>
              </>
            )}
          </RNView>
        </RNView>
        )}


        {/* ─── MARATHON STEP 2: Identity ─── */}
        {isMarathon && bookingStep === 2 && (
          <RNView style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Runner Identity</Text>
            <RNView style={styles.formFields}>
              {[{ label: 'Full Name', key: 'fullName', keyboard: 'default' as any, cap: 'words' as any },
                { label: 'Email Address', key: 'email', keyboard: 'email-address' as any, cap: 'none' as any },
                { label: 'Phone Number', key: 'phone', keyboard: 'phone-pad' as any, cap: 'none' as any },
              ].map(f => (
                <RNView key={f.key} style={styles.fieldWrapper}>
                  <Text style={[styles.label, { color: colors.muted }]}>{f.label} *</Text>
                  <TextInput
                    style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                    placeholder={`Enter ${f.label.toLowerCase()}`}
                    placeholderTextColor={colors.muted}
                    value={formResponses[f.key] || ''}
                    onChangeText={(v) => setFormResponses({ ...formResponses, [f.key]: v })}
                    keyboardType={f.keyboard}
                    autoCapitalize={f.cap}
                  />
                </RNView>
              ))}
              <RNView style={styles.fieldWrapper}>
                <Text style={[styles.label, { color: colors.muted }]}>Date of Birth</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={colors.muted}
                  value={dob}
                  onChangeText={setDob}
                  keyboardType="numeric"
                />
              </RNView>
            </RNView>
          </RNView>
        )}

        {/* ─── MARATHON STEP 3: Custom Details ─── */}
        {isMarathon && bookingStep === 3 && (
          <RNView style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Participant Details</Text>
            <RNView style={styles.formFields}>
              {(dynamicConfig.form_fields || dynamicConfig.registrationForm || []).map((field: any, i: number) => (
                <RNView key={field.id || field.label || `dyn_field_${i}`} style={styles.fieldWrapper}>
                  <Text style={[styles.label, { color: colors.muted }]}>
                    {field.label} {field.required ? '*' : ''}
                  </Text>
                  {field.type === 'select' ? (
                    <Pressable
                      onPress={() => setSelectionField(field)}
                      style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, justifyContent: 'center' }]}
                    >
                      <RNView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: formResponses[field.id] ? colors.text : colors.muted, fontSize: 15, fontWeight: '600' }}>
                          {formResponses[field.id] || `Select ${field.label.toLowerCase()}`}
                        </Text>
                        <ChevronDown size={18} color={colors.muted} />
                      </RNView>
                    </Pressable>
                  ) : (
                    <TextInput
                      style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      placeholderTextColor={colors.muted}
                      value={formResponses[field.id] || ''}
                      onChangeText={(v) => setFormResponses({ ...formResponses, [field.id]: v })}
                    />
                  )}
                </RNView>
              ))}
              {(dynamicConfig.form_fields || dynamicConfig.registrationForm || []).length === 0 && (
                <RNView style={{ padding: 24, backgroundColor: colors.card, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 13 }}>No additional details required</Text>
                </RNView>
              )}
            </RNView>
          </RNView>
        )}

        {/* ─── MARATHON STEP 4: Amenities ─── */}
        {isMarathon && bookingStep === 4 && (
          <RNView style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Race Amenities</Text>
            <RNView style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {(dynamicConfig.benefits || [
                { benefit_name: 'Finisher Medal' }, { benefit_name: 'Technical T-Shirt' },
                { benefit_name: 'E-Certificate' }, { benefit_name: 'Post-Run Breakfast' },
                { benefit_name: 'Hydration Stations' }, { benefit_name: 'First Aid' },
              ]).map((b: any, i: number) => (
                <RNView key={i} style={{ width: '47%', padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', gap: 8, backgroundColor: colors.card, borderColor: colors.border }}>
                  <RNView style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.tint + '20', alignItems: 'center', justifyContent: 'center' }}>
                    <Star size={18} color={colors.tint} />
                  </RNView>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text, textAlign: 'center' }}>{b.benefit_name}</Text>
                </RNView>
              ))}
            </RNView>
          </RNView>
        )}

        {/* ─── MARATHON STEP 5: Review ─── */}
        {isMarathon && bookingStep === 5 && (
          <RNView style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Review Registration</Text>
            <RNView style={{ backgroundColor: colors.card, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 16 }}>
              <RNView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 12 }}>
                <Text style={{ fontWeight: '900', fontSize: 14, color: colors.text }}>Runner Details</Text>
                <Pressable onPress={() => setBookingStep(2)}>
                  <Text style={{ color: colors.tint, fontWeight: '800', fontSize: 13 }}>Edit</Text>
                </Pressable>
              </RNView>
              {[
                { label: 'Name', value: formResponses.fullName },
                { label: 'Email', value: formResponses.email },
                { label: 'Phone', value: formResponses.phone },
                { label: 'Category', value: selectedTier?.name || selectedTier?.title || selectedTier?.type },
                { label: 'Distance', value: selectedKM ? `${selectedKM} KM` : null },
              ].filter(r => r.value).map(r => (
                <RNView key={r.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>{r.label}</Text>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>{r.value}</Text>
                </RNView>
              ))}
            </RNView>
            <RNView style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, padding: 16, backgroundColor: '#22c55e15', borderRadius: 16, borderWidth: 1, borderColor: '#22c55e30' }}>
              <ShieldCheck size={18} color="#22c55e" />
              <Text style={{ color: '#16a34a', fontWeight: '700', fontSize: 12, flex: 1 }}>All set! Proceed to complete your registration.</Text>
            </RNView>
          </RNView>
        )}

        {/* Coupons Modal */}
        <Modal visible={showCouponsModal} animationType="slide" transparent={true}>
          <RNView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <RNView style={{ backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%' }}>
              <RNView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: colors.text }}>Available Offers</Text>
                <Pressable onPress={() => setShowCouponsModal(false)}>
                  <Text style={{ color: colors.muted, fontWeight: '800' }}>Close</Text>
                </Pressable>
              </RNView>
              <ScrollView showsVerticalScrollIndicator={false}>
                {couponList.map((c) => (
                  <Pressable 
                    key={c.id}
                    onPress={() => {
                      setCouponCode(c.code);
                      setShowCouponsModal(false);
                      setTimeout(handleApplyCoupon, 100);
                    }}
                    style={{ 
                      padding: 20, 
                      backgroundColor: colors.card, 
                      borderRadius: 20, 
                      borderWidth: 1, 
                      borderColor: colors.border,
                      marginBottom: 12
                    }}
                  >
                    <RNView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <RNView>
                        <RNView style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>
                            {c.code?.startsWith('BULK_AUTO_') ? 'Bulk Discount' : c.code}
                          </Text>
                          {(c.isCampaign || c.code?.startsWith('BULK_AUTO_')) && (
                            <RNView style={{ backgroundColor: '#10b98120', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                               <Text style={{ color: '#10b981', fontSize: 9, fontWeight: '800' }}>
                                 {c.code?.startsWith('BULK_AUTO_') ? 'BULK OFFER' : 'BRAND OFFER'}
                               </Text>
                            </RNView>
                          )}
                        </RNView>
                        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                          {c.offerTitle || (c.type === 'percent' ? `${c.value}% Off` : `₹${c.value} Off`)}
                        </Text>
                      </RNView>
                      <ArrowLeft size={20} color={colors.tint} style={{ transform: [{ rotate: '180deg' }] }} />
                    </RNView>
                  </Pressable>
                ))}
              </ScrollView>
            </RNView>
          </RNView>
        </Modal>

        {(selectedTier && (!isMarathon || bookingStep >= 1)) && (
        <RNView style={[styles.priceBreakdown, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 28, padding: 24, marginTop: 24 }]}>
          <RNView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={[styles.breakdownTitle, { color: colors.text, marginBottom: 0 }]}>Order Summary</Text>
            <RNView style={{ backgroundColor: colors.tint + '10', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
              <Text style={{ fontSize: 9, fontWeight: '900', color: colors.tint }}>{quantity}X TICKETS</Text>
            </RNView>
          </RNView>

          <RNView style={styles.breakdownRow}>
            <RNView style={{ flex: 1 }}>
              <Text style={{ fontSize: 7, fontWeight: '900', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Plan / Category</Text>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
                {selectedTier?.title || selectedTier?.name || 'General Admission'}
              </Text>
            </RNView>
            <Text style={[styles.breakdownValue, { color: colors.text, fontSize: 14, fontWeight: '900' }]}>
               ₹{basePrice.toLocaleString('en-IN')}
            </Text>
          </RNView>
          
          <RNView style={{ height: 1, backgroundColor: colors.border, marginVertical: 16, opacity: 0.3 }} />

          {/* Detailed Breakdown */}
          <RNView style={{ gap: 10 }}>
            <RNView style={styles.breakdownRow}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: colors.muted, textTransform: 'uppercase' }}>Ticket Subtotal</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>₹{(displaySubtotal || 0).toLocaleString('en-IN')}</Text>
            </RNView>

            {discount > 0 && (
              <RNView style={styles.breakdownRow}>
                <Text style={{ fontSize: 9, fontWeight: '900', color: '#10b981', textTransform: 'uppercase' }}>Promo Discount</Text>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#10b981' }}>- ₹{discount.toLocaleString('en-IN')}</Text>
              </RNView>
            )}

            <RNView style={styles.breakdownRow}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: colors.muted, textTransform: 'uppercase' }}>Platform Fee</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>₹{convenienceFee.toLocaleString('en-IN')}</Text>
            </RNView>

            <RNView style={styles.breakdownRow}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: colors.muted, textTransform: 'uppercase' }}>GST (18%)</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>₹{gst.toLocaleString('en-IN')}</Text>
            </RNView>
          </RNView>

          <RNView style={{ 
            marginTop: 16, 
            padding: 12, 
            backgroundColor: colors.tint + '05', 
            borderRadius: 12, 
            flexDirection: 'row', 
            alignItems: 'center', 
            gap: 8,
            borderWidth: 1,
            borderColor: colors.tint + '10'
          }}>
            <ShieldCheck size={14} color={colors.tint} />
            <Text style={{ fontSize: 9, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Split Payment Enabled
            </Text>
          </RNView>

          <LinearGradient
            colors={[colors.border, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 1, marginVertical: 20, opacity: 0.5 }}
          />

          <RNView style={styles.breakdownRow}>
            <RNView>
              <Text style={{ fontSize: 9, fontWeight: '900', color: colors.text, textTransform: 'uppercase', letterSpacing: 1.5 }}>Total Payable</Text>
              <Text style={{ fontSize: 7, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' }}>Secure Transaction</Text>
            </RNView>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.tint }}>
              ₹{total.toLocaleString('en-IN')}
            </Text>
          </RNView>
        </RNView>
        )}
      </ScrollView>

      {/* CTA Footer */}
      <RNView style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {isMarathon && bookingStep < 6 ? (
          <Pressable
            onPress={() => {
              if (bookingStep === 1 && !selectedTier) {
                Alert.alert('Select Category', 'Please select a race category first.');
                return;
              }
              if (bookingStep === 5) { handleBook(); return; }
              setBookingStep(bookingStep + 1);
            }}
            disabled={submitting}
            style={({ pressed }) => [styles.bookBtn, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={colors.gradient as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookBtnGradient}
            >
              {bookingStep === 5 ? <Ticket size={18} color="#fff" /> : <ArrowRight size={18} color="#fff" />}
              <Text style={styles.bookBtnText}>
                {submitting ? 'Processing...' : bookingStep === 5 ? `Pay ₹${total.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : 'Next Step'}
              </Text>
            </LinearGradient>
          </Pressable>
        ) : (
        <Pressable
          onPress={handleBook}
          disabled={submitting}
          style={({ pressed }) => [styles.bookBtn, pressed && { opacity: 0.85 }]}
        >
          <LinearGradient
            colors={colors.gradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookBtnGradient}
          >
            <Ticket size={18} color="#fff" />
            <Text style={styles.bookBtnText}>
              {submitting
                ? 'Processing...'
                : event.is_free
                ? 'Confirm Free Ticket'
                : `Pay ₹${total.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
            </Text>
          </LinearGradient>
        </Pressable>
        )}
      </RNView>
      {/* Custom Selection Modal */}
      <Modal
        visible={!!selectionField}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectionField(null)}
      >
        <RNView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setSelectionField(null)} />
          <MotiView
            from={{ translateY: 300 }}
            animate={{ translateY: 0 }}
            style={{ 
              backgroundColor: colors.background, 
              borderTopLeftRadius: 32, 
              borderTopRightRadius: 32, 
              padding: 24,
              paddingBottom: 40,
              maxHeight: '80%'
            }}
          >
            <RNView style={{ width: 40, height: 4, backgroundColor: colors.border, alignSelf: 'center', borderRadius: 2, marginBottom: 20 }} />
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 8, textAlign: 'center' }}>
              Select {selectionField?.label}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 24, textAlign: 'center' }}>
              Choose one option from the list below
            </Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {(selectionField?.options || []).map((opt: string) => (
                <Pressable
                  key={opt}
                  onPress={() => {
                    setFormResponses({ ...formResponses, [selectionField.id]: opt });
                    setSelectionField(null);
                  }}
                  style={({ pressed }) => [
                    {
                      paddingVertical: 18,
                      paddingHorizontal: 20,
                      borderRadius: 16,
                      backgroundColor: formResponses[selectionField.id] === opt ? `${colors.tint}10` : colors.card,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: formResponses[selectionField.id] === opt ? colors.tint : colors.border,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      opacity: pressed ? 0.7 : 1
                    }
                  ]}
                >
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '700', 
                    color: formResponses[selectionField.id] === opt ? colors.tint : colors.text 
                  }}>
                    {opt}
                  </Text>
                  {formResponses[selectionField.id] === opt && (
                    <CheckCircle size={20} color={colors.tint} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
            
            <Pressable 
              onPress={() => setSelectionField(null)}
              style={{ 
                marginTop: 20, 
                paddingVertical: 16, 
                alignItems: 'center',
                backgroundColor: colors.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border
              }}
            >
              <Text style={{ fontWeight: '800', color: colors.text }}>Cancel</Text>
            </Pressable>
          </MotiView>
        </RNView>
      </Modal>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skeletonHero: { height: 200, margin: 16, borderRadius: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    paddingTop: 52,
  },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  eventCard: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  eventThumb: { width: 72, height: 72, borderRadius: 12 },
  eventInfo: { flex: 1, gap: 4 },
  eventTitle: { fontSize: 15, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontWeight: '600' },
  section: { paddingHorizontal: 16, marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 16, letterSpacing: -0.3 },
  tierOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  tierLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  tierName: { fontSize: 15, fontWeight: '800' },
  tierDesc: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  tierPrice: { fontSize: 16, fontWeight: '900' },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    height: 56,
    marginTop: 8,
  },
  quantityBtn: { width: 64, height: '100%', alignItems: 'center', justifyContent: 'center' },
  quantityValue: { fontSize: 22, fontWeight: '900', textAlign: 'center', flex: 1 },
  formFields: { gap: 16 },
  fieldWrapper: { gap: 8 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginLeft: 4 },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    fontWeight: '600',
  },
  priceBreakdown: {
    margin: 16,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    marginBottom: 100,
  },
  breakdownTitle: { fontSize: 18, fontWeight: '900', marginBottom: 8 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLabel: { fontSize: 14, fontWeight: '600' },
  breakdownValue: { fontSize: 15, fontWeight: '800' },
  breakdownDivider: { height: 1, marginVertical: 8 },
  totalLabel: { fontSize: 18, fontWeight: '900' },
  totalValue: { fontSize: 22, fontWeight: '900' },
  footer: {
    padding: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
    backgroundColor: 'transparent',
  },
  bookBtn: { borderRadius: 18, overflow: 'hidden' },
  bookBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  bookBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successContent: { alignItems: 'center', padding: 32 },
  successIcon: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { fontSize: 28, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
  successSub: { fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  successBtn: { width: '100%', borderRadius: 18, overflow: 'hidden' },
  successBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  successBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  ageGroupGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, justifyContent: 'space-between' },
  ageOption: { width: '48%', padding: 16, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  ageLabel: { fontSize: 13, fontWeight: '800' },
  agePrice: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  selectWrapper: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  applyBtn: { paddingHorizontal: 20, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  couponBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
});
