import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, KeyboardAvoidingView, Platform,
  TouchableOpacity, Animated, Easing, Image, StyleSheet, Dimensions, Modal, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { useFocusEffect } from '@react-navigation/native';
import { useAmbientSound } from '@/hooks/useAmbientSound';
import { useDay } from '@/hooks/useDay';
import { useGoals, GoalStatus } from '@/hooks/useGoals';
import { useVisionBoard } from '@/hooks/useVisionBoard';
import * as ImagePicker from 'expo-image-picker';
import { C } from '@/constants/colors';

const { width, height } = Dimensions.get('window');
const RED  = '#D94F4F';
const REDB = '#E87878';
const REDD = '#D94F4F22';

const HERO_IMG = require('@/assets/hero/hero_vision.png');
const BG_IMG   = require('@/assets/hero/bg_vision.png');

// ─── Icônes génériques d'objectifs (l'utilisateur choisit à la création) ──────
const GOAL_ICONS: Record<string, any> = {
  finance:        require('@/assets/ui/icone_vision_finance.png'),
  business:       require('@/assets/ui/icone_vision_business.png'),
  voyage:         require('@/assets/ui/icone_vision_voyage.png'),
  sante:          require('@/assets/ui/icone_vision_sante.png'),
  relations:      require('@/assets/ui/icone_vision_relations.png'),
  apprentissage:  require('@/assets/ui/icone_vision_apprentissage.png'),
  famille:        require('@/assets/ui/icone_vision_famille.png'),
  creativite:     require('@/assets/ui/icone_vision_creativite.png'),
  spiritualite:   require('@/assets/ui/icone_vision_spiritualite.png'),
  objectif:       require('@/assets/ui/icone_vision_objectif.png'),
};
const GOAL_ICON_KEYS = Object.keys(GOAL_ICONS);

const STATUS_LABEL: Record<GoalStatus, string> = {
  not_started: 'Pas commencé',
  in_progress: 'En cours',
  achieved:    'Atteint',
};
const STATUS_COLOR: Record<GoalStatus, string> = {
  not_started: 'rgba(255,255,255,0.35)',
  in_progress: RED,
  achieved:    '#6FCF7A',
};

// ─── Helpers tags ─────────────────────────────────────────────────────────────
function parseTags(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  try { const p = JSON.parse(raw); if (Array.isArray(p)) return p; } catch {}
  return raw.split(/[,\n]/).map(t => t.trim()).filter(Boolean);
}
function saveTags(tags: string[]): string { return JSON.stringify(tags); }

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function GoalsScreen() {
  const { user } = useAuth();
  const { playAmbient } = useAmbientSound();

  useFocusEffect(useCallback(() => {
    playAmbient('vision');
  }, []));
  const { goals: dayGoals, updateGoals } = useDay(user?.id);
  const { goals, addGoal, updateStatus, deleteGoal } = useGoals(user?.id);
  const { images: visionImages, uploading, addImage, removeImage } = useVisionBoard(user?.id);
  const heroScale = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formIcon, setFormIcon] = useState('objectif');

  function resetForm() {
    setFormTitle(''); setFormDesc(''); setFormDeadline(''); setFormIcon('objectif');
  }
  function submitGoal() {
    if (!formTitle.trim()) return;
    addGoal({ title: formTitle.trim(), description: formDesc.trim(), deadline: formDeadline.trim() || null, icon_key: formIcon });
    resetForm();
    setModalVisible(false);
  }

  async function pickVisionImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // laisse l'utilisateur zoomer/déplacer pour choisir le cadrage, sans ratio imposé
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      addImage(result.assets[0].uri);
    }
  }

  const stagger = useRef([0,1,2,3,4,5].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.stagger(80, stagger.map(a =>
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0606' }} edges={[]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }} keyboardShouldPersistTaps="handled">

        {/* ── HERO ── */}
        <View style={{ height: height * 0.52, position: 'relative', overflow: 'hidden' }}>
          <Animated.Image source={HERO_IMG} style={{ width: '100%', height: '100%', transform: [{ scale: heroScale }] }} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(10,6,6,0.4)', 'rgba(10,6,6,0.9)', '#0A0606']} locations={[0.2, 0.5, 0.8, 1]} style={StyleSheet.absoluteFillObject} />
          <View style={{ position: 'absolute', top: insets.top + 12, left: 20, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: RED, fontSize: 10 }}>✦</Text>
            <Text style={{ fontSize: 10, color: RED, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' }}>Vision</Text>
          </View>
          <View style={{ position: 'absolute', bottom: 28, left: 20, right: 20 }}>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 42, color: C.text, fontWeight: '800', letterSpacing: 2 }}>VISION</Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6, lineHeight: 22 }}>
              Un objectif sans plan{'\n'}reste un <Text style={{ color: REDB, fontStyle: 'italic' }}>rêve.</Text>
            </Text>
            <TouchableOpacity style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 10, color: RED, letterSpacing: 2, fontWeight: '700' }}>CLARTÉ. PLAN. ACTION.  ›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16 }}>

          {/* ── MA VISION ── */}
          <Animated.View style={[S(0), { marginBottom: 14 }]}>
            <View style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: RED + '44' }}>
              <Image source={BG_IMG} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
              <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(10,4,4,0.88)' }} />
              <View style={{ padding: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <Text style={{ fontFamily: 'Cinzel', color: REDB, fontSize: 10, letterSpacing: 4 }}>MA VISION</Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: RED + '44' }} />
                  <Text style={{ color: RED, fontSize: 14 }}>✦</Text>
                </View>
                <TextInput
                  style={{ color: C.text, fontSize: 18, lineHeight: 28, minHeight: 60, textAlignVertical: 'top', fontWeight: '600' }}
                  value={dayGoals.vision || ''}
                  onChangeText={(v: string) => updateGoals({ vision: v })}
                  placeholder="Deviens la meilleure version de toi-même et inspire les autres."
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  multiline
                />
                {dayGoals.vision?.trim() ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: RED }} />
                    <Text style={{ fontSize: 11, color: RED + 'CC' }}>{dayGoals.vision.trim().split(' ').length} mots clés</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Animated.View>

          {/* ── OBJECTIFS PRINCIPAUX ── */}
          <Animated.View style={[S(1), { marginBottom: 14 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontSize: 11, color: RED, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700' }}>OBJECTIFS PRINCIPAUX</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={{ backgroundColor: REDD, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: RED + '44' }}
              >
                <Text style={{ fontSize: 10, color: RED, fontWeight: '600' }}>+ NOUVEL OBJECTIF</Text>
              </TouchableOpacity>
            </View>

            {goals.length === 0 ? (
              <View style={{ backgroundColor: '#120404', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: RED + '33', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: C.dim, textAlign: 'center' }}>Aucun objectif pour l'instant.{'\n'}Ajoute le premier avec le bouton ci-dessus.</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
                {goals.map((obj) => (
                  <View key={obj.id} style={{ width: 168, backgroundColor: '#120404', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: RED + '33', position: 'relative' }}>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert('Supprimer cet objectif ?', obj.title, [
                          { text: 'Annuler', style: 'cancel' },
                          { text: 'Supprimer', style: 'destructive', onPress: () => deleteGoal(obj.id) },
                        ]);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
                    >
                      <Text style={{ color: C.dim, fontSize: 11, fontWeight: '700', lineHeight: 12 }}>✕</Text>
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, paddingRight: 18 }}>
                      <Image source={GOAL_ICONS[obj.icon_key] ?? GOAL_ICONS.objectif} style={{ width: 40, height: 40 }} resizeMode="contain" />
                      <Text style={{ fontSize: 14, color: C.text, fontWeight: '700', lineHeight: 18, flex: 1 }} numberOfLines={2}>{obj.title}</Text>
                    </View>
                    {!!obj.description && (
                      <Text style={{ fontSize: 10, color: C.dim, lineHeight: 14, marginTop: 4 }} numberOfLines={2}>{obj.description}</Text>
                    )}
                    <View style={{ gap: 5, marginTop: 10 }}>
                      {(['not_started', 'in_progress', 'achieved'] as GoalStatus[]).map(s => (
                        <TouchableOpacity
                          key={s}
                          onPress={() => updateStatus(obj.id, s)}
                          style={{
                            paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
                            backgroundColor: obj.status === s ? STATUS_COLOR[s] + '22' : 'transparent',
                            borderWidth: 1, borderColor: obj.status === s ? STATUS_COLOR[s] : 'rgba(255,255,255,0.12)',
                          }}
                        >
                          <Text style={{ fontSize: 9, fontWeight: '700', color: obj.status === s ? STATUS_COLOR[s] : C.dim, textAlign: 'center' }}>{STATUS_LABEL[s]}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {!!obj.deadline && (
                      <Text style={{ fontSize: 9, color: C.dim, marginTop: 10 }} numberOfLines={1}>Échéance : {obj.deadline}</Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </Animated.View>

          {/* ── VISION BOARD ── */}
          <Animated.View style={[S(2), { marginBottom: 14 }]}>
            <View style={{ backgroundColor: '#120404', borderRadius: 16, borderWidth: 1, borderColor: RED + '33', padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <Text style={{ fontSize: 11, color: RED, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700' }}>VISION BOARD</Text>
                {visionImages.length > 0 && (
                  <Text style={{ fontSize: 10, color: C.dim }}>{visionImages.length} image{visionImages.length > 1 ? 's' : ''}</Text>
                )}
              </View>

              {visionImages.length === 0 ? (
                <TouchableOpacity
                  onPress={pickVisionImage}
                  disabled={uploading}
                  style={{ borderRadius: 12, borderWidth: 1.5, borderColor: RED + '44', borderStyle: 'dashed', paddingVertical: 28, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)' }}
                >
                  <Text style={{ fontSize: 24, color: RED, marginBottom: 8 }}>+</Text>
                  <Text style={{ fontSize: 12, color: C.text, fontWeight: '600', textAlign: 'center' }}>
                    {uploading ? 'Envoi en cours...' : "Ajoute ta première image d'inspiration"}
                  </Text>
                  <Text style={{ fontSize: 10, color: C.dim, marginTop: 4, textAlign: 'center' }}>Ce que tu veux devenir, avoir, ou vivre.</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {visionImages.map(img => (
                      <TouchableOpacity
                        key={img.id}
                        onLongPress={() => removeImage(img.id)}
                        style={{ width: '31.5%', height: 100, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
                      >
                        <Image source={{ uri: img.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      onPress={pickVisionImage}
                      disabled={uploading}
                      style={{ width: '31.5%', height: 100, borderRadius: 10, borderWidth: 1.5, borderColor: RED + '44', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ fontSize: 22, color: RED }}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ fontSize: 9, color: C.dim, marginTop: 10 }}>Appui long pour retirer une image</Text>
                </>
              )}
            </View>
          </Animated.View>

          {/* ── RAPPEL QUOTIDIEN ── */}
          <Animated.View style={[S(3), { marginBottom: 14 }]}>
            <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: RED + '33' }}>
              <Image source={BG_IMG} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
              <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(10,4,4,0.85)' }} />
              <View style={{ padding: 20 }}>
                <Text style={{ fontSize: 9, color: RED, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700', marginBottom: 12 }}>RAPPEL QUOTIDIEN</Text>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                  <Text style={{ fontFamily: 'Cinzel', fontSize: 26, color: RED, lineHeight: 26, marginTop: -2 }}>❝</Text>
                  <Text style={{ fontSize: 18, color: C.text, lineHeight: 28, flex: 1, fontWeight: '500' }}>
                    La discipline aujourd'hui{'\n'}crée la <Text style={{ color: REDB, fontWeight: '700' }}>liberté</Text> de demain.
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ── STATISTIQUES VISION ── */}
          <Animated.View style={[S(4), { marginBottom: 14 }]}>
            <Text style={{ fontSize: 11, color: RED, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '700', marginBottom: 14 }}>STATISTIQUES VISION</Text>
            <View style={{ backgroundColor: '#120404', borderRadius: 16, borderWidth: 1, borderColor: RED + '33', padding: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {[
                  { icon: require('@/assets/ui/icone_vision_stat_objectifs.png'),   value: String(goals.length), label: 'OBJECTIFS', sub: 'au total' },
                  { icon: require('@/assets/ui/icone_vision_stat_pascommence.png'), value: String(goals.filter(g => g.status === 'not_started').length), label: 'PAS COMMENCÉ', sub: '' },
                  { icon: require('@/assets/ui/icone_vision_stat_encours.png'),     value: String(goals.filter(g => g.status === 'in_progress').length), label: 'EN COURS', sub: '' },
                  { icon: require('@/assets/ui/icone_vision_stat_atteints.png'),    value: String(goals.filter(g => g.status === 'achieved').length), label: 'ATTEINTS', sub: '' },
                ].map((stat, i) => (
                  <View key={i} style={{ alignItems: 'center', flex: 1, paddingTop: 44, position: 'relative' }}>
                    <Image source={stat.icon} style={{ position: 'absolute', top: -4, width: 48, height: 48 }} resizeMode="contain" />
                    <Text style={{ fontFamily: 'SpaceMono', fontSize: 20, color: C.text, fontWeight: '700' }}>{stat.value}</Text>
                    <Text style={{ fontSize: 8, color: RED, letterSpacing: 1, textTransform: 'uppercase', marginTop: 4, textAlign: 'center', fontWeight: '700' }}>{stat.label}</Text>
                    {!!stat.sub && <Text style={{ fontSize: 9, color: C.dim, marginTop: 2, textAlign: 'center' }}>{stat.sub}</Text>}
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* ── MODAL NOUVEL OBJECTIF ── */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={{ backgroundColor: '#150606', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: RED + '33', padding: 20, paddingBottom: insets.bottom + 20, maxHeight: '85%' }}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={{ fontFamily: 'Cinzel', fontSize: 18, color: C.text, fontWeight: '700', marginBottom: 18 }}>Nouvel objectif</Text>

              <Text style={{ fontSize: 10, color: RED, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700', marginBottom: 8 }}>Icône</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginBottom: 18 }}>
                {GOAL_ICON_KEYS.map(key => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setFormIcon(key)}
                    style={{
                      width: 60, height: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: formIcon === key ? RED + '22' : 'rgba(255,255,255,0.04)',
                      borderWidth: 1.5, borderColor: formIcon === key ? RED : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <Image source={GOAL_ICONS[key]} style={{ width: 44, height: 44 }} resizeMode="contain" />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={{ fontSize: 10, color: RED, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700', marginBottom: 8 }}>Titre</Text>
              <TextInput
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 12, color: C.text, fontSize: 14, marginBottom: 16 }}
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="Ex : Liberté financière"
                placeholderTextColor="rgba(255,255,255,0.25)"
              />

              <Text style={{ fontSize: 10, color: RED, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700', marginBottom: 8 }}>Description (optionnel)</Text>
              <TextInput
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 12, color: C.text, fontSize: 13, minHeight: 60, textAlignVertical: 'top', marginBottom: 16 }}
                value={formDesc}
                onChangeText={setFormDesc}
                placeholder="Ex : Atteindre l'indépendance financière totale."
                placeholderTextColor="rgba(255,255,255,0.25)"
                multiline
              />

              <Text style={{ fontSize: 10, color: RED, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700', marginBottom: 8 }}>Échéance (optionnel)</Text>
              <TextInput
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 12, color: C.text, fontSize: 13, marginBottom: 22 }}
                value={formDeadline}
                onChangeText={setFormDeadline}
                placeholder="Ex : 31 déc. 2027"
                placeholderTextColor="rgba(255,255,255,0.25)"
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => { resetForm(); setModalVisible(false); }}
                  style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  <Text style={{ color: C.dim, fontWeight: '700', fontSize: 13 }}>ANNULER</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={submitGoal}
                  disabled={!formTitle.trim()}
                  style={{ flex: 1, backgroundColor: formTitle.trim() ? RED : 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, alignItems: 'center' }}
                >
                  <Text style={{ color: formTitle.trim() ? '#fff' : C.dim, fontWeight: '700', fontSize: 13 }}>CRÉER</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
