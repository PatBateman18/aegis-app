// hooks/useNarration.ts
import { useEffect, useRef }              from 'react';
import { createAudioPlayer, AudioModule } from 'expo-audio';
import * as FileSystem                    from 'expo-file-system/legacy';
import Constants                          from 'expo-constants';

const API_KEY = (Constants.expoConfig?.extra?.elevenLabsKey as string) ?? '';
const MODEL   = 'eleven_turbo_v2_5'; // plus rapide que multilingual_v2

export const VOICE_IDS: Record<'AEGIS' | 'KRIOS' | 'ASPASIA', string> = {
  AEGIS:   'oIMNFqZKsT3IlTL2Mo7J',
  KRIOS:   '6XvRcRtD3ZxshM2vBNHS',
  ASPASIA: 'ADzQL1tROmxPqXMvqL27',
};

// stability bas = plus expressif/humain, style haut = plus vivant
const VOICE_SETTINGS = {
  AEGIS:   { stability: 0.72, similarity_boost: 0.60, style: 0.15, use_speaker_boost: false },
  KRIOS:   { stability: 0.28, similarity_boost: 0.78, style: 0.55, use_speaker_boost: true  },
  ASPASIA: { stability: 0.30, similarity_boost: 0.78, style: 0.50, use_speaker_boost: true  },
};

function hashText(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

async function fetchAndCache(text: string, narrator: 'AEGIS' | 'KRIOS' | 'ASPASIA'): Promise<string | null> {
  const cacheKey = `${FileSystem.cacheDirectory}aegis_${narrator}_${hashText(text)}.mp3`;
  const fileInfo = await FileSystem.getInfoAsync(cacheKey);

  if (fileInfo.exists) return cacheKey;

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_IDS[narrator]}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key':   API_KEY,
        'Content-Type': 'application/json',
        'Accept':       'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id:       MODEL,
        voice_settings: VOICE_SETTINGS[narrator],
      }),
    }
  );

  if (!res.ok) {
    console.warn('[NAR] ElevenLabs', res.status, await res.text());
    return null;
  }

  const buffer = await res.arrayBuffer();
  const bytes  = new Uint8Array(buffer);
  let binary   = '';
  const chunk  = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...Array.from(bytes.subarray(i, i + chunk)));
  }
  await FileSystem.writeAsStringAsync(cacheKey, btoa(binary), {
    encoding: FileSystem.EncodingType.Base64,
  });

  return cacheKey;
}

export function useNarration() {
  const playerRef  = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    AudioModule.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    }).catch(() => {});
    return () => { stop(); };
  }, []);

  // Joue la voix
  async function speak(text: string, narrator: 'AEGIS' | 'KRIOS' | 'ASPASIA') {
    if (!API_KEY || !text.trim() || loadingRef.current) return;
    loadingRef.current = true;
    try {
      stop();
      const uri = await fetchAndCache(text, narrator);
      if (!uri) return;
      const player = createAudioPlayer({ uri });
      playerRef.current = player;
      player.play();
    } catch (err) {
      console.warn('[NAR] speak error:', err);
    } finally {
      loadingRef.current = false;
    }
  }

  // Précharge sans jouer (pour la prochaine étape)
  async function prefetch(text: string, narrator: 'AEGIS' | 'KRIOS' | 'ASPASIA') {
    if (!API_KEY || !text.trim()) return;
    try { await fetchAndCache(text, narrator); } catch {}
  }

  function stop() {
    try {
      playerRef.current?.remove();
      playerRef.current = null;
    } catch {}
  }

  return { speak, prefetch, stop };
}
