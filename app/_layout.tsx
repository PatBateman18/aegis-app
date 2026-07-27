import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator, Platform } from 'react-native';
import { C } from '@/constants/colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import OnboardingScreen from '@/components/Onboarding';
import { supabase } from '@/lib/supabase';
import * as Notifications from 'expo-notifications';
import { Asset } from 'expo-asset';
import * as SplashScreen from 'expo-splash-screen';
import Purchases from 'react-native-purchases';
import { registerForPushNotificationsAsync, savePushToken, autoRescheduleIfNeeded } from '@/lib/notifications';

// Empêche le splash natif de se cacher tout seul — on le garde tant que les
// assets ne sont pas chargés en mémoire.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { session, loading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [assetsReady, setAssetsReady] = useState(false);
  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // ─── RevenueCat : configuration une seule fois au démarrage ────────────────
  // ⚠️ Clé de TEST pour l'instant (test_UrujnSmmgYudMagwTKIwaBtODIt) — à
  // remplacer par les vraies clés de prod une fois le compte Apple Developer
  // payant actif et les produits créés dans App Store Connect.
  useEffect(() => {
    const REVENUECAT_API_KEY_IOS = 'test_UrujnSmmgYudMagwTKIwaBtODIt';
    const REVENUECAT_API_KEY_ANDROID = 'test_UrujnSmmgYudMagwTKIwaBtODIt'; // même clé de test pour l'instant

    try {
      if (Platform.OS === 'ios') {
        Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS });
      } else if (Platform.OS === 'android') {
        Purchases.configure({ apiKey: REVENUECAT_API_KEY_ANDROID });
      }
    } catch (e) {
      console.error('[RevenueCat] configure failed:', e);
    }
  }, []);

  // ─── RevenueCat : lie l'utilisateur RevenueCat au compte Supabase connecté ──
  // Indispensable : sans ça, RevenueCat suit un utilisateur anonyme, jamais
  // relié à ton vrai compte — impossible de savoir qui a payé quoi.
  useEffect(() => {
    if (!user?.id) return;
    Purchases.logIn(user.id).catch(e => console.error('[RevenueCat] logIn failed:', e));
  }, [user?.id]);


  // Preload images médailles au démarrage
  useEffect(() => {
    let cancelled = false;

    async function preload() {
      await Promise.allSettled([
        Asset.loadAsync([
      // ⚠️ Ancien bloc — à vérifier : ces chemins datent d'avant la refonte des médailles
      // de rang (assets/medals/medaille_rang_XX_*.png). Si assets/ranks/ et ces anciens
      // bg_*.png n'existent plus, retire tout ce bloc.
      require('@/assets/medals/bg_bronze.png'),
      require('@/assets/medals/bg_silver.png'),
      require('@/assets/medals/bg_gold.png'),
      require('@/assets/medals/bg_platinum.png'),
      require('@/assets/medals/bg_conqueror.png'),
      require('@/assets/medals/bg_diamond.png'),
      require('@/assets/medals/bg_centurion.png'),
      require('@/assets/medals/bg_legend.png'),
      require('@/assets/ranks/rank_novice.png'),
      require('@/assets/ranks/rank_initie.png'),
      require('@/assets/ranks/rank_disciple.png'),
      require('@/assets/ranks/rank_guerrier.png'),
      require('@/assets/ranks/rank_stratege.png'),
      require('@/assets/ranks/rank_conquerant.png'),
      require('@/assets/ranks/rank_champion.png'),
      require('@/assets/ranks/rank_maitre.png'),
      require('@/assets/ranks/rank_elite.png'),
      require('@/assets/ranks/rank_aegis.png'),
        ]),

        // Nouveau bloc — médailles de rang actuelles + icônes de toutes les pages
        Asset.loadAsync([
      // Icônes de la tab bar
      require('@/assets/tabs/tab_accueil2.png'),
      require('@/assets/tabs/tab_corps.png'),
      require('@/assets/tabs/tab_mindset.png'),
      require('@/assets/tabs/tab_style.png'),
      require('@/assets/tabs/tab_vision.png'),
      require('@/assets/tabs/tab_profil.png'),

      // Médailles de rang (1-10)
      require('@/assets/medals/medaille_rang_01_novice.png'),
      require('@/assets/medals/medaille_rang_02_initie.png'),
      require('@/assets/medals/medaille_rang_03_disciple.png'),
      require('@/assets/medals/medaille_rang_04_guerrier.png'),
      require('@/assets/medals/medaille_rang_05_strategie.png'),
      require('@/assets/medals/medaille_rang_06_conquerant.png'),
      require('@/assets/medals/medaille_rang_07_champion.png'),
      require('@/assets/medals/medaille_rang_08_maitre.png'),
      require('@/assets/medals/medaille_rang_09_elite.png'),
      require('@/assets/medals/medaille_rang_10_aegis.png'),

      // Hero images (Corps, Mindset, Style, Vision, Profil — chemins confirmés)
      require('@/assets/hero/hero_corps.png'),
      require('@/assets/hero/bg_seance.png'),
      require('@/assets/hero/hero_transformation.png'),
      require('@/assets/hero/hero_mindset.png'),
      require('@/assets/hero/bg_mindset.png'),
      require('@/assets/hero/hero_style.png'),
      require('@/assets/hero/bg_style.png'),
      require('@/assets/hero/hero_vision.png'),
      require('@/assets/hero/bg_vision.png'),
      require('@/assets/hero/hero_profil.png'),

      // Icônes Corps
      require('@/assets/ui/icone_corps_proteines.png'),
      require('@/assets/ui/icone_corps_cardio.png'),
      require('@/assets/ui/icone_corps_poids.png'),

      // Icônes Style (habitudes + aperçu du jour)
      require('@/assets/ui/icone_style_tenue.png'),
      require('@/assets/ui/icone_style_soins.png'),
      require('@/assets/ui/icone_style_coiffure.png'),
      require('@/assets/ui/icone_style_parfum.png'),
      require('@/assets/ui/icone_style_habiller.png'),
      require('@/assets/ui/icone_style_routine.png'),
      require('@/assets/ui/icone_style_coiffure_habitude.png'),
      require('@/assets/ui/icone_style_parfum_habitude.png'),
      require('@/assets/ui/icone_style_tenue_prete.png'),
      require('@/assets/ui/icone_style_posture.png'),

      // Icônes Mindset (habitudes)
      require('@/assets/ui/icone_mindset_meditation.png'),
      require('@/assets/ui/icone_mindset_journal.png'),
      require('@/assets/ui/icone_mindset_lecture_habitude.png'),
      require('@/assets/ui/icone_mindset_visualisation.png'),
      require('@/assets/ui/icone_mindset_reflexion.png'),
      require('@/assets/ui/icone_mindset_detox.png'),
      // Icônes Mindset (stat tiles — bien avec le suffixe "2")
      require('@/assets/ui/icone_mindset_clarte2.png'),
      require('@/assets/ui/icone_mindset_lecture2.png'),
      require('@/assets/ui/icone_mindset_habitude2.png'),
      require('@/assets/ui/icone_mindset_discipline2.png'),

      // Icônes Vision (objectifs + stats)
      require('@/assets/ui/icone_vision_finance.png'),
      require('@/assets/ui/icone_vision_business.png'),
      require('@/assets/ui/icone_vision_voyage.png'),
      require('@/assets/ui/icone_vision_sante.png'),
      require('@/assets/ui/icone_vision_relations.png'),
      require('@/assets/ui/icone_vision_apprentissage.png'),
      require('@/assets/ui/icone_vision_famille.png'),
      require('@/assets/ui/icone_vision_creativite.png'),
      require('@/assets/ui/icone_vision_spiritualite.png'),
      require('@/assets/ui/icone_vision_objectif.png'),
      require('@/assets/ui/icone_vision_stat_objectifs.png'),
      require('@/assets/ui/icone_vision_stat_pascommence.png'),
      require('@/assets/ui/icone_vision_stat_encours.png'),
      require('@/assets/ui/icone_vision_stat_atteints.png'),

      // Icônes Profil
      require('@/assets/ui/icone_notif.png'),
      require('@/assets/ui/icone_parametres.png'),
      require('@/assets/ui/icone_stat_seances.png'),
      require('@/assets/ui/icone_stat_streak.png'),
      require('@/assets/ui/icone_stat_succes.png'),
      require('@/assets/ui/icone_stat_regularite.png'),
      require('@/assets/ui/journal_rapide_thumb.png'),
        ]),
      ]);

      if (!cancelled) setAssetsReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }

    preload();
    return () => { cancelled = true; };
  }, []);

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
    autoRescheduleIfNeeded(user.id); // reschedule si nouvelle semaine
  }, [user]);

  useEffect(() => {
    notifListener.current = Notifications.addNotificationReceivedListener(() => {
      // notification reçue en foreground — le handler global gère l'affichage
    });
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      if (data?.type === 'evening_check') {
        router.push('/(tabs)?evening=1' as any);
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
