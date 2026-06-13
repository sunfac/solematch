import Svg, { Path } from 'react-native-svg';

/**
 * Line-art running-shoe silhouette — the visual fallback wherever licensed
 * product imagery doesn't exist yet. Tinted per card tier so every card reads
 * as a shoe, not a letter tile.
 *
 * Parametric on real stack geometry: the foam wedge thickness tracks
 * stackHeelMm / stackFfMm, so a 36 mm racer draws low and sleek while a 50 mm
 * max-cushion draws a tall foam block. The shape itself carries spec data —
 * the catalogue becomes a wall of distinct, accurate profiles, not clones.
 */
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function ShoeSilhouette({
  width = 220,
  height = 96,
  accent = '#C8FF00',
  secondary = '#00E5FF',
  detail = '#9AA0AC',
  stackHeelMm = 38,
  stackFfMm = 30,
}: {
  width?: number;
  height?: number;
  accent?: string;
  secondary?: string;
  detail?: string;
  stackHeelMm?: number;
  stackFfMm?: number;
}) {
  // foam thickness in px, scaled from real stack (heel range ~28-50, ff ~18-42)
  const soleHeel = clamp(9 + (stackHeelMm - 30) * 0.8, 9, 30);
  const soleFf = clamp(6 + (stackFfMm - 22) * 0.6, 6, 22);
  const GROUND = 82;
  const heelTop = GROUND - soleHeel; // midsole/upper boundary at heel
  const ffTop = GROUND - soleFf; //     "                    at forefoot
  // upper (the foot) sits a roughly constant height above the foam
  const collar = heelTop - 30;
  const instep = ffTop - 24;

  // outsole: rounded heel → ground contact → toe spring
  const outsole = `M14 ${heelTop} Q9 ${GROUND} 26 ${GROUND + 1} Q100 ${GROUND + 5} 168 ${GROUND - 1} Q190 ${GROUND - 3} 198 ${ffTop - 2}`;
  // midsole top line (foam ↔ upper boundary)
  const midTop = `M22 ${heelTop} Q100 ${ffTop + 4} 168 ${ffTop - 1}`;
  // filled foam wedge — this is what makes a chunky shoe LOOK chunky
  const foam = `M14 ${heelTop} Q9 ${GROUND} 26 ${GROUND + 1} Q100 ${GROUND + 5} 168 ${GROUND - 1} Q190 ${GROUND - 3} 198 ${ffTop - 2} L198 ${ffTop - 2} Q168 ${ffTop - 1} 100 ${ffTop + 4} Q40 ${heelTop + 2} 22 ${heelTop} Z`;
  // upper: heel counter → collar → instep → toe
  const upper = `M16 ${heelTop} Q11 ${collar + 6} 30 ${collar} Q46 ${collar - 3} 56 ${collar + 10} Q74 ${instep} 104 ${instep + 1} L154 ${ffTop - 1} Q180 ${ffTop} 198 ${ffTop - 2}`;
  // collar opening at the ankle
  const collarLine = `M30 ${collar} Q40 ${collar + 12} 58 ${collar + 13}`;
  // laces over the instep
  const lx = 64;
  const ly = instep + 2;
  const laces = `M${lx} ${ly} l12 -6 M${lx + 9} ${ly + 4} l12 -6 M${lx + 18} ${ly + 7} l12 -6`;

  return (
    <Svg width={width} height={height} viewBox="0 0 210 92" fill="none">
      <Path d={foam} fill={accent} opacity={0.12} />
      <Path d={outsole} stroke={accent} strokeWidth={3} strokeLinecap="round" />
      <Path d={midTop} stroke={accent} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
      <Path d={upper} stroke={secondary} strokeWidth={2.5} strokeLinecap="round" />
      <Path d={collarLine} stroke={secondary} strokeWidth={2} strokeLinecap="round" />
      <Path d={laces} stroke={detail} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
