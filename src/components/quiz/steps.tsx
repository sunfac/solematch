import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { BRANDS, SHOES, bySlug } from '@/data/catalogue';
import { kgFromLb, kmFromMi, lbFromKg, miFromKm, paceSecPerKmFromMinPerMile, paceSecPerMileFromSecPerKm } from '@/engine/units';
import { planRoles } from '@/engine/rolePlan';
import { useQuizStore, type QuizDraft } from '@/state/quizStore';
import { color, font, space } from '@/theme/tokens';
import { Chip, ChoiceGrid, NumberField, TimeField, ToggleRow } from './inputs';

export interface StepProps {
  /** call after a terminal single choice — the frame advances automatically */
  onAutoNext: () => void;
}

export interface QuizStep {
  id: string;
  title: string;
  subtitle?: string;
  /** show the metric/imperial toggle in the header */
  units?: boolean;
  optional?: boolean;
  valid: (d: QuizDraft) => boolean;
  Component: (props: StepProps) => React.JSX.Element;
}

const sub = (t: string) => <Text style={styles.note}>{t}</Text>;

function StepMode({ onAutoNext }: StepProps) {
  const { mode, set } = useQuizStore();
  return (
    <ChoiceGrid
      value={mode}
      onSelect={(k) => {
        set('mode', k);
        onAutoNext();
      }}
      options={[
        { key: 'single', label: 'One perfect shoe', hint: 'The single best match for how you run' },
        { key: 'rotation', label: 'A rotation', hint: 'Race / tempo / daily / recovery — rotating differing pairs was associated with ~39% lower injury hazard (Malisoux 2015)' },
      ]}
    />
  );
}

function StepAbout(_: StepProps) {
  const { sex, age, weightKg, units, set } = useQuizStore();
  const display =
    weightKg === undefined ? undefined : units === 'metric' ? Math.round(weightKg) : Math.round(lbFromKg(weightKg));
  return (
    <View style={{ gap: space(3) }}>
      <Text style={styles.fieldLabel}>How do you identify?</Text>
      <View style={styles.chipWrap}>
        {(
          [
            { key: 'F', label: 'Female' },
            { key: 'M', label: 'Male' },
            { key: 'NA', label: 'Prefer not to say' },
          ] as const
        ).map((o) => (
          <Chip
            key={o.key}
            testID={`sex-${o.key}`}
            label={o.label}
            selected={sex === o.key}
            onPress={() => set('sex', o.key)}
          />
        ))}
      </View>
      {sub('Used only to surface women-specific fits — never for performance claims; that research is genuinely unsettled and we say so.')}
      <Text style={styles.fieldLabel}>Age</Text>
      <NumberField testID="age-input" value={age} onChange={(n) => set('age', n)} min={13} max={95} suffix="years" />
      <Text style={styles.fieldLabel}>Weight</Text>
      <NumberField
        testID="weight-input"
        value={display}
        onChange={(n) => set('weightKg', units === 'metric' ? n : kgFromLb(n))}
        min={units === 'metric' ? 35 : 77}
        max={units === 'metric' ? 180 : 400}
        suffix={units === 'metric' ? 'kg' : 'lb'}
      />
      {units === 'imperial' && weightKg
        ? sub(`≈ ${Math.floor(lbFromKg(weightKg) / 14)} st ${Math.round(lbFromKg(weightKg) % 14)} lb`)
        : sub('Body mass tunes durability picks — the evidence says it does NOT mean you need maximal cushioning.')}
    </View>
  );
}

const VOLUME_BANDS = [
  { km: 10, metric: 'Under 15 km', imperial: 'Under 10 mi' },
  { km: 20, metric: '15–25 km', imperial: '10–15 mi' },
  { km: 32, metric: '25–40 km', imperial: '15–25 mi' },
  { km: 48, metric: '40–55 km', imperial: '25–35 mi' },
  { km: 62, metric: '55–70 km', imperial: '35–45 mi' },
  { km: 80, metric: '70 km +', imperial: '45 mi +' },
];

function StepVolume({ onAutoNext }: StepProps) {
  const { weeklyKm, units, set } = useQuizStore();
  return (
    <View style={styles.chipWrap}>
      {VOLUME_BANDS.map((b) => (
        <Chip
          key={b.km}
          testID={`volume-${b.km}`}
          label={units === 'metric' ? b.metric : b.imperial}
          selected={weeklyKm === b.km}
          onPress={() => {
            set('weeklyKm', b.km);
            onAutoNext();
          }}
        />
      ))}
    </View>
  );
}

function StepPace({ onAutoNext }: StepProps) {
  const { paceKind, raceDistanceKm, raceTimeSec, easyPaceSecPerKm, units, set } = useQuizStore();
  return (
    <View style={{ gap: space(4) }}>
      <ChoiceGrid
        value={paceKind}
        onSelect={(k) => {
          set('paceKind', k);
          if (k === 'unsure') onAutoNext();
        }}
        options={[
          { key: 'race', label: 'I have a recent race result', hint: 'Most accurate — we project your marathon-equivalent pace' },
          { key: 'easy', label: 'I know my easy pace', hint: 'A solid signal' },
          { key: 'unsure', label: 'Not sure', hint: 'No problem — we use conservative defaults' },
        ]}
      />
      {paceKind === 'race' ? (
        <View style={{ gap: space(3) }}>
          <View style={styles.chipWrap}>
            {([5, 10, 21.1, 42.2] as const).map((d) => (
              <Chip
                key={d}
                label={d === 5 ? '5K' : d === 10 ? '10K' : d === 21.1 ? 'Half' : 'Marathon'}
                selected={raceDistanceKm === d}
                onPress={() => set('raceDistanceKm', d)}
              />
            ))}
          </View>
          <TimeField testID="race-time" hours seconds={raceTimeSec} onChange={(n) => set('raceTimeSec', n)} />
        </View>
      ) : null}
      {paceKind === 'easy' ? (
        <View style={{ gap: space(2) }}>
          <TimeField
            testID="easy-pace"
            seconds={
              easyPaceSecPerKm === undefined
                ? undefined
                : Math.round(units === 'metric' ? easyPaceSecPerKm : paceSecPerMileFromSecPerKm(easyPaceSecPerKm))
            }
            onChange={(n) =>
              set('easyPaceSecPerKm', units === 'metric' ? n : paceSecPerKmFromMinPerMile(0, n))
            }
          />
          {sub(`Your typical relaxed pace, per ${units === 'metric' ? 'kilometre' : 'mile'}.`)}
        </View>
      ) : null}
    </View>
  );
}

function StepIntent(_: StepProps) {
  const store = useQuizStore();
  const { mode, primaryIntent, targetingRace, raceDistanceTargetKm, set } = store;
  const rolesPreview = mode === 'rotation' ? planRoles(store.toProfile()) : null;
  return (
    <View style={{ gap: space(4) }}>
      {mode === 'single' ? (
        <ChoiceGrid
          value={primaryIntent}
          onSelect={(k) => set('primaryIntent', k)}
          options={[
            { key: 'everything', label: 'One shoe for everything', hint: 'Versatile daily that can pick up the pace' },
            { key: 'daily', label: 'Daily training' },
            { key: 'tempo', label: 'Tempo & workouts' },
            { key: 'race', label: 'Race day' },
            { key: 'recovery', label: 'Recovery / zone 2' },
          ]}
        />
      ) : null}
      <ToggleRow
        testID="targeting-race"
        label="Training for a race?"
        hint="Adds a race-day slot and tunes plate recommendations to the distance"
        value={!!targetingRace}
        onToggle={() => set('targetingRace', !targetingRace)}
      />
      {targetingRace ? (
        <View style={styles.chipWrap}>
          {([5, 10, 21.1, 42.2] as const).map((d) => (
            <Chip
              key={d}
              testID={`target-${d}`}
              label={d === 5 ? '5K' : d === 10 ? '10K' : d === 21.1 ? 'Half' : 'Marathon'}
              selected={raceDistanceTargetKm === d}
              onPress={() => set('raceDistanceTargetKm', d)}
            />
          ))}
        </View>
      ) : null}
      {rolesPreview ? sub(`Your rotation plan: ${rolesPreview.join(' · ')} (sized to your weekly volume)`) : null}
    </View>
  );
}

function StepExperience(_: StepProps) {
  const { experience, currentShoeSlug, currentShoeVerdict, set } = useQuizStore();
  const [query, setQuery] = useState('');
  const matches =
    query.length >= 2
      ? SHOES.filter((s) => `${s.brand} ${s.model} ${s.version}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
      : [];
  const current = currentShoeSlug ? bySlug.get(currentShoeSlug) : undefined;
  return (
    <View style={{ gap: space(4) }}>
      <ChoiceGrid
        value={experience}
        onSelect={(k) => set('experience', k)}
        options={[
          { key: 'new', label: 'New or returning', hint: 'Running consistently for under 6 months' },
          { key: 'regular', label: 'Regular runner' },
          { key: 'high', label: 'High mileage', hint: '50 km+ most weeks' },
        ]}
      />
      <View style={{ gap: space(2) }}>
        <Text style={styles.fieldLabel}>Current shoe (optional)</Text>
        <TextInput
          style={styles.search}
          placeholder="Search e.g. Pegasus"
          placeholderTextColor={color.muted}
          value={current ? `${current.brand} ${current.model} ${current.version}` : query}
          onChangeText={(t) => {
            set('currentShoeSlug', undefined);
            setQuery(t);
          }}
        />
        {matches.length > 0 && !current ? (
          <View style={styles.chipWrap}>
            {matches.map((s) => (
              <Chip
                key={s.slug}
                label={`${s.brand} ${s.model} ${s.version}`}
                selected={false}
                onPress={() => {
                  set('currentShoeSlug', s.slug);
                  setQuery('');
                }}
              />
            ))}
          </View>
        ) : null}
        {current ? (
          <View style={styles.chipWrap}>
            {(['love', 'meh', 'hate'] as const).map((v) => (
              <Chip
                key={v}
                label={v === 'love' ? 'Love it' : v === 'meh' ? "It's fine" : 'Not for me'}
                selected={currentShoeVerdict === v}
                onPress={() => set('currentShoeVerdict', v)}
              />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function StepFit(_: StepProps) {
  const { wide, roomyToe, wantsStability, brandLoves, brandBlocks, set, toggleBrand } = useQuizStore();
  return (
    <View style={{ gap: space(3) }}>
      <ToggleRow label="I need a wide fit" value={wide} onToggle={() => set('wide', !wide)} />
      <ToggleRow label="I like a roomy toe box" value={roomyToe} onToggle={() => set('roomyToe', !roomyToe)} />
      <ToggleRow
        label="I prefer a supported, stable feel"
        hint="Pure preference — matching shoes to foot type doesn't prevent injury (Nielsen 2014), so we never prescribe it"
        value={wantsStability}
        onToggle={() => set('wantsStability', !wantsStability)}
      />
      <Text style={styles.fieldLabel}>Brands you love</Text>
      <View style={styles.chipWrap}>
        {BRANDS.map((b) => (
          <Chip key={b} label={b} selected={brandLoves.includes(b)} onPress={() => toggleBrand('brandLoves', b)} />
        ))}
      </View>
      <Text style={styles.fieldLabel}>Brands to avoid</Text>
      <View style={styles.chipWrap}>
        {BRANDS.map((b) => (
          <Chip key={b} label={b} selected={brandBlocks.includes(b)} tone={color.magenta} onPress={() => toggleBrand('brandBlocks', b)} />
        ))}
      </View>
    </View>
  );
}

function StepBudget(_: StepProps) {
  const { budgetType, budgetAmountGbp, budgetStretch, mode, set } = useQuizStore();
  return (
    <View style={{ gap: space(4) }}>
      {mode === 'rotation' ? (
        <ChoiceGrid
          value={budgetType}
          onSelect={(k) => set('budgetType', k)}
          options={[
            { key: 'total', label: 'Total for the rotation' },
            { key: 'perShoe', label: 'Per shoe' },
          ]}
        />
      ) : null}
      <NumberField
        testID="budget-input"
        value={budgetAmountGbp}
        onChange={(n) => set('budgetAmountGbp', n)}
        step={10}
        min={50}
        max={2000}
        suffix="GBP"
      />
      <ToggleRow
        testID="stretch-toggle"
        label="Show me a stretch pick"
        hint="Allow one option up to 10% over budget if it clearly out-matches"
        value={budgetStretch}
        onToggle={() => set('budgetStretch', !budgetStretch)}
      />
    </View>
  );
}

function StepInjury(_: StepProps) {
  const { injuryConsent, injuryFlags, set, toggleFlag } = useQuizStore();
  return (
    <View style={{ gap: space(3) }}>
      {sub('Optional. This is health-related data, so we only use it with your explicit consent, it lives only on your device for this session, and starting over erases it. It makes recommendations more conservative — it is not medical advice.')}
      <ToggleRow
        testID="injury-consent"
        label="I consent to using injury history for this match"
        value={injuryConsent}
        onToggle={() => set('injuryConsent', !injuryConsent)}
      />
      {injuryConsent ? (
        <View style={styles.chipWrap}>
          <Chip label="Bone stress / stress fracture" selected={injuryFlags.includes('bone_stress')} onPress={() => toggleFlag('bone_stress')} />
          <Chip label="Calf / Achilles" selected={injuryFlags.includes('achilles_calf')} onPress={() => toggleFlag('achilles_calf')} />
          <Chip label="Knee" selected={injuryFlags.includes('knee')} onPress={() => toggleFlag('knee')} />
          <Chip label="Plantar fascia" selected={injuryFlags.includes('plantar')} onPress={() => toggleFlag('plantar')} />
        </View>
      ) : null}
      {sub('Recurring pain deserves a physio, not a shoe recommendation.')}
    </View>
  );
}

function StepPriority({ onAutoNext }: StepProps) {
  const { priority, set } = useQuizStore();
  return (
    <ChoiceGrid
      value={priority}
      onSelect={(k) => {
        set('priority', k);
        onAutoNext();
      }}
      options={[
        { key: 'comfort', label: 'Comfort', hint: 'Plush, protective cushioning leads the pick' },
        { key: 'speed', label: 'Speed', hint: 'Light, fast, responsive — pace over plush' },
        { key: 'value', label: 'Value', hint: 'The strongest shoe for the money' },
        { key: 'durability', label: 'Durability', hint: 'Holds its ride over high mileage' },
      ]}
    />
  );
}

function StepTerrain({ onAutoNext }: StepProps) {
  const { terrain, set } = useQuizStore();
  return (
    <ChoiceGrid
      value={terrain}
      onSelect={(k) => {
        set('terrain', k);
        onAutoNext();
      }}
      options={[
        { key: 'road', label: 'Roads & pavement', hint: 'Tarmac, treadmill, park paths' },
        { key: 'road-trail', label: 'Mostly road, some trail', hint: 'Door-to-trail — light gravel & dirt' },
        { key: 'trail', label: 'Regular trail', hint: 'Off-road: dirt, roots, moderate terrain' },
        { key: 'technical', label: 'Technical / mountain', hint: 'Rock, mud, steep, fell — grip is everything' },
      ]}
    />
  );
}

export const STEPS: QuizStep[] = [
  { id: 'mode', title: 'What are we matching today?', valid: (d) => !!d.mode, Component: StepMode },
  {
    id: 'about',
    title: 'About you',
    units: true,
    valid: (d) => !!d.sex && !!d.age && d.age >= 13 && !!d.weightKg,
    Component: StepAbout,
  },
  { id: 'volume', title: 'Weekly running volume', units: true, valid: (d) => !!d.weeklyKm, Component: StepVolume },
  {
    id: 'pace',
    title: 'How fast do you run?',
    units: true,
    valid: (d) =>
      d.paceKind === 'unsure' ||
      (d.paceKind === 'race' && !!d.raceDistanceKm && !!d.raceTimeSec && d.raceTimeSec > 300) ||
      (d.paceKind === 'easy' && !!d.easyPaceSecPerKm && d.easyPaceSecPerKm > 120),
    Component: StepPace,
  },
  {
    id: 'intent',
    title: 'What are you training for?',
    valid: (d) =>
      (d.mode === 'rotation' || !!d.primaryIntent) && (!d.targetingRace || !!d.raceDistanceTargetKm),
    Component: StepIntent,
  },
  { id: 'experience', title: 'Your running background', valid: (d) => !!d.experience, Component: StepExperience },
  { id: 'fit', title: 'Fit & preferences', optional: true, valid: () => true, Component: StepFit },
  {
    id: 'priority',
    title: 'What matters most to you?',
    subtitle: "We'll lean your pick toward it. Skip for a balanced match.",
    optional: true,
    valid: () => true,
    Component: StepPriority,
  },
  {
    id: 'terrain',
    title: 'Where do you run?',
    subtitle: 'Off-road brings in trail shoes, matched to your ground. Skip if you run roads.',
    optional: true,
    valid: () => true,
    Component: StepTerrain,
  },
  { id: 'budget', title: 'Your budget', valid: (d) => d.budgetAmountGbp >= 50, Component: StepBudget },
  { id: 'injury', title: 'Personalise further', optional: true, valid: () => true, Component: StepInjury },
];

const styles = StyleSheet.create({
  note: { fontFamily: font.ui, fontSize: 12.5, color: color.muted, lineHeight: 18 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  fieldLabel: { fontFamily: font.uiMed, fontSize: 13, color: color.ink, marginTop: space(1) },
  search: {
    fontFamily: font.ui,
    fontSize: 15,
    color: color.ink,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 14,
    paddingHorizontal: space(4),
    paddingVertical: space(3),
  },
});
