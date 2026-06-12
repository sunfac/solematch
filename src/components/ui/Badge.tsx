import { StyleSheet, Text, View } from 'react-native';
import { color, evidenceColor, font, tierColor, type EvidenceLevel } from '@/theme/tokens';
import type { Tier } from '@/types/shoe';

const evidenceBg: Record<EvidenceLevel, string> = {
  STRONG: color.voltDim,
  MODERATE: color.amberDim,
  EMERGING: color.surface2,
  'FIT & FEEL': color.cyanDim,
};

export function EvidenceBadge({ level }: { level: EvidenceLevel }) {
  return (
    <View style={[styles.base, { backgroundColor: evidenceBg[level], borderColor: evidenceColor[level] }]}>
      <Text style={[styles.text, { color: evidenceColor[level] }]}>{level}</Text>
    </View>
  );
}

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <View style={[styles.base, styles.tier, { borderColor: tierColor[tier] }]}>
      <Text style={[styles.text, { color: tierColor[tier], letterSpacing: 2 }]}>{tier}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  tier: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: 'transparent' },
  text: { fontFamily: font.display, fontSize: 10, letterSpacing: 1 },
});
