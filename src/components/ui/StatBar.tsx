import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { color, font } from '@/theme/tokens';

type Props = {
  label: string;
  value: number; // 0-99
  /** highlight bar+value in volt for standout stats */
  hot?: boolean;
  /** ms delay before the fill animates in (reveal stagger) */
  delay?: number;
  /** when false, renders statically at full width (reduced motion) */
  animate?: boolean;
};

export function StatBar({ label, value, hot = false, delay = 0, animate = true }: Props) {
  const pct = Math.max(0, Math.min(99, value));
  const width = useSharedValue(animate ? 0 : pct);

  useEffect(() => {
    if (animate) width.value = withDelay(delay, withTiming(pct, { duration: 600 }));
  }, [animate, delay, pct, width]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, hot && { color: color.volt }]}>{pct}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[styles.fill, { backgroundColor: hot ? color.volt : color.cyan }, fillStyle]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontFamily: font.display, fontSize: 12, color: color.muted, letterSpacing: 1 },
  value: { fontFamily: font.display, fontSize: 12, color: color.ink },
  track: { height: 4, borderRadius: 2, backgroundColor: '#232730', overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
});
