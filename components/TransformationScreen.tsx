// components/TransformationScreen.tsx
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
import { useAmbientSound } from '@/hooks/useAmbientSound';
import { supabase } from '@/lib/supabase';

const ACC  = '#8E44AD';
const ACCB = '#A55CC0';
const ACCD = '#8E44AD33';
const GOLD = '#C9A84C';

const { width, height } = Dimensions.get('window');
const THUMB_W = Math.floor((width - 32 - 3 * 10) / 4);
const THUMB_H = Math.floor(THUMB_W * 1.55);

const HERO_IMG    = require('@/assets/hero/hero_transformation.png');
const STATUE_COMP = require('@/assets/hero/statue_comparaison.png');
const ICON_PHOTOS    = require('@/assets/ui/icone_photos.png');
const ICON_APPAREIL  = require('@/assets/ui/icone_appareil_photo.png');
const ICON_SUIVI     = require('@/assets/ui/icone_suivi.png');
const ICON_EVOLUTION = require('@/assets/ui/icone_evolution.png');
const ICON_OBJECTIF  = require('@/assets/ui/icone_objectif.png');

type WeightPoint = { date: string; weight: number };

type ProgressPhoto = { name: string; url: string; date: string; label: string; };
type DayGroup      = { date: string; label: string; photos: ProgressPhoto[]; };

function fmtDate(d: string) {
  const dt = new Date(d + 'T12:00:00');
  return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateShort(d: string) {
  const dt = new Date(d + 'T12:00:00');
  return {
    day:   dt.getDate().toString(),
    month: dt.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase(),
    year:  dt.getFullYear().toString(),
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

// ─── Photo plein écran ────────────────────────────────────────────────────────
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
function GalleryModal({ group, initialIndex, onClose, onDelete }: {
  group: DayGroup; initialIndex: number; onClose: () => void; onDelete: (p: ProgressPhoto) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatRef   = useRef<FlatList>(null);
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const scale     = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,     { toValue: 1,   tension: 80, friction: 10, useNativeDriver: true }),
      Animated.timing(bgOpacity, { toValue: 1,   duration: 250,             useNativeDriver: true }),
    ]).start();
  }, []);

  function handleClose() {
    Animated.parallel([
      Animated.timing(scale,     { toValue: 0.88, duration: 220, useNativeDriver: true }),
      Animated.timing(bgOpacity, { toValue: 0,    duration: 220, useNativeDriver: true }),
    ]).start(onClose);
  }

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
      <StatusBar hidden />
      <Animated.View style={{ flex: 1, backgroundColor: '#000', opacity: bgOpacity }}>
        <Animated.View style={{ flex: 1, overflow: 'hidden', transform: [{ scale }], borderRadius: scale.interpolate({ inputRange: [0.88, 1], outputRange: [20, 0], extrapolate: 'clamp' }) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14, backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <TouchableOpacity onPress={handleClose} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20, color: '#fff', fontWeight: '300' }}>✕</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Cinzel', fontSize: 13, color: ACCB, letterSpacing: 1 }}>{group.label}</Text>
              {group.photos.length > 1 && <Text style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{currentIndex + 1} / {group.photos.length}</Text>}
            </View>
            <TouchableOpacity onPress={() => onDelete(group.photos[currentIndex])} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
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
type Props = { visible: boolean; onClose: () => void; userId: string; };

export default function TransformationScreen({ visible, onClose, userId }: Props) {
  const insets = useSafeAreaInsets();
  const [photos,        setPhotos]        = useState<ProgressPhoto[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [uploading,     setUploading]     = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DayGroup | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [weightHistory, setWeightHistory] = useState<WeightPoint[]>([]);
  const [sortDesc, setSortDesc] = useState(true); // true = plus récent d'abord
  const heroScale = useRef(new Animated.Value(1)).current;
  const { playAmbient } = useAmbientSound();

  useEffect(() => {
    if (visible) {
      playAmbient('transformation');
    } else {
      playAmbient('corps'); // revient sur l'ambiance Corps à la fermeture (écran d'origine)
    }
  }, [visible]);

  useEffect(() => {
    if (visible) { loadPhotos(); fetchWeights(); }
  }, [visible, userId]);

  async function fetchWeights() {
    const { data } = await supabase
      .from('daily_logs').select('date, weight')
      .eq('user_id', userId).not('weight', 'is', null)
      .order('date', { ascending: true });
    if (data) setWeightHistory(data.map((d: any) => ({ date: d.date, weight: d.weight })));
  }

  function closestWeight(targetDate: string): number | null {
    if (!weightHistory.length) return null;
    const target = new Date(targetDate).getTime();
    const sorted = [...weightHistory].sort((a, b) =>
      Math.abs(new Date(a.date).getTime() - target) - Math.abs(new Date(b.date).getTime() - target)
    );
    return sorted[0]?.weight ?? null;
  }

  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(heroScale, { toValue: 1.04, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(heroScale, { toValue: 1,    duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [visible]);

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
    if (!perm.granted) { Alert.alert('Permission requise', "Autorise l'accès à la galerie."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, allowsMultipleSelection: true, quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;
    setUploading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const optimistic: ProgressPhoto[] = result.assets.map((asset, i) => ({ name: `photo_${today}_${Date.now() + i}.jpg`, url: asset.uri, date: today, label: fmtDate(today) }));
      setPhotos(prev => [...optimistic, ...prev]);
      const uploaded = await Promise.all(result.assets.map(async (asset, i) => {
        const filename = optimistic[i].name;
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const arr = await new Response(blob).arrayBuffer();
        const { data: urlData } = supabase.storage.from('progress-photos').getPublicUrl(`${userId}/${filename}`);
        await supabase.storage.from('progress-photos').upload(`${userId}/${filename}`, new Uint8Array(arr), { contentType: 'image/jpeg', upsert: false });
        return { ...optimistic[i], url: urlData.publicUrl };
      }));
      setPhotos(prev => { const n = new Set(optimistic.map(p => p.name)); return [...uploaded, ...prev.filter(p => !n.has(p.name))]; });
    } catch { await loadPhotos(); Alert.alert('Erreur', 'Une erreur est survenue.'); }
    setUploading(false);
  }

  async function deletePhoto(photo: ProgressPhoto) {
    Alert.alert('Supprimer ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await supabase.storage.from('progress-photos').remove([`${userId}/${photo.name}`]);
        setPhotos(prev => prev.filter(x => x.name !== photo.name));
        const ng = selectedGroup ? { ...selectedGroup, photos: selectedGroup.photos.filter(x => x.name !== photo.name) } : null;
        if (!ng || ng.photos.length === 0) setSelectedGroup(null);
        else { setSelectedGroup(ng); setSelectedIndex(Math.min(selectedIndex, ng.photos.length - 1)); }
      }},
    ]);
  }

  const groups     = groupByDate(photos);
  const sortedGroups = sortDesc ? [...groups].reverse() : groups;
  const firstGroup = groups[0];
  const lastGroup  = groups[groups.length - 1];
  const totalDays  = groups.length > 1 ? Math.round((new Date(lastGroup.date).getTime() - new Date(firstGroup.date).getTime()) / 86400000) : 0;
  const totalWeeks = totalDays > 0 ? Math.round(totalDays / 7) : 0;
  const weightDebut  = firstGroup ? closestWeight(firstGroup.date) : null;
  const weightActuel = lastGroup  ? closestWeight(lastGroup.date)  : null;
  const weightDiff   = weightDebut !== null && weightActuel !== null ? +(weightActuel - weightDebut).toFixed(1) : null;
  const weightDiffStr = weightDiff !== null ? (weightDiff >= 0 ? '+' : '') + weightDiff + ' kg' : '—';
  const weightDiffColor = weightDiff === null ? C.dim : weightDiff >= 0 ? ACC : C.green;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#07060A' }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* ── HERO ── */}
          <View style={{ height: height * 0.44, position: 'relative' }}>
            <Animated.Image source={HERO_IMG} style={{ width: '100%', height: '100%', transform: [{ scale: heroScale }] }} resizeMode="cover" />
            <LinearGradient colors={['rgba(7,6,10,0.2)', 'transparent', 'rgba(7,6,10,0.7)', '#07060A']} locations={[0, 0.3, 0.72, 1]} style={StyleSheet.absoluteFillObject} />

            {/* Bouton fermer */}
            <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: insets.top + 12, left: 20, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: C.text, fontSize: 18 }}>‹</Text>
            </TouchableOpacity>

            {/* Bouton ajouter */}
            <TouchableOpacity onPress={addPhoto} disabled={uploading} style={{ position: 'absolute', top: insets.top + 30, right: 16, backgroundColor: 'rgba(0,0,0,0.65)', borderWidth: 1, borderColor: ACC + '77', borderRadius: 16, width: 62, paddingVertical: 10, alignItems: 'center', gap: 4 }}>
          {uploading ? <ActivityIndicator color={ACC} size="small" /> : <>
            <View style={{ height: 0, alignItems: 'center', overflow: 'visible' }}>
              <Image source={ICON_APPAREIL} style={{ width: 64, height: 64, transform: [{ translateY: -20 }] }} resizeMode="contain" />
            </View>
            <Text style={{ fontSize: 9, color: ACC, fontWeight: '700', letterSpacing: 1, marginTop: 14 }}>Ajouter</Text>
          </>}
            </TouchableOpacity>

            {/* Label + titre */}
            <View style={{ position: 'absolute', top: insets.top + 18, left: 0, right: 0, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: ACC, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' }}>TRANSFORMATION</Text>
            </View>
            <View style={{ position: 'absolute', bottom: 28, left: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Text style={{ color: ACC, fontSize: 12 }}>◈</Text>
                <Text style={{ fontSize: 10, color: ACC, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' }}>TRANSFORMATION</Text>
              </View>
              <Text style={{ fontSize: 34, color: C.text, fontWeight: '800', lineHeight: 38 }}>
                Ton <Text style={{ color: ACCB }}>évolution.</Text>
              </Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Reste constant. Deviens légendaire.</Text>
            </View>
          </View>

          <View style={{ paddingHorizontal: 16 }}>

            {/* ── STATS ── */}
            <View style={{ backgroundColor: '#0A060F', borderRadius: 18, borderWidth: 1, borderColor: ACC + '33', padding: 18, paddingTop: 48, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {[
                  { icon: ICON_PHOTOS,   value: photos.length.toString(), label: 'PHOTOS',  sub: 'au total', color: C.text },
                  { icon: ICON_SUIVI,    value: totalDays.toString(),     label: 'SUIVI',   sub: 'jours',    color: C.text },
                  { icon: ICON_OBJECTIF, value: weightActuel ? `${weightActuel} kg` : '— kg', label: 'OBJECTIF', sub: 'poids cible', color: GOLD },
                ].map((s, i) => (
                  <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                    <View style={{ height: 0, width: '100%', alignItems: 'center', overflow: 'visible' }}>
                      <Image source={s.icon} style={{ width: 80, height: 80, transform: [{ translateY: -50 }], opacity: 0.9 }} resizeMode="contain" />
                    </View>
                    <Text style={{ fontFamily: 'SpaceMono', fontSize: 18, color: s.color, fontWeight: '700', marginTop: 10 }}>{s.value}</Text>
                    <Text style={{ fontSize: 8, color: ACC, letterSpacing: 1, textTransform: 'uppercase', marginTop: 4, fontWeight: '700' }}>{s.label}</Text>
                    <Text style={{ fontSize: 9, color: C.dim, marginTop: 2, textAlign: 'center' }}>{s.sub}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── TES PHOTOS ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontSize: 11, color: ACC, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' }}>TES PHOTOS</Text>
              <TouchableOpacity
                onPress={() => setSortDesc(!sortDesc)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ACC + '22', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: ACC + '44' }}
              >
                <Text style={{ fontSize: 11, color: ACC }}>{sortDesc ? 'Plus récent' : 'Plus ancien'}</Text>
                <Text style={{ fontSize: 10, color: ACC }}>▾</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={{ height: 200, backgroundColor: '#0A060F', borderRadius: 16, borderWidth: 1, borderColor: ACC + '33', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={ACC} size="large" />
              </View>
            ) : groups.length === 0 ? (
              <TouchableOpacity onPress={addPhoto} style={{ height: 200, backgroundColor: '#0A060F', borderRadius: 16, borderWidth: 1, borderColor: ACC + '33', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <Image source={ICON_APPAREIL} style={{ width: 48, height: 48, opacity: 0.6 }} resizeMode="contain" />
                <Text style={{ fontSize: 15, color: C.text, fontWeight: '600' }}>Commence ta transformation</Text>
                <Text style={{ fontSize: 12, color: C.dim, textAlign: 'center', paddingHorizontal: 32, lineHeight: 18 }}>Ajoute ta première photo pour suivre tes progrès</Text>
              </TouchableOpacity>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
                ref={r => { if (r && sortDesc === false) setTimeout(() => r.scrollToEnd({ animated: false }), 100); }}
              >
                {sortedGroups.map((group, i) => {
                  const isFirst = group.date === groups[0]?.date;
                  const isLast  = group.date === groups[groups.length - 1]?.date;
                  const d = fmtDateShort(group.date);
                  return (
                    <TouchableOpacity key={group.date}
                      onPress={() => { setSelectedGroup(group); setSelectedIndex(0); }}
                      activeOpacity={0.88}
                      style={{ width: THUMB_W, borderRadius: 16, overflow: 'hidden', borderWidth: isLast ? 2 : 0.5, borderColor: isLast ? ACC : 'rgba(255,255,255,0.1)' }}
                    >
                      <Image source={{ uri: group.photos[0].url }} style={{ width: THUMB_W, height: THUMB_H }} resizeMode="cover" />
                      {/* Overlay gradient */}
                      <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']} locations={[0, 0.3, 0.6, 1]} style={StyleSheet.absoluteFillObject} />
                      {/* Date */}
                      <View style={{ position: 'absolute', top: 8, left: 8 }}>
                        <Text style={{ fontFamily: 'SpaceMono', fontSize: 20, color: '#fff', fontWeight: '700', lineHeight: 22 }}>{d.day}</Text>
                        <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', letterSpacing: 1 }}>{d.month}</Text>
                        <Text style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>{d.year}</Text>
                      </View>
                      {/* Infos bas */}
                      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 }}>
                        {isLast && (
                          <View style={{ backgroundColor: ACC, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 4 }}>
                            <Text style={{ fontSize: 9, color: '#fff', fontWeight: '700', letterSpacing: 1 }}>RÉCENT</Text>
                          </View>
                        )}
                        {isFirst && (
                          <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1 }}>DÉBUT</Text>
                          </View>
                        )}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'SpaceMono' }}>—</Text>
                          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'SpaceMono' }}>x{group.photos.length}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* ── COMPARAISON ── */}
            {groups.length >= 2 && (
              <View style={{ backgroundColor: '#0A060F', borderRadius: 18, borderWidth: 1, borderColor: ACC + '44', padding: 20, marginTop: 16, overflow: 'hidden' }}>
                <View style={{ position: 'absolute', right: -10, top: 0, width: 140, height: '100%', overflow: 'hidden' }}>
                  <Image source={STATUE_COMP} style={{ width: '100%', height: 220, position: 'absolute', top: 0, opacity: 0.18 }} resizeMode="cover" />
                </View>
                <Text style={{ fontSize: 11, color: ACC, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700', marginBottom: 16 }}>COMPARAISON</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9, color: C.dim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{firstGroup.label.toUpperCase()}</Text>
                    <Text style={{ fontFamily: 'SpaceMono', fontSize: 26, color: C.text, fontWeight: '700' }}>{weightDebut !== null ? `${weightDebut} kg` : '—'}</Text>
                    <Text style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>Début</Text>
                  </View>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: ACC + '22', borderWidth: 2, borderColor: ACC, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: ACC, fontSize: 22, fontWeight: '800', marginTop: -3 }}>›</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9, color: C.dim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{lastGroup.label.toUpperCase()}</Text>
                    <Text style={{ fontFamily: 'SpaceMono', fontSize: 26, color: ACCB, fontWeight: '700' }}>{weightActuel !== null ? `${weightActuel} kg` : '—'}</Text>
                    <Text style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>Actuel</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontFamily: 'SpaceMono', fontSize: 24, color: weightDiffColor, fontWeight: '700' }}>{weightDiffStr}</Text>
                    <Text style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>Progression totale</Text>
                    <View style={{ backgroundColor: ACC + '22', borderRadius: 8, borderWidth: 1, borderColor: ACC + '55', paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 }}>
                      <Text style={{ fontSize: 9, color: ACC, fontWeight: '700', letterSpacing: 1 }}>{totalWeeks > 0 ? `${totalWeeks} SEMAINES` : '—'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ── CONSEIL ── */}
            <View style={{ backgroundColor: '#0A060F', borderRadius: 16, borderWidth: 1, borderColor: ACC + '33', padding: 16, marginTop: 14 }}>
              <Text style={{ fontSize: 9, color: ACC, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700', marginBottom: 6 }}>CONSEIL</Text>
              <Text style={{ fontSize: 12, color: C.dim, lineHeight: 18 }}>
                Prends tes photos toujours dans les mêmes conditions : même lumière, même heure, même posture.
              </Text>
            </View>

          </View>
        </ScrollView>

        {selectedGroup && (
          <GalleryModal group={selectedGroup} initialIndex={selectedIndex} onClose={() => setSelectedGroup(null)} onDelete={deletePhoto} />
        )}
      </View>
    </Modal>
  );
}
