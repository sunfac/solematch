import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ChoiceGrid } from '@/components/quiz/inputs';
import { PillButton } from '@/components/ui/PillButton';
import { Screen } from '@/components/ui/Screen';
import { TopBar } from '@/components/ui/TopBar';
import { useQuizStore } from '@/state/quizStore';
import { useResultsStore } from '@/state/resultsStore';
import { color, font, space } from '@/theme/tokens';

export default function SettingsScreen() {
  const { units, region, set, reset } = useQuizStore();
  const clearResults = useResultsStore((s) => s.clear);

  return (
    <Screen scroll maxWidth={560}>
      <TopBar />
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.label}>Units</Text>
      <ChoiceGrid
        value={units}
        onSelect={(k) => set('units', k)}
        options={[
          { key: 'metric', label: 'Metric', hint: 'kg · km · min/km' },
          { key: 'imperial', label: 'Imperial', hint: 'lb · mi · min/mi' },
        ]}
      />

      <Text style={styles.label}>Region</Text>
      <ChoiceGrid
        value={region}
        onSelect={(k) => set('region', k)}
        options={[
          { key: 'UK', label: 'United Kingdom', hint: 'Prices shown in GBP' },
          { key: 'US', label: 'United States', hint: 'US retailer links where available (prices remain GBP in this version)' },
        ]}
      />

      <View style={styles.dataBox}>
        <Text style={styles.dataTitle}>Your data</Text>
        <Text style={styles.dataText}>
          Everything you enter lives only in this session — nothing is stored on a server. Erase it
          all now, including any injury-history answers:
        </Text>
        <PillButton
          label="Erase session & start over"
          variant="ghost"
          onPress={() => {
            reset();
            clearResults();
            router.replace('/');
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: font.display, fontSize: 26, color: color.ink, marginBottom: space(4) },
  label: { fontFamily: font.uiMed, fontSize: 13.5, color: color.ink, marginTop: space(5), marginBottom: space(2.5) },
  dataBox: {
    marginTop: space(8),
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 16,
    padding: space(4),
    gap: space(3),
  },
  dataTitle: { fontFamily: font.uiMed, fontSize: 14, color: color.ink },
  dataText: { fontFamily: font.ui, fontSize: 12.5, lineHeight: 18, color: color.muted },
});
