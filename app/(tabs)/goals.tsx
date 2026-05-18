import { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, Alert, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useDay } from '@/hooks/useDay';
import { AccentProvider, SectionTitle } from '@/components/ui';
import { C } from '@/constants/colors';

const ACC  = '#D94F4F';
const ACCB = '#E87878';
const ACCD = '#D94F4F22';

// ─── Helpers tags ──────────────────────────────────────────────────────────────
// Compatible avec l'ancien format texte libre et le nouveau format JSON array
function parseTags(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  try { const p = JSON.parse(raw); if (Array.isArray(p)) return p; } catch {}
  // Legacy : split par virgule / retour ligne
  return raw.split(/[,\n]/).map(t => t.trim()).filter(Boolean);
}
function saveTags(tags: string[]): string {
  return JSON.stringify(tags);
}

// ─── Config objectifs ─────────────────────────────────────────────────────────
const OBJECTIVES = [
  { key: 'physical_goal', icon: '⚔️', label: 'CORPS',    color: '#8E44AD', hint: '95 kg · Abdos · BF 12%' },
  { key: 'mental_goal',   icon: '🧠', label: 'MENTAL',   color: '#38BDF8', hint: 'Lire · Trading · Langue' },
  { key: 'style_goal',    icon: '👔', label: 'STYLE',    color: '#7BC67A', hint: 'Garde-robe · Grooming' },
  { key: 'timeline',      icon: '⏳', label: 'ÉCHÉANCE', color: '#FB923C', hint: 'Été 2025 · 6 mois' },
] as const;

// ─── TagChip — pill supprimable ───────────────────────────────────────────────
function TagChip({ label, color, onDelete }: { label: string; color: string; onDelete: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  function handleDelete() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.1,  duration: 60, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0,    duration: 120, useNativeDriver: true }),
    ]).start(onDelete);
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handleDelete}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: color + '22',
          borderWidth: 1, borderColor: color + '66',
          borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
        }}
      >
        <Text style={{ fontSize: 13, color, fontWeight: '600' }}>{label}</Text>
        <Text style={{ fontSize: 10, color: color + 'AA' }}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── ObjectiveCard — tags visuels + ajout inline ─────────────────────────────
function ObjectiveCard({
  objKey, icon, label, color, hint, rawValue, onUpdate,
}: {
  objKey: string; icon: string; label: string;
  color: string; hint: string;
  rawValue: string; onUpdate: (v: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [input,  setInput]  = useState('');
  const tags    = parseTags(rawValue);
  const isEmpty = tags.length === 0;

  function addTag() {
    const t = input.trim();
    if (!t) { setAdding(false); return; }
    onUpdate(saveTags([...tags, t]));
    setInput('');
    setAdding(false);
  }

  function deleteTag(i: number) {
    const next = tags.filter((_, idx) => idx !== i);
    onUpdate(saveTags(next));
  }

  return (
    <View style={{
      backgroundColor: isEmpty ? C.s1 : color + '0C',
      borderWidth: 1.5,
      borderColor: isEmpty ? C.s3 : color + '55',
      borderRadius: 18, marginBottom: 12, padding: 16,
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <View style={{
          width: 34, height: 34, borderRadius: 17,
          backgroundColor: isEmpty ? C.s3 : color + '25',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 16 }}>{icon}</Text>
        </View>
        <Text style={{
          fontFamily: 'Cinzel', fontSize: 11, letterSpacing: 2,
          color: isEmpty ? C.dim : color,
        }}>{label}</Text>
        {!isEmpty && (
          <View style={{ marginLeft: 'auto', backgroundColor: color, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontSize: 8, color: '#fff', fontWeight: '700', letterSpacing: 1 }}>{tags.length} OBJ.</Text>
          </View>
        )}
      </View>

      {/* Tags */}
      {isEmpty && !adding ? (
        <Text style={{ fontSize: 12, color: C.dim, fontStyle: 'italic', marginBottom: 10 }}>
          {hint}
        </Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {tags.map((t, i) => (
            <TagChip key={i} label={t} color={color} onDelete={() => deleteTag(i)} />
          ))}
        </View>
      )}

      {/* Input inline */}
      {adding && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <TextInput
            autoFocus
            style={{
              flex: 1, backgroundColor: C.s2, borderWidth: 1,
              borderColor: color + '66', borderRadius: 10,
              padding: 10, color: C.text, fontSize: 13,
            }}
            value={input}
            onChangeText={setInput}
            placeholder="Ex: 95 kg"
            placeholderTextColor={C.dim}
            onSubmitEditing={addTag}
            returnKeyType="done"
          />
          <TouchableOpacity
            onPress={addTag}
            style={{ backgroundColor: color, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>✓</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bouton ajouter */}
      {!adding && (
        <TouchableOpacity
          onPress={() => setAdding(true)}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingTop: isEmpty ? 0 : 6,
          }}
        >
          <View style={{
            width: 22, height: 22, borderRadius: 11,
            backgroundColor: color + '22', borderWidth: 1,
            borderColor: color + '55', alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color, fontSize: 14, lineHeight: 20 }}>+</Text>
          </View>
          <Text style={{ fontSize: 11, color: color + 'AA' }}>
            {isEmpty ? 'Ajouter un objectif' : 'Ajouter'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── RulesCard — règles numérotées ───────────────────────────────────────────
function RulesCard({ value, onUpdate }: { value: string; onUpdate: (v: string) => void }) {
  const rules = value ? value.split('\n').filter(Boolean) : [];
  const [adding, setAdding] = useState(false);
  const [input,  setInput]  = useState('');

  function addRule() {
    const r = input.trim();
    if (!r) { setAdding(false); return; }
    onUpdate([...rules, r].join('\n'));
    setInput('');
    setAdding(false);
  }

  function deleteRule(i: number) {
    onUpdate(rules.filter((_, idx) => idx !== i).join('\n'));
  }

  return (
    <View style={{ backgroundColor: C.s1, borderWidth: 1, borderColor: C.s3, borderRadius: 18, padding: 16, marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Text style={{ fontSize: 16 }}>📜</Text>
        <Text style={{ fontFamily: 'Cinzel', fontSize: 11, color: C.dim, letterSpacing: 2 }}>MES RÈGLES</Text>
        {rules.length > 0 && (
          <View style={{ marginLeft: 'auto', backgroundColor: C.s3, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontSize: 8, color: C.dim, letterSpacing: 1 }}>{rules.length}</Text>
          </View>
        )}
      </View>

      {rules.map((r, i) => (
        <TouchableOpacity
          key={i}
          onLongPress={() => deleteRule(i)}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}
        >
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: ACCD, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
            <Text style={{ fontFamily: 'SpaceMono', fontSize: 9, color: ACC }}>{i + 1}</Text>
          </View>
          <Text style={{ flex: 1, fontSize: 13, color: C.dim, lineHeight: 20 }}>{r}</Text>
        </TouchableOpacity>
      ))}

      {adding && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <TextInput
            autoFocus
            style={{ flex: 1, backgroundColor: C.s2, borderWidth: 1, borderColor: C.s3, borderRadius: 10, padding: 10, color: C.text, fontSize: 13 }}
            value={input}
            onChangeText={setInput}
            placeholder="Nouvelle règle..."
            placeholderTextColor={C.dim}
            onSubmitEditing={addRule}
            returnKeyType="done"
          />
          <TouchableOpacity onPress={addRule} style={{ backgroundColor: ACC, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>✓</Text>
          </TouchableOpacity>
        </View>
      )}

      {!adding && (
        <TouchableOpacity onPress={() => setAdding(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: rules.length ? 4 : 0 }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: ACCD, borderWidth: 1, borderColor: ACC + '44', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: ACC, fontSize: 14, lineHeight: 20 }}>+</Text>
          </View>
          <Text style={{ fontSize: 11, color: ACC + 'AA' }}>Ajouter une règle</Text>
        </TouchableOpacity>
      )}

      {rules.length > 0 && (
        <Text style={{ fontSize: 9, color: C.dim, marginTop: 10 }}>Appui long pour supprimer</Text>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function GoalsScreen() {
  const { user } = useAuth();
  const { goals, updateGoals } = useDay(user?.id);

  return (
    <AccentProvider color={ACC}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={{ paddingBottom: 16, paddingTop: 8 }}>
            <Text style={{ fontSize: 10, color: C.dim, letterSpacing: 3, textTransform: 'uppercase' }}>Vision long terme</Text>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 22, color: ACCB, marginTop: 4, letterSpacing: 4 }}>OBJECTIFS</Text>
            <View style={{ height: 2, width: 40, backgroundColor: ACC, borderRadius: 2, marginTop: 8 }} />
          </View>

          {/* Vision — manifesto court */}
          <View style={{ backgroundColor: '#120505', borderWidth: 1, borderColor: ACC + '55', borderRadius: 18, padding: 20, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Text style={{ fontFamily: 'Cinzel', color: ACCB, fontSize: 10, letterSpacing: 4 }}>MA VISION</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: ACC + '44' }} />
              <Text style={{ fontFamily: 'Cinzel', color: ACC, fontSize: 14 }}>✦</Text>
            </View>
            <TextInput
              style={{ color: C.text, fontSize: 15, lineHeight: 24, minHeight: 60, textAlignVertical: 'top', fontStyle: 'italic' }}
              value={goals.vision || ''}
              onChangeText={(v: string) => updateGoals({ vision: v })}
              placeholder="En une phrase — qui es-tu dans 1 an ?"
              placeholderTextColor={C.dim}
              multiline
            />
            {goals.vision?.trim() ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: ACC }} />
                <Text style={{ fontSize: 10, color: ACC + 'AA' }}>{goals.vision.trim().split(' ').length} mots</Text>
              </View>
            ) : null}
          </View>

          {/* Objectifs — tags */}
          <SectionTitle>Objectifs clés</SectionTitle>
          {OBJECTIVES.map(obj => (
            <ObjectiveCard
              key={obj.key}
              objKey={obj.key}
              icon={obj.icon}
              label={obj.label}
              color={obj.color}
              hint={obj.hint}
              rawValue={(goals as any)[obj.key] || ''}
              onUpdate={(v) => updateGoals({ [obj.key]: v } as any)}
            />
          ))}

          {/* Règles */}
          <SectionTitle>Mes règles</SectionTitle>
          <RulesCard
            value={goals.rules || ''}
            onUpdate={(v) => updateGoals({ rules: v })}
          />

        </ScrollView>
      </SafeAreaView>
    </AccentProvider>
  );
}
