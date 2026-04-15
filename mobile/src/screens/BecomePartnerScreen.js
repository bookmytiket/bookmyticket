import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupabaseMutation } from '../hooks/useSupabase';
import { Colors } from '../theme/Theme';

import { SERVICE_CATEGORIES } from '../data/serviceCategories';

const CATEGORIES = SERVICE_CATEGORIES.map(c => c.name);
const ROLES = ["Organiser", "Individual", "Pvt Ltd", "Others"];

export default function BecomePartnerScreen({ navigation }) {
  // Migrated to Supabase
  const { mutate: submitRequest } = useSupabaseMutation(async (supabase, data) => {
    const { error } = await supabase.from('partner_requests').insert({
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      category: data.category,
      role: data.role,
      remarks: data.remarks,
      type: data.type,
      status: 'Pending',
      kyc_status: 'Not Started'
    });
    if (error) throw error;
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    category: "",
    role: "Organiser",
    remarks: "",
  });

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.category || !form.role) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      await submitRequest({
        ...form,
        type: form.category === "Event Organiser" ? "event_organiser" : "professional_service"
      });
      setSuccess(true);
      setTimeout(() => {
        navigation.goBack();
      }, 3000);
    } catch (err) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      Alert.alert("Error", `Failed to send request: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const PickerModal = ({ visible, onClose, items, selectedValue, onSelect, title }) => (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {items.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.modalItem,
                  selectedValue === item && styles.modalItemSelected
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  selectedValue === item && styles.modalItemTextSelected
                ]}>{item}</Text>
                {selectedValue === item && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color="#10b981" />
        </View>
        <Text style={styles.successTitle}>Request Submitted!</Text>
        <Text style={styles.successSub}>Our team will reach out to you within 24 hours.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Become a Partner</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.subTitle}>
          Fill in your partner details — our team will reach out to you within 24 hours.
        </Text>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>First Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="John"
                value={form.firstName}
                onChangeText={(val) => setForm({ ...form, firstName: val })}
              />
            </View>
            <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Last Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Doe"
                value={form.lastName}
                onChangeText={(val) => setForm({ ...form, lastName: val })}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Email ID <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(val) => setForm({ ...form, email: val })}
              />
            </View>
            <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Contact No <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="9876543210"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(val) => setForm({ ...form, phone: val })}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity 
              style={styles.selectorTrigger} 
              onPress={() => setShowCatPicker(true)}
            >
              <Text style={[styles.selectorText, !form.category && styles.placeholderText]}>
                {form.category || "Select Category"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Role <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity 
              style={styles.selectorTrigger} 
              onPress={() => setShowRolePicker(true)}
            >
              <Text style={styles.selectorText}>{form.role}</Text>
              <Ionicons name="chevron-down" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Remarks</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about your services..."
              multiline
              numberOfLines={4}
              value={form.remarks}
              onChangeText={(val) => setForm({ ...form, remarks: val })}
            />
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Send Request</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <PickerModal
        visible={showCatPicker}
        title="Select Category"
        items={CATEGORIES}
        selectedValue={form.category}
        onSelect={(val) => setForm({ ...form, category: val })}
        onClose={() => setShowCatPicker(false)}
      />

      <PickerModal
        visible={showRolePicker}
        title="Select Role"
        items={ROLES}
        selectedValue={form.role}
        onSelect={(val) => setForm({ ...form, role: val })}
        onClose={() => setShowRolePicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginTop: Platform.OS === 'android' ? 30 : 0 },
  backBtn: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  content: { flex: 1, paddingHorizontal: 20 },
  subTitle: { fontSize: 14, color: Colors.textLight, marginTop: 16, marginBottom: 24, lineHeight: 20 },
  form: { gap: 20 },
  row: { flexDirection: 'row' },
  field: { gap: 8 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  required: { color: Colors.primary },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 15, color: Colors.text },
  textArea: { height: 100, textAlignVertical: 'top' },
  selectorTrigger: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 12, 
    padding: 12, 
    height: 50 
  },
  selectorText: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  placeholderText: { color: '#94a3b8' },
  submitBtn: { backgroundColor: '#8b5cf6', height: 54, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, ...Platform.select({ ios: { shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 4 } }) },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successContainer: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 40 },
  successIcon: { marginBottom: 24, padding: 24, backgroundColor: '#ecfdf5', borderRadius: 100 },
  successTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 12 },
  successSub: { fontSize: 15, color: Colors.textLight, textAlign: 'center', lineHeight: 24 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  modalList: { padding: 10 },
  modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, marginBottom: 4 },
  modalItemSelected: { backgroundColor: '#f5f3ff' },
  modalItemText: { fontSize: 16, color: Colors.text, fontWeight: '500' },
  modalItemTextSelected: { color: Colors.primary, fontWeight: '700' }
});
