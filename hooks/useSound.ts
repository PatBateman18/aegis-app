// hooks/useSound.ts
import { useEffect, useState, useCallback } from 'react';
import { useAudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOURCES: Record<string, any> = {
  habit:      require('@/assets/sounds/habit.mp3'),
  levelup:    require('@/assets/sounds/levelup.mp3'),
  badge:      require('@/assets/sounds/badge.mp3'),
  perfectday: require('@/assets/sounds/perfectday.mp3'),
  streak:     require('@/assets/sounds/streak.mp3'),
};

// Noms affichés dans les réglages
export const SOUND_LABELS: Record<string, string> = {
  habit:      'Habitude validée',
  levelup:    'Passage de niveau',
  badge:      'Succès débloqué',
  perfectday: 'Jour parfait',
  streak:     'Série de jours',
};

const KEY_VOLUMES = '@aegis:sfx_volumes';
const DEFAULT_VOLUME = 1;

// ─── Volumes partagés au niveau du module (comme useAmbientSound) ────────────
let sharedVolumes: Record<string, number> = {};
let volumesLoaded = false;
const listeners = new Set<(v: Record<string, number>) => void>();

async function loadVolumesOnce() {
  if (volumesLoaded) return;
  volumesLoaded = true;
  try {
    const raw = await AsyncStorage.getItem(KEY_VOLUMES);
    if (raw) sharedVolumes = JSON.parse(raw);
  } catch {}
  listeners.forEach(fn => fn(sharedVolumes));
}
loadVolumesOnce();

async function setVolumeShared(key: string, value: number) {
  sharedVolumes = { ...sharedVolumes, [key]: value };
  listeners.forEach(fn => fn(sharedVolumes));
  try {
    await AsyncStorage.setItem(KEY_VOLUMES, JSON.stringify(sharedVolumes));
  } catch (e) {
    console.log('[useSound] setVolume failed:', e);
  }
}

export function useSound() {
  const habitPlayer      = useAudioPlayer(SOURCES.habit);
  const levelupPlayer    = useAudioPlayer(SOURCES.levelup);
  const badgePlayer      = useAudioPlayer(SOURCES.badge);
  const perfectdayPlayer = useAudioPlayer(SOURCES.perfectday);
  const streakPlayer     = useAudioPlayer(SOURCES.streak);

  const [volumes, setVolumesState] = useState<Record<string, number>>(sharedVolumes);

  useEffect(() => {
    loadVolumesOnce().then(() => setVolumesState(sharedVolumes));
    const listener = (v: Record<string, number>) => setVolumesState(v);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const map: Record<string, any> = {
    habit:      habitPlayer,
    levelup:    levelupPlayer,
    badge:      badgePlayer,
    perfectday: perfectdayPlayer,
    streak:     streakPlayer,
  };

  function play(key: string) {
    try {
      const p = map[key];
      if (!p) return;
      p.volume = volumes[key] ?? DEFAULT_VOLUME;
      p.seekTo(0);
      p.play();
    } catch (e) {
      console.log('sound error', e);
    }
  }

  function stop(key: string) {
    try {
      const p = map[key];
      if (!p) return;
      p.pause();
      p.seekTo(0);
    } catch {}
  }

  const setVolume = useCallback((key: string, value: number) => {
    setVolumeShared(key, value);
  }, []);

  const getVolume = useCallback((key: string) => volumes[key] ?? DEFAULT_VOLUME, [volumes]);

  return { play, stop, volumes, setVolume, getVolume };
}
