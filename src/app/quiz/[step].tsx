import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { STEPS } from '@/components/quiz/steps';
import { PillButton } from '@/components/ui/PillButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Screen } from '@/components/ui/Screen';
import { TopBar } from '@/components/ui/TopBar';
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
  // stacked screens stay mounted on web — re-arm the guard when this step regains focus
  useFocusEffect(
    useCallback(() => {
      advancing.current = false;
    }, []),
  );

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
      <TopBar
        centre={<ProgressDots current={stepNum} total={STEPS.length} />}
        right={
          step.units ? (
            <Pressable
              testID="unit-toggle"
              accessibilityRole="button"
              onPress={() => set('units', units === 'metric' ? 'imperial' : 'metric')}
            >
              <Text style={styles.unitToggle}>{units === 'metric' ? 'kg · km' : 'lb · mi'}</Text>
            </Pressable>
          ) : null
        }
      />

      <Animated.View entering={FadeInRight.duration(240)}>
        <Text style={styles.stepTag}>
          STEP {String(stepNum).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
          {step.optional ? ' · OPTIONAL' : ''}
        </Text>
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
  stepTag: { fontFamily: font.mono, fontSize: 10, letterSpacing: 1, color: color.volt, marginBottom: space(2) },
  title: { fontFamily: font.display, fontSize: 27, lineHeight: 31, letterSpacing: -0.5, color: color.ink, marginBottom: space(2) },
  subtitle: { fontFamily: font.ui, fontSize: 14, color: color.muted, marginBottom: space(2) },
  body: { marginTop: space(4), gap: space(3) },
  footer: { flexDirection: 'row', gap: space(3), marginTop: space(8), marginBottom: space(6) },
});
