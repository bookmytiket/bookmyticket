import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  Camera,
  Plus,
  Trash2,
  FileText,
  CheckCircle2,
  Trophy,
  Target,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Image } from 'expo-image';

export default function TournamentRegistrationWizard({ event, user, onComplete }: any) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [teamName, setTeamName] = useState('');
  const [teamLogo, setTeamLogo] = useState<string | null>(null);
  const [players, setPlayers] = useState<any[]>([{ id: 1, name: '', phone: '', photo: null }]);
  const [captainName, setCaptainName] = useState(user?.user_metadata?.full_name || '');
  const [captainPhone, setCaptainPhone] = useState('');

  const addPlayer = () => {
    if (players.length >= (event.dynamic_config?.maxPlayersPerTeam || 15)) {
      Alert.alert('Limit Reached', `Maximum ${event.dynamic_config?.maxPlayersPerTeam || 15} players allowed.`);
      return;
    }
    setPlayers([...players, { id: Date.now(), name: '', phone: '', photo: null }]);
  };

  const removePlayer = (id: number) => {
    if (players.length <= (event.dynamic_config?.minPlayersPerTeam || 1)) return;
    setPlayers(players.filter(p => p.id !== id));
  };

  const updatePlayer = (id: number, field: string, value: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleRegister = async () => {
    if (!teamName || !captainName || !captainPhone) {
      Alert.alert('Required Fields', 'Please fill in team name and captain details.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create Team
      const { data: team, error: teamError } = await supabase
        .from('tournament_teams')
        .insert({
          event_id: event.id,
          captain_id: user.id,
          team_name: teamName,
          team_logo_url: teamLogo,
          captain_name: captainName,
          captain_phone: captainPhone,
          status: 'pending'
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // 2. Add Members
      const members = players.map(p => ({
        team_id: team.id,
        full_name: p.name,
        phone: p.phone,
        photo_url: p.photo,
        role: 'player'
      }));

      const { error: membersError } = await supabase
        .from('tournament_team_members')
        .insert(members);

      if (membersError) throw membersError;

      onComplete(team);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Progress Bar */}
        <View style={styles.progressRow}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={styles.progressItem}>
              <View style={[
                styles.stepCircle,
                step >= s ? { backgroundColor: '#db2777' } : { backgroundColor: colors.border }
              ]}>
                <Text style={styles.stepText}>{s}</Text>
              </View>
              <Text style={[styles.stepLabel, step >= s ? { color: '#db2777' } : { color: colors.muted }]}>
                {s === 1 ? 'Identity' : s === 2 ? 'Roster' : 'Review'}
              </Text>
            </View>
          ))}
        </View>

        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.title, { color: colors.text }]}>Team Identity</Text>
            <View style={styles.logoUpload}>
              <Pressable style={[styles.logoBtn, { borderColor: colors.border }]}>
                <Camera size={24} color={colors.muted} />
                <Text style={{ fontSize: 10, fontWeight: '800', color: colors.muted, marginTop: 4 }}>TEAM LOGO</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.muted }]}>TEAM NAME</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter team name"
                  placeholderTextColor={colors.muted}
                  value={teamName}
                  onChangeText={setTeamName}
                />
              </View>
            </View>

            <View style={{ marginTop: 20 }}>
              <Text style={[styles.label, { color: colors.muted }]}>CAPTAIN NAME</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Full Name"
                placeholderTextColor={colors.muted}
                value={captainName}
                onChangeText={setCaptainName}
              />
            </View>

            <View style={{ marginTop: 20 }}>
              <Text style={[styles.label, { color: colors.muted }]}>CAPTAIN PHONE</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="+91 XXXXX XXXXX"
                placeholderTextColor={colors.muted}
                value={captainPhone}
                onChangeText={setCaptainPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: colors.text }]}>Player Roster</Text>
              <Pressable onPress={addPlayer} style={styles.addBtn}>
                <Plus size={16} color="#fff" />
                <Text style={styles.addBtnText}>ADD PLAYER</Text>
              </Pressable>
            </View>

            {players.map((p, idx) => (
              <View key={p.id} style={[styles.playerCard, { borderColor: colors.border }]}>
                <View style={styles.playerHeader}>
                  <Text style={[styles.playerNum, { color: colors.muted }]}>PLAYER {idx + 1}</Text>
                  <Pressable onPress={() => removePlayer(p.id)}>
                    <Trash2 size={16} color={colors.error} />
                  </Pressable>
                </View>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, marginTop: 8 }]}
                  placeholder="Player Full Name"
                  placeholderTextColor={colors.muted}
                  value={p.name}
                  onChangeText={(v) => updatePlayer(p.id, 'name', v)}
                />
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, marginTop: 8 }]}
                  placeholder="Phone (Optional)"
                  placeholderTextColor={colors.muted}
                  value={p.phone}
                  onChangeText={(v) => updatePlayer(p.id, 'phone', v)}
                  keyboardType="phone-pad"
                />
              </View>
            ))}
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.title, { color: colors.text }]}>Final Review</Text>
            <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.reviewRow}>
                <Trophy size={16} color="#db2777" />
                <Text style={[styles.reviewText, { color: colors.text }]}>{teamName}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Users size={16} color="#db2777" />
                <Text style={[styles.reviewText, { color: colors.text }]}>{players.length} Players</Text>
              </View>
              <View style={styles.reviewRow}>
                <ShieldCheck size={16} color="#db2777" />
                <Text style={[styles.reviewText, { color: colors.text }]}>Captain: {captainName}</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Registration fee: ₹{event.dynamic_config?.registrationFee || 0}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
        <Pressable
          onPress={() => step > 1 && setStep(step - 1)}
          style={[styles.backBtn, step === 1 && { opacity: 0 }]}
        >
          <Text style={{ fontWeight: '800', color: colors.muted }}>BACK</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            if (step < 3) setStep(step + 1);
            else handleRegister();
          }}
          disabled={loading}
          style={styles.nextBtn}
        >
          <LinearGradient
            colors={['#db2777', '#7c3aed']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.nextText}>{step === 3 ? 'REGISTER TEAM' : 'NEXT STEP'}</Text>
                <ArrowRight size={18} color="#fff" />
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 120 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, paddingHorizontal: 10 },
  progressItem: { alignItems: 'center', gap: 6 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  stepLabel: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  stepContent: { gap: 10 },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -1, marginBottom: 10 },
  logoUpload: { flexDirection: 'row', gap: 15, alignItems: 'center' },
  logoBtn: { width: 80, height: 80, borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  input: { height: 56, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, fontSize: 16, fontWeight: '600' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#000', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  playerCard: { padding: 15, borderWidth: 1, borderRadius: 20, marginBottom: 10 },
  playerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  playerNum: { fontSize: 10, fontWeight: '900' },
  reviewCard: { padding: 20, borderRadius: 24, borderWidth: 1, gap: 15 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewText: { fontSize: 16, fontWeight: '800' },
  infoBox: { marginTop: 20, padding: 15, backgroundColor: '#fdf2f8', borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#db2777' },
  infoText: { color: '#9d174d', fontWeight: '800', fontSize: 14 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1 },
  backBtn: { padding: 15 },
  nextBtn: { flex: 1, marginLeft: 20, height: 56, borderRadius: 18, overflow: 'hidden' },
  nextGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  nextText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
});
