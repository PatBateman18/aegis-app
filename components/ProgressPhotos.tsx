// components/ProgressPhotos.tsx
import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Modal, Image, ActivityIndicator, Dimensions, Alert,
  Animated, Easing, StatusBar, FlatList, StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

const ACC  = '#8E44AD';
const ACCB = '#A55CC0';
const ACCD = '#8E44AD33';
const GOLD = '#C9A84C';

const { width, height } = Dimensions.get('window');
const THUMB_W = Math.floor((width - 32 - 3 * 10) / 4);
const THUMB_H = Math.floor(THUMB_W * 1.45);

const HERO_IMG       = require('@/assets/hero/hero_transformation.png');
const STATUE_COMP    = require('@/assets/hero/statue_comparaison.png');

// Icônes custom
const ICON_PHOTOS    = require('@/assets/ui/icone_photos.png');
const ICON_SUIVI     = require('@/assets/ui/icone_suivi.png');
const ICON_EVOLUTION = require('@/assets/ui/icone_evolution.png');
const ICON_OBJECTIF  = require('@/assets/ui/icone_objectif.png');

type ProgressPhoto = { name: string; url: string; date: string; label: string; };
type DayGroup      = { date: string; label: string; photos: ProgressPhoto[]; };
type WeightPoint   = { date: string; weight: number };

function fmtDate(d: string) {
  const dt = new Date(d + 'T12:00:00');
  return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateShort(d: string) {
  const dt = new Date(d + 'T12:00:00');
  return {
    day: dt.getDate().toString(),
    month: dt.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase(),
    year: dt.getFullYear().toString(),
  };
}
function extractDate(filename: string): string {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : new Date().toISOString().split('T')[0];
}
function groupByDate(photos: ProgressPhoto[]): DayGroup[] {
  const map: Record<string, ProgressPhoto[]> = {};
  for (const p of photos) { if (!map[p.date]) map[p.date] = []; map[p.date].push(p); }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
    .map(([date, photos]) => ({ date, label: fmtDate(date), photos }));
}

// ─── PhotoItem plein écran ────────────────────────────────────────────────────
function PhotoItem({ item }: { item: ProgressPhoto }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <View style={{ width, flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      {!loaded && <Image source={{ uri: item.url }} style={{ position: 'absolute', width, height: '100%', opacity: 0.3 }} resizeMode="cover" blurRadius={8} />}
      <Image source={{ uri: item.url }} style={{ width, height: '100%', opacity: loaded ? 1 : 0 }} resizeMode="contain" onLoad={() => setLoaded(true)} />
      {!loaded && <ActivityIndicator color={ACC} size="large" style={{ position: 'absolute' }} />}
    </View>
  );
}

// ─── Galerie plein écran ──────────────────────────────────────────────────────
function GalleryModal({ group, initialIndex, onClose, onDelete }: { group: DayGroup; initialIndex: number; onClose: () => void; onDelete: (p: ProgressPhoto) => void; }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatRef   = useRef<FlatList>(null);
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const scale     = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,     { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.timing(bgOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  function handleClose() {
    Animated.parallel([
      Animated.timing(scale,     { toValue: 0.88, duration: 220, useNativeDriver: true }),
      Animated.timing(bgOpacity, { toValue: 0,    duration: 220, useNativeDriver: true }),
    ]).start(onClose);
  }

  const current = group.photos[currentIndex];
  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
      <StatusBar hidden />
      <Animated.View style={{ flex: 1, backgroundColor: '#000', opacity: bgOpacity }}>
        <Animated.View style={{ flex: 1, overflow: 'hidden', transform: [{ scale }], borderRadius: scale.interpolate({ inputRange: [0.88, 1], outputRange: [20, 0], extrapolate: 'clamp' }) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14, backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20, color: '#fff', fontWeight: '300' }}>✕</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Cinzel', fontSize: 13, color: ACCB, letterSpacing: 1 }}>{group.label}</Text>
              {group.photos.length > 1 && <Text style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{currentIndex + 1} / {group.photos.length}</Text>}
            </View>
            <TouchableOpacity onPress={() => onDelete(current)} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 22 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
          <FlatList ref={flatRef} data={group.photos} horizontal pagingEnabled decelerationRate="fast" showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialIndex} getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            onMomentumScrollEnd={e => setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => <PhotoItem item={item} />} keyExtractor={item => item.name}
          />
          {group.photos.length > 1 && (
            <View style={{ position: 'absolute', bottom: 36, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              {group.photos.map((_, i) => <View key={i} style={{ height: 5, width: i === currentIndex ? 14 : 5, borderRadius: 3, backgroundColor: i === currentIndex ? ACCB : 'rgba(255,255,255,0.3)' }} />)}
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ProgressPhotos({ userId, weightHistory: weightHistoryProp }: { userId: string; weightHistory?: WeightPoint[] }) {
  const insets = useSafeAreaInsets();
  const [photos,        setPhotos]        = useState<ProgressPhoto[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [uploading,     setUploading]     = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DayGroup | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [weightHistory, setWeightHistory] = useState<WeightPoint[]>(weightHistoryProp ?? []);
  const heroScale = useRef(new Animated.Value(1)).current;

  useEffect(() => { loadPhotos(); }, [userId]);

  // Fetch historique poids depuis Supabase si pas passé en props
  useEffect(() => {
    if (weightHistoryProp?.length) { setWeightHistory(weightHistoryProp); return; }
    async function fetchWeights() {
      const { data } = await supabase
        .from('daily_logs')
        .select('date, weight')
        .eq('user_id', userId)
        .not('weight', 'is', null)
        .order('date', { ascending: true });
      if (data) setWeightHistory(data.map((d: any) => ({ date: d.date, weight: d.weight })));
    }
    fetchWeights();
  }, [userId]);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(heroScale, { toValue: 1.03, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(heroScale, { toValue: 1,    duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  async function loadPhotos() {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from('progress-photos').list(userId, { sortBy: { column: 'created_at', order: 'asc' } });
      if (error || !data) { setLoading(false); return; }
      const loaded: ProgressPhoto[] = data.filter(f => f.name !== '.emptyFolderPlaceholder').map(f => {
        const dateStr = extractDate(f.name);
        const { data: urlData } = supabase.storage.from('progress-photos').getPublicUrl(`${userId}/${f.name}`);
        return { name: f.name, url: urlData.publicUrl, date: dateStr, label: fmtDate(dateStr) };
      });
      setPhotos(loaded);
    } catch {}
    setLoading(false);
  }

  async function addPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission requise', "Autorise l'accès à la galerie dans les Réglages."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, allowsMultipleSelection: true, quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;
    setUploading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const optimisticPhotos: ProgressPhoto[] = result.assets.map((asset, i) => ({ name: `photo_${today}_${Date.now() + i}.jpg`, url: asset.uri, date: today, label: fmtDate(today) }));
      setPhotos(prev => [...optimisticPhotos, ...prev]);
      const uploaded = await Promise.all(result.assets.map(async (asset, i) => {
        const filename = optimisticPhotos[i].name;
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const arr = await new Response(blob).arrayBuffer();
        const { data: urlData } = supabase.storage.from('progress-photos').getPublicUrl(`${userId}/${filename}`);
        await supabase.storage.from('progress-photos').upload(`${userId}/${filename}`, new Uint8Array(arr), { contentType: 'image/jpeg', upsert: false });
        return { ...optimisticPhotos[i], url: urlData.publicUrl };
      }));
      setPhotos(prev => { const n = new Set(optimisticPhotos.map(p => p.name)); return [...uploaded, ...prev.filter(p => !n.has(p.name))]; });
    } catch { await loadPhotos(); Alert.alert('Erreur', 'Une erreur est survenue.'); }
    setUploading(false);
  }

  async function deletePhoto(photo: ProgressPhoto) {
    Alert.alert('Supprimer cette photo ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await supabase.storage.from('progress-photos').remove([`${userId}/${photo.name}`]);
        const newPhotos = photos.filter(x => x.name !== photo.name);
        setPhotos(newPhotos);
        const newGroup = selectedGroup ? { ...selectedGroup, photos: selectedGroup.photos.filter(x => x.name !== photo.name) } : null;
        if (!newGroup || newGroup.photos.length === 0) setSelectedGroup(null);
        else { setSelectedGroup(newGroup); setSelectedIndex(Math.min(selectedIndex, newGroup.photos.length - 1)); }
      }},
    ]);
  }

  const groups = groupByDate(photos);
  const firstGroup = groups[0];
  const lastGroup  = groups[groups.length - 1];
  const totalDays  = groups.length > 1 ? Math.round((new Date(lastGroup.date).getTime() - new Date(firstGroup.date).getTime()) / 86400000) : 0;
  const totalWeeks = totalDays > 0 ? Math.round(totalDays / 7) : 0;

  // Trouver le poids le plus proche d'une date donnée
  function closestWeight(targetDate: string): number | null {
    if (!weightHistory.length) return null;
    const target = new Date(targetDate).getTime();
    const sorted = [...weightHistory].sort((a, b) =>
      Math.abs(new Date(a.date).getTime() - target) - Math.abs(new Date(b.date).getTime() - target)
    );
    return sorted[0]?.weight ?? null;
  }

  const weightDebut  = firstGroup ? closestWeight(firstGroup.date) : null;
  const weightActuel = lastGroup  ? closestWeight(lastGroup.date)  : null;
  const weightDiff   = weightDebut !== null && weightActuel !== null
    ? +(weightActuel - weightDebut).toFixed(1) : null;
  const weightDiffStr = weightDiff !== null
    ? (weightDiff >= 0 ? '+' : '') + weightDiff + ' kg' : '—';
  const weightDiffColor = weightDiff === null ? C.dim : weightDiff >= 0 ? ACC : C.green;

  return (
    <View style={{ marginBottom: 14 }}>
      {/* ── HEADER HERO ── */}
      <View style={{ height: height * 0.32, position: 'relative', borderRadius: 20, overflow: 'hidden', marginBottom: 14 }}>
        <Animated.Image source={HERO_IMG} style={{ width: '100%', height: '100%', transform: [{ scale: heroScale }] }} resizeMode="cover" />
        <LinearGradient colors={['transparent', 'rgba(8,6,18,0.5)', 'rgba(8,6,18,0.95)']} locations={[0.3, 0.65, 1]} style={StyleSheet.absoluteFillObject} />
        {/* Bouton ajouter */}
        <TouchableOpacity onPress={addPhoto} disabled={uploading} style={{ position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: ACC + '66', borderRadius: 12, padding: 10, alignItems: 'center', gap: 4 }}>
          {uploading ? <ActivityIndicator color={ACC} size="small" /> : <>
            <Image source={ICON_PHOTOS} style={{ width: 22, height: 22 }} resizeMode="contain" />
            <Text style={{ fontSize: 9, color: ACC, fontWeight: '700', letterSpacing: 1 }}>Ajouter</Text>
          </>}
        </TouchableOpacity>
        {/* Titre */}
        <View style={{ position: 'absolute', bottom: 18, left: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Text style={{ color: ACC, fontSize: 10 }}>←</Text>
            <Text style={{ fontSize: 10, color: ACC, letterSpacing: 3, fontWeight: '700', textTransform: 'uppercase' }}>TRANSFORMATION</Text>
          </View>
          <Text style={{ fontSize: 28, color: C.text, fontWeight: '800', lineHeight: 32 }}>
            Ton <Text style={{ color: ACCB }}>évolution.</Text>
          </Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Reste constant. Deviens légendaire.</Text>
        </View>
      </View>

      {/* ── STATS ROW ── */}
      <View style={{ backgroundColor: '#080612', borderRadius: 16, borderWidth: 1, borderColor: ACC + '33', padding: 18, marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {[
            { icon: ICON_PHOTOS,    value: photos.length.toString(), label: 'PHOTOS',    sub: 'au total',     color: C.text },
            { icon: ICON_SUIVI,     value: totalDays.toString(),     label: 'SUIVI',     sub: 'jours',        color: C.text },
            { icon: ICON_EVOLUTION, value: weightDiffStr,            label: 'ÉVOLUTION', sub: 'masse maigre', color: weightDiffColor },
            { icon: ICON_OBJECTIF,  value: weightActuel ? `${weightActuel} kg` : '— kg', label: 'OBJECTIF', sub: 'poids cible', color: GOLD },
          ].map((stat, i) => (
            <View key={i} style={{ alignItems: 'center', flex: 1 }}>
              <Image source={stat.icon} style={{ width: 24, height: 24, marginBottom: 4 }} resizeMode="contain" />
              <Text style={{ fontFamily: 'SpaceMono', fontSize: 18, color: stat.color, fontWeight: '700' }}>{stat.value}</Text>
              <Text style={{ fontSize: 8, color: ACC, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2, fontWeight: '700' }}>{stat.label}</Text>
              <Text style={{ fontSize: 9, color: C.dim, marginTop: 1 }}>{stat.sub}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── TES PHOTOS ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 11, color: ACC, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' }}>TES PHOTOS</Text>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ACC + '22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: ACC + '44' }}>
          <Text style={{ fontSize: 10, color: ACC }}>Plus récent</Text>
          <Text style={{ fontSize: 10, color: ACC }}>▾</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ height: 160, backgroundColor: '#080612', borderRadius: 14, borderWidth: 1, borderColor: ACC + '33', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={ACC} />
        </View>
      ) : groups.length === 0 ? (
        <TouchableOpacity onPress={addPhoto} style={{ height: 160, backgroundColor: '#080612', borderRadius: 14, borderWidth: 1, borderColor: ACC + '33', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Image source={ICON_PHOTOS} style={{ width: 40, height: 40, opacity: 0.6 }} resizeMode="contain" />
          <Text style={{ fontSize: 14, color: C.text, fontWeight: '600' }}>Commence ta transformation</Text>
          <Text style={{ fontSize: 11, color: C.dim, textAlign: 'center', paddingHorizontal: 32 }}>Ajoute ta première photo pour suivre tes progrès</Text>
        </TouchableOpacity>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 2, paddingBottom: 4 }}
          ref={r => { if (r) setTimeout(() => r.scrollToEnd({ animated: false }), 100); }}
        >
          {groups.map((group, i) => {
            const isFirst = i === 0;
            const isLast  = i === groups.length - 1;
            const d = fmtDateShort(group.date);
            return (
              <TouchableOpacity key={group.date} onPress={() => { setSelectedGroup(group); setSelectedIndex(0); }} activeOpacity={0.85}
                style={{ width: THUMB_W, borderRadius: 14, overflow: 'hidden', borderWidth: isLast ? 1.5 : 0.5, borderColor: isLast ? GOLD : 'rgba(255,255,255,0.1)' }}
              >
                <Image source={{ uri: group.photos[0].url }} style={{ width: THUMB_W, height: THUMB_H }} resizeMode="cover" />
                {/* Overlay date en haut à gauche */}
                <View style={{ position: 'absolute', top: 8, left: 8 }}>
                  <Text style={{ fontFamily: 'SpaceMono', fontSize: 18, color: '#fff', fontWeight: '700', lineHeight: 20 }}>{d.day}</Text>
                  <Text style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>{d.month}</Text>
                  <Text style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>{d.year}</Text>
                </View>
                {/* Badge nb photos */}
                {group.photos.length > 1 && (
                  <View style={{ position: 'absolute', bottom: 28, right: 6, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: ACC + '55' }}>
                    <Text style={{ fontSize: 9, color: ACCB, fontWeight: '700' }}>x{group.photos.length}</Text>
                  </View>
                )}
                {/* Badge début/récent */}
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: isLast ? GOLD + 'CC' : 'rgba(0,0,0,0.6)', padding: 4, alignItems: 'center' }}>
                  <Text style={{ fontSize: 8, color: isLast ? '#000' : 'rgba(255,255,255,0.5)', fontWeight: '700', letterSpacing: 1 }}>{isFirst ? 'DÉBUT' : isLast ? 'RÉCENT' : ''}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── COMPARAISON ── */}
      {groups.length >= 2 && (
        <View style={{ backgroundColor: '#080612', borderRadius: 16, borderWidth: 1, borderColor: ACC + '33', padding: 18, marginTop: 14, overflow: 'hidden' }}>
          {/* Petite statue en fond */}
          <Image source={STATUE_COMP} style={{ position: 'absolute', right: 0, top: 0, width: 120, height: '100%', opacity: 0.15 }} resizeMode="cover" />

          <Text style={{ fontSize: 11, color: ACC, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700', marginBottom: 16 }}>COMPARAISON</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, color: C.dim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{firstGroup.label.toUpperCase()}</Text>
              <Text style={{ fontFamily: 'SpaceMono', fontSize: 24, color: C.text, fontWeight: '700' }}>{weightDebut !== null ? `${weightDebut} kg` : '—'}</Text>
              <Text style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>Début</Text>
            </View>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: ACC + '22', borderWidth: 1.5, borderColor: ACC, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: ACC, fontSize: 16, fontWeight: '800' }}>››</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, color: C.dim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{lastGroup.label.toUpperCase()}</Text>
              <Text style={{ fontFamily: 'SpaceMono', fontSize: 24, color: ACCB, fontWeight: '700' }}>{weightActuel !== null ? `${weightActuel} kg` : '—'}</Text>
              <Text style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>Actuel</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: 'SpaceMono', fontSize: 22, color: weightDiffColor, fontWeight: '700' }}>{weightDiffStr}</Text>
              <Text style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>Progression totale</Text>
              {totalWeeks > 0 && (
                <View style={{ backgroundColor: ACC + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: ACC + '44', marginTop: 6 }}>
                  <Text style={{ fontSize: 9, color: ACC, fontWeight: '700', letterSpacing: 1 }}>{totalWeeks} SEMAINES</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* ── CONSEIL ── */}
      <View style={{ backgroundColor: '#080612', borderRadius: 16, borderWidth: 1, borderColor: GOLD + '33', padding: 16, marginTop: 14, flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
        <Image source={ICON_OBJECTIF} style={{ width: 24, height: 24, opacity: 0.8 }} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 9, color: GOLD, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700', marginBottom: 6 }}>CONSEIL</Text>
          <Text style={{ fontSize: 12, color: C.dim, lineHeight: 18 }}>
            Prends tes photos toujours dans les mêmes conditions : même lumière, même heure, même posture.
          </Text>
        </View>
        <Text style={{ fontSize: 10, color: C.dim }}>1/3</Text>
      </View>

      {selectedGroup && (
        <GalleryModal group={selectedGroup} initialIndex={selectedIndex} onClose={() => setSelectedGroup(null)} onDelete={deletePhoto} />
      )}
    </View>
  );
}
