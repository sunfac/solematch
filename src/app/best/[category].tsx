import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SHOES, isLegacy } from '@/data/catalogue';
import { CATEGORY_CONTENT, CATEGORY_ORDER } from '@/data/categories';
import { SCORED } from '@/scores/formulas';
import { TierBadge } from '@/components/ui/Badge';
import { PillButton } from '@/components/ui/PillButton';
import { Screen } from '@/components/ui/Screen';
import { TopBar } from '@/components/ui/TopBar';
import { track } from '@/lib/analytics';
import { color, focusRing, font, space, tierColor, type PressState } from '@/theme/tokens';
import type { Category } from '@/types/shoe';

const isCategory = (k: string | undefined): k is Category =>
  !!k && k in CATEGORY_CONTENT;

export default function BestCategoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const valid = isCategory(category);
  const content = valid ? CATEGORY_CONTENT[category] : undefined;

  const shoes = useMemo(
    () =>
      valid
        ? SHOES.filter(
            (s) => (s.status === 'current' || isLegacy(s.slug)) && s.category === category,
          ).sort((a, b) => SCORED.get(b.slug)!.overall - SCORED.get(a.slug)!.overall)
        : [],
    [valid, category],
  );

  useEffect(() => {
    if (valid) track('category_view', { category });
  }, [valid, category]);

  if (!content) {
    return (
      <Screen>
        <View style={styles.notFound}>
          <Text style={styles.notFoundEyebrow}>OFF THE MAP</Text>
          <Text style={styles.notFoundTitle}>No such category</Text>
          <Text style={styles.notFoundSub}>
            That isn&apos;t one of our shoe categories. Browse the full catalogue or let the engine
            match you.
          </Text>
          <View style={styles.notFoundCtas}>
            <PillButton label="Browse all shoes" onPress={() => router.replace('/browse')} />
            <PillButton label="Take the quiz" variant="ghost" onPress={() => router.replace('/quiz/1')} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll maxWidth={620}>
      <TopBar />
      <Text style={styles.eyebrow}>MEASURED. NOT MARKETED.</Text>
      <Text style={styles.title}>{content.h1}</Text>
      <Text style={styles.console}>{shoes.length} SHOES · RANKED BY RATING</Text>
      <Text style={styles.intro}>{content.intro}</Text>

      {/* cross-links to the other category pages */}
      <View style={styles.catNav}>
        {CATEGORY_ORDER.filter((k) => k !== category).map((k) => (
          <Pressable
            key={k}
            onPress={() => router.push(`/best/${k}`)}
            style={({ focused }: PressState) => [styles.catChip, focused && focusRing]}
          >
            <Text style={styles.catChipText}>{CATEGORY_CONTENT[k].label}</Text>
          </Pressable>
        ))}
      </View>

      <PillButton
        label="Get your personal match — free"
        onPress={() => router.push('/quiz/1')}
        style={{ alignSelf: 'stretch', marginTop: space(5) }}
      />

      <View style={styles.list}>
        {shoes.map((s, i) => {
          const sc = SCORED.get(s.slug)!;
          return (
            <Pressable
              key={s.slug}
              testID={`best-${s.slug}`}
              onPress={() => router.push(`/shoe/${s.slug}`)}
              style={({ focused }: PressState) => [styles.row, focused && focusRing]}
            >
              <Text style={styles.rank}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>
                  {s.brand} {s.model} {s.version}
                </Text>
                <Text style={styles.rowMeta}>
                  {s.weightG} g · {s.dropMm} mm drop · £{s.msrpGbp}
                  {isLegacy(s.slug) ? ' · ◇ PREV GEN' : ''}
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.rowScore, { color: tierColor[sc.tier] }]}>{sc.overall}</Text>
                <TierBadge tier={sc.tier} />
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable onPress={() => router.push('/browse')}>
        <Text style={styles.link}>Browse the full catalogue →</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/methodology')}>
        <Text style={styles.linkMuted}>
          How we rank — every rule and citation, no brand can buy a place →
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: font.mono, fontSize: 10, letterSpacing: 2, color: color.volt, marginBottom: 6 },
  title: { fontFamily: font.display, fontSize: 30, letterSpacing: -0.5, color: color.ink, lineHeight: 34 },
  console: { fontFamily: font.mono, fontSize: 10, letterSpacing: 0.5, color: color.muted, marginTop: space(1.5) },
  intro: { fontFamily: font.ui, fontSize: 15, lineHeight: 23, color: color.muted, marginTop: space(3) },
  catNav: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2), marginTop: space(4) },
  catChip: {
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 999,
    paddingHorizontal: space(3),
    paddingVertical: space(1.5),
  },
  catChipText: { fontFamily: font.uiMed, fontSize: 12.5, color: color.cyan },
  list: { marginTop: space(5), gap: space(2.5) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 14,
    padding: space(3.5),
  },
  rank: { fontFamily: font.display, fontSize: 20, color: color.muted, width: 26, textAlign: 'center' },
  rowName: { fontFamily: font.uiMed, fontSize: 15, color: color.ink },
  rowMeta: { fontFamily: font.ui, fontSize: 11.5, color: color.muted, marginTop: 3 },
  rowRight: { alignItems: 'flex-end', gap: 3 },
  rowScore: { fontFamily: font.display, fontSize: 20 },
  link: { fontFamily: font.uiMed, fontSize: 14, color: color.cyan, marginTop: space(5), textAlign: 'center' },
  linkMuted: {
    fontFamily: font.uiMed,
    fontSize: 13,
    color: color.volt,
    marginTop: space(3),
    marginBottom: space(6),
    textAlign: 'center',
  },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space(6), gap: space(2) },
  notFoundEyebrow: { fontFamily: font.mono, fontSize: 10, letterSpacing: 2, color: color.volt },
  notFoundTitle: { fontFamily: font.display, fontSize: 28, letterSpacing: -0.5, color: color.ink, marginTop: space(1) },
  notFoundSub: { fontFamily: font.ui, fontSize: 13.5, lineHeight: 20, color: color.muted, textAlign: 'center', maxWidth: 320, marginTop: space(1) },
  notFoundCtas: { alignSelf: 'stretch', maxWidth: 320, gap: space(2.5), marginTop: space(4) },
});
