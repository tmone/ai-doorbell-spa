import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { I18nextProvider } from 'react-i18next';

import { useColorScheme } from '@/hooks/useColorScheme';
import { initializeI18n } from '@/constants/i18n';
import i18n from '@/constants/i18n';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [i18nInitialized, setI18nInitialized] = useState(false);

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Initialize i18n configuration
  useEffect(() => {
    const init = async () => {
      await initializeI18n();
      setI18nInitialized(true);
    };
    
    init();
  }, []);

  useEffect(() => {
    if (loaded && i18nInitialized) {
      SplashScreen.hideAsync();
    }
  }, [loaded, i18nInitialized]);

  if (!loaded || !i18nInitialized) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </I18nextProvider>
  );
}
