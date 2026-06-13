import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SHOES } from '@/data/catalogue';
import { PillButton } from '@/components/ui/PillButton';
import { Screen } from '@/components/ui/Screen';
import { TopBar } from '@/components/ui/TopBar';
import { track } from '@/lib/analytics';
import { useQuizStore } from '@/state/quizStore';
import { color, font, space } from '@/theme/tokens';

/** Recognisable flagship names for the live catalogue ticker. */
const TICKER = SHOES.filter((s) => s.status === 'current')
  .slice(0, 22)
  .map((s) => `${s.brand} ${s.model}`);

/** A continuously scrolling catalogue readout — the app feels alive and current. */
function Ticker() {
  const x = useSharedValue(0);
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const measured = e.nativeEvent.layout.width;
    if (measured && measured !== w) {
      setW(measured);
      x.value = 0;
      x.value = withRepeat(
        withTiming(-measured, { duration: measured * 22, easing: Easing.linear }),
        -1,
      );
    }
  };
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const row = (
    <View style={styles.tickerRow} onLayout={onLayout}>
      {TICKER.map((name, i) => (
        <View key={`${name}-${i}`} style={styles.tickerItem}>
          <Text style={styles.tickerDot}>◇</Text>
          <Text style={styles.tickerText}>{name}</Text>
        </View>
      ))}
    </View>
  );
  return (
    <View style={styles.tickerMask} pointerEvents="none">
      <Animated.View style={[styles.tickerTrack, style]}>
        {row}
        {/* duplicate so the loop is seamless */}
        <View style={styles.tickerRow}>
          {TICKER.map((name, i) => (
            <View key={`dup-${name}-${i}`} style={styles.tickerItem}>
              <Text style={styles.tickerDot}>◇</Text>
              <Text style={styles.tickerText}>{name}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

/** Technical corner ticks — the "instrument viewport" frame. */
function CornerTicks() {
  return (
    <>
      <View style={[styles.tick, styles.tickTL]} />
      <View style={[styles.tick, styles.tickTR]} />
      <View style={[styles.tick, styles.tickBL]} />
      <View style={[styles.tick, styles.tickBR]} />
    </>
  );
}

export default function Landing() {
  const reset = useQuizStore((s) => s.reset);
  return (
    <Screen scroll>
      <TopBar hideBack />

      {/* brand + console readout */}
      <View style={styles.brandRow}>
        <Text style={styles.wordmark}>SOLEMATCH</Text>
        <Text style={styles.consoleText}>MATCH ENGINE · v1.0</Text>
      </View>
      <View style={styles.console}>
        <Text style={styles.consoleText}>SCIENCE IN · SHOE OUT</Text>
        <Text style={styles.consoleText}>UK · GBP · DETERMINISTIC</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>MEASURED. NOT MARKETED.</Text>
        <Text style={styles.headline}>
          Stop guessing.{'\n'}Your shoe,{' '}
          <Text style={styles.headlineAccent}>revealed.</Text>
        </Text>
        <Text style={styles.sub}>
          Nine questions. The published science picks — myths and house favourites don&apos;t get a
          vote. Your match, dealt as a card with the study to prove it.
        </Text>

        {/* instrument viewport */}
        <View style={styles.viewport}>
          <LinearGradient
            colors={[`${color.volt}1A`, 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Image
            source={require('../../assets/hero-shoe.png')}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
            accessibilityLabel="Neon-lit running shoe"
          />
          <CornerTicks />
          <Text style={styles.viewportCaption}>FIG.01 — PEAK-EMOTION CARD REVEAL</Text>
        </View>

        <PillButton
          testID="cta-start"
          label="Reveal my match"
          onPress={() => {
            reset();
            track('quiz_start');
            router.push('/quiz/1');
          }}
          style={{ marginTop: space(6), alignSelf: 'stretch' }}
        />
        <Link href="/browse" style={styles.browseLink}>
          or scout the full catalogue →
        </Link>
      </View>

      <Text style={styles.tickerLabel}>IN THE ENGINE RIGHT NOW</Text>
      <Ticker />

      {/* spec readout — mono, hairline dividers */}
      <View style={styles.specRow}>
        <View style={styles.specCell}>
          <Text style={styles.specValue}>{SHOES.length}</Text>
          <Text style={styles.specKey}>ROAD SHOES{'\n'}SPEC-VERIFIED</Text>
        </View>
        <View style={styles.specDivider} />
        <View style={styles.specCell}>
          <Text style={[styles.specValue, { color: color.cyan }]}>25+</Text>
          <Text style={styles.specKey}>PEER-REVIEWED{'\n'}STUDIES CITED</Text>
        </View>
        <View style={styles.specDivider} />
        <View style={styles.specCell}>
          <Text style={[styles.specValue, { color: color.magenta }]}>−39%</Text>
          <Text style={styles.specKey}>INJURY HAZARD{'\n'}ROTATING PAIRS*</Text>
        </View>
      </View>

      {/* the trust contract — confident, not apologetic */}
      <View style={styles.trust}>
        <Text style={styles.trustHead}>Independent matching. No brand can buy a ranking.</Text>
        <Text style={styles.trustSub}>
          The engine is deterministic and published in full — manufacturer specs, peer-reviewed
          evidence and your answers. A recommendation that visibly isn&apos;t for sale is the entire
          advantage.
        </Text>
      </View>

      <Link href="/methodology" style={styles.methodLink}>
        Read the methodology — every rule, every citation →
      </Link>

      <Text style={styles.disclaimer}>
        *Malisoux 2015. SoleMatch optimises performance, comfort and fit — not medical advice, and
        no shoe is proven to prevent injury. Some retailer links are affiliate links, which never
        affect your ranking. Disclosure, privacy and terms in the menu.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space(1),
  },
  wordmark: { fontFamily: font.display, fontSize: 15, letterSpacing: 4, color: color.ink },
  console: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: color.line,
    paddingVertical: space(2),
    marginTop: space(2.5),
  },
  consoleText: { fontFamily: font.mono, fontSize: 9, letterSpacing: 0.5, color: color.muted },

  hero: { marginTop: space(7), marginBottom: space(8) },
  eyebrow: { fontFamily: font.mono, fontSize: 10, letterSpacing: 1, color: color.volt, marginBottom: space(4) },
  headline: { fontFamily: font.display, fontSize: 46, lineHeight: 50, color: color.ink, letterSpacing: -1 },
  headlineAccent: { color: color.volt },
  sub: { fontFamily: font.ui, fontSize: 15, lineHeight: 23, color: color.muted, marginTop: space(5) },

  viewport: {
    marginTop: space(6),
    height: 240,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: color.line,
    overflow: 'hidden',
    backgroundColor: '#06070A',
    justifyContent: 'center',
  },
  heroImage: { width: '100%', height: '100%', opacity: 0.96 },
  viewportCaption: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    fontFamily: font.mono,
    fontSize: 9,
    letterSpacing: 0.5,
    color: color.ink,
    opacity: 0.7,
  },
  tick: { position: 'absolute', width: 12, height: 12, borderColor: color.volt },
  tickTL: { top: 10, left: 10, borderTopWidth: 1.5, borderLeftWidth: 1.5 },
  tickTR: { top: 10, right: 10, borderTopWidth: 1.5, borderRightWidth: 1.5 },
  tickBL: { bottom: 10, left: 10, borderBottomWidth: 1.5, borderLeftWidth: 1.5 },
  tickBR: { bottom: 10, right: 10, borderBottomWidth: 1.5, borderRightWidth: 1.5 },

  browseLink: { fontFamily: font.uiMed, fontSize: 13.5, color: color.cyan, marginTop: space(4), textAlign: 'center' },

  tickerLabel: { fontFamily: font.mono, fontSize: 9, letterSpacing: 1, color: color.muted, marginBottom: space(2.5) },
  tickerMask: { height: 26, overflow: 'hidden', marginBottom: space(7) },
  tickerTrack: { flexDirection: 'row' },
  tickerRow: { flexDirection: 'row' },
  tickerItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: space(5) },
  tickerDot: { color: color.volt, fontSize: 10 },
  tickerText: { fontFamily: font.mono, fontSize: 11, color: color.muted, letterSpacing: 0.3 },

  specRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: color.line,
    paddingVertical: space(4),
  },
  specCell: { flex: 1, gap: 6 },
  specDivider: { width: 1, backgroundColor: color.line, marginHorizontal: space(3) },
  specValue: { fontFamily: font.display, fontSize: 30, color: color.volt, letterSpacing: -0.5 },
  specKey: { fontFamily: font.mono, fontSize: 8.5, letterSpacing: 0.5, lineHeight: 13, color: color.muted },

  trust: {
    marginTop: space(7),
    borderLeftWidth: 2,
    borderLeftColor: color.volt,
    paddingLeft: space(4),
  },
  trustHead: { fontFamily: font.display, fontSize: 18, color: color.ink, lineHeight: 24 },
  trustSub: { fontFamily: font.ui, fontSize: 13, lineHeight: 20, color: color.muted, marginTop: space(2) },

  methodLink: { fontFamily: font.uiMed, fontSize: 13.5, color: color.volt, marginTop: space(7) },
  disclaimer: {
    fontFamily: font.ui,
    fontSize: 11,
    lineHeight: 16,
    color: color.muted,
    marginTop: space(5),
    marginBottom: space(6),
    opacity: 0.75,
  },
});
