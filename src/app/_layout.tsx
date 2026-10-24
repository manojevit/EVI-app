import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold, useFonts } from '@expo-google-fonts/sora';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Palette, Radius, Spacing } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: 'index', // launch animation → onboarding → login
};

/** If a screen ever crashes, show a way back instead of a blank app. */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, backgroundColor: Palette.canvas }}>
      <Ionicons name="refresh-circle-outline" size={56} color={Palette.forest} />
      <Text style={{ fontSize: 20, fontWeight: '700', color: Palette.ink, marginTop: Spacing.md, textAlign: 'center' }}>Something went wrong</Text>
      <Text style={{ fontSize: 14, color: Palette.mist, marginTop: Spacing.sm, textAlign: 'center' }}>Your data is safe. Try again, or go back to the map.</Text>
      <TouchableOpacity onPress={retry} activeOpacity={0.85} style={{ marginTop: Spacing.xl, backgroundColor: Palette.forest, borderRadius: Radius.pill, paddingHorizontal: 28, paddingVertical: 13 }}>
        <Text style={{ color: Palette.white, fontWeight: '700', fontSize: 15 }}>Try again</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/map')} activeOpacity={0.7} style={{ marginTop: Spacing.md, padding: Spacing.sm }}>
        <Text style={{ color: Palette.forest, fontWeight: '600', fontSize: 14 }}>Go to map</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Palette.canvas } }}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="login" options={{ animation: 'fade' }} />
          <Stack.Screen name="otp" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="station/[id]" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="history" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="vehicles" />
          <Stack.Screen name="plans" />
          <Stack.Screen name="help" />
          <Stack.Screen name="tickets" />
          <Stack.Screen name="ticket/[id]" />
          <Stack.Screen name="new-ticket" />
          <Stack.Screen name="receipt/[id]" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="wallet" />
          <Stack.Screen name="reservations" />
          <Stack.Screen name="reserve" />
          <Stack.Screen name="rfid" />
          <Stack.Screen name="add-rfid" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="scan" />
          <Stack.Screen name="filters" options={{ presentation: 'transparentModal', animation: 'fade' }} />
          <Stack.Screen name="add-vehicle" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
