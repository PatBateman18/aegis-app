// hooks/useSound.ts
import { useAudioPlayer } from 'expo-audio';

const SOURCES: Record<string, any> = {
  habit:      require('@/assets/sounds/habit.mp3'),
  levelup:    require('@/assets/sounds/levelup.mp3'),
  badge:      require('@/assets/sounds/badge.mp3'),
  perfectday: require('@/assets/sounds/perfectday.mp3'),
  streak:     require('@/assets/sounds/streak.mp3'),
};

export function useSound() {
  const habitPlayer      = useAudioPlayer(SOURCES.habit);
  const levelupPlayer    = useAudioPlayer(SOURCES.levelup);
  const badgePlayer      = useAudioPlayer(SOURCES.badge);
  const perfectdayPlayer = useAudioPlayer(SOURCES.perfectday);
  const streakPlayer     = useAudioPlayer(SOURCES.streak);

  function play(key: string) {
    try {
      const map: Record<string, any> = {
        habit:      habitPlayer,
        levelup:    levelupPlayer,
        badge:      badgePlayer,
        perfectday: perfectdayPlayer,
        streak:     streakPlayer,
      };
      const p = map[key];
      if (!p) return;
      p.seekTo(0);
      p.play();
    } catch (e) {
      console.log('sound error', e);
    }
  }

  function stop(key: string) {
    try {
      const map: Record<string, any> = {
        habit:      habitPlayer,
        levelup:    levelupPlayer,
        badge:      badgePlayer,
        perfectday: perfectdayPlayer,
        streak:     streakPlayer,
      };
      const p = map[key];
      if (!p) return;
      p.pause();
      p.seekTo(0);
    } catch {}
  }

  return { play, stop };
}
