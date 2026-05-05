import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Pressable, 
  ScrollView, 
  Platform, 
  Alert, 
  ActivityIndicator,
  Vibration,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { MotiView, AnimatePresence } from 'moti';
import { 
  ArrowLeft, 
  QrCode, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Ticket, 
  Layers, 
  History,
  XCircle,
  Camera as CameraIcon
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function TicketScanningScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'duplicate' | 'invalid' | 'expired'>('idle');
  const [scanHistory, setScanHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (verifying) return;
    
    setVerifying(true);
    setScanning(false);
    Vibration.vibrate(100);

    try {
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          bookings (
            id,
            ticket_count,
            event_name,
            customer_details,
            status,
            user_id,
            event_id,
            events (
              id,
              title,
              date,
              start_date,
              start_time
            )
          )
        `)
        .eq('ticket_number', data)
        .single();

      if (ticketError || !ticket) {
        setScanStatus('invalid');
        setLastResult({ message: 'Invalid Ticket QR Code' });
        return;
      }

      const booking = ticket.bookings;
      const event = booking?.events || {};
      const customer = booking?.customer_details || {};

      // 1. Check Expiration
      const eventDateStr = event.start_date || event.date;
      if (eventDateStr) {
        let eventDate: Date;
        if (eventDateStr.includes('/')) {
          const [d, m, y] = eventDateStr.split('/');
          eventDate = new Date(`${y}-${m}-${d}T23:59:59`);
        } else {
          eventDate = new Date(eventDateStr);
          eventDate.setHours(23, 59, 59, 999);
        }

        if (eventDate < new Date()) {
          setScanStatus('expired');
          setLastResult({
            title: event.title || booking.event_name,
            customer: customer.name || 'Guest',
            category: customer.ticket_type || 'General',
            quantity: booking.ticket_count || 1,
            eventDate: eventDateStr,
            message: 'This event has already ended. Access denied.'
          });
          Vibration.vibrate([100, 300]);
          return;
        }
      }

      // 2. Check Duplicate
      if (ticket.status === 'scanned' || ticket.scanned_at) {
        setScanStatus('duplicate');
        setLastResult({
          title: event.title || booking.event_name,
          customer: customer.name || 'Guest',
          category: customer.ticket_type || 'General',
          quantity: booking.ticket_count || 1,
          scannedAt: ticket.scanned_at,
          message: 'Already Scanned! This ticket was previously verified.'
        });
        Vibration.vibrate([100, 200, 100]);
        return;
      }

      const { error: updateError } = await supabase
        .from('tickets')
        .update({ status: 'scanned', scanned_at: new Date().toISOString() })
        .eq('id', ticket.id);

      if (updateError) throw updateError;

      const successResult = {
        title: booking.event_name,
        customer: customer.name || 'Guest',
        category: customer.ticket_type || 'General',
        quantity: booking.ticket_count || 1,
        ticketNo: ticket.ticket_number,
        message: 'Access Granted'
      };
      
      setScanStatus('success');
      setLastResult(successResult);
      setScanHistory(prev => [{ ...successResult, id: Math.random().toString(), time: new Date().toISOString() }, ...prev].slice(0, 10));
      Vibration.vibrate(200);

    } catch (err: any) {
      setScanStatus('invalid');
      setLastResult({ message: err.message || 'Verification system error' });
    } finally {
      setVerifying(false);
    }
  };

  if (!permission) return <View style={styles.center}><ActivityIndicator size="large" color="#a855f7" /></View>;

  return (
    <View style={[styles.container, { backgroundColor: '#FFF9F0' }]}>
      <LinearGradient
        colors={['#f844a4', '#a855f7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Pressable 
          onPress={() => router.canGoBack() ? router.back() : router.replace('/staff')} 
          style={styles.backBtn}
        >
          <ArrowLeft size={24} color="#fff" />
        </Pressable>
        <Image 
          source={{ uri: 'https://bookmyticket.net/logo.png' }} 
          style={{ width: 180, height: 50, tintColor: '#fff' }}
          resizeMode="contain"
        />
        <Pressable onPress={() => setScanning(!scanning)}>
          <CameraIcon size={24} color={scanning ? 'rgba(255,255,255,0.8)' : '#fff'} />
        </Pressable>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {scanning ? (
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.scannerWrapper}>
            <CameraView
              style={StyleSheet.absoluteFill}
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
            <View style={styles.overlay}><View style={styles.scanFrame} /><Text style={styles.scanHint}>Align QR code within the frame</Text></View>
          </MotiView>
        ) : (
          <AnimatePresence>
            {scanStatus !== 'idle' && scanStatus !== 'invalid' && (
              <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={[styles.resultCard, scanStatus === 'success' ? styles.resultSuccess : styles.resultDuplicate]}>
                <View style={styles.resultHeader}>
                  {scanStatus === 'success' ? <CheckCircle size={54} color="#10b981" /> : <AlertCircle size={54} color="#f59e0b" />}
                  <Text style={[styles.resultStatusText, { color: scanStatus === 'success' ? '#10b981' : '#f59e0b' }]}>
                    {scanStatus === 'success' ? 'VALID' : scanStatus === 'expired' ? 'EXPIRED' : 'DUPLICATE'}
                  </Text>
                </View>
                
                <Text style={[styles.resultTitle, { color: '#000' }]}>{lastResult.title}</Text>
                <View style={styles.resultDetails}>
                  <DetailItem icon={<User size={18} color="#666" />} label="Customer" value={lastResult.customer} colors={{ text: '#000', muted: '#666' }} />
                  <DetailItem icon={<Layers size={18} color="#666" />} label="Category" value={lastResult.category} colors={{ text: '#000', muted: '#666' }} />
                  <DetailItem icon={<Ticket size={18} color="#666" />} label="Quantity" value={`${lastResult.quantity} Tickets`} colors={{ text: '#000', muted: '#666' }} />
                  {lastResult.scannedAt && (
                    <DetailItem icon={<History size={18} color="#666" />} label="Scanned At" value={new Date(lastResult.scannedAt).toLocaleTimeString()} colors={{ text: '#000', muted: '#666' }} />
                  )}
                </View>
                <Text style={[styles.resultMessage, { color: '#444' }]}>{lastResult.message}</Text>

                <Pressable 
                  style={[styles.continueBtn, { backgroundColor: scanStatus === 'success' ? '#10b981' : '#f59e0b' }]}
                  onPress={() => {
                    setScanStatus('idle');
                    setScanning(true);
                  }}
                >
                  <Text style={styles.continueBtnText}>Continue Scanning</Text>
                </Pressable>
              </MotiView>
            )}
            
            {scanStatus === 'invalid' && (
              <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={styles.errorCard}>
                <XCircle size={64} color="#ef4444" />
                <Text style={styles.errorTitle}>Invalid Ticket</Text>
                <Text style={styles.errorText}>{lastResult.message}</Text>
                <Pressable style={styles.retryBtn} onPress={() => { setScanStatus('idle'); setScanning(true); }}>
                  <Text style={styles.retryBtnText}>Try Again</Text>
                </Pressable>
              </MotiView>
            )}
          </AnimatePresence>
        )}

        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <History size={20} color="#000" />
            <Text style={[styles.historyTitle, { color: '#000' }]}>Recent Scans</Text>
          </View>
          
          {scanHistory.length === 0 ? (
            <View style={[styles.emptyHistory, { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
              <Text style={{ color: '#666' }}>No tickets scanned yet</Text>
            </View>
          ) : (
            scanHistory.map((item, index) => (
              <MotiView 
                key={index} 
                from={{ opacity: 0, translateX: -20 }} 
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: index * 100 }}
                style={[styles.historyItem, { backgroundColor: '#fff', borderColor: 'rgba(0,0,0,0.1)' }]}
              >
                <View style={styles.historyItemLeft}>
                  <View style={[styles.statusIndicator, { backgroundColor: item.status === 'success' ? '#10b981' : '#f59e0b' }]} />
                  <View>
                    <Text style={[styles.historyItemName, { color: '#000' }]}>{item.customer}</Text>
                    <Text style={{ color: '#666', fontSize: 12 }}>{item.category} • {new Date(item.time).toLocaleTimeString()}</Text>
                  </View>
                </View>
                <CheckCircle size={20} color="#10b981" />
              </MotiView>
            ))
          )}
        </View>
      </ScrollView>
      {verifying && <View style={styles.verifyingOverlay}><ActivityIndicator size="large" color="#fff" /></View>}
    </View>
  );
}

function DetailItem({ icon, label, value, colors }: any) {
  return (
    <View style={styles.detailItem}>
      {icon}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600' }}>{label}</Text>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, paddingTop: 60, backgroundColor: '#1e293b' },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  scrollContent: { padding: 20 },
  scannerWrapper: { height: 400, borderRadius: 24, overflow: 'hidden', backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: '#a855f7', borderRadius: 24 },
  scanHint: { color: '#fff', marginTop: 20, fontWeight: '700', fontSize: 14, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  resultCard: { padding: 24, borderRadius: 24, borderWidth: 2, alignItems: 'center', backgroundColor: '#fff' },
  resultSuccess: { borderColor: '#10b981' },
  resultDuplicate: { borderColor: '#f59e0b' },
  resultHeader: { alignItems: 'center', marginBottom: 20 },
  resultStatusText: { fontSize: 24, fontWeight: '900', marginTop: 10 },
  resultTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 20 },
  resultDetails: { width: '100%', gap: 12, marginBottom: 20 },
  detailItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)', padding: 12, borderRadius: 12 },
  resultMessage: { textAlign: 'center', fontSize: 14, fontWeight: '600', marginBottom: 20 },
  continueBtn: { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  errorCard: { padding: 32, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', borderWidth: 2, borderColor: '#ef4444' },
  errorTitle: { fontSize: 24, fontWeight: '900', color: '#ef4444', marginTop: 16 },
  errorText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  retryBtn: { backgroundColor: '#ef4444', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  retryBtnText: { color: '#fff', fontWeight: '800' },
  historySection: { marginTop: 32, paddingBottom: 40 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  historyTitle: { fontSize: 18, fontWeight: '900' },
  emptyHistory: { padding: 24, borderRadius: 16, alignItems: 'center' },
  historyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  historyItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusIndicator: { width: 8, height: 8, borderRadius: 4 },
  historyItemName: { fontSize: 15, fontWeight: '700' },
  verifyingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center' },
});
