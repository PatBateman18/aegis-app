// components/SoundSettingsScreen.tsx
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/constants/colors';
import { useSound, SOUND_LABELS } from '@/hooks/useSound';

const GOLD  = '#C9A84C';
const GOLDB = '#E8C46A';

type Props = { visible: boolean; onClose: () => void };

export default function SoundSettingsScreen({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { play, volumes, setVolume, getVolume } = useSound();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.s3 }}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: C.dim, fontSize: 14 }}>Fermer</Text></TouchableOpacity>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 15, color: GOLDB, letterSpacing: 2 }}>VOLUME DES SONS</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20, gap: 20 }}>
          {Object.entries(SOUND_LABELS).map(([key, label]) => (
            <View key={key} style={{ backgroundColor: '#0A0800', borderRadius: 14, borderWidth: 1, borderColor: GOLD + '22', padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ fontSize: 14, color: C.text, fontWeight: '600' }}>{label}</Text>
                <TouchableOpacity
                  onPress={() => play(key)}
                  style={{ backgroundColor: GOLD + '22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: GOLD + '55' }}
                >
                  <Text style={{ fontSize: 10, color: GOLD, fontWeight: '700' }}>TESTER</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Slider
                  style={{ flex: 1, height: 32 }}
                  minimumValue={0}
                  maximumValue={1}
                  value={getVolume(key)}
                  onValueChange={(v: number) => setVolume(key, v)}
                  minimumTrackTintColor={GOLD}
                  maximumTrackTintColor="rgba(255,255,255,0.15)"
                  thumbTintColor={GOLDB}
                />
                <Text style={{ fontSize: 11, color: C.dim, width: 32, textAlign: 'right' }}>
                  {Math.round((volumes[key] ?? 1) * 100)}%
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
