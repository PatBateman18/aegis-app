import { useState, useEffect } from 'react';
import {
  View, Text, Switch, TouchableOpacity, StyleSheet,
  Modal, ScrollView, Alert,
} from 'react-native';
import { C } from '@/constants/colors';
import { requestNotificationPermission, scheduleNotifications, cancelAllNotifications, saveNotificationPrefs } from '@/lib/notifications';
import { useAuth } from '@/hooks/useAuth';

type TimePickerProps = {
  hour: number;
  minute: number;
  onChange: (h: number, m: number) => void;
  onClose: () => void;
};

function TimePicker({ hour, minute, onChange, onClose }: TimePickerProps) {
  const [h, setH] = useState(hour);
  const [m, setM] = useState(minute);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <Modal visible transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: C.s1, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: C.dim, fontSize: 14 }}>Annuler</Text>
            </TouchableOpacity>
            <Text style={{ fontFamily: 'Cinzel', color: C.goldBright, fontSize: 14, letterSpacing: 2 }}>HEURE</Text>
            <TouchableOpacity onPress={() => { onChange(h, m); onClose(); }}>
              <Text style={{ color: C.gold, fontSize: 14, fontWeight: '700' }}>OK</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Heures */}
            <View style={{ flex: 1 }}>
              <Text style={tp.label}>Heures</Text>
              <ScrollView style={{ height: 180 }} showsVerticalScrollIndicator={false}>
                {hours.map(hr => (
                  <TouchableOpacity key={hr} style={[tp.item, h === hr && tp.itemActive]} onPress={() => setH(hr)}>
                    <Text style={[tp.itemText, h === hr && tp.itemTextActive]}>
                      {String(hr).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={{ width: 1, backgroundColor: C.s3 }} />
            {/* Minutes */}
            <View style={{ flex: 1 }}>
              <Text style={tp.label}>Minutes</Text>
              <ScrollView style={{ height: 180 }} showsVerticalScrollIndicator={false}>
                {minutes.map(min => (
                  <TouchableOpacity key={min} style={[tp.item, m === min && tp.itemActive]} onPress={() => setM(min)}>
                    <Text style={[tp.itemText, m === min && tp.itemTextActive]}>
                      {String(min).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function NotificationSettings() {
  const { user, profile } = useAuth();
  const [morningEnabled, setMorningEnabled] = useState(false);
  const [morningHour, setMorningHour] = useState(7);
  const [morningMinute, setMorningMinute] = useState(30);
  const [eveningEnabled, setEveningEnabled] = useState(true);
  const [eveningHour, setEveningHour] = useState(21);
  const [eveningMinute, setEveningMinute] = useState(0);
  const [showMorningPicker, setShowMorningPicker] = useState(false);
  const [showEveningPicker, setShowEveningPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setMorningEnabled(profile.notif_morning ?? false);
    setMorningHour(profile.notif_morning_hour ?? 7);
    setMorningMinute(profile.notif_morning_minute ?? 30);
    setEveningEnabled(profile.notif_evening ?? true);
    setEveningHour(profile.notif_evening_hour ?? 21);
    setEveningMinute(profile.notif_evening_minute ?? 0);
  }, [profile]);

  async function handleToggle(type: 'morning' | 'evening', value: boolean) {
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert(
        'Notifications désactivées',
        'Active les notifications pour AEGIS dans les Réglages iOS.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (type === 'morning') setMorningEnabled(value);
    else setEveningEnabled(value);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);

    const granted = await requestNotificationPermission();
    if (granted) {
      await scheduleNotifications(
        morningEnabled, morningHour, morningMinute,
        eveningEnabled, eveningHour, eveningMinute,
      );
    }

    await saveNotificationPrefs(user.id, {
      notif_morning: morningEnabled,
      notif_morning_hour: morningHour,
      notif_morning_minute: morningMinute,
      notif_evening: eveningEnabled,
      notif_evening_hour: eveningHour,
      notif_evening_minute: eveningMinute,
    });

    setSaving(false);
    Alert.alert('✅ Sauvegardé', 'Tes notifications ont été configurées.');
  }

  const fmt = (h: number, m: number) =>
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 Notifications</Text>
      <Text style={styles.subtitle}>Des rappels personnalisés pour rester discipliné</Text>

      {/* Matin */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View>
            <Text style={styles.rowTitle}>🌅 Rappel matin</Text>
            <Text style={styles.rowSub}>Commence ta journée avec intention</Text>
          </View>
          <Switch
            value={morningEnabled}
            onValueChange={v => handleToggle('morning', v)}
            trackColor={{ false: C.s3, true: C.gold }}
            thumbColor={morningEnabled ? '#000' : C.dim}
            ios_backgroundColor={C.s3}
          />
        </View>
        {morningEnabled && (
          <TouchableOpacity style={styles.timeBtn} onPress={() => setShowMorningPicker(true)}>
            <Text style={styles.timeLabel}>Heure</Text>
            <Text style={styles.timeValue}>{fmt(morningHour, morningMinute)}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Soir */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View>
            <Text style={styles.rowTitle}>🌙 Rappel soir</Text>
            <Text style={styles.rowSub}>Vérifie tes habitudes avant de dormir</Text>
          </View>
          <Switch
            value={eveningEnabled}
            onValueChange={v => handleToggle('evening', v)}
            trackColor={{ false: C.s3, true: C.gold }}
            thumbColor={eveningEnabled ? '#000' : C.dim}
            ios_backgroundColor={C.s3}
          />
        </View>
        {eveningEnabled && (
          <TouchableOpacity style={styles.timeBtn} onPress={() => setShowEveningPicker(true)}>
            <Text style={styles.timeLabel}>Heure</Text>
            <Text style={styles.timeValue}>{fmt(eveningHour, eveningMinute)}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 Les messages changent chaque jour pour rester motivants et ne pas devenir répétitifs.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, { opacity: saving ? 0.7 : 1 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</Text>
      </TouchableOpacity>

      {showMorningPicker && (
        <TimePicker
          hour={morningHour} minute={morningMinute}
          onChange={(h, m) => { setMorningHour(h); setMorningMinute(m); }}
          onClose={() => setShowMorningPicker(false)}
        />
      )}
      {showEveningPicker && (
        <TimePicker
          hour={eveningHour} minute={eveningMinute}
          onChange={(h, m) => { setEveningHour(h); setEveningMinute(m); }}
          onClose={() => setShowEveningPicker(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontFamily: 'Cinzel', fontSize: 18, color: C.goldBright, letterSpacing: 2, marginBottom: 6 },
  subtitle: { fontSize: 12, color: C.dim, marginBottom: 20 },
  card: { backgroundColor: C.s1, borderWidth: 1, borderColor: C.s3, borderRadius: 14, padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { fontSize: 14, color: C.text, fontWeight: '600' },
  rowSub: { fontSize: 11, color: C.dim, marginTop: 3 },
  timeBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.s3 },
  timeLabel: { fontSize: 13, color: C.dim },
  timeValue: { fontFamily: 'SpaceMono', fontSize: 20, color: C.gold },
  infoBox: { backgroundColor: C.s2, borderRadius: 10, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: C.s3 },
  infoText: { fontSize: 12, color: C.dim, lineHeight: 18 },
  saveBtn: { backgroundColor: C.gold, borderRadius: 12, padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: 14, letterSpacing: 1 },
});

const tp = StyleSheet.create({
  label: { fontSize: 10, color: C.dim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' },
  item: { padding: 10, borderRadius: 8, marginBottom: 4, alignItems: 'center' },
  itemActive: { backgroundColor: C.goldDim },
  itemText: { fontFamily: 'SpaceMono', fontSize: 18, color: C.dim },
  itemTextActive: { color: C.gold, fontWeight: '700' },
});
