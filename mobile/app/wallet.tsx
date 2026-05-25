import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View,
  Text,
  TextInput,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth, useSupabaseMutation } from '@/hooks/useSupabase';
import { useUnifiedResource } from '@/hooks/useUnifiedSync';
import UnifiedApi from '@/lib/unifiedApi';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Landmark,
  TrendingUp,
  History,
  X,
  ChevronRight,
  Search,
  Plus,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, AnimatePresence } from 'moti';

const { width } = Dimensions.get('window');

export default function WalletScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user } = useAuth();

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');

  // Real-time Wallet Data from the unified API gateway.
  const { data: walletBundle, loading: walletLoading, refresh: refreshWallet } = useUnifiedResource(
    'wallet',
    () => UnifiedApi.getWallet(),
    [user?.id],
    { enabled: !!user, realtimeTables: ['wallets', 'wallet_transactions', 'withdraw_requests', 'payments'] }
  );

  const [createWithdrawRequest, { loading: isSubmitting }] = useSupabaseMutation('withdraw_requests');

  const wallet = walletBundle?.wallet;
  const transactions = walletBundle?.transactions || [];
  const withdrawRequests = walletBundle?.withdrawRequests || [];

  const handleWithdrawRequest = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    if (amount > (wallet?.balance || 0)) {
      Alert.alert('Insufficient Balance', 'You do not have enough funds for this withdrawal');
      return;
    }

    const { success, error } = await createWithdrawRequest({
      organiser_id: user?.id,
      amount: amount,
      payout_details: { notes: withdrawNotes },
      status: 'pending',
    });

    if (success) {
      setWithdrawAmount('');
      setWithdrawNotes('');
      setShowWithdrawModal(false);
      refreshWallet();
      Alert.alert('Success', 'Withdrawal request submitted successfully');
    } else {
      Alert.alert('Error', (error as any)?.message || 'Failed to submit request');
    }
  };

  const pendingPayouts = useMemo(() => {
    if (!withdrawRequests) return 0;
    return withdrawRequests
      .filter((r: any) => r.status === 'pending')
      .reduce((acc: number, r: any) => acc + r.amount, 0);
  }, [withdrawRequests]);

  if (walletLoading || !user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.muted }}>Loading Wallet...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Wallet',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Main Balance Card */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={styles.balanceCardContainer}
        >
          <LinearGradient colors={['#1e1b4b', '#312e81']} style={styles.balanceCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
                <View style={styles.balanceRow}>
                  <Text style={styles.currency}>₹</Text>
                  <Text style={styles.balanceAmount}>
                    {wallet?.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                  </Text>
                </View>
              </View>
              <View style={styles.walletIconContainer}>
                <Wallet size={40} color="rgba(255,255,255,0.2)" />
              </View>
            </View>

            <View style={styles.cardActions}>
              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
                onPress={() => setShowWithdrawModal(true)}
              >
                <Text style={styles.actionBtnText}>REQUEST PAYOUT</Text>
              </Pressable>
              
              <View style={styles.growthContainer}>
                <TrendingUp size={16} color="#4ade80" />
                <View>
                  <Text style={styles.growthLabel}>MONTHLY GROWTH</Text>
                  <Text style={styles.growthValue}>+12.5%</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </MotiView>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.tint + '15' }]}>
              <Clock size={20} color={colors.tint} />
            </View>
            <Text style={styles.statLabel}>PENDING</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              ₹{pendingPayouts.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: '#22c55e15' }]}>
              <CheckCircle2 size={20} color="#22c55e" />
            </View>
            <Text style={styles.statLabel}>PROCESSED</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              ₹{withdrawRequests?.filter((r: any) => r.status === 'processed').reduce((acc: number, r: any) => acc + r.amount, 0).toLocaleString('en-IN') || '0'}
            </Text>
          </View>
        </View>

        {/* Transactions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>RECENT EARNINGS</Text>
            <Pressable>
              <Text style={[styles.seeAll, { color: colors.tint }]}>See All</Text>
            </Pressable>
          </View>

          <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {transactions?.length === 0 ? (
              <View style={styles.emptyState}>
                <History size={40} color={colors.muted} strokeWidth={1} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>No transactions yet</Text>
              </View>
            ) : (
              transactions?.slice(0, 5).map((tx: any, idx: number) => (
                <View 
                  key={tx.id} 
                  style={[
                    styles.txItem, 
                    idx !== Math.min(transactions.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                  ]}
                >
                  <View style={[styles.txIcon, { backgroundColor: tx.type === 'credit' ? '#22c55e15' : '#ef444415' }]}>
                    {tx.type === 'credit' ? (
                      <ArrowUpRight size={18} color="#22c55e" />
                    ) : (
                      <ArrowDownLeft size={18} color="#ef4444" />
                    )}
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={[styles.txDesc, { color: colors.text }]}>{tx.description || 'Earnings'}</Text>
                    <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                  </View>
                  <Text style={[styles.txAmount, { color: tx.type === 'credit' ? '#22c55e' : '#ef4444' }]}>
                    {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount.toFixed(2)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Payouts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>PAYOUT REQUESTS</Text>
          </View>

          <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {withdrawRequests?.length === 0 ? (
              <View style={styles.emptyState}>
                <Landmark size={40} color={colors.muted} strokeWidth={1} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>No payout requests</Text>
              </View>
            ) : (
              withdrawRequests?.map((req: any, idx: number) => (
                <View 
                  key={req.id} 
                  style={[
                    styles.txItem, 
                    idx !== withdrawRequests.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                  ]}
                >
                  <View style={styles.txInfo}>
                    <View style={styles.row}>
                      <Text style={[styles.txAmount, { color: colors.text }]}>₹{req.amount.toLocaleString()}</Text>
                      <StatusBadge status={req.status} colors={colors} />
                    </View>
                    <Text style={styles.txDate}>Requested {new Date(req.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.txDate}>TARGET ACCOUNT</Text>
                    <Text style={[styles.txDesc, { color: colors.text, fontSize: 12 }]}>Primary Bank</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Withdraw Modal */}
      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View style={styles.modalOverlay}>
          <MotiView
            from={{ opacity: 0, scale: 0.9, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            style={[styles.modalContent, { backgroundColor: colors.card }]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Request Payout</Text>
                <Text style={styles.modalSub}>Withdraw funds to your bank</Text>
              </View>
              <Pressable onPress={() => setShowWithdrawModal(false)} style={styles.closeBtn}>
                <X size={20} color={colors.muted} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={[styles.balancePreview, { backgroundColor: colors.background }]}>
                <Text style={styles.previewLabel}>CURRENT BALANCE</Text>
                <Text style={[styles.previewValue, { color: colors.text }]}>₹{wallet?.balance?.toLocaleString() || '0'}</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>WITHDRAWAL AMOUNT</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
                  <Text style={styles.inputCurrency}>₹</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter amount"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={withdrawAmount}
                    onChangeText={setWithdrawAmount}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NOTES (OPTIONAL)</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.background, color: colors.text }]}
                  placeholder="E.g. Monthly withdrawal"
                  placeholderTextColor={colors.muted}
                  multiline
                  value={withdrawNotes}
                  onChangeText={setWithdrawNotes}
                />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.confirmBtn,
                  pressed && { opacity: 0.8 },
                  (isSubmitting || !withdrawAmount || parseFloat(withdrawAmount) > (wallet?.balance || 0)) && { opacity: 0.5 }
                ]}
                disabled={isSubmitting || !withdrawAmount || parseFloat(withdrawAmount) > (wallet?.balance || 0)}
                onPress={handleWithdrawRequest}
              >
                <Text style={styles.confirmBtnText}>{isSubmitting ? 'PROCESSING...' : 'CONFIRM WITHDRAWAL'}</Text>
              </Pressable>
            </View>
          </MotiView>
        </View>
      </Modal>
    </View>
  );
}

function StatusBadge({ status, colors }: any) {
  const configs: any = {
    pending: { label: 'Pending', color: '#f59e0b', bg: '#fef3c7' },
    approved: { label: 'Approved', color: '#6366f1', bg: '#e0e7ff' },
    processed: { label: 'Processed', color: '#10b981', bg: '#dcfce7' },
    rejected: { label: 'Rejected', color: '#ef4444', bg: '#fee2e2' },
  };
  const config = configs[status] || configs.pending;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  balanceCardContainer: { padding: 20 },
  balanceCard: {
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  currency: { color: '#f84464', fontSize: 24, fontWeight: '900', marginRight: 4 },
  balanceAmount: { color: '#fff', fontSize: 44, fontWeight: '900', letterSpacing: -1 },
  walletIconContainer: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  cardActions: { marginTop: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionBtn: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  actionBtnText: { color: '#000', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  growthContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14 },
  growthLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  growthValue: { color: '#fff', fontSize: 12, fontWeight: '800' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 16 },
  statCard: { flex: 1, padding: 16, borderRadius: 24, borderWidth: 1, gap: 4 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statLabel: { fontSize: 9, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
  statValue: { fontSize: 18, fontWeight: '900' },
  section: { marginTop: 32, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  seeAll: { fontSize: 12, fontWeight: '800' },
  listCard: { borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  txItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1, gap: 2 },
  txDesc: { fontSize: 14, fontWeight: '800' },
  txDate: { fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' },
  txAmount: { fontSize: 15, fontWeight: '900' },
  emptyState: { padding: 40, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 32, overflow: 'hidden' },
  modalHeader: { padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  modalSub: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
  closeBtn: { padding: 8 },
  modalBody: { padding: 24, gap: 24 },
  balancePreview: { padding: 20, borderRadius: 20, alignItems: 'center', gap: 4 },
  previewLabel: { fontSize: 9, fontWeight: '800', color: '#94a3b8', letterSpacing: 2 },
  previewValue: { fontSize: 28, fontWeight: '900' },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.5, marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, paddingHorizontal: 16 },
  inputCurrency: { fontSize: 18, fontWeight: '900', color: '#94a3b8', marginRight: 8 },
  input: { flex: 1, height: 56, fontSize: 18, fontWeight: '900' },
  textArea: { borderRadius: 18, padding: 16, height: 100, fontSize: 14, fontWeight: '700', textAlignVertical: 'top' },
  confirmBtn: { backgroundColor: '#f84464', height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#f84464', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  confirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
});
