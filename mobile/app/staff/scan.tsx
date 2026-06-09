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
  Image,
  TextInput,
  KeyboardAvoidingView
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
  Camera as CameraIcon,
  Search
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useSupabase';
import UnifiedApi from '@/lib/unifiedApi';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function TicketScanningScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user } = useAuth();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'duplicate' | 'invalid' | 'expired' | 'requires_action'>('idle');
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isActioning, setIsActioning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [kitCollected, setKitCollected] = useState(false);

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
      if (data.startsWith('TEAM-')) {
        // Tournament Team QR Scan
        const teamId = data.replace('TEAM-', '');
        const { data: team, error: teamError } = await supabase
          .from('tournament_teams')
          .select(`
            *,
            tournament_events (
              title,
              event_date
            )
          `)
          .eq('id', teamId)
          .single();

        if (teamError || !team) {
          setScanStatus('invalid');
          setLastResult({ message: 'Invalid Team QR Code' });
          return;
        }

        // Add to scan history
        const { error: scanError } = await supabase
          .from('tournament_qr_scans')
          .insert({
            team_id: team.id,
            scanned_by: user?.id,
            scan_location: 'Main Entry'
          });

        const result = {
          title: team.tournament_events?.title || 'Tournament',
          customer: team.team_name,
          category: 'Team Registration',
          quantity: team.captain_name,
          message: 'Team Access Granted'
        };

        setScanStatus('success');
        setLastResult(result);
        setScanHistory(prev => [{ ...result, id: Math.random().toString(), time: new Date().toISOString() }, ...prev].slice(0, 10));
        Vibration.vibrate(200);
        return;
      }

      // 1. Try Sports QR Ticket (from new workflow)
      const { data: sportsTicket } = await supabase
        .from('qr_tickets')
        .select(`
          *,
          sports_registrations (
            id,
            booking_status,
            payment_status,
            participants (full_name, dob, gender),
            sports_match_types (match_type),
            sports_events (sport_type)
          ),
          checkins (id)
        `)
        .eq('qr_token', data)
        .maybeSingle();

      if (sportsTicket && sportsTicket.sports_registrations) {
        const reg = sportsTicket.sports_registrations;
        const participant = reg.participants || {};
        const match = reg.sports_match_types || {};
        const event = reg.sports_events || {};

        if (sportsTicket.status === 'Scanned' || (sportsTicket.checkins && sportsTicket.checkins.length > 0)) {
          setScanStatus('duplicate');
          setLastResult({
            title: event.sport_type || 'Sports Event',
            customer: participant.full_name || 'Participant',
            category: match.match_type || 'General',
            quantity: 1,
            scannedAt: sportsTicket.created_at, // proxy for now
            message: 'Already Scanned! This participant was previously verified.'
          });
          Vibration.vibrate([100, 200, 100]);
          return;
        }

        const successResult = {
          title: event.sport_type || 'Sports Event',
          customer: participant.full_name || 'Participant',
          category: match.match_type || 'General',
          quantity: 1,
          ticketNo: sportsTicket.qr_token,
          qrTicketId: sportsTicket.id,
          registrationId: reg.id,
          message: 'ID VERIFICATION REQUIRED (Sports)',
          isSports: true
        };
        
        setScanStatus('requires_action');
        setLastResult(successResult);
        Vibration.vibrate([100, 100]);
        return;
      }

      // 2. Standard Ticket Scan Fallback (Uses API to decode JWTs)
      try {
        const apiResult = await UnifiedApi.validateTicketScan({ 
          qrPayload: data, 
          scannerUserId: user?.id 
        });

        if (apiResult.status === 'invalid' || apiResult.status === 'error') {
          setScanStatus('invalid');
          setLastResult({ message: apiResult.message || 'Invalid Ticket QR Code' });
          return;
        }

        if (apiResult.status === 'already_used') {
          setScanStatus('duplicate');
          setLastResult({
            title: apiResult.event || 'Event',
            customer: apiResult.attendee || 'Guest',
            category: apiResult.category || 'General',
            quantity: 1,
            scannedAt: apiResult.scanned_at,
            message: apiResult.message || 'Already Scanned! This ticket was previously verified.'
          });
          Vibration.vibrate([100, 200, 100]);
          return;
        }

        if (apiResult.status === 'blocked') {
          setScanStatus('invalid');
          setLastResult({ message: apiResult.message || 'Access Blocked' });
          Vibration.vibrate([300, 300]);
          return;
        }

        const successResult = {
          title: apiResult.event || 'Event',
          customer: apiResult.attendee || 'Guest',
          category: apiResult.category || 'General',
          quantity: 1,
          ticketNo: apiResult.ticket_code,
          ticketId: apiResult.ticket_id,
          bookingId: apiResult.booking_id,
          message: apiResult.message || 'ID VERIFICATION REQUIRED',
          isSports: false
        };
        
        setScanStatus('requires_action');
        setLastResult(successResult);
        Vibration.vibrate([100, 100]);
        
      } catch (err: any) {
        setScanStatus('invalid');
        setLastResult({ message: err.message || 'Invalid Ticket QR Code' });
      }

    } catch (err: any) {
      setScanStatus('invalid');
      setLastResult({ message: err.message || 'Verification system error' });
    } finally {
      setVerifying(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!lastResult?.ticketId) return;
    setIsActioning(true);
    
    try {
      if (action === 'approve') {
        if (lastResult.isSports) {
          // Update sports checkins table
          await supabase.from('checkins').insert({
            registration_id: lastResult.registrationId,
            staff_id: user?.id,
            verification_status: 'Checked-In',
            kit_collected: kitCollected,
            remarks: 'Verified at Main Entry'
          });
          await supabase.from('qr_tickets').update({ status: 'Scanned' }).eq('id', lastResult.qrTicketId);
        } else {
          // Update regular tickets
          await UnifiedApi.submitTicketScanAction({
            ticketId: lastResult.ticketId,
            bookingId: lastResult.bookingId,
            ticketCode: lastResult.ticketNo,
            action: 'approve',
            gateName: 'Main Entry',
            scannerUserId: user?.id,
            kitCollected
          });
        }
        
        const finalResult = { ...lastResult, message: 'Access Granted', status: 'success' };
        setScanStatus('success');
        setLastResult(finalResult);
        setScanHistory(prev => [{ ...finalResult, id: Math.random().toString(), time: new Date().toISOString() }, ...prev].slice(0, 10));
        Vibration.vibrate(200);
        setKitCollected(false);
      } else {
        await UnifiedApi.submitTicketScanAction({
          ticketId: lastResult.ticketId,
          bookingId: lastResult.bookingId,
          ticketCode: lastResult.ticketNo,
          action: 'reject',
          rejectionReason: rejectionReason || 'No ID',
          gateName: 'Main Entry',
          scannerUserId: user?.id,
        });

        const finalResult = { ...lastResult, message: `Entry Rejected: ${rejectionReason || 'No ID'}`, status: 'invalid' };
        setScanStatus('invalid');
        setLastResult(finalResult);
        Vibration.vibrate([300]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsActioning(false);
      setRejectionReason("");
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

      <View style={styles.cameraContainer}>
        {/* Scanner is always mounted in background, but active only when scanning */}
        <MotiView animate={{ opacity: scanning ? 1 : 0.4 }} style={StyleSheet.absoluteFill}>
          <CameraView
            style={StyleSheet.absoluteFill}
            onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
          <View style={styles.overlay}><View style={styles.scanFrame} /><Text style={styles.scanHint}>{scanning ? "Align QR code within the frame" : "Processing..."}</Text></View>
        </MotiView>

        {scanning && scanStatus === 'idle' && (
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.manualEntryContainer}
            keyboardVerticalOffset={0}
          >
            <View style={styles.manualEntryBox}>
              <Search size={20} color="#a1a1aa" />
              <TextInput
                style={styles.manualInput}
                placeholder="Enter Booking ID or Code"
                placeholderTextColor="#a1a1aa"
                value={manualCode}
                onChangeText={setManualCode}
                autoCapitalize="characters"
                onSubmitEditing={() => {
                  if (manualCode.trim()) {
                    handleBarCodeScanned({ data: manualCode.trim() });
                    setManualCode('');
                  }
                }}
              />
              <Pressable 
                style={[styles.manualVerifyBtn, !manualCode.trim() && { opacity: 0.5 }]}
                onPress={() => {
                  if (manualCode.trim()) {
                    handleBarCodeScanned({ data: manualCode.trim() });
                    setManualCode('');
                  }
                }}
                disabled={!manualCode.trim()}
              >
                <Text style={styles.manualVerifyBtnText}>Verify</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        )}

        <AnimatePresence>
          {!scanning && scanStatus !== 'idle' && (
            <MotiView 
              from={{ opacity: 0, scale: 0.9, translateY: 50 }} 
              animate={{ opacity: 1, scale: 1, translateY: 0 }} 
              exit={{ opacity: 0, scale: 0.9, translateY: 50 }}
              style={styles.popupContainer}
            >
              {scanStatus !== 'invalid' && scanStatus !== 'requires_action' && (
                <View style={[styles.resultCard, scanStatus === 'success' ? styles.resultSuccess : styles.resultDuplicate]}>
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
              </View>
            )}
            {scanStatus === 'requires_action' && (
              <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={[styles.resultCard, { borderColor: '#3b82f6' }]}>
                <View style={styles.resultHeader}>
                  <User size={54} color="#3b82f6" />
                  <Text style={[styles.resultStatusText, { color: '#3b82f6' }]}>ID VERIFICATION</Text>
                </View>
                
                <Text style={[styles.resultTitle, { color: '#000' }]}>{lastResult.title}</Text>
                <View style={styles.resultDetails}>
                  <DetailItem icon={<User size={18} color="#666" />} label="Expected Name" value={lastResult.customer} colors={{ text: '#000', muted: '#666' }} />
                  <DetailItem icon={<Layers size={18} color="#666" />} label="Category" value={lastResult.category} colors={{ text: '#000', muted: '#666' }} />
                  <DetailItem icon={<Ticket size={18} color="#666" />} label="Quantity" value={`${lastResult.quantity} Tickets`} colors={{ text: '#000', muted: '#666' }} />
                </View>
                <Text style={[styles.resultMessage, { color: '#444', marginBottom: 10 }]}>Please check government ID against expected name.</Text>

                <Pressable 
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: kitCollected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.05)', padding: 12, borderRadius: 12, width: '100%', marginBottom: 20 }}
                  onPress={() => setKitCollected(!kitCollected)}
                >
                  <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: kitCollected ? '#10b981' : '#a1a1aa', alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: kitCollected ? '#10b981' : 'transparent' }}>
                    {kitCollected && <CheckCircle size={16} color="#fff" />}
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: kitCollected ? '#10b981' : '#666' }}>Participant Kit Distributed</Text>
                </Pressable>

                <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                  <Pressable 
                    style={[styles.continueBtn, { flex: 1, backgroundColor: '#ef4444' }]}
                    onPress={() => { setRejectionReason('No Match'); handleAction('reject'); }}
                    disabled={isActioning}
                  >
                    <Text style={styles.continueBtnText}>Reject</Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.continueBtn, { flex: 2, backgroundColor: '#10b981' }]}
                    onPress={() => handleAction('approve')}
                    disabled={isActioning}
                  >
                    <Text style={styles.continueBtnText}>Approve Entry</Text>
                  </Pressable>
                </View>
              </MotiView>
            )}

            {scanStatus === 'invalid' && (
              <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={styles.errorCard}>
                <XCircle size={64} color="#ef4444" />
                <Text style={styles.errorTitle}>{lastResult.message?.includes('Rejected') ? 'Entry Rejected' : 'Invalid Ticket'}</Text>
                <Text style={styles.errorText}>{lastResult.message}</Text>
                <Pressable style={styles.retryBtn} onPress={() => { setScanStatus('idle'); setScanning(true); }}>
                  <Text style={styles.retryBtnText}>Continue Scanning</Text>
                </Pressable>
              </MotiView>
            )}
              </MotiView>
            )}
          </AnimatePresence>
      </View>
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
  cameraContainer: { flex: 1, position: 'relative', backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  scanFrame: { width: 280, height: 280, borderWidth: 3, borderColor: '#fff', borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10 },
  scanHint: { color: '#fff', marginTop: 24, fontWeight: '800', fontSize: 15, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, overflow: 'hidden' },
  popupContainer: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100 },
  resultCard: { width: '100%', padding: 28, borderRadius: 32, borderWidth: 0, alignItems: 'center', backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
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
  manualEntryContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 50 : 30, left: 20, right: 20, zIndex: 10 },
  manualEntryBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  manualInput: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '700', color: '#000', padding: 0, minHeight: 24 },
  manualVerifyBtn: { backgroundColor: '#a855f7', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginLeft: 12 },
  manualVerifyBtnText: { color: '#fff', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
});
