import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { RULES, RULESET_VERSION } from '@/data/rules';
import { ENGINE_VERSION } from '@/engine';
import { COMMUNITY_BONUS, FORMULA_VERSION } from '@/scores/formulas';
import { EvidenceBadge } from '@/components/ui/Badge';
import { Screen } from '@/components/ui/Screen';
import { color, font, space, type EvidenceLevel } from '@/theme/tokens';

const GROUPS: EvidenceLevel[] = ['STRONG', 'MODERATE', 'EMERGING', 'FIT & FEEL'];

const MYTHS = [
  'We never match shoes to foot type or pronation to "prevent injury" — refuted by an RCT of 927 novices and a review of 12 trials (n=11,240).',
  'We never tell heavier runners they need maximal cushioning — the soft-shoe benefit concentrated in lighter runners (Malisoux 2020).',
  'We never claim more cushioning means less impact — maximal shoes raised impact loading at speed (Kulmala 2018).',
  'We never promise a fixed "4% faster" from plates — the benefit is individual and shrinks at slower paces.',
  'We never recommend supershoes as everyday trainers — case reports link high-volume rigid-plate use to midfoot bone stress.',
  'We never claim any shoe prevents injury. Training load management matters more than any shoe choice.',
];

export default function MethodologyScreen() {
  return (
    <Screen scroll maxWidth={560}>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back">
        <Text style={styles.back}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Methodology</Text>
      <Text style={styles.intro}>
        Every recommendation reason cites one of the rules below, each graded by the strength of its
        evidence. Engine v{ENGINE_VERSION} · ruleset {RULESET_VERSION} · formulas v{FORMULA_VERSION}.
        The engine is deterministic — no machine learning, no black box: the same answers always
        produce the same match.
      </Text>

      <Text style={styles.sectionTitle}>How the card stats work</Text>
      <Text style={styles.body}>
        Each shoe gets six 0–99 stats computed from verified manufacturer facts: SPD (foam energy
        class, plate, weight), CSH (stack height and softness), STB (platform and guidance), LGT
        (weight, inverted), DUR (foam class durability and outsole), VAL (price against its
        category median, adjusted for durability). A shoe&apos;s overall is its best
        role-weighted expression of those six. Community consensus — when independent reviewers
        and the running community converge on a shoe — adds a published +{COMMUNITY_BONUS}, never
        more. Tiers are percentile-based against the current market: the top 10% of the catalogue
        is ELITE, the next 25% GOLD, the next 40% SILVER, the rest BRONZE. When two shoes are
        statistically tied for your slot (within ±0.8 points), a deterministic, profile-seeded
        tiebreak decides — different runners see different but equally right picks, and the same
        runner always gets the same answer.
      </Text>

      <Text style={styles.sectionTitle}>What we deliberately do NOT do</Text>
      <View style={{ gap: space(2) }}>
        {MYTHS.map((m, i) => (
          <Text key={i} style={styles.body}>
            · {m}
          </Text>
        ))}
      </View>

      {GROUPS.map((g) => (
        <View key={g}>
          <View style={styles.groupHeader}>
            <EvidenceBadge level={g} />
            <Text style={styles.groupHint}>
              {g === 'STRONG'
                ? 'multiple trials or meta-analysis'
                : g === 'MODERATE'
                  ? 'one large trial or consistent evidence'
                  : g === 'EMERGING'
                    ? 'case series or mechanism — held loosely'
                    : 'preference and consensus, not clinical evidence'}
            </Text>
          </View>
          {Object.values(RULES)
            .filter((r) => r.confidence === g)
            .map((r) => (
              <Pressable
                key={r.id}
                testID={`rule-${r.id}`}
                style={styles.rule}
                onPress={() => Linking.openURL(r.url).catch(() => {})}
              >
                <Text style={styles.ruleStatement}>{r.statement}</Text>
                <Text style={styles.ruleCitation}>{r.citation} ↗</Text>
                {r.effectNote ? <Text style={styles.ruleEffect}>{r.effectNote}</Text> : null}
              </Pressable>
            ))}
        </View>
      ))}

      <Text style={styles.disclaimer}>
        SoleMatch optimises performance, comfort and fit. It is not medical advice, and no shoe —
        or shoe-matching method — is proven to prevent running injury. Recurring pain deserves a
        physio, not a recommendation engine.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { fontFamily: font.ui, fontSize: 14, color: color.muted, marginBottom: space(3) },
  title: { fontFamily: font.display, fontSize: 26, color: color.ink },
  intro: { fontFamily: font.ui, fontSize: 13.5, lineHeight: 20, color: color.muted, marginTop: space(2) },
  sectionTitle: { fontFamily: font.display, fontSize: 16, color: color.ink, marginTop: space(6), marginBottom: space(2) },
  body: { fontFamily: font.ui, fontSize: 13, lineHeight: 19, color: color.muted },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: space(2.5), marginTop: space(6), marginBottom: space(2) },
  groupHint: { fontFamily: font.ui, fontSize: 12, color: color.muted },
  rule: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 14,
    padding: space(3.5),
    marginBottom: space(2.5),
    gap: 6,
  },
  ruleStatement: { fontFamily: font.ui, fontSize: 13.5, lineHeight: 19, color: color.ink },
  ruleCitation: { fontFamily: font.ui, fontSize: 11.5, color: color.cyan },
  ruleEffect: { fontFamily: font.ui, fontSize: 11.5, color: color.muted, fontStyle: 'italic' },
  disclaimer: {
    fontFamily: font.ui,
    fontSize: 12,
    lineHeight: 17,
    color: color.muted,
    marginVertical: space(8),
    textAlign: 'center',
    opacity: 0.85,
  },
});
