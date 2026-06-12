import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { color } from '@/theme/tokens';

const COLORS = [color.volt, color.cyan, color.magenta, color.gold];
const COUNT = 22;

function Particle({ index }: { index: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      (index % 5) * 40,
      withTiming(1, { duration: 750, easing: Easing.out(Easing.quad) }),
    );
  }, [index, progress]);

  const angle = (index / COUNT) * Math.PI * 2;
  const velocity = 70 + (index % 3) * 34;

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: Math.cos(angle) * velocity * progress.value },
      // slight gravity pull on the vertical component
      { translateY: Math.sin(angle) * velocity * progress.value + 36 * progress.value * progress.value },
      { scale: 1 - 0.5 * progress.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: COLORS[index % COLORS.length] },
        index % 4 === 0 && styles.big,
        style,
      ]}
    />
  );
}

/** Firework burst for ELITE-tier reveals — pure reanimated, no asset deps. */
export function ParticleBurst() {
  return (
    <View pointerEvents="none" style={styles.wrap}>
      {Array.from({ length: COUNT }, (_, i) => (
        <Particle key={i} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  particle: { position: 'absolute', width: 6, height: 6, borderRadius: 3 },
  big: { width: 9, height: 9, borderRadius: 4.5 },
});
