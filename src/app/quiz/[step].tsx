import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { STEPS } from '@/components/quiz/steps';
import { PillButton } from '@/components/ui/PillButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Screen } from '@/components/ui/Screen';
import { track } from '@/lib/analytics';
import { useQuizStore } from '@/state/quizStore';
import { color, font, space } from '@/theme/tokens';

export default function QuizStepScreen() {
  const params = useLocalSearchParams<{ step: string }>();
  const stepNum = Math.min(Math.max(Number(params.step) || 1, 1), STEPS.length);
  const step = STEPS[stepNum - 1];
  const store = useQuizStore();
  const { units, set } = store;
  const valid = step.valid(store);
  const last = stepNum === STEPS.length;
  const advancing = useRef(false);

  const next = () => {
    if (advancing.current) return;
    advancing.current = true;
    track('quiz_step', { step: step.id });
    if (last) {
      track('quiz_complete', { mode: store.mode });
      router.push('/reveal');
    } else {
      router.push(`/quiz/${stepNum + 1}`);
    }
  };

  // single-choice steps advance themselves after a beat of visual feedback
  const onAutoNext = () => setTimeout(next, 260);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => (stepNum === 1 ? router.replace('/') : router.back())}
        >
          <Text style={styles.back}>←</Text>
        </Pressable>
        <ProgressDots current={stepNum} total={STEPS.length} />
        {step.units ? (
          <Pressable
            testID="unit-toggle"
            accessibilityRole="button"
            onPress={() => set('units', units === 'metric' ? 'imperial' : 'metric')}
          >
            <Text style={styles.unitToggle}>{units === 'metric' ? 'kg · km' : 'lb · mi'}</Text>
          </Pressable>
        ) : (
          <View style={{ width: 52 }} />
        )}
      </View>

      <Animated.View entering={FadeInRight.duration(240)}>
        <Text style={styles.title}>{step.title}</Text>
        {step.subtitle ? <Text style={styles.subtitle}>{step.subtitle}</Text> : null}

        <View style={styles.body}>
          <step.Component onAutoNext={onAutoNext} />
        </View>
      </Animated.View>

      <View style={styles.footer}>
        {step.optional && !last ? (
          <PillButton label="Skip" variant="ghost" onPress={next} />
        ) : null}
        <PillButton
          testID="quiz-next"
          label={last ? 'Reveal my match' : 'Next'}
          onPress={next}
          disabled={!valid}
          style={{ flex: 1 }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space(6),
  },
  back: { color: color.muted, fontSize: 22, width: 52 },
  unitToggle: {
    color: color.cyan,
    fontFamily: font.uiMed,
    fontSize: 12,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  title: { fontFamily: font.display, fontSize: 24, color: color.ink, marginBottom: space(2) },
  subtitle: { fontFamily: font.ui, fontSize: 14, color: color.muted, marginBottom: space(2) },
  body: { marginTop: space(4), gap: space(3) },
  footer: { flexDirection: 'row', gap: space(3), marginTop: space(8), marginBottom: space(6) },
});
