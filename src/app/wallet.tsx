import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import AppHeader from '@/components/app-header';
import VoltButton from '@/components/volt-button';
import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { addMoney, useAppStore } from '@/data/app-store';
import { TOPUP_AMOUNTS, formatINR, type WalletTxn } from '@/data/mock';

const MIN = 50;
const MAX = 10000;
const TXN_ICON: Record<WalletTxn['kind'], keyof typeof Ionicons.glyphMap> = {
  topup: 'arrow-down',
  charge: 'flash',
  refund: 'return-down-back',
  plan: 'ribbon',
};

/** Wallet: balance, add money (UPI / card), and every credit and debit. */
export default function WalletScreen() {
  const balance = useAppStore((st) => st.walletBalance);
  const txns = useAppStore((st) => st.txns);
  const [amount, setAmount] = useState('500');
  const [method, setMethod] = useState<'UPI' | 'Card'>('UPI');
  const [filter, setFilter] = useState<'All' | 'Added' | 'Spent'>('All');
  const [added, setAdded] = useState<number | null>(null);

  const value = Number(amount) || 0;
  const valid = value >= MIN && value <= MAX;
  const shown = txns.filter((t) => filter === 'All' || (filter === 'Added' ? t.amount > 0 : t.amount < 0));

  const pay = () => {
    if (!valid) return;
    addMoney(value, method);
    setAdded(value);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Wallet</Text>

        <View style={styles.balanceCard}>
          <View style={styles.balanceIcon}>
            <Ionicons name="wallet" size={18} color={Palette.forest} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={styles.balance}>{formatINR(balance)}</Text>
          </View>
        </View>

        {added ? (
          <View style={styles.success}>
            <Ionicons name="checkmark-circle" size={22} color={Palette.forest} />
            <Text style={styles.successText}>{formatINR(added)} added to your wallet.</Text>
            <TouchableOpacity onPress={() => setAdded(null)} hitSlop={8}>
              <Text style={styles.successLink}>Add more</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add money</Text>
            <View style={styles.amountBox}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput
                value={amount}
                onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, '').slice(0, 5))}
                keyboardType="number-pad"
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor={Palette.mistLight}
              />
            </View>
            <View style={styles.quick}>
              {TOPUP_AMOUNTS.map((a) => (
                <TouchableOpacity key={a} onPress={() => setAmount(String(a))} activeOpacity={0.85} style={[styles.quickBtn, value === a && styles.quickOn]}>
                  <Text style={[styles.quickText, value === a && styles.quickTextOn]}>₹{a.toLocaleString('en-IN')}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {!valid && amount !== '' ? (
              <Text style={styles.error}>
                Enter between ₹{MIN} and ₹{MAX.toLocaleString('en-IN')}.
              </Text>
            ) : null}

            <Text style={styles.payLabel}>Pay with</Text>
            <View style={styles.methods}>
              <Method icon="phone-portrait-outline" title="UPI" sub="GPay, PhonePe, Paytm" on={method === 'UPI'} onPress={() => setMethod('UPI')} />
              <Method icon="card-outline" title="Card" sub="Debit or credit" on={method === 'Card'} onPress={() => setMethod('Card')} />
            </View>

            <VoltButton label={valid ? `Add ${formatINR(value)}` : 'Add money'} icon="add" disabled={!valid} onPress={pay} style={{ marginTop: Spacing.sm }} />
            <Text style={styles.demo}>Prototype: no real payment is made.</Text>
          </View>
        )}

        <View style={styles.histHead}>
          <Text style={styles.section}>Transactions</Text>
          <View style={styles.filters}>
            {(['All', 'Added', 'Spent'] as const).map((f) => (
              <TouchableOpacity key={f} onPress={() => setFilter(f)} activeOpacity={0.85} style={[styles.filter, filter === f && styles.filterOn]}>
                <Text style={[styles.filterText, filter === f && styles.filterTextOn]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.list}>
          {shown.map((t, i) => (
            <View key={t.id} style={[styles.txn, i > 0 && styles.txnBorder]}>
              <View style={[styles.txnIcon, t.amount > 0 && styles.txnIconIn]}>
                <Ionicons name={TXN_ICON[t.kind]} size={16} color={t.amount > 0 ? Palette.forest : Palette.inkSoft} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txnTitle} numberOfLines={1}>
                  {t.title}
                </Text>
                <Text style={styles.txnDate}>{t.dateLabel}</Text>
              </View>
              <Text style={[styles.txnAmount, t.amount > 0 && { color: Palette.forest }]}>
                {t.amount > 0 ? '+' : '−'}
                {formatINR(Math.abs(t.amount))}
              </Text>
            </View>
          ))}
          {shown.length === 0 ? <Text style={styles.empty}>Nothing here yet.</Text> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Method({ icon, title, sub, on, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string; on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.method, on && styles.methodOn]}>
      <Ionicons name={icon} size={20} color={on ? Palette.forest : Palette.mist} />
      <View style={{ flex: 1 }}>
        <Text style={styles.methodTitle}>{title}</Text>
        <Text style={styles.methodSub} numberOfLines={1}>
          {sub}
        </Text>
      </View>
      <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={18} color={on ? Palette.volt : Palette.mistLight} />
    </TouchableOpacity>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: 48, gap: Spacing.md },
  title: { fontFamily: Font.display, fontSize: 22, color: Palette.ink },

  balanceCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Palette.voltSofter, borderRadius: Radius.card, padding: Spacing.lg, borderWidth: 1, borderColor: Palette.brandTint2 },
  balanceIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center' },
  balanceLabel: { fontFamily: Font.medium, fontSize: 12, color: Palette.mist },
  balance: { fontFamily: Font.display, fontSize: 22, color: Palette.ink },

  card: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.lg, gap: Spacing.md, ...Shadow.soft },
  cardTitle: { fontFamily: Font.displaySemi, fontSize: 16, color: Palette.ink },
  amountBox: { flexDirection: 'row', alignItems: 'center', gap: 4, borderBottomWidth: 2, borderBottomColor: Palette.volt, paddingBottom: 4 },
  rupee: { fontFamily: Font.display, fontSize: 26, color: Palette.mist },
  amountInput: { flex: 1, fontFamily: Font.display, fontSize: 28, color: Palette.ink, padding: 0 },
  quick: { flexDirection: 'row', gap: Spacing.sm },
  quickBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Palette.surfaceAlt, borderWidth: 1, borderColor: Palette.line },
  quickOn: { backgroundColor: Palette.voltSoft, borderColor: Palette.volt },
  quickText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.inkSoft },
  quickTextOn: { color: Palette.forest },
  error: { fontFamily: Font.medium, fontSize: 12, color: Palette.red, marginTop: -Spacing.xs },

  payLabel: { fontFamily: Font.semibold, fontSize: 13, color: Palette.mist },
  methods: { gap: Spacing.sm, marginTop: -Spacing.xs },
  method: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.chip, padding: Spacing.md, borderWidth: 1, borderColor: Palette.line },
  methodOn: { borderColor: Palette.volt, backgroundColor: Palette.voltSofter },
  methodTitle: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },
  methodSub: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist },
  demo: { fontFamily: Font.regular, fontSize: 11, color: Palette.mistLight, textAlign: 'center' },

  success: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Palette.voltSoft, borderRadius: Radius.card, padding: Spacing.lg },
  successText: { flex: 1, fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },
  successLink: { fontFamily: Font.bold, fontSize: 13, color: Palette.forest },

  histHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.sm },
  section: { fontFamily: Font.display, fontSize: 17, color: Palette.ink },
  filters: { flexDirection: 'row', gap: 4 },
  filter: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.pill },
  filterOn: { backgroundColor: Palette.voltSoft },
  filterText: { fontFamily: Font.semibold, fontSize: 12, color: Palette.mist },
  filterTextOn: { color: Palette.forest },

  list: { backgroundColor: Palette.surface, borderRadius: Radius.card, paddingHorizontal: Spacing.md, ...Shadow.soft },
  txn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  txnBorder: { borderTopWidth: 1, borderTopColor: Palette.lineSoft },
  txnIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: Palette.canvasDeep, alignItems: 'center', justifyContent: 'center' },
  txnIconIn: { backgroundColor: Palette.voltSoft },
  txnTitle: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },
  txnDate: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 1 },
  txnAmount: { fontFamily: Font.displaySemi, fontSize: 14, color: Palette.ink },
  empty: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist, textAlign: 'center', paddingVertical: Spacing.xl },
});
