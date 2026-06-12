import { Link, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { PillButton } from '@/components/ui/PillButton';
import { Screen } from '@/components/ui/Screen';
import { track } from '@/lib/analytics';
import { useQuizStore } from '@/state/quizStore';
import { color, font, space } from '@/theme/tokens';

export default function Landing() {
  const reset = useQuizStore((s) => s.reset);
  return (
    <Screen scroll>
      <View style={styles.hero}>
        <Text style={styles.wordmark}>SOLEMATCH</Text>
        <Text style={styles.headline}>
          Your perfect running shoe,{'\n'}
          <Text style={{ color: color.volt }}>revealed.</Text>
        </Text>
        <Text style={styles.sub}>
          Answer eleven quick questions. Our evidence-cited engine matches you to real, current
          shoes — one perfect pick or a full training rotation — and reveals them as cards worth
          screenshotting.
        </Text>
        <PillButton
          testID="cta-start"
          label="Find my shoe"
          onPress={() => {
            reset();
            track('quiz_start');
            router.push('/quiz/1');
          }}
          style={{ marginTop: space(6), alignSelf: 'stretch' }}
        />
        <Link href="/browse" style={styles.browseLink}>
          or browse the full catalogue →
        </Link>
      </View>

      <View style={styles.strip}>
        <Text style={styles.stripStat}>25+</Text>
        <Text style={styles.stripText}>
          peer-reviewed studies behind every recommendation — every reason carries its citation and
          an honest confidence badge.
        </Text>
      </View>
      <View style={styles.strip}>
        <Text style={[styles.stripStat, { color: color.cyan }]}>67</Text>
        <Text style={styles.stripText}>
          real, current road shoes in the database — specs verified, scored across six attributes,
          tiered against the live market.
        </Text>
      </View>
      <View style={styles.strip}>
        <Text style={[styles.stripStat, { color: color.magenta }]}>−39%</Text>
        <Text style={styles.stripText}>
          injury hazard associated with rotating differing pairs (Malisoux 2015) — the science our
          rotation builder is named for.
        </Text>
      </View>

      <Link href="/methodology" style={styles.methodLink}>
        Read the methodology — every rule, every citation
      </Link>

      <View style={styles.footer}>
        <Link href="/legal/disclosure" style={styles.footerLink}>Affiliate disclosure</Link>
        <Link href="/legal/privacy" style={styles.footerLink}>Privacy</Link>
        <Link href="/legal/terms" style={styles.footerLink}>Terms</Link>
        <Link href="/settings" style={styles.footerLink}>Settings</Link>
      </View>
      <Text style={styles.disclaimer}>
        SoleMatch optimises performance, comfort and fit. It is not medical advice and no shoe is
        proven to prevent injury. We may earn commission on retailer links.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { marginTop: space(10), marginBottom: space(8) },
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
  footer: { flexDirection: 'row', gap: space(4), justifyContent: 'center', marginTop: space(10), flexWrap: 'wrap' },
  footerLink: { fontFamily: font.ui, fontSize: 12.5, color: color.muted },
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
