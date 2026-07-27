// hooks/useAmbientSound.ts
// Musique d'ambiance par page : un seul lecteur actif à la fois, en boucle,
// à bas volume. Configuré pour ne JAMAIS couper Spotify/un podcast en cours
// (mixWithOthers) — l'ambiance vient s'ajouter, pas remplacer.
//
// Important : l'état du lecteur est partagé globalement (au niveau du module,
// pas du composant) — sinon changer d'onglet empilerait les ambiances au lieu
// de les remplacer, puisque les écrans restent montés en arrière-plan avec
// React Navigation.
//
// Usage dans une page :
//   const { playAmbient } = useAmbientSound();
//   useFocusEffect(useCallback(() => { playAmbient('corps'); }, []));

import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const AMBIENT_SOURCES: Record<string, any> = {
  accueil:        require('@/assets/sounds/ambient/ambient_accueil.mp3'),
  corps:          require('@/assets/sounds/ambient/ambient_corps.mp3'),
  mindset:        require('@/assets/sounds/ambient/ambient_mindset.mp3'),
  style:          require('@/assets/sounds/ambient/ambient_style.mp3'),
  vision:         require('@/assets/sounds/ambient/ambient_vision.mp3'),
  profil:         require('@/assets/sounds/ambient/ambient_profil.mp3'),
  journal:        require('@/assets/sounds/ambient/ambient_journal.mp3'),
  transformation: require('@/assets/sounds/ambient/ambient_transformation.mp3'),
  succes:         require('@/assets/sounds/ambient/ambient_succes.mp3'),
  parametres:     require('@/assets/sounds/ambient/ambient_parametres.mp3'),
};

const KEY_ENABLED = '@aegis:ambient_enabled';
const DEFAULT_VOLUME = 0.18; // bas et discret — de l'ambiance, pas de la musique qu'on écoute

// ─── État partagé au niveau du module (un seul lecteur pour toute l'app) ─────
let sharedPlayer: AudioPlayer | null = null;
let currentKey: string | null = null;
let sharedEnabled = true;
let audioModeConfigured = false;
const listeners = new Set<(enabled: boolean) => void>();

async function ensureAudioMode() {
  if (audioModeConfigured) return;
  audioModeConfigured = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers', // ne coupe jamais Spotify/un podcast en cours
      shouldPlayInBackground: false,
    });
  } catch (e) {
    console.log('[useAmbientSound] audio mode config failed:', e);
  }
}

async function playAmbientShared(pageKey: string) {
  await ensureAudioMode();
  if (currentKey === pageKey && sharedPlayer) return; // déjà sur cette ambiance
  currentKey = pageKey;

  if (sharedPlayer) {
    try { sharedPlayer.pause(); sharedPlayer.remove(); } catch {}
    sharedPlayer = null;
  }

  const source = AMBIENT_SOURCES[pageKey];
  if (!source) {
    console.log(`[useAmbientSound] aucune ambiance pour la clé "${pageKey}"`);
    return;
  }

  try {
    const player = createAudioPlayer(source);
    player.loop = true;
    player.volume = DEFAULT_VOLUME;
    sharedPlayer = player;
    if (sharedEnabled) player.play();
  } catch (e) {
    console.log('[useAmbientSound] playAmbient failed:', e);
  }
}

function stopAmbientShared() {
  currentKey = null;
  if (sharedPlayer) {
    try { sharedPlayer.pause(); sharedPlayer.remove(); } catch {}
    sharedPlayer = null;
  }
}

async function setEnabledShared(value: boolean) {
  sharedEnabled = value;
  await AsyncStorage.setItem(KEY_ENABLED, String(value));
  if (!value) sharedPlayer?.pause();
  else sharedPlayer?.play();
  listeners.forEach(fn => fn(value));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAmbientSound() {
  const [enabled, setEnabledState] = useState(sharedEnabled);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY_ENABLED).then(v => {
      const value = v === null ? true : v === 'true'; // activé par défaut si jamais réglé
      sharedEnabled = value;
      setEnabledState(value);
      setLoaded(true);
    });

    const listener = (value: boolean) => setEnabledState(value);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const setEnabled = useCallback((value: boolean) => { setEnabledShared(value); }, []);
  const playAmbient = useCallback((pageKey: string) => { playAmbientShared(pageKey); }, []);
  const stopAmbient = useCallback(() => { stopAmbientShared(); }, []);

  return { playAmbient, stopAmbient, enabled, setEnabled, loaded };
}
