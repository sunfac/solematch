import { StyleSheet, View } from 'react-native';
import { StatBar } from '@/components/ui/StatBar';
import type { ShoeScores } from '@/types/shoe';

const ORDER: Array<{
  key: keyof Pick<ShoeScores, 'spd' | 'csh' | 'stb' | 'lgt' | 'dur' | 'val'>;
  label: string;
  fullName: string;
}> = [
  { key: 'spd', label: 'SPD', fullName: 'Speed' },
  { key: 'csh', label: 'CSH', fullName: 'Cushioning' },
  { key: 'stb', label: 'STB', fullName: 'Stability' },
  { key: 'lgt', label: 'LGT', fullName: 'Lightness' },
  { key: 'dur', label: 'DUR', fullName: 'Durability' },
  { key: 'val', label: 'VAL', fullName: 'Value' },
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
            fullName={o.fullName}
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
