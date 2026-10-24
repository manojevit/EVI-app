import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import AppHeader from '@/components/app-header';
import BrandLogo from '@/components/brand-logo';
import ConfirmDialog from '@/components/confirm-dialog';
import VoltButton from '@/components/volt-button';
import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { RFID_CARD_PRICE, formatUid, orderRfidCard, removeRfidCard, setRfidStatus, useAppStore, type RfidCard } from '@/data/app-store';
import { formatINR } from '@/data/mock';

type Pending = { kind: 'block' | 'remove'; card: RfidCard } | { kind: 'order' } | null;

/** RFID cards: tap a card on the charger to start charging without the phone. */
export default function RfidScreen() {
  const router = useRouter();
  const cards = useAppStore((st) => st.rfidCards);
  const vehicles = useAppStore((st) => st.vehicles);
  const balance = useAppStore((st) => st.walletBalance);
  const [pending, setPending] = useState<Pending>(null);
  const [lowBalance, setLowBalance] = useState(false);

  const confirm = () => {
    if (!pending) return;
    if (pending.kind === 'block') setRfidStatus(pending.card.id, 'blocked');
    if (pending.kind === 'remove') removeRfidCard(pending.card.id);
    if (pending.kind === 'order') setLowBalance(!orderRfidCard());
    setPending(null);
  };

  return (
    <View style={styles.container}>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View>
          <Text style={styles.title}>RFID cards</Text>
          <Text style={styles.subtitle}>Tap your card on any EVIT charger to start charging. No phone needed.</Text>
        </View>

        {cards.length ? (
          cards.map((card) => (
            <View key={card.id} style={{ gap: Spacing.sm }}>
              <CardFace card={card} vehicle={vehicles.find((v) => v.id === card.vehicleId)?.model} />
              {card.status === 'ordered' ? (
                <Text style={styles.orderNote}>We&apos;ll text you when it ships. Add it here when it arrives by tapping it on any charger.</Text>
              ) : (
                <View style={styles.actions}>
                  {card.status === 'active' ? (
                    <Action icon="lock-closed-outline" label="Block" onPress={() => setPending({ kind: 'block', card })} />
                  ) : (
                    <Action icon="lock-open-outline" label="Unblock" onPress={() => setRfidStatus(card.id, 'active')} />
                  )}
                  <Action icon="trash-outline" label="Remove" danger onPress={() => setPending({ kind: 'remove', card })} />
                  <Text style={styles.added}>{card.addedLabel}</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="credit-card-wireless-outline" size={34} color={Palette.forest} />
            <Text style={styles.emptyTitle}>No cards yet</Text>
            <Text style={styles.emptyText}>Add the EVIT card you have, or order one below.</Text>
          </View>
        )}

        <View style={styles.buttons}>
          <VoltButton label={`Order a new card · ₹${RFID_CARD_PRICE}`} icon="cart-outline" onPress={() => setPending({ kind: 'order' })} />
          <VoltButton label="Add a card you have" icon="add" variant="outline" onPress={() => router.push('/add-rfid' as never)} />
          {lowBalance ? (
            <Text style={styles.low} onPress={() => router.push('/wallet')}>
              Your wallet has {formatINR(balance)}. <Text style={styles.lowLink}>Add money</Text> to order a card.
            </Text>
          ) : null}
        </View>

        <View style={styles.how}>
          <Text style={styles.howTitle}>How it works</Text>
          {[
            ['Plug in', 'Connect the charger to your car.'],
            ['Tap your card', 'Hold it on the card reader under the screen.'],
            ['Charging starts', 'You pay from your EVIT wallet and get a receipt in the app.'],
          ].map(([t, d], i) => (
            <View key={t} style={styles.howRow}>
              <View style={styles.howNum}>
                <Text style={styles.howNumText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.howStep}>{t}</Text>
                <Text style={styles.howText}>{d}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={pending != null}
        icon={pending?.kind === 'order' ? 'card-outline' : pending?.kind === 'remove' ? 'trash-outline' : 'lock-closed-outline'}
        danger={pending?.kind !== 'order'}
        title={pending?.kind === 'order' ? 'Order an EVIT card?' : pending?.kind === 'remove' ? 'Remove this card?' : 'Block this card?'}
        message={
          pending?.kind === 'order'
            ? `₹${RFID_CARD_PRICE} is paid from your wallet. The card reaches your address in 5–7 days.`
            : pending?.kind === 'remove'
              ? "It's taken off your account and can't start a charge. You can add it again later."
              : "It won't start a charge until you unblock it. Do this if you've lost the card."
        }
        confirmLabel={pending?.kind === 'order' ? `Pay ₹${RFID_CARD_PRICE}` : pending?.kind === 'remove' ? 'Remove card' : 'Block card'}
        onCancel={() => setPending(null)}
        onConfirm={confirm}
      />
    </View>
  );
}

/** The card itself, drawn like the physical EVIT card. */
function CardFace({ card, vehicle }: { card: RfidCard; vehicle?: string }) {
  const blocked = card.status === 'blocked';
  const ordered = card.status === 'ordered';
  const pill = blocked
    ? { label: 'Blocked', ink: Palette.red, tint: Palette.redSoft }
    : ordered
      ? { label: 'On the way', ink: Palette.amberDeep, tint: Palette.amberSoft }
      : { label: 'Active', ink: Palette.forest, tint: Palette.voltSoft };
  return (
    <LinearGradient colors={['#FFFFFF', '#E3F2E8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.face, ordered && styles.faceOrdered]}>
      <View style={[styles.ring, styles.ringBig]} pointerEvents="none" />
      <View style={[styles.ring, styles.ringSmall]} pointerEvents="none" />
      <View style={[styles.faceInner, blocked && { opacity: 0.45 }]}>
        <View style={styles.faceTop}>
          <BrandLogo height={30} />
          <MaterialCommunityIcons name="contactless-payment" size={26} color={Palette.forest} />
        </View>
        <MaterialCommunityIcons name="integrated-circuit-chip" size={34} color="#B8963E" />
        <Text style={styles.uid}>{ordered ? 'Arrives in 5–7 days' : formatUid(card.uid)}</Text>
      </View>
      <View style={styles.faceBottom}>
        <View style={[{ flex: 1, minWidth: 0 }, blocked && { opacity: 0.45 }]}>
          <Text style={styles.cardName} numberOfLines={1}>
            {card.name}
          </Text>
          <Text style={styles.cardCar} numberOfLines={1}>
            {vehicle ? `Linked to ${vehicle}` : 'Not linked to a vehicle'}
          </Text>
        </View>
        <Text style={[styles.pill, { color: pill.ink, backgroundColor: pill.tint }]}>{pill.label}</Text>
      </View>
    </LinearGradient>
  );
}

function Action({ icon, label, onPress, danger }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={[styles.action, danger && styles.actionDanger]} activeOpacity={0.8} onPress={onPress}>
      <Ionicons name={icon} size={16} color={danger ? Palette.red : Palette.forest} />
      <Text style={[styles.actionText, danger && { color: Palette.red }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: 48, gap: Spacing.xl },
  title: { fontFamily: Font.display, fontSize: 22, color: Palette.ink },
  subtitle: { fontFamily: Font.regular, fontSize: 14, lineHeight: 20, color: Palette.mist, marginTop: 2 },

  // card face (credit-card proportions)
  face: { aspectRatio: 1.586, maxWidth: '100%', borderRadius: 20, padding: Spacing.lg, justifyContent: 'space-between', overflow: 'hidden', borderWidth: 1, borderColor: Palette.brandTint2, ...Shadow.lift },
  faceOrdered: { borderStyle: 'dashed', borderColor: Palette.amber },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 26, borderColor: 'rgba(32,148,76,0.06)' },
  ringBig: { width: 260, height: 260, right: -90, bottom: -120 },
  ringSmall: { width: 150, height: 150, right: -40, bottom: -60 },
  faceInner: { gap: Spacing.sm },
  faceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  uid: { fontFamily: Font.displaySemi, fontSize: 18, letterSpacing: 2, color: Palette.ink },
  faceBottom: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.md },
  cardName: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },
  cardCar: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 1 },
  pill: { fontFamily: Font.bold, fontSize: 11, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden' },

  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingHorizontal: 14, borderRadius: Radius.pill, backgroundColor: Palette.voltSoft },
  actionDanger: { backgroundColor: Palette.redSoft },
  actionText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.forest },
  added: { flex: 1, textAlign: 'right', fontFamily: Font.regular, fontSize: 12, color: Palette.mistLight },
  orderNote: { fontFamily: Font.regular, fontSize: 13, lineHeight: 18, color: Palette.mist, paddingHorizontal: Spacing.xs },

  empty: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.xl, alignItems: 'center', gap: 4, ...Shadow.soft },
  emptyTitle: { fontFamily: Font.displaySemi, fontSize: 17, color: Palette.ink, marginTop: Spacing.sm },
  emptyText: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist, textAlign: 'center' },

  buttons: { gap: Spacing.sm },
  low: { fontFamily: Font.regular, fontSize: 13, color: Palette.red, textAlign: 'center' },
  lowLink: { fontFamily: Font.bold, color: Palette.forest },

  how: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.lg, gap: Spacing.md, ...Shadow.soft },
  howTitle: { fontFamily: Font.displaySemi, fontSize: 16, color: Palette.ink },
  howRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  howNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center' },
  howNumText: { fontFamily: Font.bold, fontSize: 13, color: Palette.forest },
  howStep: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },
  howText: { fontFamily: Font.regular, fontSize: 13, lineHeight: 18, color: Palette.mist, marginTop: 1 },
});
