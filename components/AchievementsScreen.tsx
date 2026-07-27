// components/AchievementsScreen.tsx
import { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/constants/colors';
import { HABIT_KEYS, HABIT_LABELS } from '@/constants/types';
import { useHabitAchievements } from '@/hooks/useHabitAchievements';
import { useAmbientSound } from '@/hooks/useAmbientSound';
import { MASTER_ACHIEVEMENT } from '@/constants/achievements';

const GOLD  = '#C9A84C';
const GOLDB = '#E8C46A';

type Props = { visible: boolean; onClose: () => void; userId: string | undefined };

export default function AchievementsScreen({ visible, onClose, userId }: Props) {
  const insets = useSafeAreaInsets();
  const { achievements, unlockedIds, counts, unlockedCount, totalCount, masterUnlocked } = useHabitAchievements(userId);
  const { playAmbient } = useAmbientSound();

  useEffect(() => {
    if (visible) {
      playAmbient('succes');
    } else {
      playAmbient('profil'); // revient sur l'ambiance Profil à la fermeture (seul écran d'où ce modal s'ouvre pour l'instant)
    }
  }, [visible]);
  const [category, setCategory] = useState<string>('all');
  const listRef = useRef<ScrollView>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ y: 0, animated: false });
  }, [category]);

  const categories = [
    { key: 'all', label: 'TOUS' },
    ...HABIT_KEYS.map(k => ({ key: k as string, label: HABIT_LABELS[k as string] })),
    { key: 'perfect_day', label: 'JOURS PARFAITS' },
  ];

  const filtered = achievements
    .filter(a => category === 'all' || a.habitKey === category)
    .sort((a, b) => {
      if (a.habitKey !== b.habitKey) return a.habitKey.localeCompare(b.habitKey);
      return a.threshold - b.threshold;
    });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#07060A' }}>
        {/* ── HEADER ── */}
        <View style={{ paddingTop: insets.top + 12, paddingBottom: 14, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={onClose}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: GOLD + '33', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: GOLD, fontSize: 18 }}>‹</Text>
            </TouchableOpacity>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 17, color: GOLDB, letterSpacing: 3, fontWeight: '700' }}>SUCCÈS</Text>
            <Text style={{ fontFamily: 'SpaceMono', fontSize: 12, color: GOLD, fontWeight: '700' }}>{unlockedCount}/{totalCount}</Text>
          </View>
        </View>

        {/* ── FILTRES ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ height: 58, flexGrow: 0 }}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 20, alignItems: 'center' }}
        >
          {categories.map(c => (
            <TouchableOpacity
              key={c.key}
              onPress={() => setCategory(c.key)}
              style={{
                paddingHorizontal: 16, height: 38, borderRadius: 12,
                justifyContent: 'center', alignItems: 'center',
                backgroundColor: category === c.key ? GOLD + '22' : 'rgba(255,255,255,0.04)',
                borderWidth: 1, borderColor: category === c.key ? GOLD : 'rgba(255,255,255,0.1)',
              }}
            >
              <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: category === c.key ? GOLD : C.dim }}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── CARTE AEGIS (succès maître) ── */}
        <View style={{ paddingHorizontal: 16, marginTop: 14, marginBottom: 14 }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 16,
            backgroundColor: masterUnlocked ? GOLD + '14' : '#0A0800',
            borderRadius: 18, padding: 18,
            borderWidth: 1.5, borderColor: masterUnlocked ? GOLD : 'rgba(255,255,255,0.1)',
          }}>
            <View style={{
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: masterUnlocked ? GOLD + '22' : 'rgba(255,255,255,0.05)',
              borderWidth: 2, borderColor: masterUnlocked ? GOLD : 'rgba(255,255,255,0.15)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontFamily: 'Cinzel', fontSize: 22, color: masterUnlocked ? GOLD : C.dim, fontWeight: '800' }}>Λ</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Cinzel', fontSize: 16, color: masterUnlocked ? GOLDB : C.text, letterSpacing: 2, fontWeight: '700' }}>
                {MASTER_ACHIEVEMENT.title}
              </Text>
              <Text style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{MASTER_ACHIEVEMENT.description}</Text>
              <Text style={{ fontSize: 11, fontFamily: 'SpaceMono', color: masterUnlocked ? GOLD : C.dim, marginTop: 6, fontWeight: '700' }}>
                {unlockedCount}/{totalCount}
              </Text>
            </View>
          </View>
        </View>

        {/* ── LISTE ── */}
        <ScrollView ref={listRef} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 8 }}>
          {filtered.map(a => {
            const done = unlockedIds.has(a.id);
            const count = counts[a.habitKey] ?? 0;
            return (
              <View
                key={a.id}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                  backgroundColor: '#0A0800', borderRadius: 14, padding: 14,
                  borderWidth: 1, borderColor: done ? GOLD + '44' : 'rgba(255,255,255,0.08)',
                  opacity: done ? 1 : 0.7,
                }}
              >
                <View style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: done ? GOLD + '22' : 'rgba(255,255,255,0.05)',
                  borderWidth: 1.5, borderColor: done ? GOLD : 'rgba(255,255,255,0.12)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 16, color: done ? GOLD : C.dim }}>{done ? '✓' : '◆'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: done ? C.text : C.dim, fontWeight: '600' }}>{a.title}</Text>
                  <Text style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{a.description}</Text>
                  {!done && (
                    <Text style={{ fontSize: 10, fontFamily: 'SpaceMono', color: GOLD + 'AA', marginTop: 4 }}>
                      {Math.min(count, a.threshold)}/{a.threshold}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}
