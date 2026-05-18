// components/AvatarCreator.tsx
import { useState, useEffect, useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  StyleSheet, Modal, Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '@/constants/colors';

const { width, height } = Dimensions.get('window');

// ─── Assets disponibles ───────────────────────────────────────────────────────
const BODIES: Record<string, Record<number, any>> = {
  slim: {
    1: require('@/assets/avatar/avatar_slim_skin1.png'),
    2: require('@/assets/avatar/avatar_slim_skin2.png'),
    3: require('@/assets/avatar/avatar_body_slim.png'),
    4: require('@/assets/avatar/avatar_slim_skin4.png'),
    5: require('@/assets/avatar/avatar_slim_skin5.png'),
  },
  athletic: {
    1: require('@/assets/avatar/avatar_athletic_skin1.png'),
    2: require('@/assets/avatar/avatar_athletic_skin2.png'),
    3: require('@/assets/avatar/avatar_body_athletic.png'),
    4: require('@/assets/avatar/avatar_athletic_skin4.png'),
    5: require('@/assets/avatar/avatar_athletic_skin5.png'),
  },
  built: {
    1: require('@/assets/avatar/avatar_body_built.png'), // fallback
    2: require('@/assets/avatar/avatar_body_built.png'), // fallback
    3: require('@/assets/avatar/avatar_body_built.png'),
    4: require('@/assets/avatar/avatar_body_built.png'), // fallback
    5: require('@/assets/avatar/avatar_body_built.png'), // fallback
  },
};


// ─── Offsets de centrage par skin ────────────────────────────────────────────
// skin 3 (avatar_body_X.png) = référence centrée, offset 0
// les autres PNG ont le personnage décalé à gauche → offset positif pour remettre au centre
const SKIN_OFFSET_X: Record<number, number> = {
  1: 0.07,   // 7% de la largeur vers la droite
  2: 0.05,
  3: 0,      // centré, référence
  4: 0.05,
  5: 0.07,
};
const BODY_OPTIONS = [
  { id: 'slim',     label: 'Mince',       desc: 'Agile & rapide' },
  { id: 'athletic', label: 'Athlétique',  desc: 'Équilibré & musclé' },
  { id: 'built',    label: 'Massif',      desc: 'Force & puissance' },
];

const SKIN_OPTIONS = [
  { id: 1, label: 'Très clair', color: '#F5DEB3' },
  { id: 2, label: 'Clair',      color: '#D4A574' },
  { id: 3, label: 'Médium',     color: '#C68642' },
  { id: 4, label: 'Foncé',      color: '#8D5524' },
  { id: 5, label: 'Très foncé', color: '#3D1C02' },
];

export type AvatarConfig = {
  body: 'slim' | 'athletic' | 'built';
  skin: number;
};

type Props = {
  visible: boolean;
  initial?: AvatarConfig;
  onSave: (config: AvatarConfig) => void;
  onClose: () => void;
};

export default function AvatarCreator({ visible, initial, onSave, onClose }: Props) {
  const [body, setBody] = useState<'slim' | 'athletic' | 'built'>(initial?.body ?? 'athletic');
  const [skin, setSkin] = useState<number>(initial?.skin ?? 3);

  // Source et offset affichés (mis à jour pendant le fade-out pour éviter tout saut visible)
  const [displayedBody, setDisplayedBody] = useState<'slim' | 'athletic' | 'built'>(initial?.body ?? 'athletic');
  const [displayedSkin, setDisplayedSkin] = useState<number>(initial?.skin ?? 3);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const avatarSource = BODIES[body][skin];
  const displayedSource = BODIES[displayedBody][displayedSkin];
  const displayedOffset = (SKIN_OFFSET_X[displayedSkin] ?? 0) * 220;

  useEffect(() => {
    // 1. Fade out
    Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      // 2. Invisible → on met à jour source + offset sans saut visible
      setDisplayedBody(body);
      setDisplayedSkin(skin);
      // 3. Fade in
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  }, [body, skin]);

  function handleSave() {
    onSave({ body, skin });
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <LinearGradient
          colors={['#0D0A00', C.bg]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.title}>TON GUERRIER</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.save}>Sauver</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Avatar preview */}
          <View style={styles.previewContainer}>
            <View style={styles.previewGlow} />
            <Animated.Image
              source={displayedSource}
              style={[styles.avatar, { opacity: fadeAnim, marginLeft: displayedOffset }]}
              resizeMode="contain"
            />
            {/* Ligne dorée sous les pieds */}
            <View style={styles.groundLine} />
          </View>

          {/* Physique */}
          <Text style={styles.sectionLabel}>PHYSIQUE</Text>
          <View style={styles.optionRow}>
            {BODY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.bodyOption, body === opt.id && styles.bodyOptionActive]}
                onPress={() => setBody(opt.id as any)}
              >
                <Text style={[styles.bodyLabel, body === opt.id && { color: C.goldBright }]}>
                  {opt.label}
                </Text>
                <Text style={styles.bodyDesc}>{opt.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Teinte de peau */}
          <Text style={styles.sectionLabel}>TEINTE</Text>
          <View style={styles.skinRow}>
            {SKIN_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.skinDot, { backgroundColor: opt.color }, skin === opt.id && styles.skinDotActive]}
                onPress={() => setSkin(opt.id)}
              >
                {skin === opt.id && (
                  <View style={styles.skinCheck}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.skinLabel}>
            {SKIN_OPTIONS.find(s => s.id === skin)?.label}
          </Text>

          {/* Note si fallback */}
          {(body === 'built' && skin !== 3) && (
            <Text style={styles.fallbackNote}>
              ✦ Plus de variantes disponibles prochainement
            </Text>
          )}

        </ScrollView>
      </View>
    </Modal>
  );
}


// ─── AvatarHero — demi-corps Liftoff, coupé à la taille, centré ─────────────
export function AvatarHero({ config, rankColor }: { config: AvatarConfig; rankColor?: string }) {
  const source = BODIES[config.body]?.[config.skin] ?? BODIES.athletic[3];
  const scrW   = Dimensions.get('window').width;

  // Image pleine largeur, ratio portrait naturel
  const IMG_W  = scrW;
  const IMG_H  = scrW * 1.55;
  // Coupure à ~52% = niveau taille/ceinture
  const SHOW_H = IMG_H * 0.52;

  return (
    <View style={{
      width: scrW,
      height: SHOW_H,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'flex-start',
    }}>
      {/* Glow ambiance */}
      <View style={{
        position: 'absolute',
        top: 40, alignSelf: 'center',
        width: scrW * 0.55, height: scrW * 0.55,
        borderRadius: scrW * 0.275,
        backgroundColor: rankColor ?? '#C9A84C',
        opacity: 0.08,
      }} />
      {/* Personnage — offset horizontal pour compenser le décentrage des PNG */}
      <Image
        source={source}
        style={{
          width: IMG_W,
          height: IMG_H,
          marginLeft: scrW * (SKIN_OFFSET_X[config.skin] ?? 0),
        }}
        resizeMode="contain"
      />
    </View>
  );
}

// ─── Avatar display (tête dans un cercle pour le profil) ─────────────────────
export function AvatarDisplay({ config, size = 64 }: { config: AvatarConfig; size?: number }) {
  const source = BODIES[config.body]?.[config.skin] ?? BODIES.athletic[3];
  // On affiche l'image 2.4x plus grande que le container, centrée,
  // et on la remonte légèrement pour montrer la tête (pas les pieds)
  const imgW   = size * 2.4;
  const imgH   = imgW * 1.6;
  const offX   = (imgW - size) / 2;  // pour centrer horizontalement
  const offY   = imgH * 0.02;        // remonter très légèrement
  return (
    <View style={{
      width: size, height: size,
      borderRadius: size / 2,
      overflow: 'hidden',
      backgroundColor: C.s2,
    }}>
      <Image
        source={source}
        style={{
          width: imgW,
          height: imgH,
          marginLeft: -offX + size * (SKIN_OFFSET_X[config.skin] ?? 0),
          marginTop: -offY,
        }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.s3,
  },
  cancel: { color: C.dim, fontSize: 14 },
  title:  { fontFamily: 'Cinzel', fontSize: 16, color: C.goldBright, letterSpacing: 3 },
  save:   { color: C.gold, fontSize: 14, fontWeight: '700' },

  scroll: { padding: 20, paddingBottom: 40 },

  // Preview
  previewContainer: {
    width: '100%',
    height: 380,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  previewGlow: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 20,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: C.gold,
    opacity: 0.08,
  },
  avatar: {
    width: '100%',
    height: 380,
    zIndex: 1,
  },
  groundLine: {
    position: 'absolute',
    bottom: 10,
    width: 120,
    height: 1,
    backgroundColor: C.goldDim,
    opacity: 0.5,
  },

  // Options
  sectionLabel: {
    fontSize: 9,
    color: C.gold,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 12,
    fontWeight: '700',
  },

  optionRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  bodyOption: {
    flex: 1,
    backgroundColor: C.s1,
    borderWidth: 1,
    borderColor: C.s3,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  bodyOptionActive: {
    borderColor: C.gold,
    backgroundColor: C.goldDim + '33',
  },
  bodyLabel: { fontFamily: 'Cinzel', fontSize: 11, color: C.dim, letterSpacing: 1, marginBottom: 3 },
  bodyDesc:  { fontSize: 9, color: C.dim, textAlign: 'center' },

  // Skin
  skinRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  skinDot: {
    width: 44, height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skinDotActive: {
    borderColor: C.goldBright,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  skinCheck: {
    width: 18, height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skinLabel: {
    fontSize: 10,
    color: C.dim,
    letterSpacing: 1,
    marginBottom: 28,
  },
  fallbackNote: {
    fontSize: 10,
    color: C.goldDim,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: -16,
  },
});
