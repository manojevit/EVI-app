import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';

/** Centred confirm popup: icon, title, message, Cancel + a (red by default) action. */
export default function ConfirmDialog({
  visible,
  icon,
  title,
  message,
  confirmLabel,
  danger = true,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const tone = danger ? Palette.red : Palette.forest;
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={styles.center}>
        <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel="Close" />
        <View style={styles.card} accessibilityRole="alert">
          <View style={[styles.icon, { backgroundColor: danger ? Palette.redSoft : Palette.voltSoft }]}>
            <Ionicons name={icon} size={26} color={tone} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { backgroundColor: tone }]} onPress={onConfirm} activeOpacity={0.85}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = scaledSheet({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(19,32,26,0.5)' },
  card: { width: '100%', maxWidth: 360, backgroundColor: Palette.surface, borderRadius: Radius.hero, padding: Spacing.xxl, alignItems: 'center', ...Shadow.lift },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  title: { fontFamily: Font.display, fontSize: 20, color: Palette.ink, textAlign: 'center' },
  message: { fontFamily: Font.regular, fontSize: 14, lineHeight: 20, color: Palette.mist, textAlign: 'center', marginTop: Spacing.sm },
  buttons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xxl, alignSelf: 'stretch' },
  btn: { flex: 1, height: 50, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: Palette.canvasDeep },
  cancelText: { fontFamily: Font.bold, fontSize: 15, color: Palette.ink },
  confirmText: { fontFamily: Font.bold, fontSize: 15, color: Palette.white },
});
