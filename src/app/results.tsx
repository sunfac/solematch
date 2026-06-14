import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { consensusBestForSlug } from '@/data/consensusBest';
import { runMatch } from '@/engine';
import type { MatchResult } from '@/types/match';
import { roleDrivers } from '@/scores/formulas';
import { bestOffer, buildAffiliateUrl, dropFor, offersFor, payPrice } from '@/lib/affiliate';
import { CARD_H, CARD_W, ShoeCard } from '@/components/card/ShoeCard';
import { EvidenceBadge } from '@/components/ui/Badge';
import { PillButton } from '@/components/ui/PillButton';
import { Screen } from '@/components/ui/Screen';
import { TopBar } from '@/components/ui/TopBar';
import { track } from '@/lib/analytics';
import { useQuizStore } from '@/state/quizStore';
import { useResultsStore } from '@/state/resultsStore';
import { color, font, space } from '@/theme/tokens';

const ROLE_LABEL: Record<string, string> = {
  race: 'Race day',
  tempo: 'Tempo',
  daily: 'Daily',
  recovery: 'Recovery / zone 2',
  trail: 'Trail',
};

export default function ResultsScreen() {
  const storeResult = useResultsStore((s) => s.result);
  const matchId = useResultsStore((s) => s.matchId);
  const region = useQuizStore((s) => s.region);
  const toProfile = useQuizStore((s) => s.toProfile);
  const resetQuiz = useQuizStore((s) => s.reset);
  const clearResults = useResultsStore((s) => s.clear);
  const [copied, setCopied] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  // "show me another" re-rolls among statistically-tied rotations (engine shuffle
  // seed); the displayed result is the re-roll if any, else the canonical store one
  const [shuffled, setShuffled] = useState<MatchResult | null>(null);
  const [shuffle, setShuffle] = useState(0);
  const result = shuffled ?? storeResult;
  const CARD_STEP = CARD_W * 0.78 + 14;

  // a rotation only has "another" to show when a slot is a genuine dead heat
  const hasDeadHeat =
    !!result &&
    result.mode === 'rotation' &&
    result.roles.some((r) => r.alternates.length > 0 && Math.abs(r.alternates[0].match - r.pick.match) <= 2);

  const sig = (r: MatchResult) => r.roles.map((x) => x.pick.shoe.slug).join('|');
  const showAnother = () => {
    if (!result) return;
    const base = toProfile();
    const current = sig(result);
    // find the next shuffle that yields a genuinely different (still-tied) rotation
    for (let s = shuffle + 1; s <= shuffle + 8; s++) {
      const r = runMatch({ ...base, shuffle: s });
      if (sig(r) !== current) {
        track('show_another', { shuffle: s });
        setShuffle(s);
        setShuffled(r);
        setActiveCard(0);
        return;
      }
    }
    const s = shuffle + 1;
    setShuffle(s);
    setShuffled(runMatch({ ...base, shuffle: s }));
    setActiveCard(0);
  };

  // the direct money path: cheapest offer for a pick, attributed to this match
  const buyNow = (slug: string) => {
    const offers = offersFor(slug, region);
    const best = bestOffer(offers);
    if (!best) return;
    const subId = `${matchId ?? 'results'}:${slug}:results`;
    track('offer_click', { slug, retailer: best.retailer, subId });
    Linking.openURL(buildAffiliateUrl(best, subId)).catch(() => {});
  };

  if (!result) {
    return (
      <Screen>
        <View style={styles.empty}>
          <Text style={styles.emptyEyebrow}>NO SIGNAL</Text>
          <Text style={styles.emptyTitle}>No match yet</Text>
          <Text style={styles.emptySub}>
            Nine quick questions and the engine deals your shoe — as a card, with the study to prove it.
          </Text>
          <View style={styles.emptyCtas}>
            <PillButton testID="empty-quiz" label="Find my shoe" onPress={() => router.replace('/quiz/1')} />
            <PillButton label="Browse the catalogue" variant="ghost" onPress={() => router.replace('/browse')} />
          </View>
        </View>
      </Screen>
    );
  }

  const overBudget = result.totals.costGbp > result.totals.budgetGbp;
  const copySummary = async () => {
    const lines = [
      result.mode === 'rotation' ? 'My SoleMatch rotation:' : 'My SoleMatch:',
      ...result.roles.map(
        (r) =>
          `${ROLE_LABEL[r.role]}: ${r.pick.shoe.brand} ${r.pick.shoe.model} ${r.pick.shoe.version} — ${r.pick.match}% match`,
      ),
      `Total £${result.totals.costGbp}`,
      'Matched by SoleMatch — science-backed shoe matching.',
    ];
    await Clipboard.setStringAsync(lines.join('\n'));
    track('share_copy', { roles: result.roles.length });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Screen scroll maxWidth={560}>
      <TopBar />
      <Text style={styles.title}>
        {result.mode === 'rotation' ? 'Your rotation' : 'Your match'}
      </Text>
      <Text style={styles.console}>
        {result.mode === 'rotation' ? `${result.roles.length} SHOES` : 'SINGLE PICK'} · £
        {result.totals.costGbp} / £{result.totals.budgetGbp}
        {overBudget ? ' · OVER BUDGET' : ' · IN BUDGET'}
      </Text>

      {result.roles.length > 1 ? (
        <View style={styles.fanHead}>
          <Text style={styles.fanHeadLabel}>YOUR LINEUP · {result.roles.length} SHOES</Text>
          <Text style={styles.fanHeadHint}>SWIPE →</Text>
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_STEP}
        decelerationRate="fast"
        onScroll={(e) => setActiveCard(Math.round(e.nativeEvent.contentOffset.x / CARD_STEP))}
        scrollEventThrottle={16}
        contentContainerStyle={styles.fan}
      >
        {result.roles.map((r, i) => (
          <Pressable key={r.role} onPress={() => router.push(`/shoe/${r.pick.shoe.slug}`)}>
            <View style={styles.fanCard}>
              <Text style={styles.fanRole}>
                {ROLE_LABEL[r.role]} · {i + 1}/{result.roles.length}
              </Text>
              <View style={styles.fanScale}>
                <ShoeCard shoe={r.pick.shoe} scores={r.pick.scores} match={r.pick.match} context="match" tiltEnabled={false} />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {result.roles.length > 1 ? (
        <View style={styles.dots}>
          {result.roles.map((r, i) => (
            <View key={r.role} style={[styles.dot, i === activeCard && styles.dotActive]} />
          ))}
        </View>
      ) : null}

      <View style={styles.budgetBar}>
        <Text style={styles.budgetText}>
          Total <Text style={{ color: color.ink }}>£{result.totals.costGbp}</Text> of £
          {result.totals.budgetGbp} budget
        </Text>
        <View style={styles.budgetTrack}>
          <View
            style={[
              styles.budgetFill,
              {
                width: `${Math.min(100, (result.totals.costGbp / result.totals.budgetGbp) * 100)}%`,
                backgroundColor: overBudget ? color.magenta : color.volt,
              },
            ]}
          />
        </View>
      </View>

      {result.roles.map((r) => (
        <Pressable
          key={r.role}
          testID={`role-row-${r.role}`}
          onPress={() => router.push(`/shoe/${r.pick.shoe.slug}`)}
          style={styles.roleRow}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.roleLabelRow}>
              <Text style={styles.roleLabel}>{ROLE_LABEL[r.role]}</Text>
              {(() => {
                const cb = consensusBestForSlug(r.pick.shoe.slug);
                return cb ? (
                  <Text style={styles.criticsChip}>
                    {cb.confidence === 'clear' ? "CRITICS' #1" : "CRITICS' TOP TIER"}
                  </Text>
                ) : null;
              })()}
            </View>
            <Text style={styles.roleShoe}>
              {r.pick.shoe.brand} {r.pick.shoe.model} {r.pick.shoe.version}
            </Text>
            <View style={styles.reasonRow}>
              <EvidenceBadge level={r.pick.reasons[0].evidence} />
              <Text style={styles.reasonText} numberOfLines={2}>
                {r.pick.reasons[0].text}
              </Text>
            </View>
            {r.edge ? (
              <Text style={styles.edge} numberOfLines={2}>
                {r.edge}
              </Text>
            ) : null}
            <Text style={styles.drivers} numberOfLines={1}>
              WEIGHTS · {roleDrivers(r.role).map((d) => `${d.code} ${d.pct}%`).join(' · ')}
            </Text>
            {r.alternates.length > 0 ? (
              <View style={styles.altRow}>
                <Text style={styles.altLabel}>
                  {Math.abs(r.alternates[0].match - r.pick.match) <= 2
                    ? 'DEAD HEAT · SWAP ON FIT & FEEL'
                    : 'ALSO STRONG'}
                </Text>
                {r.alternates.map((alt) => (
                  <Pressable key={alt.shoe.slug} onPress={() => router.push(`/shoe/${alt.shoe.slug}`)}>
                    <Text style={styles.altChip}>
                      {alt.shoe.brand} {alt.shoe.model} {alt.match}% · £{alt.shoe.msrpGbp}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
          <View style={styles.roleRight}>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.roleMatch}>{r.pick.match}%</Text>
              <Text style={styles.roleMatchLabel}>MATCH</Text>
            </View>
            <Pressable onPress={() => buyNow(r.pick.shoe.slug)} accessibilityRole="button">
              {(() => {
                const drop = dropFor(offersFor(r.pick.shoe.slug, region));
                if (drop) {
                  return (
                    <View style={styles.priceStack}>
                      <Text style={styles.priceWas}>was £{drop.rrpGbp}</Text>
                      <Text style={styles.buyLink}>£{drop.streetGbp} →</Text>
                      <Text style={styles.priceDropTag}>-{drop.pctOff}%</Text>
                    </View>
                  );
                }
                const best = bestOffer(offersFor(r.pick.shoe.slug, region));
                const price = best ? payPrice(best) : r.pick.shoe.msrpGbp;
                return <Text style={styles.buyLink}>£{price} →</Text>;
              })()}
            </Pressable>
          </View>
        </Pressable>
      ))}

      {result.notes.length > 0 ? (
        <View style={styles.notes}>
          <Text style={styles.notesTitle}>Worth knowing</Text>
          {result.notes.map((n, i) => (
            <Text key={i} style={styles.note}>
              · {n}
            </Text>
          ))}
        </View>
      ) : null}

      {hasDeadHeat ? (
        <View style={styles.shuffleWrap}>
          <PillButton testID="show-another" label="↻ Show me another" variant="ghost" onPress={showAnother} />
          <Text style={styles.shuffleHint}>Among your dead-heat picks — same match quality, a different feel</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <PillButton label={copied ? 'Copied ✓' : 'Copy my result'} variant="ghost" onPress={copySummary} />
        <PillButton
          label="Start over"
          variant="ghost"
          onPress={() => {
            resetQuiz();
            clearResults();
            router.replace('/');
          }}
        />
      </View>
      <Text style={styles.disclosure}>Independent matching · some retailer links are affiliate links.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: font.display, fontSize: 26, letterSpacing: -0.5, color: color.ink },
  console: { fontFamily: font.mono, fontSize: 10, letterSpacing: 0.5, color: color.muted, marginTop: space(1.5), marginBottom: space(4) },
  fanHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: space(2) },
  fanHeadLabel: { fontFamily: font.mono, fontSize: 10, letterSpacing: 1, color: color.muted },
  fanHeadHint: { fontFamily: font.mono, fontSize: 10, letterSpacing: 1.5, color: color.cyan },
  fan: { gap: 14, paddingBottom: space(2), paddingRight: space(8) },
  fanCard: { width: CARD_W * 0.78, height: CARD_H * 0.78 + 18, overflow: 'visible' },
  fanRole: { fontFamily: font.mono, fontSize: 9, letterSpacing: 1, color: color.cyan, marginBottom: 5 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: space(2.5) },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.line },
  dotActive: { backgroundColor: color.volt, width: 18 },
  fanScale: {
    width: CARD_W,
    height: CARD_H,
    transform: [{ scale: 0.78 }],
    transformOrigin: 'top left',
  } as object,
  budgetBar: { marginTop: space(4), gap: 6 },
  budgetText: { fontFamily: font.ui, fontSize: 13, color: color.muted },
  budgetTrack: { height: 6, borderRadius: 3, backgroundColor: color.surface2, overflow: 'hidden' },
  budgetFill: { height: 6, borderRadius: 3 },
  roleRow: {
    flexDirection: 'row',
    gap: space(3),
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 16,
    padding: space(4),
    marginTop: space(3),
  },
  roleLabelRow: { flexDirection: 'row', alignItems: 'center', gap: space(2), flexWrap: 'wrap' },
  roleLabel: { fontFamily: font.mono, fontSize: 10, letterSpacing: 1, color: color.cyan },
  criticsChip: {
    fontFamily: font.mono,
    fontSize: 8.5,
    letterSpacing: 1,
    color: color.volt,
    borderWidth: 1,
    borderColor: color.volt,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    overflow: 'hidden',
  },
  roleShoe: { fontFamily: font.uiMed, fontSize: 16, color: color.ink, marginTop: 4 },
  reasonRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: space(2) },
  reasonText: { flex: 1, fontFamily: font.ui, fontSize: 12, color: color.muted, lineHeight: 16 },
  edge: { fontFamily: font.ui, fontSize: 11.5, color: color.cyan, marginTop: space(1.5), lineHeight: 15 },
  drivers: { fontFamily: font.mono, fontSize: 9, letterSpacing: 0.5, color: color.muted, marginTop: space(1.5) },
  altRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space(2), marginTop: space(2.5) },
  altLabel: { fontFamily: font.mono, fontSize: 9, letterSpacing: 0.5, color: color.muted, width: '100%' },
  altChip: {
    fontFamily: font.uiMed,
    fontSize: 11,
    color: color.ink,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  roleRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  roleMatchLabel: { fontFamily: font.mono, fontSize: 8, letterSpacing: 1, color: color.muted, marginTop: -2 },
  roleMatch: { fontFamily: font.display, fontSize: 22, color: color.volt },
  buyLink: { fontFamily: font.uiMed, fontSize: 13, color: color.cyan },
  priceStack: { alignItems: 'flex-end' },
  priceWas: {
    fontFamily: font.ui,
    fontSize: 10,
    color: color.muted,
    textDecorationLine: 'line-through',
  },
  priceDropTag: {
    fontFamily: font.uiMed,
    fontSize: 10,
    color: color.volt,
    marginTop: 1,
    letterSpacing: 0.5,
  },
  notes: {
    marginTop: space(5),
    backgroundColor: color.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.line,
    padding: space(4),
    gap: space(2),
  },
  notesTitle: { fontFamily: font.uiMed, fontSize: 13, color: color.ink },
  note: { fontFamily: font.ui, fontSize: 12.5, lineHeight: 18, color: color.muted },
  shuffleWrap: { alignItems: 'center', gap: space(2), marginTop: space(5) },
  shuffleHint: { fontFamily: font.mono, fontSize: 9, letterSpacing: 0.5, color: color.muted, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: space(3), marginTop: space(5), justifyContent: 'center' },
  disclosure: { fontFamily: font.ui, fontSize: 11, color: color.muted, textAlign: 'center', marginVertical: space(4), opacity: 0.8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space(6), gap: space(2) },
  emptyEyebrow: { fontFamily: font.mono, fontSize: 10, letterSpacing: 2, color: color.volt },
  emptyTitle: { fontFamily: font.display, fontSize: 28, letterSpacing: -0.5, color: color.ink, marginTop: space(1) },
  emptySub: { fontFamily: font.ui, fontSize: 13.5, lineHeight: 20, color: color.muted, textAlign: 'center', maxWidth: 320, marginTop: space(1) },
  emptyCtas: { alignSelf: 'stretch', maxWidth: 320, gap: space(2.5), marginTop: space(4) },
});
