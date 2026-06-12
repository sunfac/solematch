import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { color, font, radius, space } from '@/theme/tokens';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export function PillButton({ label, onPress, variant = 'primary', disabled, style, testID }: Props) {
  const primary = variant === 'primary';
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        primary ? styles.primary : styles.ghost,
        pressed && { transform: [{ scale: 0.98 }] },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <Text style={[styles.label, primary ? styles.labelPrimary : styles.labelGhost]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: space(3.5),
    paddingHorizontal: space(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: color.volt },
  ghost: { borderWidth: 1, borderColor: color.line, backgroundColor: 'transparent' },
  label: { fontFamily: font.uiMed, fontSize: 15 },
  labelPrimary: { color: color.bg },
  labelGhost: { color: color.ink },
});
