import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useMutation, useConvex, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/Theme';

export default function OrganiserScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scannedBooking, setScannedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const { user } = useAuth();
  const convex = useConvex();
  const validateAndLogScan = useMutation(api.pwaScans.validateAndLogScan);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || showModal) return;
    setScanned(true);
    setLoading(true);

    try {
      // 1. Fetch booking details first
      const booking = await convex.query(api.bookings.getBookingById, { id: data });
      
      if (booking) {
        setScannedBooking(booking);
        setShowModal(true);
      } else {
        Alert.alert('Error', 'Invalid Ticket QR Code');
        setScanned(false);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to read ticket details');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!scannedBooking) return;
    setLoading(true);

    try {
      const res = await validateAndLogScan({
        bookingId: scannedBooking._id,
        eventId: 'manual_or_scan',
        organiserId: user?.organiserId || user?.identifier || user?.id,
      });

      if (res.success) {
        Alert.alert('Success', 'Ticket verified and user checked in!');
        setShowModal(false);
        setScannedBooking(null);
        setScanned(false);
      } else {
        Alert.alert('Error', res.message || 'Validation failed');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong during validation');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setScannedBooking(null);
    setScanned(false);
  };

  if (!permission) return (
    <View style={styles.center}><ActivityIndicator size="large" color={Colors.secondary} /></View>
  );

  if (!permission.granted) return (
    <View style={styles.center}>
      <Text style={styles.text}>Camera access is required for scanning tickets.</Text>
      <TouchableOpacity style={styles.btn} onPress={requestPermission}>
        <Text style={styles.btnText}>Grant Permission</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      
      <View style={styles.overlay}>
        <View style={styles.frame} />
        <Text style={styles.hintText}>Align QR code within the frame</Text>
      </View>

      {loading && !showModal && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {/* Verification Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify Ticket</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {scannedBooking && (
              <View style={styles.details}>
                <View style={styles.item}>
                  <Text style={styles.label}>Customer</Text>
                  <Text style={styles.value}>{scannedBooking.userName || scannedBooking.customerDetails?.name || 'Guest User'}</Text>
                  <Text style={styles.subValue}>{scannedBooking.userId || scannedBooking.customerDetails?.email}</Text>
                </View>

                <View style={styles.item}>
                  <Text style={styles.label}>Event</Text>
                  <Text style={styles.value}>{scannedBooking.eventName}</Text>
                </View>

                <View style={[styles.item, styles.row]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Quantity</Text>
                    <Text style={styles.value}>{scannedBooking.ticketCount} Tickets</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Booking ID</Text>
                    <Text style={styles.value}>#{scannedBooking._id.slice(-6).toUpperCase()}</Text>
                  </View>
                </View>

                <View style={[styles.statusBox, scannedBooking.scanned ? styles.errorBox : styles.successBox]}>
                  <Ionicons 
                    name={scannedBooking.scanned ? "warning-outline" : "checkmark-circle-outline"} 
                    size={20} 
                    color={scannedBooking.scanned ? "#991b1b" : "#166534"} 
                  />
                  <Text style={[styles.statusText, { color: scannedBooking.scanned ? "#991b1b" : "#166534" }]}>
                    {scannedBooking.scanned ? "Ticket already used" : "Ticket is valid for check-in"}
                  </Text>
                </View>

                {scannedBooking.scanned ? (
                  <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
                    <Text style={styles.btnText}>Dismiss</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.approveBtn} onPress={handleApprove} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Approve Ticket</Text>}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { color: '#000', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  btn: { backgroundColor: Colors.secondary, padding: 14, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  frame: { width: 280, height: 280, borderWidth: 3, borderColor: '#fff', borderRadius: 24, marginBottom: 20 },
  hintText: { color: '#fff', fontSize: 16, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
  details: { gap: 20 },
  item: { paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  row: { flexDirection: 'row' },
  label: { fontSize: 12, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700', marginBottom: 4 },
  value: { fontSize: 16, fontWeight: '800', color: Colors.text },
  subValue: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 16, marginTop: 8 },
  successBox: { backgroundColor: '#dcfce7' },
  errorBox: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 14, fontWeight: '800' },
  approveBtn: { backgroundColor: '#10b981', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  closeBtn: { backgroundColor: Colors.textMuted, padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 12 },
});
