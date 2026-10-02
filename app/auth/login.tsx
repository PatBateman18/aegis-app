import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { C } from '@/constants/colors';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return Alert.alert('Remplis tous les champs');
    setLoading(true);
    const error = await signIn(email.trim(), password);
    setLoading(false);
    if (error) Alert.alert('Erreur', error.message);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>AEGIS</Text>
        <Text style={styles.sub}>Discipline. Chaque jour.</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={C.dim}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={C.dim}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
        />

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.btnText}>CONNEXION</Text>
          }
        </TouchableOpacity>

        <Link href="/auth/register" asChild>
          <TouchableOpacity style={styles.linkBtn}>
            <Text style={styles.linkText}>Pas encore de compte ? <Text style={{ color: C.gold }}>Créer un compte</Text></Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  inner: { flex: 1, justifyContent: 'center', padding: 28 },
  logo: {
    fontFamily: 'Cinzel',
    fontSize: 40,
    color: C.goldBright,
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    fontSize: 12,
    color: C.dim,
    textAlign: 'center',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 48,
  },
  input: {
    backgroundColor: C.s2,
    borderWidth: 1,
    borderColor: C.s3,
    borderRadius: 10,
    padding: 14,
    color: C.text,
    fontSize: 16,
    marginBottom: 14,
  },
  btn: {
    backgroundColor: C.gold,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  btnText: {
    color: '#000',
    fontWeight: '700',
    letterSpacing: 2,
    fontSize: 14,
  },
  linkBtn: { alignItems: 'center' },
  linkText: { color: C.dim, fontSize: 14 },
});
