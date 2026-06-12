import { Archivo_600SemiBold } from '@expo-google-fonts/archivo';
import { Inter_400Regular, Inter_500Medium, useFonts } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { color } from '@/theme/tokens';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Archivo_600SemiBold,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.bg },
        }}
      />
    </GestureHandlerRootView>
  );
}
