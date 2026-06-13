import { StyleSheet, Text } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import type { Role } from '@/types/profile';
import { color, font } from '@/theme/tokens';

const LABELS: Record<Role, string> = {
  race: 'RACE DAY',
  tempo: 'TEMPO',
  daily: 'DAILY TRAINER',
  recovery: 'RECOVERY · ZONE 2',
  trail: 'TRAIL',
};

/** The FUT position-flag moment: banner drops in and gently waves. */
export function RoleBanner({ role, animate = true }: { role: Role; animate?: boolean }) {
  const wave = useSharedValue(0);
  useEffect(() => {
    if (!animate) return;
    wave.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(-1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [animate, wave]);

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${wave.value * 1.6}deg` }, { skewX: `${wave.value * 1.2}deg` }],
  }));

  return (
    <Animated.View style={[styles.banner, waveStyle]}>
      <Text style={styles.text}>{LABELS[role]}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: color.cyan,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 999,
  },
  text: { fontFamily: font.display, fontSize: 13, letterSpacing: 4, color: color.bg },
});
