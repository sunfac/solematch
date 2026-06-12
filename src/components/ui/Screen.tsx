import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, space } from '@/theme/tokens';

type Props = PropsWithChildren<{
  scroll?: boolean;
  style?: ViewStyle;
  /** centers content column on wide (web) viewports */
  maxWidth?: number;
}>;

export function Screen({ children, scroll = false, style, maxWidth = 480 }: Props) {
  const inner = (
    <View style={[styles.column, { maxWidth }, style]}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.safe}>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {inner}
        </ScrollView>
      ) : (
        <View style={styles.fill}>{inner}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  fill: { flex: 1, alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingBottom: space(12) },
  column: {
    flex: 1,
    width: '100%',
    paddingHorizontal: space(5),
    paddingTop: space(4),
  },
});
