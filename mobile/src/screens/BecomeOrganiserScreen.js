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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupabaseMutation } from '../hooks/useSupabase';
import { Colors } from '../theme/Theme';

import { SERVICE_CATEGORIES } from '../data/serviceCategories';

const CATEGORIES = [...SERVICE_CATEGORIES.map(c => c.name), "Other"];

const ROLES = ["Organiser", "Individual", "Pvt Ltd", "Others"];

export default function BecomeOrganiserScreen({ navigation }) {
  const { mutate: submitPartnerRequest } = useSupabaseMutation(async (supabase, data) => await supabase.from('partner_requests').insert([{
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    phone: data.phone,
    category: data.category,
    role: data.role,
    remarks: data.remarks,
    type: "event_organiser",
    status: 'Pending',
    kyc_status: 'Not Started'
  }]));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      await submitPartnerRequest({ ...form, type: "event_organiser" });
      setSuccess(true);
      setTimeout(() => {
        navigation.goBack();
      }, 2500);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to send request. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.primary} />
        </View>
        <Text style={styles.successTitle}>Request Submitted!</Text>
        <Text style={styles.successSub}>Our team will get in touch with you shortly.</Text>
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
          Fill in your details — our team will reach out to you within 24 hours.
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

          <View style={styles.field}>
            <Text style={styles.label}>Email ID <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="john@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(val) => setForm({ ...form, email: val })}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contact Number <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(val) => setForm({ ...form, phone: val })}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Event Category <Text style={styles.required}>*</Text></Text>
            <View style={styles.pickerContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.pickerItem,
                      form.category === cat && styles.activePickerItem
                    ]}
                    onPress={() => setForm({ ...form, category: cat })}
                  >
                    <Text style={[
                      styles.pickerText,
                      form.category === cat && styles.activePickerText
                    ]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Role <Text style={styles.required}>*</Text></Text>
            <View style={styles.roleContainer}>
              {ROLES.map(role => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleItem,
                    form.role === role && styles.activeRoleItem
                  ]}
                  onPress={() => setForm({ ...form, role: role })}
                >
                  <Text style={[
                    styles.roleText,
                    form.role === role && styles.activeRoleText
                  ]}>{role}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Remarks</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about your events..."
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginTop: Platform.OS === 'android' ? 30 : 0,
  },
  backBtn: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  subTitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 20,
  },
  form: {
    gap: 20,
  },
  row: {
    flexDirection: 'row',
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  required: {
    color: Colors.primary,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: Colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginTop: 4,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activePickerItem: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
  },
  pickerText: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '600',
  },
  activePickerText: {
    color: Colors.primary,
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  roleItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeRoleItem: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
  },
  roleText: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '600',
  },
  activeRoleText: {
    color: Colors.primary,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  successSub: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
});
