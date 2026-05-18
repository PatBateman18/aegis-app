import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Dimensions, ActivityIndicator,
  Animated, Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useDay } from '@/hooks/useDay';
import { Card, SectionTitle, ScoreRing, Inp, ToggleRow } from '@/components/ui';
import { XPBar, RankBadge } from '@/components/XPBar';
import { C } from '@/constants/colors';
import { HABIT_KEYS, HABIT_LABELS, calcScore } from '@/constants/types';
import {
  calcTotalXP, calcDayXP, getRank,
  QUOTES, getCurrentMilestone, getNextMilestone,
} from '@/constants/rpg';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

function XPPopup({ xp }: { xp: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(800),
      Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, -20] }) }],
      marginBottom: 4,
    }}>
      <Text style={{ fontFamily: 'SpaceMono', fontSize: 20, fontWeight: '700', color: C.gold }}>+{xp} XP</Text>
    </Animated.View>
  );
}

function MilestoneModal({ milestone, onClose }: { milestone: any; onClose: () => void }) {
  return (
    <Modal visible transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <View style={{ backgroundColor: C.s1, borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: milestone.color + '44', width: '100%' }}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>{milestone.emoji}</Text>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 22, letterSpacing: 3, color: milestone.color, marginBottom: 8 }}>{milestone.title}</Text>
          <Text style={{ fontSize: 13, color: C.dim, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>{milestone.description}</Text>
          <TouchableOpacity style={{ backgroundColor: milestone.color, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 }} onPress={onClose}>
            <Text style={{ color: '#000', fontWeight: '700', fontSize: 14, letterSpacing: 2 }}>CONTINUER</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { day, history, streak, updateDay } = useDay(user?.id);
  const insets = useSafeAreaInsets();
  const HERO_H = 280 + insets.top;

  const [heroUri, setHeroUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [xpPopups, setXpPopups] = useState<number[]>([]);
  const [milestoneToShow, setMilestoneToShow] = useState<any>(null);
  const prevStreak = useRef(streak);

  const totalXP = calcTotalXP([...history.filter(h => h.date !== day.date), day]);
  const rank = getRank(totalXP);
  const score = calcScore(day);
  const done = HABIT_KEYS.filter(k => !!day[k as keyof typeof day]).length;
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
  const currentMilestone = getCurrentMilestone(streak);
  const nextMilestone = getNextMilestone(streak);
  const scoreLabel = score >= 90 ? 'CONQUÉRANT' : score >= 70 ? 'DISCIPLINÉ' : score >= 40 ? 'EN MARCHE' : 'À DÉMARRER';

  useEffect(() => {
    if (!user) return;
    const { data } = supabase.storage.from('avatar').getPublicUrl(`hero_${user.id}.jpg`);
    if (data?.publicUrl) setHeroUri(data.publicUrl);
  }, [user]);

  useEffect(() => {
    if (streak > prevStreak.current && currentMilestone) {
      const { STREAK_MILESTONES } = require('@/constants/rpg');
      const newMilestone = STREAK_MILESTONES.find((m: any) => m.days === streak);
      if (newMilestone) setMilestoneToShow(newMilestone);
    }
    prevStreak.current = streak;
  }, [streak]);

  async function pickHero() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7 });
    if (result.canceled || !user) return;
    const uri = result.assets[0].uri;
    setHeroUri(uri);
    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const arr = await new Response(blob).arrayBuffer();
      const { error } = await supabase.storage.from('avatar').upload(`hero_${user.id}.jpg`, new Uint8Array(arr), { contentType: 'image/jpeg', upsert: true });
      if (!error) {
        const { data } = supabase.storage.from('avatar').getPublicUrl(`hero_${user.id}.jpg`);
        setHeroUri(data.publicUrl + '?t=' + Date.now());
      }
    } catch {}
    setUploading(false);
  }

  function showXP(xp: number) {
    const id = Date.now();
    setXpPopups(p => [...p, id]);
    setTimeout(() => setXpPopups(p => p.filter(x => x !== id)), 1500);
  }

  async function toggleHabit(key: string) {
    const current = !!(day as any)[key];
    const updates: any = { [key]: !current };
    if (key === 'm_face') {
      updates.m_face = !current; updates.m_hydra = !current; updates.m_skin = !current;
      updates.e_face = !current; updates.e_hydra = !current; updates.e_skin = !current;
    }
    await updateDay(updates);
    if (!current) {
      const xpMap: any = { workout_done: 40, calories_ok: 20, learning_done: 25, m_face: 15, outfit_ok: 10, morning_water: 10 };
      if (xpMap[key]) showXP(xpMap[key]);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ position: 'absolute', top: 100, right: 20, zIndex: 999, alignItems: 'flex-end' }}>
        {xpPopups.map(id => <XPPopup key={id} xp={40} />)}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View style={{ height: HERO_H }}>
          {heroUri
            ? <Image source={{ uri: heroUri }} style={{ width, height: HERO_H, resizeMode: 'cover' }} />
            : <View style={{ width, height: HERO_H, backgroundColor: '#0a0800', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 60, color: C.goldDim }}>✦</Text>
              </View>
          }
          <LinearGradient colors={['rgba(7,7,7,0.05)', 'rgba(7,7,7,0.5)', 'rgba(7,7,7,1)']} style={StyleSheet.absoluteFillObject} />
          <View style={{ position: 'absolute', top: insets.top + 12, left: 16 }}>
            <RankBadge totalXP={totalXP} />
          </View>
          <TouchableOpacity onPress={pickHero} style={{ position: 'absolute', bottom: 18, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.goldDim }} disabled={uploading}>
            {uploading ? <ActivityIndicator color={C.gold} size="small" /> : <Text>📷</Text>}
          </TouchableOpacity>
          <View style={{ position: 'absolute', bottom: 20, left: 20, right: 56 }}>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 28, color: C.goldBright, letterSpacing: 6 }}>AEGIS</Text>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 5, letterSpacing: 2 }}>{dateStr}</Text>
          </View>
        </View>

        <View style={{ padding: 16 }}>
          {/* QUOTE */}
          <View style={{ marginBottom: 14, padding: 14, backgroundColor: C.s1, borderLeftWidth: 3, borderLeftColor: C.goldDim, borderRadius: 4 }}>
            <Text style={{ fontSize: 12.5, color: C.dim, fontStyle: 'italic', lineHeight: 20 }}>"{quote}"</Text>
          </View>

          {/* XP BAR */}
          <Card style={{ borderColor: rank.color + '33', backgroundColor: rank.color + '06' }}>
            <XPBar totalXP={totalXP} />
          </Card>

          {/* SCORE ROW */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <Card style={{ flex: 1.2, alignItems: 'center', gap: 10, margin: 0 }}>
              <ScoreRing score={score} />
              <Text style={{ fontFamily: 'Cinzel', fontSize: 11, letterSpacing: 2, color: score >= 70 ? C.gold : C.dim }}>
                {scoreLabel}
              </Text>
            </Card>
            <View style={{ flex: 1, gap: 10 }}>
              <Card style={{ flex: 1, margin: 0 }}>
                <Text style={{ fontFamily: 'SpaceMono', fontSize: 26, lineHeight: 28, color: streak > 0 ? C.gold : C.dim }}>
                  {streak}<Text style={{ fontSize: 14, color: C.dim }}>j</Text>
                </Text>
                <Text style={{ fontSize: 10, color: C.dim, marginTop: 4, letterSpacing: 2, textTransform: 'uppercase' }}>
                  {currentMilestone ? currentMilestone.emoji : '🔥'} Streak
                </Text>
                {nextMilestone && (
                  <Text style={{ fontSize: 9, color: C.goldDim, marginTop: 3 }}>
                    {nextMilestone.days - streak}j → {nextMilestone.title}
                  </Text>
                )}
              </Card>
              <Card style={{ flex: 1, margin: 0 }}>
                <Text style={{ fontFamily: 'SpaceMono', fontSize: 22, lineHeight: 24, color: done === 6 ? C.green : C.text }}>
                  {done}<Text style={{ fontSize: 14, color: C.dim }}>/6</Text>
                </Text>
                <Text style={{ fontSize: 10, color: C.dim, marginTop: 4, letterSpacing: 2, textTransform: 'uppercase' }}>✓ Habitudes</Text>
                <Text style={{ fontSize: 9, color: C.gold, marginTop: 3 }}>+{calcDayXP(day)} XP</Text>
              </Card>
            </View>
          </View>

          {/* HABITUDES */}
          <SectionTitle>Habitudes du jour</SectionTitle>
          <Card>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
              {HABIT_KEYS.map(k => {
                const key = k as string;
                const active = !!(day as any)[key];
                return (
                  <TouchableOpacity key={key}
                    style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22, backgroundColor: active ? C.goldDim : C.s2, borderWidth: 1, borderColor: active ? C.gold : C.s3 }}
                    onPress={() => toggleHabit(key)}
                  >
                    <Text style={{ fontSize: 13, color: active ? C.goldBright : C.dim }}>
                      {HABIT_LABELS[key]}{active ? ' ✓' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* OBJECTIF */}
          <SectionTitle>Objectif du jour</SectionTitle>
          <Card>
            <Inp value={day.daily_goal} onChange={(v: string) => updateDay({ daily_goal: v })} placeholder="Qu'est-ce que tu dois accomplir aujourd'hui ?" />
            <ToggleRow label="💧 Eau au réveil" value={!!day.morning_water} onChange={v => updateDay({ morning_water: v })} />
            <ToggleRow label="📚 Apprentissage" sub="Lecture, podcast, cours..." value={!!day.learning_done} onChange={v => updateDay({ learning_done: v })} />
          </Card>
        </View>
      </ScrollView>

      {milestoneToShow && (
        <MilestoneModal milestone={milestoneToShow} onClose={() => setMilestoneToShow(null)} />
      )}
    </View>
  );
}
