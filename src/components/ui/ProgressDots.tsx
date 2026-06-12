import { StyleSheet, View } from 'react-native';
import { color } from '@/theme/tokens';

export function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.row} accessibilityLabel={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < current && { backgroundColor: color.volt },
            i === current - 1 && styles.active,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  dot: { width: 16, height: 3, borderRadius: 2, backgroundColor: '#232730' },
  active: { width: 24 },
});
