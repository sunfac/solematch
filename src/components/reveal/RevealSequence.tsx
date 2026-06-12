import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { CARD_W, matchBand, ShoeCard } from '@/components/card/ShoeCard';
import { ShoeSilhouette } from '@/components/card/ShoeSilhouette';
import { PillButton } from '@/components/ui/PillButton';
import type { RoleResult } from '@/types/match';
import { color, font, space } from '@/theme/tokens';
import { CountUp } from './CountUp';
import { ParticleBurst } from './ParticleBurst';
import { RoleBanner } from './RoleBanner';

type Stage = 'banner' | 'match' | 'tease' | 'slam' | 'stats' | 'done';

/**
 * One card's walkout, staged per spec §6.2: banner drop → match odometer →
 * (ELITE pyro) → card slam + shine sweep → staggered stat count-up → CTAs.
 * Skippable from t=0; reduced motion renders the final state instantly.
 */
export function RevealSequence({
  roleResult,
  index,
  total,
  onNext,
}: {
  roleResult: RoleResult;
  index: number;
  total: number;
  onNext: () => void;
}) {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState<Stage>(reduced ? 'done' : 'banner');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { pick } = roleResult;
  // the celebration scales with YOUR match quality, not the market tier
  const elite = pick.match >= 92;

  const bannerY = useSharedValue(reduced ? 0 : -60);
  const bannerOpacity = useSharedValue(reduced ? 1 : 0);
  const cardScale = useSharedValue(reduced ? 1 : 0.55);
  const cardOpacity = useSharedValue(reduced ? 1 : 0);
  const shineX = useSharedValue(reduced ? CARD_W * 1.4 : -CARD_W);
  const flash = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

    bannerY.value = withTiming(0, { duration: 450, easing: Easing.out(Easing.back(1.4)) });
    bannerOpacity.value = withTiming(1, { duration: 350 });

    at(650, () => setStage('match'));
    // the FUT guessing gap: brand silhouette glows before the card lands
    at(1350, () => setStage('tease'));
    at(elite ? 2350 : 2050, () => {
      setStage('slam');
      flash.value = withSequence(withTiming(0.85, { duration: 90 }), withTiming(0, { duration: 380 }));
      cardOpacity.value = withTiming(1, { duration: 160 });
      cardScale.value = withSequence(
        withTiming(1.08, { duration: 300, easing: Easing.out(Easing.quad) }),
        withTiming(0.985, { duration: 110 }),
        withTiming(1, { duration: 90 }),
      );
      shineX.value = withDelay(340, withTiming(CARD_W * 1.4, { duration: 520 }));
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      }
    });
    at(elite ? 2950 : 2650, () => setStage('stats'));
    at(elite ? 4000 : 3700, () => setStage('done'));

    return () => timers.current.forEach(clearTimeout);
  }, [reduced, elite, bannerY, bannerOpacity, cardScale, cardOpacity, shineX]);

  const skip = () => {
    timers.current.forEach(clearTimeout);
    bannerY.value = 0;
    bannerOpacity.value = 1;
    cardScale.value = 1;
    cardOpacity.value = 1;
    shineX.value = CARD_W * 1.4;
    flash.value = 0;
    setStage('done');
  };

  const bannerStyle = useAnimatedStyle(() => ({
    opacity: bannerOpacity.value,
    transform: [{ translateY: bannerY.value }],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));
  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shineX.value }, { rotateZ: '18deg' }],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  const showCard = stage === 'slam' || stage === 'stats' || stage === 'done';
  const statsOn = stage === 'stats' || stage === 'done';
  const tierColour = matchBand(pick.match).colour;

  return (
    <Pressable style={styles.stage} onPress={stage !== 'done' ? skip : undefined} testID="reveal-stage">
      <Text style={styles.counter}>
        CARD {index + 1} OF {total}
      </Text>

      <Animated.View style={[styles.bannerWrap, bannerStyle]}>
        <RoleBanner role={roleResult.role} animate={!reduced && stage !== 'done'} />
      </Animated.View>

      <View style={styles.matchZone}>
        {stage !== 'banner' ? (
          <View style={styles.matchRow}>
            <CountUp
              to={pick.match}
              duration={650}
              animate={!reduced && stage === 'match'}
              style={styles.matchBig}
            />
            <Text style={styles.matchPct}>% MATCH</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardZone}>
        {stage === 'tease' ? (
          <Animated.View entering={FadeIn.duration(200)} style={styles.tease}>
            <ShoeSilhouette accent={tierColour} secondary={color.cyan} detail={color.line} width={250} height={110} />
            <Text style={[styles.teaseBrand, { color: tierColour }]}>{pick.shoe.brand.toUpperCase()}</Text>
          </Animated.View>
        ) : null}
        {showCard ? (
          <Animated.View style={cardStyle}>
            <ShoeCard
              shoe={pick.shoe}
              scores={pick.scores}
              match={pick.match}
              context="match"
              animateStats={!reduced}
              statsDelay={statsOn ? 0 : 99999}
              tiltEnabled={stage === 'done'}
            />
            <Animated.View pointerEvents="none" style={[styles.shine, shineStyle]}>
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.16)', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </Animated.View>
        ) : null}
        {elite && (stage === 'slam' || stage === 'stats') && !reduced ? <ParticleBurst /> : null}
        <Animated.View pointerEvents="none" style={[styles.flash, { backgroundColor: tierColour }, flashStyle]} />
      </View>

      {stage === 'done' ? (
        <View style={styles.ctas}>
          <View style={styles.ctaRow}>
            <PillButton
              label="Why this shoe"
              variant="ghost"
              onPress={() => router.push(`/shoe/${pick.shoe.slug}`)}
              style={{ flex: 1 }}
            />
            <PillButton
              label="Where to buy"
              variant="ghost"
              onPress={() => router.push(`/shoe/${pick.shoe.slug}#offers`)}
              style={{ flex: 1 }}
            />
          </View>
          <PillButton
            testID="reveal-next"
            label={index + 1 < total ? 'Next card →' : total > 1 ? 'See my rotation' : 'See my result'}
            onPress={onNext}
          />
          <Text style={styles.tiltHint}>Drag the card · we may earn commission on retailer links</Text>
        </View>
      ) : (
        <Text style={styles.skipHint}>tap anywhere to skip</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, alignItems: 'center', paddingTop: space(4) },
  counter: { fontFamily: font.display, fontSize: 11, letterSpacing: 3, color: color.cyan },
  bannerWrap: { marginTop: space(4) },
  matchZone: { height: 56, justifyContent: 'center', marginTop: space(2) },
  matchRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  matchBig: { fontFamily: font.display, fontSize: 44, color: color.volt },
  matchPct: { fontFamily: font.display, fontSize: 13, letterSpacing: 2, color: color.volt },
  cardZone: { marginTop: space(2), height: 480, alignItems: 'center', justifyContent: 'center' },
  tease: { alignItems: 'center', gap: space(3) },
  teaseBrand: { fontFamily: font.display, fontSize: 15, letterSpacing: 8 },
  flash: { position: 'absolute', top: -60, bottom: -60, left: -600, right: -600, opacity: 0 },
  shine: { position: 'absolute', top: -40, bottom: -40, width: 90 },
  ctas: { width: '100%', maxWidth: 360, gap: space(2.5), marginTop: space(2) },
  ctaRow: { flexDirection: 'row', gap: space(2.5) },
  tiltHint: { fontFamily: font.ui, fontSize: 11, color: color.muted, textAlign: 'center', opacity: 0.8 },
  skipHint: { fontFamily: font.ui, fontSize: 12, color: color.muted, marginTop: space(4), opacity: 0.7 },
});
