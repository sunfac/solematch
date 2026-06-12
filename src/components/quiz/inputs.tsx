import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { color, font, radius, space } from '@/theme/tokens';

export function Chip({
  label,
  selected,
  onPress,
  tone = color.volt,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  tone?: string;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && { borderColor: tone, backgroundColor: color.surface2 }]}
    >
      <Text style={[styles.chipText, selected && { color: tone }]}>{label}</Text>
    </Pressable>
  );
}

export function ChoiceGrid<T extends string>({
  options,
  value,
  onSelect,
}: {
  options: Array<{ key: T; label: string; hint?: string }>;
  value?: T;
  onSelect: (key: T) => void;
}) {
  return (
    <View style={styles.grid}>
      {options.map((o) => {
        const selected = value === o.key;
        return (
          <Pressable
            key={o.key}
            testID={`choice-${o.key}`}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onSelect(o.key)}
            style={[styles.card, selected && styles.cardSelected]}
          >
            <Text style={[styles.cardLabel, selected && { color: color.volt }]}>{o.label}</Text>
            {o.hint ? <Text style={styles.cardHint}>{o.hint}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function NumberField({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  suffix,
  testID,
}: {
  value?: number;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  testID?: string;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const current = value ?? 0;
  return (
    <View style={styles.numberRow}>
      <Pressable
        accessibilityLabel="decrease"
        onPress={() => onChange(clamp(Math.round((current - step) * 10) / 10))}
        style={styles.stepBtn}
      >
        <Text style={styles.stepBtnText}>−</Text>
      </Pressable>
      <View style={styles.numberBox}>
        <TextInput
          testID={testID}
          style={styles.numberInput}
          keyboardType="numeric"
          inputMode="numeric"
          value={value === undefined ? '' : String(value)}
          onChangeText={(t) => {
            const n = Number(t.replace(/[^0-9.]/g, ''));
            if (!Number.isNaN(n)) onChange(clamp(n));
          }}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
      <Pressable
        accessibilityLabel="increase"
        onPress={() => onChange(clamp(Math.round((current + step) * 10) / 10))}
        style={styles.stepBtn}
      >
        <Text style={styles.stepBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

/** mm:ss entry (pace) or h:mm:ss (race time) returning total seconds. */
export function TimeField({
  seconds,
  onChange,
  hours = false,
  testID,
}: {
  seconds?: number;
  onChange: (totalSec: number) => void;
  hours?: boolean;
  testID?: string;
}) {
  const total = seconds ?? 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.round(total % 60);
  const update = (nh: number, nm: number, ns: number) => onChange(nh * 3600 + nm * 60 + ns);
  const box = (val: number, set: (n: number) => void, max: number, label: string, id?: string) => (
    <View style={styles.timeBoxWrap}>
      <TextInput
        testID={id}
        style={styles.timeBox}
        keyboardType="numeric"
        inputMode="numeric"
        value={String(val)}
        onChangeText={(t) => {
          const n = Number(t.replace(/[^0-9]/g, ''));
          if (!Number.isNaN(n)) set(Math.min(max, n));
        }}
      />
      <Text style={styles.timeLabel}>{label}</Text>
    </View>
  );
  return (
    <View style={styles.timeRow}>
      {hours ? box(h, (n) => update(n, m, s), 23, 'hrs', testID ? `${testID}-h` : undefined) : null}
      {box(m, (n) => update(h, n, s), 59, 'min', testID ? `${testID}-m` : undefined)}
      {box(s, (n) => update(h, m, n), 59, 'sec', testID ? `${testID}-s` : undefined)}
    </View>
  );
}

export function ToggleRow({
  label,
  hint,
  value,
  onToggle,
  testID,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onToggle: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={onToggle}
      style={styles.toggleRow}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {hint ? <Text style={styles.cardHint}>{hint}</Text> : null}
      </View>
      <View style={[styles.switch, value && { backgroundColor: color.voltDim, borderColor: color.volt }]}>
        <View style={[styles.knob, value && { backgroundColor: color.volt, alignSelf: 'flex-end' }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.pill,
    paddingHorizontal: space(3.5),
    paddingVertical: space(2),
  },
  chipText: { fontFamily: font.uiMed, fontSize: 13, color: color.muted },
  grid: { gap: space(2.5) },
  card: {
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
    borderRadius: radius.input,
    padding: space(4),
  },
  cardSelected: { borderColor: color.volt, backgroundColor: color.surface2 },
  cardLabel: { fontFamily: font.uiMed, fontSize: 16, color: color.ink },
  cardHint: { fontFamily: font.ui, fontSize: 12.5, color: color.muted, marginTop: 3, lineHeight: 17 },
  numberRow: { flexDirection: 'row', alignItems: 'center', gap: space(3), justifyContent: 'center' },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { color: color.ink, fontSize: 20, fontFamily: font.uiMed },
  numberBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    backgroundColor: color.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: space(4),
    paddingVertical: space(2.5),
    minWidth: 120,
    justifyContent: 'center',
  },
  numberInput: {
    fontFamily: font.display,
    fontSize: 28,
    color: color.ink,
    minWidth: 60,
    textAlign: 'center',
    padding: 0,
  },
  suffix: { fontFamily: font.ui, fontSize: 14, color: color.muted },
  timeRow: { flexDirection: 'row', gap: space(2.5), justifyContent: 'center' },
  timeBoxWrap: { alignItems: 'center', gap: 4 },
  timeBox: {
    fontFamily: font.display,
    fontSize: 28,
    color: color.ink,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.input,
    width: 76,
    textAlign: 'center',
    paddingVertical: space(2.5),
  },
  timeLabel: { fontFamily: font.ui, fontSize: 11, color: color.muted },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.input,
    padding: space(3.5),
  },
  toggleLabel: { fontFamily: font.uiMed, fontSize: 14.5, color: color.ink },
  switch: {
    width: 46,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface2,
    padding: 3,
  },
  knob: { width: 18, height: 18, borderRadius: 9, backgroundColor: color.muted },
});
