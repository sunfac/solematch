import Svg, { Path } from 'react-native-svg';

/**
 * Line-art running-shoe silhouette — the visual fallback wherever licensed
 * product imagery doesn't exist yet. Tinted per card tier so every card reads
 * as a shoe card, not a letter tile.
 */
export function ShoeSilhouette({
  width = 220,
  height = 96,
  accent = '#C8FF00',
  secondary = '#00E5FF',
  detail = '#9AA0AC',
}: {
  width?: number;
  height?: number;
  accent?: string;
  secondary?: string;
  detail?: string;
}) {
  return (
    <Svg width={width} height={height} viewBox="0 0 210 92" fill="none">
      {/* sole — exaggerated rocker */}
      <Path
        d="M14 64 Q10 76 26 77 Q98 85 164 74 Q190 69 198 54"
        stroke={accent}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {/* midsole sidewall line */}
      <Path
        d="M22 73 Q98 81 160 71"
        stroke={accent}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.5}
      />
      {/* upper outline: heel counter → collar → instep → toe */}
      <Path
        d="M16 62 Q12 36 32 31 Q47 28 56 38 Q74 55 100 57 L152 59 Q176 60 196 52"
        stroke={secondary}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {/* collar */}
      <Path d="M33 32 Q41 43 58 45" stroke={secondary} strokeWidth={2} strokeLinecap="round" />
      {/* laces */}
      <Path
        d="M66 44 L78 38 M76 48 L88 42 M86 51 L98 45"
        stroke={detail}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
