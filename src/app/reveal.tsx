import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SHOES } from '@/data/catalogue';
import { runMatch } from '@/engine';
import { RevealSequence } from '@/components/reveal/RevealSequence';
import { Screen } from '@/components/ui/Screen';
import { track } from '@/lib/analytics';
import { useQuizStore } from '@/state/quizStore';
import { useResultsStore } from '@/state/resultsStore';
import { color, font, space } from '@/theme/tokens';

const SUSPENSE_MS = 2400;

function Suspense({ lines }: { lines: string[] }) {
  const SUSPENSE_COPY = lines;
  const [line, setLine] = useState(0);
  const sweep = useSharedValue(-1);
  useEffect(() => {
    const t = setInterval(() => setLine((l) => (l + 1) % SUSPENSE_COPY.length), 650);
    sweep.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }), -1, false);
    return () => clearInterval(t);
  }, [sweep]);
  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sweep.value * 130 }],
  }));
  return (
    <View style={styles.suspense}>
      <View style={styles.scanTrack}>
        <Animated.View style={[styles.scanBar, sweepStyle]} />
      </View>
      <Text style={styles.suspenseText}>{SUSPENSE_COPY[line]}</Text>
    </View>
  );
}

export default function RevealScreen() {
  const toProfile = useQuizStore((s) => s.toProfile);
  const setResult = useResultsStore((s) => s.setResult);
  const result = useMemo(() => runMatch(toProfile()), [toProfile]);
  const [ready, setReady] = useState(false);
  const [card, setCard] = useState(0);

  useEffect(() => {
    setResult(result);
    track('reveal_view', { mode: result.mode, roles: result.roles.length });
    const t = setTimeout(() => setReady(true), SUSPENSE_MS);
    return () => clearTimeout(t);
  }, [result, setResult]);

  if (!ready) {
    const draft = useQuizStore.getState();
    const lines = [
      `Scanning ${SHOES.length} shoes against your ${draft.weeklyKm ?? 25} km weeks…`,
      'Reading the evidence…',
      'Weighing 19 carbon plates…',
      `Balancing your £${draft.budgetAmountGbp} budget…`,
      'Consulting Malisoux et al. (2015)…',
      'Building your reveal…',
    ];
    return (
      <Screen>
        <Suspense lines={lines} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <RevealSequence
        key={card}
        roleResult={result.roles[card]}
        index={card}
        total={result.roles.length}
        onNext={() =>
          card + 1 < result.roles.length ? setCard(card + 1) : router.replace('/results')
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  suspense: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space(6) },
  scanTrack: {
    width: 260,
    height: 3,
    borderRadius: 2,
    backgroundColor: color.surface2,
    overflow: 'hidden',
    alignItems: 'flex-start',
  },
  scanBar: { width: 130, height: 3, borderRadius: 2, backgroundColor: color.volt },
  suspenseText: { fontFamily: font.ui, fontSize: 13.5, color: color.muted },
});
