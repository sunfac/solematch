import { StyleSheet, Text } from 'react-native';
import { Screen } from './Screen';
import { TopBar } from './TopBar';
import { color, font, space } from '@/theme/tokens';

export function TextPage({ title, sections }: { title: string; sections: Array<{ h?: string; p: string }> }) {
  return (
    <Screen scroll maxWidth={560}>
      <TopBar />
      <Text style={styles.title}>{title}</Text>
      {sections.map((s, i) => (
        <Text key={i} style={styles.block}>
          {s.h ? <Text style={styles.h}>{s.h}{'\n'}</Text> : null}
          <Text style={styles.p}>{s.p}</Text>
        </Text>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: font.display, fontSize: 26, color: color.ink, marginBottom: space(4) },
  block: { marginBottom: space(4) },
  h: { fontFamily: font.uiMed, fontSize: 14.5, color: color.ink, lineHeight: 26 },
  p: { fontFamily: font.ui, fontSize: 13.5, lineHeight: 20, color: color.muted },
});
