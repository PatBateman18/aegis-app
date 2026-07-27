// components/MentorScreen.tsx
import { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Modal, Dimensions, Animated, Easing } from 'react-native';
import Svg, { Polygon, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/constants/colors';
import { MENTORS, getMentor, type MentorId, type Mentor } from '@/constants/mentors';
import { getDailyMentorMessage } from '@/constants/mentorMessages';
import { usePremium } from '@/hooks/usePremium';

const { width, height } = Dimensions.get('window');
const GOLD  = '#C9A84C';
const GOLDB = '#E8C46A';
const RED   = '#D94F4F';
const GREEN = '#52C97A';
const BG    = '#07060A';

// Grille 2 colonnes : largeur écran - padding latéral (40) - 1 gap (12)
const CARD_W = (width - 40 - 12) / 2;
const CARD_IMG_H = CARD_W * 1.2;

// ─── Placeholder pour les mentors dont le portrait n'existe pas encore ───────
function MentorPlaceholder({ letter, size }: { letter: string; size: number }) {
  return (
    <View style={{ width: '100%', height: size, backgroundColor: '#0D0B07', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size * 0.45} height={size * 0.45} viewBox="0 0 100 100">
        <Polygon points="50,6 88,28 88,72 50,94 12,72 12,28" fill="none" stroke={GOLD} strokeOpacity={0.35} strokeWidth={3} />
        <Path d="M35 70 L50 30 L65 70" fill="none" stroke={GOLD} strokeOpacity={0.5} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <Text style={{ fontFamily: 'Cinzel', fontSize: 11, color: GOLD + '55', letterSpacing: 2, marginTop: 6 }}>{letter}</Text>
    </View>
  );
}

type Props = {
  visible: boolean;
  onClose: () => void;
  mentorId: MentorId | null;
  onSelectMentor: (id: MentorId) => void;
  gender: string;
  userId: string | undefined;
};

type Filter = 'all' | 'unlocked' | 'locked';

export default function MentorScreen({ visible, onClose, mentorId, onSelectMentor, gender, userId }: Props) {
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium(userId);
  const mentor = getMentor(mentorId);
  const [filter, setFilter] = useState<Filter>('all');
  const heroScale = useRef(new Animated.Value(1)).current;

  // Respiration lente du hero, comme sur les autres pages
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(heroScale, { toValue: 1.04, duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(heroScale, { toValue: 1,    duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [visible]);

  const genderKey = gender === 'female' ? 'female' : 'male';
  const roster = MENTORS.filter(m => m.gender === genderKey);

  const filtered = roster.filter(m => {
    if (filter === 'unlocked') return !m.premium || isPremium;
    if (filter === 'locked') return m.premium && !isPremium;
    return true;
  });

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'TOUS' },
    { key: 'unlocked', label: 'DÉBLOQUÉS' },
    { key: 'locked', label: 'NON DÉBLOQUÉS' },
  ];

  function renderCard(m: Mentor) {
    const active = m.id === mentor.id;
    const locked = m.premium && !isPremium;

    return (
      <TouchableOpacity
        key={m.id}
        disabled={locked}
        onPress={() => onSelectMentor(m.id)}
        activeOpacity={0.8}
        style={{
          width: CARD_W,
          borderRadius: 14,
          overflow: 'hidden',
          borderWidth: active ? 2 : 1,
          borderColor: active ? GOLD : 'rgba(255,255,255,0.09)',
          backgroundColor: '#0A0800',
        }}
      >
        <View style={{ width: '100%', height: CARD_IMG_H, position: 'relative' }}>
          {m.portrait ? (
            <Image source={m.portrait} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <MentorPlaceholder letter={m.name.charAt(0)} size={CARD_IMG_H} />
          )}

          <View style={[StyleSheet.absoluteFillObject, {
            backgroundColor: locked ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.18)',
          }]} />

          {active && (
            <View style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#000', fontSize: 14, fontWeight: '800' }}>✓</Text>
            </View>
          )}
          {locked && (
            <View style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.65)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={13} height={13} viewBox="0 0 24 24">
                <Path d="M7 11V8a5 5 0 0110 0v3" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth={2.5} strokeLinecap="round" />
                <Path d="M5 11h14v9H5z" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth={2.5} strokeLinejoin="round" />
              </Svg>
            </View>
          )}
        </View>

        <View style={{ padding: 11, paddingTop: 10 }}>
          <Text
            numberOfLines={1}
            style={{ fontFamily: 'Cinzel', fontSize: 15, fontWeight: '700', letterSpacing: 0.5, color: locked ? 'rgba(255,255,255,0.45)' : active ? GOLDB : C.text }}
          >
            {m.name}
          </Text>
          <Text numberOfLines={2} style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 14, marginTop: 3 }}>
            {m.traits}
          </Text>
          <Text style={{ fontSize: 10, fontWeight: '700', marginTop: 7, color: active ? GOLD : locked ? RED : GREEN }}>
            {active ? 'MENTOR ACTUEL' : locked ? 'VERROUILLÉ' : 'DÉBLOQUÉ'}
          </Text>
          {locked && !!m.unlockHint && (
            <Text numberOfLines={2} style={{ fontSize: 9, color: 'rgba(255,255,255,0.32)', lineHeight: 13, marginTop: 3 }}>
              {m.unlockHint}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: BG }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

          {/* ── HERO plein cadre, fondu dans le fond ── */}
          <View style={{ height: height * 0.56, position: 'relative', overflow: 'hidden' }}>
            {mentor.portrait ? (
              <Animated.Image
                source={mentor.portrait}
                style={{ width: '100%', height: '100%', transform: [{ scale: heroScale }] }}
                resizeMode="cover"
              />
            ) : (
              <MentorPlaceholder letter={mentor.name.charAt(0)} size={height * 0.56} />
            )}

            <LinearGradient
              colors={['rgba(7,6,10,0.75)', 'transparent', 'rgba(7,6,10,0.72)', BG]}
              locations={[0, 0.28, 0.7, 1]}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Header par-dessus le hero */}
            <View style={{ position: 'absolute', top: insets.top + 10, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={onClose}
                style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: GOLD + '44', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: GOLD, fontSize: 18 }}>‹</Text>
              </TouchableOpacity>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontFamily: 'Cinzel', fontSize: 17, color: GOLDB, letterSpacing: 3, fontWeight: '700' }}>MENTOR</Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Choisis celui qui guidera ta légende.</Text>
              </View>
              <View style={{ width: 38 }} />
            </View>

            {/* Bloc texte en bas du hero */}
            <View style={{ position: 'absolute', bottom: 22, left: 20, right: 20 }}>
              <Text style={{ fontFamily: 'Cinzel', fontSize: 40, color: C.text, fontWeight: '800', letterSpacing: 1, lineHeight: 46 }}>
                {mentor.name}
              </Text>
              <Text style={{ fontSize: 10, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700', marginTop: 2 }}>
                MENTOR ACTUEL
              </Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', lineHeight: 21, marginTop: 14 }}>
                ❝ {getDailyMentorMessage(mentor.id)} ❞
              </Text>
              <TouchableOpacity
                style={{
                  marginTop: 16, alignSelf: 'flex-start',
                  paddingHorizontal: 20, paddingVertical: 10,
                  borderRadius: 10, borderWidth: 1, borderColor: GOLD + '77',
                  backgroundColor: 'rgba(0,0,0,0.35)',
                }}
              >
                <Text style={{ fontSize: 11, color: GOLDB, fontWeight: '700', letterSpacing: 1.5 }}>EN SAVOIR PLUS</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 10 }}>

            {/* ── FILTRES ── */}
            <Text style={{ fontSize: 12, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700', marginBottom: 12 }}>
              TOUS LES MENTORS
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
              {filters.map(f => (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  style={{
                    paddingHorizontal: 14, height: 34, borderRadius: 10, justifyContent: 'center',
                    backgroundColor: filter === f.key ? GOLD + '22' : 'rgba(255,255,255,0.04)',
                    borderWidth: 1, borderColor: filter === f.key ? GOLD : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: '700', color: filter === f.key ? GOLD : C.dim }}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── GRILLE 3 COLONNES ── */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {filtered.map(renderCard)}
            </View>

            {/* ── À PROPOS ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#0A0800', borderRadius: 16, borderWidth: 1, borderColor: GOLD + '22', padding: 16, marginTop: 22 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: GOLD + '14', alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={20} height={20} viewBox="0 0 100 100">
                  <Path d="M35 70 L50 30 L65 70" fill="none" stroke={GOLD} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: GOLDB, fontWeight: '700', marginBottom: 3, letterSpacing: 0.5 }}>À PROPOS DES MENTORS</Text>
                <Text style={{ fontSize: 11, color: C.dim, lineHeight: 16 }}>
                  Chaque mentor t'apporte une perspective unique et t'aide à devenir la meilleure version de toi-même.
                </Text>
              </View>
              <Text style={{ color: C.dim, fontSize: 18 }}>›</Text>
            </View>

          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
