import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { C } from '@/constants/colors';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [calTarget, setCalTarget] = useState('2300');
  const [protTarget, setProtTarget] = useState('180');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name || !email || !password) return Alert.alert('Remplis tous les champs');
    if (password.length < 6) return Alert.alert('Mot de passe trop court (6 caractères min)');
    setLoading(true);
    const error = await signUp(email.trim(), password, name.trim());
    setLoading(false);
    if (error) Alert.alert('Erreur', error.message);
    else Alert.alert('✅ Compte créé !', 'Vérifie ton email pour confirmer.');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.logo}>AEGIS</Text>
        <Text style={styles.sub}>Crée ton profil</Text>

        <Text style={styles.sectionLabel}>👤 Identité</Text>
        <TextInput style={styles.input} placeholder="Prénom" placeholderTextColor={C.dim}
          value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={C.dim}
          value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Mot de passe (6 caractères min)" placeholderTextColor={C.dim}
          value={password} onChangeText={setPassword} secureTextEntry />

        <Text style={styles.sectionLabel}>🎯 Objectifs nutritionnels</Text>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.inputLabel}>Calories / jour</Text>
            <TextInput style={styles.input} placeholderTextColor={C.dim}
              value={calTarget} onChangeText={setCalTarget} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Protéines / jour (g)</Text>
            <TextInput style={styles.input} placeholderTextColor={C.dim}
              value={protTarget} onChangeText={setProtTarget} keyboardType="numeric" />
          </View>
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.btnText}>CRÉER MON COMPTE</Text>
          }
        </TouchableOpacity>

        <Link href="/auth/login" asChild>
          <TouchableOpacity style={styles.linkBtn}>
            <Text style={styles.linkText}>Déjà un compte ? <Text style={{ color: C.gold }}>Se connecter</Text></Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  inner: { padding: 28, paddingTop: 60 },
  logo: { fontFamily: 'Cinzel', fontSize: 36, color: C.goldBright, letterSpacing: 8, textAlign: 'center', marginBottom: 6 },
  sub: { fontSize: 12, color: C.dim, textAlign: 'center', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 36 },
  sectionLabel: { fontSize: 10, color: C.gold, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12, marginTop: 8 },
  inputLabel: { fontSize: 11, color: C.dim, marginBottom: 6 },
  input: { backgroundColor: C.s2, borderWidth: 1, borderColor: C.s3, borderRadius: 10, padding: 14, color: C.text, fontSize: 15, marginBottom: 12 },
  row: { flexDirection: 'row' },
  btn: { backgroundColor: C.gold, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12, marginBottom: 20 },
  btnText: { color: '#000', fontWeight: '700', letterSpacing: 2, fontSize: 14 },
  linkBtn: { alignItems: 'center' },
  linkText: { color: C.dim, fontSize: 14 },
});
