import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { TierBadge } from '@/components/ui/Badge';
import { HoloFoil } from './HoloFoil';
import { ShoeSilhouette } from './ShoeSilhouette';
import { StatPanel } from './StatPanel';
import { useTilt } from '@/components/reveal/useTilt';
import { imageFor } from '@/lib/affiliate';
import { color, font, tierColor } from '@/theme/tokens';
import type { ShoeScores, Shoe } from '@/types/shoe';

export const CARD_W = 320;
export const CARD_H = 460;

/**
 * On personal-match surfaces the card celebrates YOUR fit, not the market tier —
 * a 90% match framed "BRONZE" reads as a downgrade (owner feedback). Tier
 * framing stays on catalogue surfaces where it ranks the market.
 */
export function matchBand(match: number): { label: string; colour: string } {
  if (match >= 92) return { label: 'ELITE MATCH', colour: tierColor.ELITE };
  if (match >= 85) return { label: 'STRONG MATCH', colour: color.volt };
  if (match >= 78) return { label: 'SOLID MATCH', colour: color.cyan };
  return { label: 'YOUR MATCH', colour: tierColor.SILVER };
}

/**
 * The FUT-style shoe card: tier frame → stage gradient → shoe image (counter-
 * parallax) → holographic foil (web) → identity + six-stat panel. Drag to tilt.
 */
export function ShoeCard({
  shoe,
  scores,
  match,
  context = 'catalogue',
  animateStats = false,
  statsDelay = 0,
  tiltEnabled = true,
}: {
  shoe: Shoe;
  scores: ShoeScores;
  match?: number;
  /** 'match' = personal result surfaces (match-quality framing); 'catalogue' = market tier framing */
  context?: 'match' | 'catalogue';
  animateStats?: boolean;
  statsDelay?: number;
  tiltEnabled?: boolean;
}) {
  const { rx, ry, pan } = useTilt(tiltEnabled);
  const tier = scores.tier;
  const personal = context === 'match' && match !== undefined;
  const band = personal ? matchBand(match) : undefined;
  const frame = band ? band.colour : tierColor[tier];
  const image = imageFor(shoe.slug);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${rx.value}deg` },
      { rotateY: `${ry.value}deg` },
    ],
  }));

  // the shoe floats against the tilt — the depth illusion
  const parallaxStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: ry.value * -1.6 }, { translateY: rx.value * 1.6 }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, { borderColor: frame, outlineColor: `${frame}2E` } as object, cardStyle]}>
        <LinearGradient colors={[color.surface2, '#0E1014']} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['transparent', `${frame}14`]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.topRow}>
          {match !== undefined ? (
            <View style={styles.matchWrap}>
              <Text style={[styles.matchValue, band && { color: band.colour }]}>{match}</Text>
              <Text style={[styles.matchLabel, band && { color: band.colour }]}>% MATCH</Text>
            </View>
          ) : (
            <Text style={styles.overall}>{scores.overall}</Text>
          )}
          {band ? (
            <View style={[styles.bandBadge, { borderColor: band.colour }]}>
              <Text style={[styles.bandText, { color: band.colour }]}>{band.label}</Text>
            </View>
          ) : (
            <TierBadge tier={tier} />
          )}
        </View>

        <Animated.View style={[styles.imageZone, parallaxStyle]}>
          {image ? (
            <View style={image.cut ? styles.imageFloat : styles.imageTile}>
              <Image
                source={{ uri: image.url }}
                style={image.cut ? styles.imageCut : styles.image}
                contentFit="contain"
                transition={200}
                accessibilityLabel={`${shoe.brand} ${shoe.model}`}
              />
            </View>
          ) : (
            <View style={styles.monogram}>
              <ShoeSilhouette accent={frame} secondary={color.cyan} detail={color.muted} />
              <Text style={styles.monogramModel}>
                {shoe.brand.toUpperCase()} {shoe.model.toUpperCase()}
              </Text>
            </View>
          )}
        </Animated.View>

        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {shoe.brand} {shoe.model} {shoe.version}
          </Text>
          <Text style={styles.meta}>
            {shoe.weightG} g · {shoe.dropMm} mm drop · {shoe.foamName}
            {shoe.plate !== 'none' ? ` · ${shoe.plate} plate` : ''}
          </Text>
          {shoe.athleteNotes ? (
            <Text style={styles.athlete} numberOfLines={2}>
              {shoe.athleteNotes}
            </Text>
          ) : null}
        </View>

        <View style={styles.stats}>
          <StatPanel scores={scores} animate={animateStats} startDelay={statsDelay} />
        </View>

        <HoloFoil intense={personal ? (match ?? 0) >= 92 : tier === 'ELITE'} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 18,
    borderWidth: 2,
    overflow: 'hidden',
    padding: 16,
    // dim outer ring (web honours outline*, native ignores unknown props safely via cast above)
    outlineWidth: 4,
    outlineStyle: 'solid',
  } as object,
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  matchWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  matchValue: { fontFamily: font.display, fontSize: 30, color: color.volt },
  matchLabel: { fontFamily: font.display, fontSize: 11, letterSpacing: 1, color: color.volt },
  overall: { fontFamily: font.display, fontSize: 30, color: color.ink },
  imageZone: { height: 162, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  // background-free product shots float straight on the card, rendered large
  imageFloat: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  imageCut: { width: '100%', height: '100%' },
  // Nike-PDP-style light tile for sources with baked backgrounds
  imageTile: {
    width: '96%',
    height: '100%',
    backgroundColor: '#EDEEF0',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '94%', height: '92%' },
  bandBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  bandText: { fontFamily: font.display, fontSize: 10, letterSpacing: 1.5 },
  monogram: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  monogramModel: {
    fontFamily: font.display,
    fontSize: 10,
    letterSpacing: 2.5,
    color: color.muted,
    maxWidth: 250,
    textAlign: 'center',
  },
  identity: { marginTop: 6, marginBottom: 12 },
  name: { fontFamily: font.uiMed, fontSize: 16.5, color: color.ink },
  meta: { fontFamily: font.ui, fontSize: 11.5, color: color.muted, marginTop: 2 },
  athlete: { fontFamily: font.ui, fontSize: 10.5, color: color.cyan, marginTop: 4, fontStyle: 'italic' },
  stats: { marginTop: 'auto' },
});
