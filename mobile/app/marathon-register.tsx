import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../utils/supabase';

export default function MarathonRegister() {
  const { marathonId, slug } = useLocalSearchParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category_id: '',
    participant: {
      full_name: '',
      email: '',
      phone: '',
      dob: '',
      gender: '',
      blood_group: ''
    },
    tshirt_size: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await supabase.from('marathon_categories').select('*').eq('marathon_id', marathonId);
      if (data) setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setSubmitting(true);
    try {
      const selectedCat = categories.find(c => c.id === formData.category_id);
      
      const payload = {
        marathon_id: marathonId,
        category_id: formData.category_id,
        participant: formData.participant,
        tshirt_size: formData.tshirt_size,
        payment_amount: selectedCat?.price || 0,
        payment_status: 'Paid', // Simulating successful payment
        payment_id: `PAY_MOB_${Date.now()}`
      };

      const res = await fetch('https://bookmyticket.net/api/marathon/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Registration Successful! Booking ID: ' + data.registration.registration_id);
      router.replace('/');

    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#ec4899" size="large"/></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Registration (Step {step}/2)</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 && (
          <View>
            <Text style={styles.label}>Select Category *</Text>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.card, formData.category_id === cat.id && styles.cardSelected]}
                onPress={() => setFormData({...formData, category_id: cat.id})}
              >
                <Text style={styles.cardTitle}>{cat.category_name}</Text>
                <Text style={styles.cardPrice}>₹{cat.price}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={[styles.btn, !formData.category_id && styles.btnDisabled]} 
              disabled={!formData.category_id}
              onPress={() => setStep(2)}
            >
              <Text style={styles.btnText}>Next: Participant Details</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput style={styles.input} value={formData.participant.full_name} onChangeText={t => setFormData({...formData, participant: {...formData.participant, full_name: t}})} placeholderTextColor="rgba(255,255,255,0.4)" placeholder="Legal Name"/>
            
            <Text style={styles.label}>Email *</Text>
            <TextInput style={styles.input} value={formData.participant.email} onChangeText={t => setFormData({...formData, participant: {...formData.participant, email: t}})} placeholderTextColor="rgba(255,255,255,0.4)" placeholder="Email Address"/>
            
            <Text style={styles.label}>Phone *</Text>
            <TextInput style={styles.input} value={formData.participant.phone} onChangeText={t => setFormData({...formData, participant: {...formData.participant, phone: t}})} placeholderTextColor="rgba(255,255,255,0.4)" placeholder="Phone Number"/>
            
            <Text style={styles.label}>Date of Birth (YYYY-MM-DD) *</Text>
            <TextInput style={styles.input} value={formData.participant.dob} onChangeText={t => setFormData({...formData, participant: {...formData.participant, dob: t}})} placeholderTextColor="rgba(255,255,255,0.4)" placeholder="e.g. 1990-01-01"/>

            <View style={styles.rowBtn}>
              <TouchableOpacity style={styles.btnSec} onPress={() => setStep(1)}>
                <Text style={styles.btnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, {flex: 1}]} onPress={handleRegister} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff"/> : <Text style={styles.btnText}>Pay & Register</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0f' },
  header: { padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  label: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'transparent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardSelected: { borderColor: '#ec4899', backgroundColor: 'rgba(236,72,153,0.1)' },
  cardTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cardPrice: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  btn: { backgroundColor: '#ec4899', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  btnSec: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 30, marginRight: 10, width: 100 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  rowBtn: { flexDirection: 'row' }
});
