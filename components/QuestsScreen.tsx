// components/QuestsScreen.tsx
import { useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet, Dimensions, Modal, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/constants/colors';
import { type Quest } from '@/constants/quests';
import { type DailyLog } from '@/constants/types';

const { width, height } = Dimensions.get('window');
const GOLD  = '#C9A84C';
const GOLDB = '#E8C46A';

const HERO_IMG    = require('@/assets/hero/hero_quetes.png');
const BG_CARD_IMG = require('@/assets/hero/bg_quete_card.png');

// ─── QuestCard ────────────────────────────────────────────────────────────────
function QuestCard({ quest, day, completed }: { quest: Quest; day: DailyLog; completed: boolean }) {
  const active = quest.check(day);
  const done   = completed || active;
  const color  = quest.fixed ? GOLD : quest.color;

  const barAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: done ? 1 : 0,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [done]);

  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  // Calcul progression partielle
  const getProgress = (): string => {
    if (quest.id === 'forge_du_jour') {
      const count = ['workout_done','calories_ok','learning_done','m_face','outfit_ok','morning_water']
        .filter(k => !!(day as any)[k]).length;
      return `${count}/6`;
    }
    return done ? 'Complété' : '';
  };

  return (
    <View style={{
      borderRadius: 20, overflow: 'hidden', marginBottom: 12,
      borderWidth: 1.5, borderColor: done ? color + '66' : 'rgba(255,255,255,0.08)',
    }}>
      {/* Image de fond */}
      <Image source={BG_CARD_IMG} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
      <View style={{ position: 'absolute', inset: 0, backgroundColor: done ? 'rgba(5,3,0,0.78)' : 'rgba(5,3,0,0.88)' }} />
      {done && <View style={{ position: 'absolute', inset: 0, backgroundColor: color + '06' }} />}

      <View style={{ padding: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
        {/* Icône */}
        <View style={{
          width: 48, height: 48, borderRadius: 14,
          backgroundColor: done ? color + '22' : 'rgba(255,255,255,0.06)',
          borderWidth: 1.5, borderColor: done ? color + '66' : 'rgba(255,255,255,0.1)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 20, color: done ? color : C.dim }}>{quest.icon}</Text>
        </View>

        {/* Contenu */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {quest.fixed && (
              <View style={{ backgroundColor: GOLD + '33', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: GOLD + '55' }}>
                <Text style={{ fontSize: 8, color: GOLD, fontWeight: '700', letterSpacing: 1 }}>FIXE</Text>
              </View>
            )}
            <Text style={{ fontFamily: 'Cinzel', fontSize: 14, color: done ? color : C.text, letterSpacing: 0.5, flex: 1 }}>
              {quest.title}
            </Text>
            <Text style={{ fontFamily: 'SpaceMono', fontSize: 13, color: done ? color : C.dim, fontWeight: '700' }}>
              +{quest.xp} XP
            </Text>
          </View>

          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 18, marginBottom: 14 }}>
            {quest.description}
          </Text>

          {/* Barre de progression */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginRight: 12 }}>
              <Animated.View style={{ height: '100%', borderRadius: 2, width: barWidth, backgroundColor: color }} />
            </View>
            {done ? (
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: color + '22', borderWidth: 1.5, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color, fontSize: 13, fontWeight: '800' }}>✓</Text>
              </View>
            ) : (
              <Text style={{ fontSize: 10, color: C.dim, fontFamily: 'SpaceMono' }}>{getProgress()}</Text>
            )}
          </View>
          {getProgress() && (
            <Text style={{ fontSize: 10, color: done ? color + 'AA' : C.dim, fontFamily: 'SpaceMono' }}>{getProgress()}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
type Props = {
  visible: boolean;
  onClose: () => void;
  quests: Quest[];
  day: DailyLog;
  completedIds: Set<string>;
  streak?: number;
};

export default function QuestsScreen({ visible, onClose, quests, day, completedIds, streak = 0 }: Props) {
  const insets    = useSafeAreaInsets();
  const heroScale = useRef(new Animated.Value(1)).current;
  const stagger   = useRef([0,1,2].map(() => new Animated.Value(0))).current;

  const totalXP   = quests.reduce((acc, q) => acc + ((completedIds.has(q.id) || q.check(day)) ? q.xp : 0), 0);
  const doneCount = quests.filter(q => completedIds.has(q.id) || q.check(day)).length;

  // 7 derniers jours pour le streak quêtes
  const today7 = (() => {
    const now = new Date();
    const daysFromMon = (now.getDay() + 6) % 7;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - daysFromMon + i);
      return {
        dayName: ['L','M','M','J','V','S','D'][i],
        done: d <= now && i < (daysFromMon + 1),
        isFuture: d > now,
      };
    });
  })();

  useEffect(() => {
    if (!visible) return;
    stagger.forEach(a => a.setValue(0));
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(heroScale, { toValue: 1.04, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(heroScale, { toValue: 1,    duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    setTimeout(() => {
      Animated.stagger(100, stagger.map(a =>
        Animated.spring(a, { toValue: 1, tension: 50, friction: 12, useNativeDriver: true })
      )).start();
    }, 200);
    return () => loop.stop();
  }, [visible]);

  const S = (i: number) => ({
    opacity: stagger[i],
    transform: [{ translateY: stagger[i].interpolate({ inputRange: [0,1], outputRange: [24, 0] }) }],
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#07060A' }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* ── HERO ── */}
          <View style={{ height: height * 0.45, position: 'relative', overflow: 'hidden' }}>
            <Animated.Image
              source={HERO_IMG}
              style={{
                width: '100%',
                height: '160%',
                transform: [{ scale: heroScale }],
                position: 'absolute',
                top: 0,
              }}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(7,6,10,0.3)', 'transparent', 'rgba(7,6,10,0.6)', '#07060A']}
              locations={[0, 0.3, 0.7, 1]}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Bouton fermer */}
            <TouchableOpacity
              onPress={onClose}
              style={{
                position: 'absolute', top: insets.top + 12, left: 20,
                width: 38, height: 38, borderRadius: 19,
                backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ color: C.text, fontSize: 16 }}>‹</Text>
            </TouchableOpacity>

            {/* Label */}
            <View style={{ position: 'absolute', top: insets.top + 18, left: 0, right: 0, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' }}>QUÊTES DU JOUR</Text>
            </View>

            {/* Bas hero */}
            <View style={{ position: 'absolute', bottom: 28, left: 20, right: 20 }}>
              <Text style={{ fontSize: 30, color: C.text, fontWeight: '800', lineHeight: 36, marginBottom: 12 }}>
                Accomplis ce qui{'\n'}te rapproche de ta{'\n'}
                <Text style={{ color: GOLDB }}>meilleure version.</Text>
              </Text>

              {/* Badge progression */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: GOLD, backgroundColor: GOLD + '22', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: 'SpaceMono', fontSize: 14, color: GOLD, fontWeight: '700' }}>{doneCount}/{quests.length}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 11, color: C.dim, letterSpacing: 1, textTransform: 'uppercase' }}>Quêtes terminées</Text>
                  {totalXP > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Text style={{ fontFamily: 'SpaceMono', fontSize: 13, color: GOLD, fontWeight: '700' }}>+{totalXP} XP</Text>
                      <Text style={{ color: GOLD, fontSize: 10 }}>◆</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          <View style={{ paddingHorizontal: 16 }}>

            {/* ── QUÊTES ── */}
            <Animated.View style={S(0)}>
              {quests.map(q => (
                <QuestCard key={q.id} quest={q} day={day} completed={completedIds.has(q.id)} />
              ))}
            </Animated.View>

            {/* ── STREAK QUÊTES ── */}
            <Animated.View style={[S(1), {
              backgroundColor: '#0A0800',
              borderRadius: 20, borderWidth: 1, borderColor: GOLD + '33',
              padding: 18, marginTop: 4,
            }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: GOLD, backgroundColor: GOLD + '18', alignItems: 'center', justifyContent: 'center' }}>
                    <Image source={require('@/assets/ui/icone_calories2.png')} style={{ width: 100, height: 100 }} resizeMode="contain" />
                  </View>
                </View>
                <View>
                  <Text style={{ fontSize: 9, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>STREAK QUÊTES</Text>
                  <Text style={{ fontFamily: 'SpaceMono', fontSize: 22, color: GOLDB, fontWeight: '700' }}>{streak} jours</Text>
                  <Text style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>Continue ton élan.</Text>
                </View>
              </View>

              {/* 7 jours */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {today7.map((d, i) => (
                  <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 9, color: C.dim }}>{d.dayName}</Text>
                    <View style={{
                      width: 32, height: 32, borderRadius: 16,
                      backgroundColor: d.done ? GOLD + '22' : 'rgba(255,255,255,0.04)',
                      borderWidth: 1.5, borderColor: d.done ? GOLD : 'rgba(255,255,255,0.08)',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {d.done && <Text style={{ color: GOLD, fontSize: 14, fontWeight: '700' }}>✓</Text>}
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>

          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
