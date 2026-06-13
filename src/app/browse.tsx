import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SHOES } from '@/data/catalogue';
import { SCORED } from '@/scores/formulas';
import { Chip } from '@/components/quiz/inputs';
import { TierBadge } from '@/components/ui/Badge';
import { Screen } from '@/components/ui/Screen';
import { TopBar } from '@/components/ui/TopBar';
import { color, font, space, tierColor } from '@/theme/tokens';
import type { Category } from '@/types/shoe';

const CATS: Array<{ key: Category | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'race', label: 'Race day' },
  { key: 'tempo', label: 'Tempo' },
  { key: 'daily', label: 'Daily' },
  { key: 'max_cushion', label: 'Max cushion' },
  { key: 'stability', label: 'Stability' },
  { key: 'budget', label: 'Budget' },
];

export default function BrowseScreen() {
  const [cat, setCat] = useState<Category | 'all'>('all');
  const shoes = useMemo(
    () =>
      SHOES.filter((s) => s.status === 'current' && (cat === 'all' || s.category === cat)).sort(
        (a, b) => SCORED.get(b.slug)!.overall - SCORED.get(a.slug)!.overall,
      ),
    [cat],
  );

  return (
    <Screen scroll maxWidth={560}>
      <TopBar />
      <Text style={styles.title}>The catalogue</Text>

      <View style={styles.filters}>
        {CATS.map((c) => (
          <Chip key={c.key} label={c.label} selected={cat === c.key} onPress={() => setCat(c.key)} />
        ))}
      </View>

      <View style={styles.grid}>
        {shoes.map((s) => {
          const sc = SCORED.get(s.slug)!;
          return (
            <Pressable
              key={s.slug}
              testID={`browse-${s.slug}`}
              style={styles.tile}
              onPress={() => router.push(`/shoe/${s.slug}`)}
            >
              <View style={styles.tileTop}>
                <Text style={[styles.tileOverall, { color: tierColor[sc.tier] }]}>{sc.overall}</Text>
                <TierBadge tier={sc.tier} />
              </View>
              <Text style={[styles.tileMonogram, { color: tierColor[sc.tier] }]}>{s.brand.slice(0, 1)}</Text>
              <Text style={styles.tileName} numberOfLines={2}>
                {s.brand} {s.model} {s.version}
              </Text>
              <Text style={styles.tileMeta}>
                {s.weightG} g · {s.dropMm} mm · £{s.msrpGbp}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: font.display, fontSize: 24, color: color.ink, marginBottom: space(4) },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2), marginBottom: space(4) },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space(3) },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 16,
    padding: space(3.5),
  },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tileOverall: { fontFamily: font.display, fontSize: 20 },
  tileMonogram: { fontFamily: font.display, fontSize: 44, textAlign: 'center', marginVertical: space(2), opacity: 0.85 },
  tileName: { fontFamily: font.uiMed, fontSize: 13.5, color: color.ink, lineHeight: 18 },
  tileMeta: { fontFamily: font.ui, fontSize: 11.5, color: color.muted, marginTop: 3 },
});
