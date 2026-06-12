import { Gesture } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  Easing,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

const MAX_DEG = 10;

/**
 * FUT-card tilt: drag (mouse or touch) rotates the card toward the pointer with
 * spring snap-back; when idle, a slow sway loop keeps the card feeling alive.
 * Respects the system reduced-motion preference.
 */
export function useTilt(enabled = true) {
  const rx = useSharedValue(0); // rotateX deg
  const ry = useSharedValue(0); // rotateY deg
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!enabled || reduced) return;
    ry.value = withRepeat(
      withSequence(
        withTiming(4, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
        withTiming(-4, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    rx.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 3400, easing: Easing.inOut(Easing.quad) }),
        withTiming(2, { duration: 3400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    return () => {
      cancelAnimation(rx);
      cancelAnimation(ry);
    };
  }, [enabled, reduced, rx, ry]);

  const pan = Gesture.Pan()
    .enabled(enabled && !reduced)
    .onBegin(() => {
      cancelAnimation(rx);
      cancelAnimation(ry);
    })
    .onUpdate((e) => {
      ry.value = Math.max(-MAX_DEG, Math.min(MAX_DEG, e.translationX / 8));
      rx.value = Math.max(-MAX_DEG, Math.min(MAX_DEG, -e.translationY / 8));
    })
    .onFinalize(() => {
      rx.value = withSpring(0, { damping: 12 });
      ry.value = withSpring(0, { damping: 12 });
    });

  return { rx, ry, pan, reduced };
}
