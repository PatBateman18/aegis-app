import { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Image, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Easing } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useFocusEffect } from '@react-navigation/native';
import { useAmbientSound } from '@/hooks/useAmbientSound';
import { useDay } from '@/hooks/useDay';
import { useFragranceCollection } from '@/hooks/useFragranceCollection';
import { getDailyFragrance } from '@/constants/fragrances';
import { C } from '@/constants/colors';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const GREEN  = '#7BC67A';
const GREENB = '#A3D8A2';
const GREEND = '#7BC67A22';

const HERO_IMG              = require('@/assets/hero/hero_style.png');
const BG_IMG                = require('@/assets/hero/bg_style.png');
const INSPI_CLASSIQUE       = require('@/assets/hero/inspiration_classique.png');
const INSPI_DECONTRACTE     = require('@/assets/hero/inspiration_decontracte.png');
const INSPI_STREETWEAR      = require('@/assets/hero/inspiration_streetwear.png');

const ORB = 70;

// ─── StyleOrb ─────────────────────────────────────────────────────────────────
function StyleOrb({ icon, label, active, onPress, iconScale = 0.5 }: {
  icon: any; label: string; active: boolean; onPress: () => void; iconScale?: number;
}) {
  const scale    = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(active ? 1 : 0)).current;
  const checkAnim = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(glowAnim,  { toValue: active ? 1 : 0, duration: 250, useNativeDriver: false }).start();
    Animated.spring(checkAnim, { toValue: active ? 1 : 0, tension: 200, friction: 8, useNativeDriver: true }).start();
  }, [active]);

  function handlePress() {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.85, tension: 400, friction: 8, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1,    tension: 200, friction: 8, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(!active ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  const borderCol = glowAnim.interpolate({ inputRange: [0,1], outputRange: ['#1a2a1a', GREEN] });
  const bgCol     = glowAnim.interpolate({ inputRange: [0,1], outputRange: ['rgba(0,0,0,0)', GREEN + '18'] });

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={{ alignItems: 'center', width: ORB + 14 }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Animated.View style={{
          width: ORB, height: ORB, borderRadius: ORB / 2,
          borderWidth: active ? 2 : 1.5,
          borderColor: borderCol, backgroundColor: bgCol,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Image source={icon} style={{ width: ORB * iconScale, height: ORB * iconScale }} resizeMode="contain" />
          {active && (
            <Animated.View style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 18, height: 18, borderRadius: 9,
              backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center',
              opacity: checkAnim, transform: [{ scale: checkAnim }],
            }}>
              <Text style={{ color: '#000', fontSize: 10, fontWeight: '800' }}>✓</Text>
            </Animated.View>
          )}
        </Animated.View>
      </Animated.View>
      <Text style={{ fontSize: 7, marginTop: 6, textAlign: 'center', color: active ? GREEN : C.dim, fontWeight: active ? '700' : '400', letterSpacing: 0.3 }} numberOfLines={2}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ fontSize: 7, color: active ? C.green : C.dim, textAlign: 'center', marginTop: 1 }}>
        {active ? '1/1' : '0/1'}
      </Text>
    </TouchableOpacity>
  );
}

// ─── StatTile ─────────────────────────────────────────────────────────────────
function StatTile({ icon, value, max, label, sublabel }: {
  icon: any; value: number; max: number; label: string; sublabel: string;
}) {
  const pct = Math.min(value / max, 1);
  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#0A0F0A', borderRadius: 14, paddingTop: 46, paddingBottom: 12, paddingHorizontal: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }}>
      <Image source={icon} style={{ position: 'absolute', top: -4, width: 48, height: 48 }} resizeMode="contain" />
      <Text style={{ fontFamily: 'SpaceMono', fontSize: 16, color: C.text, fontWeight: '700' }}>{value}/{max}</Text>
      <Text style={{ fontSize: 8, color: GREEN, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2, textAlign: 'center', fontWeight: '700' }}>{label}</Text>
      <Text style={{ fontSize: 7, color: C.dim, marginTop: 1, textAlign: 'center' }}>{sublabel}</Text>
      <View style={{ height: 2, backgroundColor: '#1a2a1a', width: '100%', borderRadius: 1, marginTop: 8, overflow: 'hidden' }}>
        <View style={{ height: 2, backgroundColor: GREEN, width: `${pct * 100}%` as any, borderRadius: 1 }} />
      </View>
    </View>
  );
}

// ─── SkinRow ──────────────────────────────────────────────────────────────────
function SkinRow({ icon, label, value, onToggle, isLast }: {
  icon: string; label: string; value: boolean; onToggle: () => void; isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle(); }}
      style={{
        flexDirection: 'row', alignItems: 'center', padding: 16,
        borderBottomWidth: isLast ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.05)',
        backgroundColor: value ? GREEN + '0A' : 'transparent',
      }}
    >
      <View style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: value ? GREEN + '22' : 'rgba(255,255,255,0.05)',
        borderWidth: 1, borderColor: value ? GREEN + '55' : 'rgba(255,255,255,0.08)',
        alignItems: 'center', justifyContent: 'center', marginRight: 14,
      }}>
        <Text style={{ fontSize: 16, color: value ? GREEN : C.dim }}>{icon}</Text>
      </View>
      <Text style={{ flex: 1, fontSize: 15, color: value ? C.text : C.dim }}>{label}</Text>
      <View style={{
        width: 26, height: 26, borderRadius: 13,
        borderWidth: 1.5, borderColor: value ? GREEN : 'rgba(255,255,255,0.2)',
        backgroundColor: value ? GREEN + '22' : 'transparent',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {value && <Text style={{ color: GREEN, fontSize: 12, fontWeight: '800' }}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default function AppearanceScreen() {
  const { user } = useAuth();
  const { playAmbient } = useAmbientSound();

  useFocusEffect(useCallback(() => {
    playAmbient('style');
  }, []));
  const { collection, isInCollection, addFragrance } = useFragranceCollection(user?.id);
  const dailyFragrance = getDailyFragrance();
  const [showFullCollection, setShowFullCollection] = useState(false);
  const { day, goals, updateDay, updateGoals } = useDay(user?.id);
  const heroScale = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  const stagger = useRef([0,1,2,3,4,5,6,7,8].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.stagger(70, stagger.map(a =>
        Animated.spring(a, { toValue: 1, tension: 50, friction: 12, useNativeDriver: true })
      )).start();
    }, 150);
  }, []);
  const S = (i: number) => ({
    opacity: stagger[i],
    transform: [{ translateY: stagger[i].interpolate({ inputRange: [0,1], outputRange: [20, 0] }) }],
  });

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(heroScale, { toValue: 1.03, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(heroScale, { toValue: 1,    duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  const daysSince   = goals.last_haircut ? Math.floor((Date.now() - new Date(goals.last_haircut).getTime()) / 86400000) : null;
  const matingCount = [day.m_face, day.m_hydra, day.m_skin].filter(Boolean).length;

  const STYLE_HABITS = [
    { key: 'outfit_ok',     icon: require('@/assets/ui/icone_style_habiller.png'),         label: "S'HABILLER AVEC INTENTION", iconScale: 1.3 },
    { key: 'm_face',        icon: require('@/assets/ui/icone_style_routine.png'),           label: 'ROUTINE SOINS', iconScale: 1.3 },
    { key: 'm_skin',        icon: require('@/assets/ui/icone_style_coiffure_habitude.png'), label: 'COIFFURE SOIGNÉE', iconScale: 1.3 },
    { key: 'morning_water', icon: require('@/assets/ui/icone_style_parfum_habitude.png'),   label: 'PARFUM SIGNATURE', iconScale: 1.3 },
    { key: 'e_face',        icon: require('@/assets/ui/icone_style_tenue_prete.png'),       label: 'TENUE PRÊTE', iconScale: 1.3 },
    { key: 'e_hydra',       icon: require('@/assets/ui/icone_style_posture.png'),           label: 'POSTURE & ALLURE', iconScale: 1.3 },
  ];

  const INSPI = [
    { img: INSPI_CLASSIQUE,   label: 'Classique',    count: '12 looks' },
    { img: INSPI_DECONTRACTE, label: 'Décontracté',  count: '18 looks' },
    { img: INSPI_STREETWEAR,  label: 'Streetwear',   count: '15 looks' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#060A06' }} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }} keyboardShouldPersistTaps="handled">

        {/* ── HERO ── */}
        <View style={{ height: height * 0.52, position: 'relative', overflow: 'hidden' }}>
          <Animated.Image
            source={HERO_IMG}
            style={{ width: '100%', height: '100%', transform: [{ scale: 1.15 }, { translateY: 30 }] }}
            resizeMode="cover"
          />
          <LinearGradient colors={['transparent', 'rgba(6,10,6,0.4)', 'rgba(6,10,6,0.92)', '#060A06']} locations={[0.2, 0.5, 0.8, 1]} style={StyleSheet.absoluteFillObject} />
          <View style={{ position: 'absolute', top: insets.top + 12, left: 20, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: GREEN, fontSize: 10 }}>♛</Text>
            <Text style={{ fontSize: 10, color: GREEN, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' }}>Style & Apparence</Text>
          </View>
          <View style={{ position: 'absolute', bottom: 28, left: 20, right: 20 }}>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 42, color: C.text, fontWeight: '800', letterSpacing: 2 }}>STYLE</Text>
            <View style={{ height: 2, width: 40, backgroundColor: GREEN, borderRadius: 1, marginTop: 8, marginBottom: 8 }} />
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 20 }}>Sois une œuvre d'art.{'\n'}Ton style, ton identité.</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16 }}>

          {/* ── APERÇU DU JOUR ── */}
          <Animated.View style={[S(1), { marginBottom: 14 }]}>
            <Text style={{ fontSize: 11, color: GREEN, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700', marginBottom: 12 }}>APERÇU DU JOUR</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <StatTile icon={require('@/assets/ui/icone_style_tenue.png')}    value={day.outfit_ok ? 1 : 0} max={1} label="TENUE"    sublabel="Choix faits" />
              <StatTile icon={require('@/assets/ui/icone_style_soins.png')}    value={matingCount}            max={3} label="SOINS"    sublabel="Étapes" />
              <StatTile icon={require('@/assets/ui/icone_style_coiffure.png')} value={daysSince !== null ? (daysSince < 21 ? 1 : 0) : 0} max={1} label="COIFFURE" sublabel="Routine" />
              <StatTile icon={require('@/assets/ui/icone_style_parfum.png')}   value={day.morning_water ? 1 : 0} max={1} label="PARFUM" sublabel="Sélectionné" />
            </View>
          </Animated.View>

          {/* ── STYLE DU JOUR ── */}
          <Animated.View style={[S(2), { marginBottom: 14 }]}>
            <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: GREEN + '33' }}>
              <Image source={BG_IMG} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
              <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(4,8,4,0.75)' }} />
              <View style={{ padding: 18 }}>
                <Text style={{ fontSize: 10, color: GREEN, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700', marginBottom: 12 }}>STYLE DU JOUR</Text>
                <View style={{ height: 140, justifyContent: 'flex-end', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Text style={{ fontSize: 17, color: C.text, fontWeight: '800' }}>Minimal Dark Elegance</Text>
                    <View style={{ backgroundColor: GREEN + '33', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: GREEN + '55' }}>
                      <Text style={{ fontSize: 9, color: GREEN, fontWeight: '700', letterSpacing: 1 }}>ÉLÉGANT</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Un style intemporel, sobre et puissant.</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ── INSPIRATION ── */}
          <Animated.View style={[S(3), { marginBottom: 14 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 11, color: GREEN, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' }}>INSPIRATION</Text>
              <Text style={{ fontSize: 10, color: C.dim }}>VOIR TOUT  ›</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {INSPI.map((inspi, i) => (
                <TouchableOpacity key={i} style={{ flex: 1, borderRadius: 14, overflow: 'hidden', height: 200 }} activeOpacity={0.85}>
                  <Image
                    source={inspi.img}
                    style={{ width: '100%', height: 320, position: 'absolute', top: 0 }}
                    resizeMode="cover"
                  />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} locations={[0.5, 1]} style={StyleSheet.absoluteFillObject} />
                  <View style={{ position: 'absolute', bottom: 10, left: 10 }}>
                    <Text style={{ fontSize: 13, color: C.text, fontWeight: '700' }}>{inspi.label}</Text>
                    <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{inspi.count}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* ── SUGGESTIONS ── */}
          <Animated.View style={[S(4), { marginBottom: 14 }]}>
            <Text style={{ fontSize: 11, color: GREEN, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700', marginBottom: 12 }}>SUGGESTIONS</Text>
            <View style={{ backgroundColor: '#0A0F0A', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: '#1a1a2a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Image source={require('@/assets/ui/icone_style_parfum.png')} style={{ width: 56, height: 56 }} resizeMode="contain" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, color: C.text, fontWeight: '700' }}>{dailyFragrance.name}</Text>
                  <Text style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{dailyFragrance.brand}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <Text style={{ fontSize: 10, color: C.dim }}>Intensité</Text>
                    <View style={{ flexDirection: 'row', gap: 3 }}>
                      {[1,2,3,4,5].map(i => <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i <= dailyFragrance.intensite ? GREEN : 'rgba(255,255,255,0.1)' }} />)}
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Text style={{ fontSize: 10, color: C.dim }}>Tenue</Text>
                    <View style={{ flexDirection: 'row', gap: 3 }}>
                      {[1,2,3,4,5].map(i => <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i <= dailyFragrance.tenue ? GREEN : 'rgba(255,255,255,0.1)' }} />)}
                    </View>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                disabled={isInCollection(dailyFragrance.key)}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  addFragrance(dailyFragrance.key);
                }}
                style={{ backgroundColor: isInCollection(dailyFragrance.key) ? 'rgba(255,255,255,0.05)' : GREEN + '22', borderRadius: 12, borderWidth: 1, borderColor: isInCollection(dailyFragrance.key) ? 'rgba(255,255,255,0.1)' : GREEN + '44', padding: 12, alignItems: 'center', marginTop: 14 }}
              >
                <Text style={{ color: isInCollection(dailyFragrance.key) ? C.dim : GREEN, fontWeight: '700', fontSize: 13, letterSpacing: 1 }}>
                  {isInCollection(dailyFragrance.key) ? 'DÉJÀ DANS MA COLLECTION' : 'AJOUTER À MA COLLECTION'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ── MA COLLECTION ── */}
          {collection.length > 0 && (
            <Animated.View style={[S(4), { marginBottom: 14 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 11, color: GREEN, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' }}>MA COLLECTION</Text>
                {collection.length > 3 && (
                  <TouchableOpacity onPress={() => setShowFullCollection(v => !v)}>
                    <Text style={{ fontSize: 10, color: C.dim }}>
                      {showFullCollection ? 'VOIR MOINS' : `VOIR TOUT (${collection.length})`}  ›
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ backgroundColor: '#0A0F0A', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }}>
                {(showFullCollection ? collection : collection.slice(0, 3)).map((f, i) => (
                  <View key={f.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
                    <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#1a1a2a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                      <Image source={require('@/assets/ui/icone_style_parfum.png')} style={{ width: 22, height: 22 }} resizeMode="contain" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, color: C.text, fontWeight: '600' }}>{f.name}</Text>
                      <Text style={{ fontSize: 10, color: C.dim, marginTop: 1 }}>{f.brand}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* ── HABITUDES STYLE ── */}
          <Animated.View style={[S(5), { marginBottom: 14 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 11, color: GREEN, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' }}>HABITUDES STYLE</Text>
              <Text style={{ fontSize: 10, color: C.dim }}>VOIR TOUT  ›</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}>
              {STYLE_HABITS.map(h => (
                <StyleOrb
                  key={h.key}
                  icon={h.icon}
                  label={h.label}
                  iconScale={h.iconScale}
                  active={!!(day as any)[h.key]}
                  onPress={() => {
                    const v = !(day as any)[h.key];
                    const updates: any = { [h.key]: v };
                    if (h.key === 'm_face') { updates.m_face = v; updates.m_hydra = v; updates.m_skin = v; }
                    updateDay(updates);
                  }}
                />
              ))}
            </ScrollView>
          </Animated.View>

          {/* ── CITATION ── */}
          <Animated.View style={[S(6), { marginBottom: 14 }]}>
            <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }}>
              <Image source={BG_IMG} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
              <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(4,8,4,0.85)' }} />
              <View style={{ padding: 20, flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
                <Text style={{ fontFamily: 'Cinzel', fontSize: 28, color: GREEN, lineHeight: 28, marginTop: -4 }}>❝</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, color: C.text, lineHeight: 24, fontStyle: 'italic', marginBottom: 8 }}>
                    Le style est la manière de dire qui tu es{'\n'}sans avoir à parler.
                  </Text>
                  <Text style={{ fontSize: 10, color: GREEN, letterSpacing: 2, fontWeight: '600' }}>— RACHEL ZOE</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ── COIFFURE ── */}
          <Animated.View style={[S(7), { marginBottom: 14 }]}>
            <Text style={{ fontSize: 11, color: GREEN, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700', marginBottom: 12 }}>COIFFURE</Text>
            <View style={{ backgroundColor: '#0A0F0A', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 18 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View>
                  <Text style={{ fontSize: 15, color: C.text, fontWeight: '600' }}>Dernière coupe</Text>
                  <Text style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>
                    {goals.last_haircut
                      ? new Date(goals.last_haircut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                      : 'Non défini'}
                  </Text>
                </View>
                {daysSince !== null && (
                  <View style={{ backgroundColor: daysSince > 21 ? '#1a0808' : '#0A0F0A', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: daysSince > 21 ? C.red : GREEN + '33' }}>
                    <Text style={{ fontFamily: 'SpaceMono', fontSize: 20, color: daysSince > 21 ? C.red : GREEN }}>{daysSince}j</Text>
                    <Text style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>depuis</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={{ backgroundColor: GREEN + '15', borderRadius: 12, borderWidth: 1, borderColor: GREEN + '33', padding: 14, alignItems: 'center' }}
                onPress={() => updateGoals({ last_haircut: new Date().toISOString().split('T')[0] })}
              >
                <Text style={{ color: GREEN, fontWeight: '600', fontSize: 13 }}>✦  Enregistrer une coupe aujourd'hui</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
