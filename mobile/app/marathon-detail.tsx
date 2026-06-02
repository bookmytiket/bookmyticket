import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Share } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MapPin, Calendar, Clock, ArrowRight, Share2, Award, QrCode } from 'lucide-react-native';
import { supabase } from '../../utils/supabase'; // Assuming standard supabase client

export default function MarathonDetail() {
  const { slug } = useLocalSearchParams();
  const [marathon, setMarathon] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarathonData();
  }, [slug]);

  const fetchMarathonData = async () => {
    try {
      // In Expo, we would fetch from the same backend API
      const res = await fetch(`https://bookmyticket.net/api/marathon/${slug}`);
      const data = await res.json();
      if (data.marathon) {
        setMarathon(data.marathon);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Register for ${marathon.title} at ${marathon.venue}!`,
        url: `https://bookmyticket.net/marathon/${slug}`
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#ec4899" size="large"/></View>;
  if (!marathon) return <View style={styles.center}><Text style={styles.textLight}>Event not found</Text></View>;

  const minPrice = categories.length > 0 ? Math.min(...categories.map(c => Number(c.effective_price || c.price))) : 0;
  const hasEarlyBird = categories.some(c => c.is_early_bird);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image source={{ uri: marathon.banner_image }} style={styles.banner} />
          <View style={styles.heroOverlay}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}><ArrowRight color="#fff" size={20} style={{transform: [{rotate: '180deg'}]}}/></TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.iconBtn}><Share2 color="#fff" size={20}/></TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{marathon.title}</Text>
          
          <View style={styles.infoRow}>
            <Calendar color="#ec4899" size={16} />
            <Text style={styles.infoText}>{new Date(marathon.event_date).toDateString()}</Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin color="#ec4899" size={16} />
            <Text style={styles.infoText}>{marathon.venue}</Text>
          </View>

          {/* Categories */}
          <Text style={styles.sectionTitle}>Run Categories</Text>
          {categories.map(cat => (
            <View key={cat.id} style={styles.categoryCard}>
              <View style={{flex: 1}}>
                <Text style={styles.catTitle}>{cat.category_name} <Text style={{color: '#ec4899'}}>({cat.distance_km}{cat.distance_unit === 'M' ? 'M' : 'K'})</Text></Text>
                {cat.age_group && <Text style={styles.catSub}>Age: {cat.age_group}</Text>}
              </View>
              <View style={{alignItems: 'flex-end'}}>
                {cat.is_early_bird && <Text style={styles.earlyBirdTxt}>EARLY BIRD</Text>}
                <Text style={styles.priceTxt}>₹{cat.effective_price}</Text>
                {cat.is_early_bird && <Text style={styles.strikeTxt}>₹{cat.price}</Text>}
              </View>
            </View>
          ))}

          {/* About */}
          <Text style={styles.sectionTitle}>About Event</Text>
          <Text style={styles.desc}>{marathon.description}</Text>
        </View>
      </ScrollView>

      {/* CTA Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.priceLabel}>Starting from</Text>
          <Text style={styles.priceTotal}>₹{minPrice}</Text>
        </View>
        <TouchableOpacity 
          style={styles.regBtn}
          onPress={() => router.push({ pathname: '/marathon-register', params: { slug, marathonId: marathon.id } })}
        >
          <Text style={styles.regBtnTxt}>Register Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0f' },
  hero: { height: 300, position: 'relative' },
  banner: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, padding: 20, paddingTop: 50 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  iconBtn: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 20 },
  content: { padding: 20, marginTop: -20, backgroundColor: '#0a0a0f', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  infoText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginTop: 24, marginBottom: 16 },
  categoryCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  catTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  catSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  priceTxt: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  earlyBirdTxt: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold' },
  strikeTxt: { color: 'rgba(255,255,255,0.4)', textDecorationLine: 'line-through', fontSize: 12 },
  desc: { color: 'rgba(255,255,255,0.7)', lineHeight: 22 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(10,10,15,0.95)', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  priceLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  priceTotal: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  regBtn: { backgroundColor: '#ec4899', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 12 },
  regBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
