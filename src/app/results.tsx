import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ShoeCard } from '@/components/card/ShoeCard';
import { EvidenceBadge } from '@/components/ui/Badge';
import { PillButton } from '@/components/ui/PillButton';
import { Screen } from '@/components/ui/Screen';
import { track } from '@/lib/analytics';
import { useQuizStore } from '@/state/quizStore';
import { useResultsStore } from '@/state/resultsStore';
import { color, font, space } from '@/theme/tokens';

const ROLE_LABEL: Record<string, string> = {
  race: 'Race day',
  tempo: 'Tempo',
  daily: 'Daily',
  recovery: 'Recovery / zone 2',
};

export default function ResultsScreen() {
  const result = useResultsStore((s) => s.result);
  const resetQuiz = useQuizStore((s) => s.reset);
  const clearResults = useResultsStore((s) => s.clear);
  const [copied, setCopied] = useState(false);

  if (!result) {
    return (
      <Screen>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No match yet — take the quiz first.</Text>
          <PillButton label="Find my shoe" onPress={() => router.replace('/quiz/1')} />
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
      <Text style={styles.title}>
        {result.mode === 'rotation' ? 'Your rotation' : 'Your match'}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.fan}
      >
        {result.roles.map((r) => (
          <Pressable key={r.role} onPress={() => router.push(`/shoe/${r.pick.shoe.slug}`)}>
            <View style={styles.fanCard}>
              <ShoeCard shoe={r.pick.shoe} scores={r.pick.scores} match={r.pick.match} tiltEnabled={false} />
            </View>
          </Pressable>
        ))}
      </ScrollView>

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
            <Text style={styles.roleLabel}>{ROLE_LABEL[r.role]}</Text>
            <Text style={styles.roleShoe}>
              {r.pick.shoe.brand} {r.pick.shoe.model} {r.pick.shoe.version}
            </Text>
            <View style={styles.reasonRow}>
              <EvidenceBadge level={r.pick.reasons[0].evidence} />
              <Text style={styles.reasonText} numberOfLines={2}>
                {r.pick.reasons[0].text}
              </Text>
            </View>
          </View>
          <View style={styles.roleRight}>
            <Text style={styles.roleMatch}>{r.pick.match}%</Text>
            <Text style={styles.rolePrice}>£{r.pick.shoe.msrpGbp}</Text>
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
      <Text style={styles.disclosure}>We may earn commission on retailer links.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: font.display, fontSize: 26, color: color.ink, marginBottom: space(4) },
  fan: { gap: space(3), paddingBottom: space(2) },
  fanCard: { transform: [{ scale: 0.86 }], marginHorizontal: -20, marginVertical: -28 },
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
  roleLabel: { fontFamily: font.display, fontSize: 11, letterSpacing: 2, color: color.cyan },
  roleShoe: { fontFamily: font.uiMed, fontSize: 16, color: color.ink, marginTop: 3 },
  reasonRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: space(2) },
  reasonText: { flex: 1, fontFamily: font.ui, fontSize: 12, color: color.muted, lineHeight: 16 },
  roleRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  roleMatch: { fontFamily: font.display, fontSize: 22, color: color.volt },
  rolePrice: { fontFamily: font.ui, fontSize: 13, color: color.muted },
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
  actions: { flexDirection: 'row', gap: space(3), marginTop: space(5), justifyContent: 'center' },
  disclosure: { fontFamily: font.ui, fontSize: 11, color: color.muted, textAlign: 'center', marginVertical: space(4), opacity: 0.8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space(4) },
  emptyText: { fontFamily: font.ui, fontSize: 14, color: color.muted },
});
