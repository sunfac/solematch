import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SHOES, isLegacy } from '@/data/catalogue';
import { SCORED } from '@/scores/formulas';
import { Chip } from '@/components/quiz/inputs';
import { fallbackArt } from '@/components/card/fallbackArt';
import { imageFor } from '@/lib/affiliate';
import { ShoeSilhouette } from '@/components/card/ShoeSilhouette';
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
  { key: 'trail', label: 'Trail' },
  { key: 'budget', label: 'Budget' },
];

export default function BrowseScreen() {
  const [cat, setCat] = useState<Category | 'all'>('all');
  const shoes = useMemo(
    () =>
      SHOES.filter(
        (s) => (s.status === 'current' || isLegacy(s.slug)) && (cat === 'all' || s.category === cat),
      ).sort(
        (a, b) => SCORED.get(b.slug)!.overall - SCORED.get(a.slug)!.overall,
      ),
    [cat],
  );

  const catLabel = CATS.find((c) => c.key === cat)!.label;

  return (
    <Screen scroll maxWidth={560}>
      <TopBar />
      <Text style={styles.eyebrow}>MEASURED. NOT MARKETED.</Text>
      <Text style={styles.title}>The catalogue</Text>
      <Text style={styles.console}>
        {shoes.length} SHOES · SORTED BY RATING{cat === 'all' ? '' : ` · ${catLabel.toUpperCase()}`}
      </Text>

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
              <View style={styles.tileArt}>
                {(() => {
                  // photoreal cascade: real product photo → brand-free category
                  // art → line-art silhouette (last resort), so browse reads like
                  // the cards, not a wall of line drawings
                  const img = imageFor(s.slug);
                  const art = img ? undefined : fallbackArt(s.category);
                  if (img) return <Image source={{ uri: img.source }} style={styles.tileImg} contentFit="contain" />;
                  if (art) return <Image source={art} style={styles.tileImg} contentFit="contain" />;
                  return (
                    <ShoeSilhouette
                      width={150}
                      height={62}
                      accent={tierColor[sc.tier]}
                      secondary={color.cyan}
                      detail={color.muted}
                      stackHeelMm={s.stackHeelMm}
                      stackFfMm={s.stackFfMm}
                    />
                  );
                })()}
              </View>
              <Text style={styles.tileName} numberOfLines={2}>
                {s.brand} {s.model} {s.version}
              </Text>
              <Text style={styles.tileMeta}>
                {s.weightG} g · {s.dropMm} mm · £{s.msrpGbp}
              </Text>
              {isLegacy(s.slug) ? <Text style={styles.tilePrevGen}>◇ PREV GEN</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: font.mono, fontSize: 10, letterSpacing: 2, color: color.volt, marginBottom: 6 },
  title: { fontFamily: font.display, fontSize: 26, letterSpacing: -0.5, color: color.ink },
  console: { fontFamily: font.mono, fontSize: 10, letterSpacing: 0.5, color: color.muted, marginTop: space(1.5), marginBottom: space(4) },
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
  tileArt: { alignItems: 'center', justifyContent: 'center', marginVertical: space(2), height: 84 },
  tileImg: { width: '100%', height: '100%' },
  tileName: { fontFamily: font.uiMed, fontSize: 13.5, color: color.ink, lineHeight: 18 },
  tileMeta: { fontFamily: font.ui, fontSize: 11.5, color: color.muted, marginTop: 3 },
  tilePrevGen: { fontFamily: font.mono, fontSize: 8, letterSpacing: 1, color: color.cyan, marginTop: 3 },
});
