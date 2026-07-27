// hooks/useVisionBoard.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';

export type VisionImage = {
  id: string;
  image_url: string;
  created_at: string;
};

const BUCKET = 'vision-board';

export function useVisionBoard(userId: string | undefined) {
  const [images, setImages] = useState<VisionImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    load();
  }, [userId]);

  async function load() {
    const { data, error } = await supabase
      .from('user_vision_images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) console.error('[useVisionBoard] load failed:', error);
    if (data) setImages(data as VisionImage[]);
    setLoading(false);
  }

  const addImage = useCallback(async (localUri: string) => {
    if (!userId) return;
    setUploading(true);
    try {
      const ext = localUri.split('.').pop()?.split('?')[0] || 'jpg';
      const path = `${userId}/${Date.now()}.${ext}`;

      const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });
      const arrayBuffer = decodeBase64(base64);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, arrayBuffer, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` });

      if (uploadError) {
        console.error('[useVisionBoard] upload failed:', uploadError);
        return;
      }

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const imageUrl = pub.publicUrl;

      const { data, error } = await supabase
        .from('user_vision_images')
        .insert({ user_id: userId, image_url: imageUrl })
        .select()
        .single();

      if (error) {
        console.error('[useVisionBoard] insert failed:', error);
        return;
      }
      if (data) setImages(prev => [data as VisionImage, ...prev]);
    } finally {
      setUploading(false);
    }
  }, [userId]);

  const removeImage = useCallback(async (id: string) => {
    const prev = images;
    setImages(imgs => imgs.filter(i => i.id !== id)); // optimiste

    const { error } = await supabase.from('user_vision_images').delete().eq('id', id);
    if (error) {
      console.error('[useVisionBoard] removeImage failed:', error);
      setImages(prev); // rollback
    }
  }, [images]);

  return { images, loading, uploading, addImage, removeImage };
}

// Décode une chaîne base64 en ArrayBuffer (pas de Buffer en React Native)
function decodeBase64(base64: string): ArrayBuffer {
  const binaryString = globalThis.atob ? globalThis.atob(base64) : atobPolyfill(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes.buffer;
}

function atobPolyfill(input: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input.replace(/=+$/, '');
  let output = '';
  for (let bc = 0, bs = 0, buffer, i = 0; (buffer = str.charAt(i++)); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)))) : 0) {
    buffer = chars.indexOf(buffer);
  }
  return output;
}
