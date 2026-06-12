import { StyleSheet, View } from 'react-native';
import { StatBar } from '@/components/ui/StatBar';
import type { ShoeScores } from '@/types/shoe';

const ORDER: Array<{ key: keyof Pick<ShoeScores, 'spd' | 'csh' | 'stb' | 'lgt' | 'dur' | 'val'>; label: string }> = [
  { key: 'spd', label: 'SPD' },
  { key: 'csh', label: 'CSH' },
  { key: 'stb', label: 'STB' },
  { key: 'lgt', label: 'LGT' },
  { key: 'dur', label: 'DUR' },
  { key: 'val', label: 'VAL' },
];

/** The six FIFA-style attribute bars, staggered 80 ms on reveal (spec §6.2-7). */
export function StatPanel({
  scores,
  animate = true,
  startDelay = 0,
}: {
  scores: ShoeScores;
  animate?: boolean;
  startDelay?: number;
}) {
  const top = Math.max(...ORDER.map((o) => scores[o.key]));
  return (
    <View style={styles.grid}>
      {ORDER.map((o, i) => (
        <View key={o.key} style={styles.cell}>
          <StatBar
            label={o.label}
            value={scores[o.key]}
            hot={scores[o.key] === top}
            animate={animate}
            delay={startDelay + i * 80}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 8 },
  cell: { flexBasis: '46%', flexGrow: 1 },
});
