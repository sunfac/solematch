import { router } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { color, font, space } from '@/theme/tokens';

type Item = { label: string; href: string; emphasis?: boolean };

const PRIMARY: Item[] = [
  { label: 'Reveal my match', href: '/quiz/1', emphasis: true },
  { label: 'Catalogue', href: '/browse' },
  { label: 'Methodology', href: '/methodology' },
];

const SECONDARY: Item[] = [
  { label: 'Settings', href: '/settings' },
  { label: 'Affiliate disclosure', href: '/legal/disclosure' },
  { label: 'Privacy', href: '/legal/privacy' },
  { label: 'Terms', href: '/legal/terms' },
];

export function NavMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const go = (href: string) => {
    onClose();
    setTimeout(() => router.push(href as never), 60);
  };

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={styles.backdropFade} entering={FadeIn.duration(150)} />
      </Pressable>
      <Animated.View
        style={styles.sheet}
        entering={SlideInRight.duration(200)}
      >
        <View style={styles.header}>
          <Text style={styles.wordmark}>SOLEMATCH</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close menu">
            <Text style={styles.close}>×</Text>
          </Pressable>
        </View>
        <View style={styles.group}>
          {PRIMARY.map((item) => (
            <Pressable key={item.href} onPress={() => go(item.href)} style={styles.row} accessibilityRole="link">
              <Text style={[styles.label, item.emphasis && styles.labelPrimary]}>{item.label}</Text>
              <Text style={[styles.arrow, item.emphasis && { color: color.volt }]}>→</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.divider} />
        <View style={styles.group}>
          {SECONDARY.map((item) => (
            <Pressable key={item.href} onPress={() => go(item.href)} style={styles.rowSmall} accessibilityRole="link">
              <Text style={styles.labelMuted}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.footnote}>Independent ranking — no brand can buy placement.</Text>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  backdropFade: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '88%',
    maxWidth: 360,
    backgroundColor: color.surface,
    borderLeftWidth: 1,
    borderLeftColor: color.line,
    paddingHorizontal: space(5),
    paddingTop: space(6),
    paddingBottom: space(8),
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space(7) },
  wordmark: { fontFamily: font.display, fontSize: 13, letterSpacing: 6, color: color.muted },
  close: { fontFamily: font.display, fontSize: 28, color: color.muted, paddingHorizontal: space(2), lineHeight: 28 },
  group: { gap: 2 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space(4),
    borderBottomWidth: 1,
    borderBottomColor: color.line,
  },
  rowSmall: { paddingVertical: space(2.5) },
  label: { fontFamily: font.uiMed, fontSize: 17, color: color.ink },
  labelPrimary: { color: color.volt },
  labelMuted: { fontFamily: font.ui, fontSize: 13, color: color.muted },
  arrow: { fontFamily: font.uiMed, fontSize: 17, color: color.muted },
  divider: { height: 1, backgroundColor: color.line, marginVertical: space(5) },
  footnote: {
    marginTop: 'auto',
    fontFamily: font.ui,
    fontSize: 11.5,
    color: color.muted,
    textAlign: 'center',
    opacity: 0.7,
  },
});
