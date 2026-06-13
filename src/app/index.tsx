import { Link, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SHOES } from '@/data/catalogue';
import { PillButton } from '@/components/ui/PillButton';
import { Screen } from '@/components/ui/Screen';
import { TopBar } from '@/components/ui/TopBar';
import { track } from '@/lib/analytics';
import { useQuizStore } from '@/state/quizStore';
import { color, font, space } from '@/theme/tokens';

export default function Landing() {
  const reset = useQuizStore((s) => s.reset);
  return (
    <Screen scroll>
      <TopBar hideBack />
      <View style={styles.hero}>
        <Image
          source={require('../../assets/hero-shoe.png')}
          style={styles.heroImage}
          contentFit="cover"
          transition={300}
          accessibilityLabel="Neon-lit running shoe"
        />
        <Text style={styles.wordmark}>SOLEMATCH</Text>
        <Text style={styles.headline}>
          Stop guessing.{'\n'}Your shoe,{' '}
          <Text style={{ color: color.volt }}>revealed.</Text>
        </Text>
        <Text style={styles.sub}>
          Nine questions about how you actually run — pace, miles, body, budget. Our engine reads
          the published science, cuts through the shop-floor myths, and deals your match as a
          holographic card built to be screenshotted. Every pick explains itself, with the study
          to prove it.
        </Text>
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

      <View style={styles.strip}>
        <Text style={styles.stripStat}>25+</Text>
        <Text style={styles.stripText}>
          peer-reviewed studies power every pick. Tap any reason and read the actual science —
          graded honestly, STRONG to EMERGING.
        </Text>
      </View>
      <View style={styles.strip}>
        <Text style={[styles.stripStat, { color: color.cyan }]}>{SHOES.length}</Text>
        <Text style={styles.stripText}>
          current road shoes, spec-verified and tiered against the live market — with prices
          compared across the retailers runners actually use.
        </Text>
      </View>
      <View style={styles.strip}>
        <Text style={[styles.stripStat, { color: color.magenta }]}>−39%</Text>
        <Text style={styles.stripText}>
          injury hazard associated with rotating differing pairs (Malisoux 2015). It is the
          single best-evidenced reason to own more than one shoe — our rotation builder is named
          for it.
        </Text>
      </View>

      <Link href="/methodology" style={styles.methodLink}>
        Read the methodology — every rule, every citation
      </Link>

      <Text style={styles.disclaimer}>
        SoleMatch optimises performance, comfort and fit. It is not medical advice and no shoe is
        proven to prevent injury. We may earn commission on retailer links. Affiliate disclosure,
        privacy and terms in the menu.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { marginTop: space(6), marginBottom: space(8) },
  heroImage: {
    width: '100%',
    height: 230,
    borderRadius: 20,
    marginBottom: space(5),
  },
  wordmark: { fontFamily: font.display, fontSize: 13, letterSpacing: 6, color: color.muted },
  headline: { fontFamily: font.display, fontSize: 40, lineHeight: 46, color: color.ink, marginTop: space(3) },
  sub: { fontFamily: font.ui, fontSize: 15, lineHeight: 22, color: color.muted, marginTop: space(4) },
  browseLink: { fontFamily: font.uiMed, fontSize: 13.5, color: color.cyan, marginTop: space(4), textAlign: 'center' },
  strip: {
    flexDirection: 'row',
    gap: space(4),
    alignItems: 'center',
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 16,
    padding: space(4),
    marginBottom: space(2.5),
  },
  stripStat: { fontFamily: font.display, fontSize: 26, color: color.volt, minWidth: 76, textAlign: 'center' },
  stripText: { flex: 1, fontFamily: font.ui, fontSize: 12.5, lineHeight: 18, color: color.muted },
  methodLink: { fontFamily: font.uiMed, fontSize: 13.5, color: color.volt, textAlign: 'center', marginTop: space(4) },
  disclaimer: {
    fontFamily: font.ui,
    fontSize: 11.5,
    lineHeight: 16,
    color: color.muted,
    textAlign: 'center',
    marginTop: space(4),
    marginBottom: space(6),
    opacity: 0.8,
  },
});
