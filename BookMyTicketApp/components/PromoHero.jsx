import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const FEATURES = [
  { num: '01', title: 'CREATE EVENT PAGE', sub: 'Do-it-yourself approach' },
  { num: '02', title: 'EASY SIGN-UP',        sub: 'Super quick activation' },
  { num: '03', title: 'SIMPLE REGISTRATION', sub: 'No hassle, no paperwork' },
  { num: '04', title: 'QUICK SETUP',         sub: 'No setup cost, zero fee' },
];

export default function PromoHero() {
  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#1a0a2e', '#2d1b69', '#0f172a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Glow orbs */}
        <View style={styles.glow1} />
        <View style={styles.glow2} />

        {/* Main Content Row */}
        <View style={styles.contentRow}>
          {/* LEFT: Title */}
          <View style={styles.titleCol}>
            <Text style={styles.tagline}>IT'S TIME TO</Text>
            <Text style={styles.rTitle}>ROCK</Text>
            <Text style={styles.eTitle}>{'EVEN'}<Text style={styles.tHighlight}>TS</Text></Text>
            <Text style={styles.calendar}>Calendar</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* RIGHT: Features */}
          <View style={styles.featuresCol}>
            {FEATURES.map((f) => (
              <View key={f.num} style={styles.featureRow}>
                <Text style={styles.featureNum}>{f.num}</Text>
                <View>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureSub}>{f.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.ctaBtn}>
          <LinearGradient
            colors={['#f84464', '#c026d3']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Ionicons name="arrow-forward-circle" size={18} color="#fff" />
            <Text style={styles.ctaText}>ALL EVENTS START HERE</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 14,
    shadowColor: '#c026d3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  gradient: {
    padding: 20,
    position: 'relative',
  },
  glow1: {
    position: 'absolute', top: -10, right: -10,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#f84464', opacity: 0.18,
  },
  glow2: {
    position: 'absolute', bottom: -20, left: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#c026d3', opacity: 0.15,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleCol: { flex: 1 },
  tagline: {
    color: '#f84464',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 2,
  },
  rTitle: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 36,
  },
  eTitle: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 36,
  },
  tHighlight: {
    color: '#f84464',
  },
  calendar: {
    color: '#d8b4fe',
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '700',
    marginTop: 4,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
  },
  featuresCol: { flex: 1.2, gap: 8 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureNum: {
    fontSize: 10,
    fontWeight: '900',
    color: '#f84464',
    width: 20,
    marginTop: 1,
  },
  featureTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#e2e8f0',
    letterSpacing: 0.5,
  },
  featureSub: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 1,
  },
  ctaBtn: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  ctaText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
