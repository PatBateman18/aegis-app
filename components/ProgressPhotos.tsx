// components/ProgressPhotos.tsx
import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Image, ActivityIndicator, Dimensions, Alert,
  Animated, StatusBar, FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { C } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
// ─── Accent couleur (page Corps) ─────────────────────────────────────────────
const ACC  = '#8E44AD';
const ACCB = '#A55CC0';
const ACCD = '#8E44AD33';
// ─────────────────────────────────────────────────────────────────────────────


const { width, height } = Dimensions.get('window');
const THUMB_SIZE = 110;

type ProgressPhoto = {
  name: string;
  url: string;
  date: string;
  label: string;
};

type DayGroup = {
  date: string;
  label: string;
  photos: ProgressPhoto[];
};

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function extractDate(filename: string): string {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : new Date().toISOString().split('T')[0];
}

// Groupe les photos par date
function groupByDate(photos: ProgressPhoto[]): DayGroup[] {
  const map: Record<string, ProgressPhoto[]> = {};
  for (const p of photos) {
    if (!map[p.date]) map[p.date] = [];
    map[p.date].push(p);
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a)) // plus récent en premier
    .map(([date, photos]) => ({ date, label: fmtDate(date), photos }));
}

// ─── Photo avec placeholder ───────────────────────────────────────────────────
function PhotoItem({ item }: { item: ProgressPhoto }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <View style={{ width, flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      {!loaded && (
        <Image
          source={{ uri: item.url }}
          style={{ position: 'absolute', width, height: '100%', opacity: 0.3 }}
          resizeMode="cover"
          blurRadius={8}
        />
      )}
      <Image
        source={{ uri: item.url }}
        style={{ width, height: '100%', opacity: loaded ? 1 : 0 }}
        resizeMode="contain"
        onLoad={() => setLoaded(true)}
      />
      {!loaded && (
        <ActivityIndicator color={ACC} size="large" style={{ position: 'absolute' }} />
      )}
    </View>
  );
}

// ─── Dot animé ───────────────────────────────────────────────────────────────
function AnimatedDot({ active }: { active: boolean }) {
  const widthAnim = useRef(new Animated.Value(active ? 14 : 5)).current;
  const opacAnim  = useRef(new Animated.Value(active ? 1 : 0.35)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(widthAnim, { toValue: active ? 14 : 5, tension: 120, friction: 10, useNativeDriver: false }),
      Animated.timing(opacAnim,  { toValue: active ? 1 : 0.35, duration: 200, useNativeDriver: false }),
    ]).start();
  }, [active]);

  return (
    <Animated.View style={{
      height: 5,
      width: widthAnim,
      borderRadius: 3,
      backgroundColor: ACCB,
      opacity: opacAnim,
    }} />
  );
}

// ─── Galerie plein écran ──────────────────────────────────────────────────────
function GalleryModal({
  group, initialIndex, onClose, onDelete,
}: {
  group: DayGroup;
  initialIndex: number;
  onClose: () => void;
  onDelete: (photo: ProgressPhoto) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatRef = useRef<FlatList>(null);
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

  const borderRadius = scale.interpolate({
    inputRange: [0.88, 1],
    outputRange: [20, 0],
    extrapolate: 'clamp',
  });

  const current = group.photos[currentIndex];

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
      <StatusBar hidden />
      <Animated.View style={[fs.overlay, { opacity: bgOpacity }]}>
        <Animated.View style={[{ flex: 1, overflow: 'hidden' }, { transform: [{ scale }], borderRadius }]}>

          {/* Header */}
          <View style={fs.header}>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }} style={fs.closeBtn}>
              <Text style={fs.closeText}>✕</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={fs.date}>{group.label}</Text>
              {group.photos.length > 1 && (
                <Text style={fs.counter}>{currentIndex + 1} / {group.photos.length}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => onDelete(current)} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }} style={fs.deleteBtn}>
              <Text style={fs.deleteText}>🗑️</Text>
            </TouchableOpacity>
          </View>

          {/* Photos */}
          <FlatList
            ref={flatRef}
            data={group.photos}
            horizontal
            pagingEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialIndex}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            onMomentumScrollEnd={e => {
              const i = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentIndex(i);
            }}
            renderItem={({ item }) => <PhotoItem item={item} />}
            keyExtractor={item => item.name}
          />

          {/* Dots animés */}
          {group.photos.length > 1 && (
            <View style={fs.dots}>
              {group.photos.map((_, i) => (
                <AnimatedDot key={i} active={i === currentIndex} />
              ))}
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function ProgressPhotos({ userId }: { userId: string }) {
  const [photos, setPhotos]         = useState<ProgressPhoto[]>([]);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DayGroup | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => { loadPhotos(); }, [userId]);

  async function loadPhotos() {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('progress-photos')
        .list(userId, { sortBy: { column: 'created_at', order: 'desc' } });

      if (error || !data) { setLoading(false); return; }

      const loaded: ProgressPhoto[] = data
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(f => {
          const dateStr = extractDate(f.name);
          const { data: urlData } = supabase.storage
            .from('progress-photos')
            .getPublicUrl(`${userId}/${f.name}`);
          return { name: f.name, url: urlData.publicUrl, date: dateStr, label: fmtDate(dateStr) };
        });

      setPhotos(loaded);
    } catch {}
    setLoading(false);
  }

  async function addPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission requise', "Autorise l'accès à la galerie dans les Réglages.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (result.canceled || result.assets.length === 0) return;

    setUploading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Optimistic update — affiche les photos immédiatement depuis l'URI locale
      const optimisticPhotos: ProgressPhoto[] = result.assets.map((asset, i) => {
        const filename = `photo_${today}_${Date.now() + i}.jpg`;
        return {
          name: filename,
          url: asset.uri, // URI locale en attendant l'upload
          date: today,
          label: fmtDate(today),
        };
      });
      setPhotos(prev => [...optimisticPhotos, ...prev]);

      // Upload en parallèle
      const uploaded = await Promise.all(result.assets.map(async (asset, i) => {
        const filename = optimisticPhotos[i].name;
        const response = await fetch(asset.uri);
        const blob     = await response.blob();
        const arr      = await new Response(blob).arrayBuffer();
        const { data: urlData } = supabase.storage
          .from('progress-photos')
          .getPublicUrl(`${userId}/${filename}`);
        await supabase.storage
          .from('progress-photos')
          .upload(`${userId}/${filename}`, new Uint8Array(arr), { contentType: 'image/jpeg', upsert: false });
        // Remplace l'URI locale par l'URL Supabase définitive
        return { ...optimisticPhotos[i], url: urlData.publicUrl };
      }));

      // Remplace les entrées optimistes par les vraies URLs
      setPhotos(prev => {
        const optimisticNames = new Set(optimisticPhotos.map(p => p.name));
        return [...uploaded, ...prev.filter(p => !optimisticNames.has(p.name))];
      });
    } catch {
      // En cas d'erreur — reload depuis Supabase
      await loadPhotos();
      Alert.alert('Erreur', 'Une erreur est survenue.');
    }
    setUploading(false);
  }

  async function deletePhoto(photo: ProgressPhoto) {
    Alert.alert(
      'Supprimer cette photo ?',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await supabase.storage.from('progress-photos').remove([`${userId}/${photo.name}`]);
            const newPhotos = photos.filter(x => x.name !== photo.name);
            setPhotos(newPhotos);
            // Si plus de photos dans le groupe → ferme la galerie
            const newGroup = selectedGroup
              ? { ...selectedGroup, photos: selectedGroup.photos.filter(x => x.name !== photo.name) }
              : null;
            if (!newGroup || newGroup.photos.length === 0) {
              setSelectedGroup(null);
            } else {
              setSelectedGroup(newGroup);
              setSelectedIndex(Math.min(selectedIndex, newGroup.photos.length - 1));
            }
          },
        },
      ]
    );
  }

  const groups = groupByDate(photos);

  return (
    <View style={{ marginBottom: 14 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.sectionRow}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>PHOTOS DE TRANSFORMATION</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, uploading && { opacity: 0.6 }]}
          onPress={addPhoto}
          disabled={uploading}
        >
          {uploading
            ? <ActivityIndicator color={ACC} size="small" />
            : <Text style={styles.addBtnText}>+ Photo</Text>
          }
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}><ActivityIndicator color={ACC} /></View>
      ) : groups.length === 0 ? (
        <TouchableOpacity style={styles.emptyBox} onPress={addPhoto}>
          <Text style={styles.emptyIcon}>📸</Text>
          <Text style={styles.emptyTitle}>Commence ta transformation</Text>
          <Text style={styles.emptySub}>Ajoute ta première photo pour suivre tes progrès</Text>
        </TouchableOpacity>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeline}>
          {/* Bouton ajout */}
          <TouchableOpacity style={styles.addThumb} onPress={addPhoto} disabled={uploading}>
            <Text style={styles.addThumbIcon}>+</Text>
            <Text style={styles.addThumbLabel}>Ajouter</Text>
          </TouchableOpacity>

          {groups.map((group, i) => (
            <TouchableOpacity
              key={group.date}
              style={styles.photoItem}
              onPress={() => { setSelectedGroup(group); setSelectedIndex(0); }}
              onLongPress={() => deletePhoto(group.photos[0])}
              activeOpacity={0.85}
            >
              {/* Timeline */}
              <View style={styles.timelineLine}>
                <View style={[styles.timelineDot, i === 0 && styles.timelineDotActive]} />
                {i < groups.length - 1 && <View style={styles.timelineConnector} />}
              </View>

              {/* Miniature */}
              <View>
                <Image source={{ uri: group.photos[0].url }} style={styles.thumb} resizeMode="cover" />
                {/* Badge nombre de photos si > 1 */}
                {group.photos.length > 1 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>×{group.photos.length}</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.photoDate, i === 0 && { color: ACC }]}>{group.label}</Text>
              {i === 0 && (
                <View style={styles.latestBadge}>
                  <Text style={styles.latestText}>RÉCENT</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {selectedGroup && (
        <GalleryModal
          group={selectedGroup}
          initialIndex={selectedIndex}
          onClose={() => setSelectedGroup(null)}
          onDelete={deletePhoto}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 6 },
  sectionRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionBar:   { width: 3, height: 14, backgroundColor: ACC, borderRadius: 2 },
  sectionTitle: { fontSize: 10, letterSpacing: 3, color: ACC, textTransform: 'uppercase', fontWeight: '700' },
  addBtn:       { borderWidth: 1, borderColor: ACCD, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText:   { color: ACC, fontSize: 13, fontWeight: '600' },
  loadingBox:   { height: 160, backgroundColor: C.s1, borderRadius: 14, borderWidth: 1, borderColor: C.s3, alignItems: 'center', justifyContent: 'center' },
  emptyBox:     { height: 160, backgroundColor: C.s1, borderRadius: 14, borderWidth: 1, borderColor: C.s3, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyIcon:    { fontSize: 32 },
  emptyTitle:   { fontSize: 14, color: C.text, fontWeight: '600' },
  emptySub:     { fontSize: 11, color: C.dim, textAlign: 'center', paddingHorizontal: 32 },
  timeline:     { paddingHorizontal: 4, paddingBottom: 4, gap: 12, alignItems: 'flex-start' },
  photoItem:    { alignItems: 'center', width: THUMB_SIZE },
  timelineLine: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 8 },
  timelineDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: C.s3, borderWidth: 1, borderColor: C.dim },
  timelineDotActive: { backgroundColor: ACC, borderColor: ACC },
  timelineConnector: { flex: 1, height: 1, backgroundColor: C.s3 },
  thumb:        { width: THUMB_SIZE, height: THUMB_SIZE * 1.33, borderRadius: 10, backgroundColor: C.s2, borderWidth: 1, borderColor: C.s3 },
  photoDate:    { fontSize: 9, color: C.dim, marginTop: 6, textAlign: 'center' },
  latestBadge:  { marginTop: 4, backgroundColor: ACCD, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  latestText:   { fontSize: 8, color: ACC, letterSpacing: 1, fontWeight: '700' },
  addThumb: {
    width: THUMB_SIZE, height: THUMB_SIZE * 1.33,
    borderRadius: 10, borderWidth: 1, borderColor: ACCD,
    borderStyle: 'dashed', backgroundColor: ACCD,
    alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16,
  },
  addThumbIcon:  { fontSize: 24, color: ACC },
  addThumbLabel: { fontSize: 11, color: ACC },
  countBadge: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2,
    borderWidth: 1, borderColor: ACCD,
  },
  countText: { fontSize: 9, color: ACCB, fontWeight: '700' },
});

const fs = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeBtn:  { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 20, color: '#fff', fontWeight: '300' },
  date:      { fontFamily: 'Cinzel', fontSize: 13, color: ACCB, letterSpacing: 1 },
  counter:   { fontSize: 10, color: C.dim, marginTop: 2, textAlign: 'center' },
  deleteBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  deleteText:{ fontSize: 22 },
  dots: { position: 'absolute', bottom: 36, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot:       { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: ACCB, width: 14 },
});
