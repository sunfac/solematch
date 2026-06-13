import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { RULES, RULESET_VERSION } from '@/data/rules';
import { ENGINE_VERSION } from '@/engine';
import { COMMUNITY_BONUS, COMMUNITY_NUDGE, FORMULA_VERSION } from '@/scores/formulas';
import { EvidenceBadge } from '@/components/ui/Badge';
import { Screen } from '@/components/ui/Screen';
import { TopBar } from '@/components/ui/TopBar';
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
      <TopBar />
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
        and the running community converge on a shoe — adds a published +{COMMUNITY_BONUS} to its
        market ranking, but only a +{COMMUNITY_NUDGE} nudge to YOUR personal match: your shoe is
        decided by fit and evidence, not by what&apos;s trending. Tiers are percentile-based
        against the current market: the top 10% of the catalogue
        is ELITE, the next 25% GOLD, the next 40% SILVER, the rest BRONZE. When two shoes are
        statistically tied for your slot (within ±0.8 points), a deterministic, profile-seeded
        tiebreak decides — different runners see different but equally right picks, and the same
        runner always gets the same answer. Match percentages cap at 96, never 100: no real
        shoe is a perfect match for a real runner, so above 90% we apply a soft compression
        and refuse to claim the last few points. And if you tell us what matters most — speed,
        comfort, value or durability — we lean your match toward it: a stated preference, bounded
        so it can decide a close call but never overrides the evidence, your budget, or a safety
        signal.
      </Text>

      <Text style={styles.sectionTitle}>What about gait analysis?</Text>
      <Text style={styles.body}>
        It&apos;s the ritual in every run shop — hop on a treadmill, film your stride, get sorted
        into &ldquo;neutral&rdquo; or &ldquo;overpronator&rdquo;. And for one thing it&apos;s
        genuinely useful: checking a shoe actually fits and feels right on your foot. What the
        evidence doesn&apos;t support is the step it&apos;s usually used for — prescribing a shoe by
        your pronation &ldquo;type&rdquo; to prevent injury. A 927-runner randomised trial
        (Nielsen 2014) and a review of 21 studies found no injury benefit from matching shoes to
        foot type. So we ask the fit questions that actually matter — width, what you&apos;ve worn,
        what&apos;s worked, any injury history — and skip the prescription the science doesn&apos;t
        back. If you love your gait analysis, use it for fit. We&apos;ll handle the rest.
      </Text>

      <Text style={styles.sectionTitle}>Critics&apos; consensus best-in-class</Text>
      <Text style={styles.body}>
        Separately from your personal match, some shoes carry a &ldquo;critics&apos; #1&rdquo; or
        &ldquo;top tier&rdquo; badge for their class. That is a market-merit signal — the
        independent reviewer and lab consensus (RunRepeat, iRunFar, Believe in the Run, The Run
        Testers and others), judged on the merits with price no object: peer reviews, lab data,
        technology and race pedigree. It is never paid placement — a brand cannot buy it. Where the
        top of a class is a genuine toss-up we say &ldquo;top tier&rdquo; and name the co-leader
        rather than fake a single winner. A scheduled job re-checks each incumbent against new
        releases, so the crown moves when the market does. Your match still comes from the
        deterministic engine and your answers — the badge tells you when your fit also happens to be
        the shoe the critics crown all-round.
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
