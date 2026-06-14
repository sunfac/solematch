export const color = {
  bg: '#0A0B0F',
  surface: '#14161C',
  surface2: '#1B1E26',
  ink: '#F5F6F7',
  muted: '#9AA0AC',
  line: '#2A2E38',
  volt: '#C8FF00',
  cyan: '#00E5FF',
  magenta: '#FF2DD4',
  gold: '#FFC857',
  amber: '#FFB020',
  voltDim: '#1A200A',
  cyanDim: '#06222A',
  amberDim: '#241A06',
} as const;

export const radius = { card: 18, pill: 999, input: 14 } as const;

/**
 * Keyboard focus ring for WEB. react-native-web maps outline* to CSS outline,
 * and its Pressable style callback exposes a `focused` state — spread this when
 * focused so Tab users get a visible cyan ring. Typed `object` so the web-only
 * outline props bypass RN's ViewStyle typing; native ignores them (and `focused`
 * is undefined there, so it never applies).
 */
export const focusRing: object = {
  outlineWidth: 2,
  outlineStyle: 'solid',
  outlineColor: color.cyan,
  outlineOffset: 2,
};

/**
 * Pressable style-callback state. RN's own type is just { pressed }; react-
 * native-web adds `focused`/`hovered` at runtime but not in the types, so we
 * widen it here (the extras optional) to read `focused` without a cast.
 */
export type PressState = { pressed: boolean; focused?: boolean; hovered?: boolean };

export const space = (n: number) => n * 4;

export const font = {
  ui: 'Inter_400Regular',
  uiMed: 'Inter_500Medium',
  display: 'Archivo_600SemiBold',
  /** Martian Mono — geometric technical monospace for instrument-readout labels */
  mono: 'MartianMono_500Medium',
} as const;

export type EvidenceLevel = 'STRONG' | 'MODERATE' | 'EMERGING' | 'FIT & FEEL';

export const evidenceColor: Record<EvidenceLevel, string> = {
  STRONG: color.volt,
  MODERATE: color.amber,
  EMERGING: color.muted,
  'FIT & FEEL': color.cyan,
} as const;

export const tierColor = {
  ELITE: color.magenta,
  GOLD: color.gold,
  SILVER: '#C9D1E0',
  BRONZE: '#B08D57',
} as const;
