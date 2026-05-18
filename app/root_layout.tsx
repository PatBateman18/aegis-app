import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import { C } from '@/constants/colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import OnboardingScreen from '@/components/Onboarding';
import { supabase } from '@/lib/supabase';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, savePushToken } from '@/lib/notifications';

export default function RootLayout() {
  const { session, loading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === 'auth';
    if (!session && !inAuth) {
      router.replace('/auth/login');
    } else if (session && inAuth) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  useEffect(() => {
    if (!user) return;
    checkOnboarding();
    registerForPushNotificationsAsync().then(token => {
      if (token) savePushToken(user.id, token);
    });
  }, [user]);

  useEffect(() => {
    notifListener.current = Notifications.addNotificationReceivedListener(() => {
      // notification reçue en foreground — le handler global gère l'affichage
    });
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      if (data?.type === 'evening_check') {
        // Notif du soir → accueil + déclenche EveningSummary
        router.push('/(tabs)?evening=1');
      } else {
        router.push('/(tabs)');
      }
    });
    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  async function checkOnboarding() {
    const { data } = await supabase
      .from('profiles')
      .select('onboarding_done')
      .eq('id', user!.id)
      .single();
    setOnboardingDone(!!data?.onboarding_done);
  }

  if (loading || (session && onboardingDone === null)) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={C.gold} />
      </View>
    );
  }

  // Affiche l'onboarding si pas encore fait
  if (session && onboardingDone === false) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" backgroundColor={C.bg} />
        <OnboardingScreen
          userId={user!.id}
          onComplete={() => setOnboardingDone(true)}
        />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor={C.bg} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
