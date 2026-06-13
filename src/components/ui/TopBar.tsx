import { Link, router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NavMenu } from './NavMenu';
import { color, font, space } from '@/theme/tokens';

type Props = {
  /** Hide the back arrow (e.g. on the landing page). Default shows it. */
  hideBack?: boolean;
  /**
   * Slot that REPLACES the centre wordmark. Used by the quiz to drop
   * ProgressDots in the centre — same nav frame, different middle content.
   */
  centre?: ReactNode;
  /** Slot that REPLACES the right menu button. Used by the quiz for unit toggle. */
  right?: ReactNode;
};

/**
 * Consistent global navigation: back arrow (left) + brand wordmark (centre) +
 * menu button (right). Tap menu to slide in a sheet with every public route.
 * On every screen so the user always has a way home and one way to get to any
 * page — no more dead-ending in a deep link.
 */
export function TopBar({ hideBack, centre, right }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {!hideBack ? (
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}
          >
            <Text style={styles.back}>←</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.centre}>
        {centre ??
          (hideBack ? null : (
            <Link href="/" accessibilityLabel="Home" style={styles.wordmarkLink}>
              <Text style={styles.wordmark}>SOLEMATCH</Text>
            </Link>
          ))}
      </View>

      <View style={[styles.side, styles.sideRight]}>
        {right ?? (
          <>
            <Pressable
              onPress={() => setMenuOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Open menu"
              hitSlop={12}
              style={styles.menuBtn}
            >
              <Text style={styles.menuIcon}>≡</Text>
            </Pressable>
            <NavMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space(5),
    minHeight: 36,
  },
  side: { width: 48, alignItems: 'flex-start' },
  sideRight: { alignItems: 'flex-end' },
  centre: { flex: 1, alignItems: 'center' },
  back: { color: color.muted, fontSize: 22, lineHeight: 26, paddingHorizontal: space(1) },
  wordmarkLink: { paddingVertical: space(1) },
  wordmark: { fontFamily: font.display, fontSize: 11, letterSpacing: 4, color: color.muted },
  menuBtn: { paddingHorizontal: space(1), paddingVertical: space(0.5) },
  menuIcon: { color: color.ink, fontSize: 26, lineHeight: 26 },
});
