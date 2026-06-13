import Svg, { Path } from 'react-native-svg';

/**
 * Line-art running-shoe silhouette — the visual fallback wherever licensed
 * product imagery doesn't exist yet. Tinted per card tier so every card reads
 * as a shoe, not a letter tile.
 *
 * Anatomically built so it actually reads as a trainer: a heel counter rising
 * to the ankle collar, a scooped collar opening with a pull tab, a laced instep
 * hump, then a long vamp down to a toe-sprung box. Parametric on real stack
 * geometry — the foam wedge thickness tracks stackHeelMm / stackFfMm, so a 36 mm
 * racer draws low and sleek while a 50 mm max-cushion draws a tall foam block.
 * The shape itself carries spec data; the catalogue becomes a wall of distinct,
 * accurate profiles, not clones.
 */
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function ShoeSilhouette({
  width = 232,
  height = 116,
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
  // foam thickness in px, scaled from real stack (heel ~28-50, ff ~18-42)
  const soleHeel = clamp(18 + (stackHeelMm - 30) * 0.95, 18, 46);
  const soleFf = clamp(11 + (stackFfMm - 22) * 0.7, 11, 32);
  const G = 108; // ground line
  const hT = G - soleHeel; // foam top at heel
  const fT = G - soleFf; //   foam top at forefoot
  const heelLift = 4; // heel bevel / crash pad
  const toeLift = 11; // toe spring

  // filled foam wedge — flat-ish ground contact, heel bevel + toe spring; this
  // is what makes a chunky shoe LOOK chunky and a racer LOOK low.
  const foam =
    `M28 ${hT} C18 ${hT + 2}, 14 ${G - 7}, 30 ${G - heelLift} L196 ${G - 2} ` +
    `C214 ${G - 3}, 228 ${G - toeLift + 3}, 236 ${fT - 3} ` +
    `C210 ${fT + 3}, 150 ${fT + 6}, 96 ${fT + 6} C60 ${fT + 4}, 42 ${hT + 6}, 28 ${hT} Z`;
  // outsole — the accent contact stroke along the bottom
  const outsole =
    `M20 ${hT + 9} C13 ${G - 5}, 16 ${G}, 32 ${G - heelLift + 1} ` +
    `L196 ${G - 1} C215 ${G - 2}, 229 ${G - toeLift + 4}, 236 ${fT - 2}`;

  // upper: heel counter → collar high point → ankle scoop → instep hump → toe
  const collarTop = hT - 42;
  const ankleLow = hT - 27;
  const instepTop = fT - 30;
  const upper =
    `M30 ${hT - 2} C21 ${hT - 22}, 30 ${collarTop}, 47 ${collarTop} ` +
    `C57 ${collarTop + 1}, 61 ${ankleLow}, 73 ${ankleLow} ` +
    `C85 ${ankleLow - 1}, 93 ${instepTop}, 110 ${instepTop} ` +
    `C152 ${instepTop + 7}, 202 ${fT - 9}, 234 ${fT - 2}`;
  // inner ankle-collar scoop (depth), heel pull tab, side panel, laces, toe seam
  const collar = `M47 ${collarTop} C58 ${collarTop + 9}, 64 ${ankleLow + 1}, 73 ${ankleLow}`;
  const tab = `M30 ${collarTop + 2} l-9 -6 l3 -9 l9 5`;
  const lx = 96;
  const ly = instepTop + 4;
  const laces = `M${lx} ${ly} l15 -6 M${lx + 9} ${ly + 6} l15 -6 M${lx + 18} ${ly + 12} l15 -6`;
  const tongue = `M73 ${ankleLow} C80 ${ankleLow - 3}, 88 ${instepTop + 2}, ${lx} ${ly - 2}`;
  const toe = `M210 ${fT - 7} C218 ${fT}, 226 ${fT + 1}, 234 ${fT - 2}`;
  const panel = `M150 ${Math.round((instepTop + fT) / 2)} C170 ${fT - 4}, 196 ${fT - 3}, 214 ${fT - 6}`;

  return (
    <Svg width={width} height={height} viewBox="0 0 248 124" fill="none">
      <Path d={foam} fill={accent} opacity={0.13} />
      <Path d={foam} stroke={accent} strokeWidth={1} opacity={0.3} />
      <Path d={outsole} stroke={accent} strokeWidth={3.5} strokeLinecap="round" />
      <Path d={panel} stroke={accent} strokeWidth={1.6} strokeLinecap="round" opacity={0.5} />
      <Path d={upper} stroke={secondary} strokeWidth={2.6} strokeLinecap="round" />
      <Path d={collar} stroke={secondary} strokeWidth={1.8} strokeLinecap="round" opacity={0.8} />
      <Path d={tongue} stroke={detail} strokeWidth={1.6} strokeLinecap="round" opacity={0.7} />
      <Path d={tab} stroke={secondary} strokeWidth={2.2} strokeLinecap="round" />
      <Path d={laces} stroke={detail} strokeWidth={2} strokeLinecap="round" />
      <Path d={toe} stroke={accent} strokeWidth={1.6} strokeLinecap="round" opacity={0.7} />
    </Svg>
  );
}
