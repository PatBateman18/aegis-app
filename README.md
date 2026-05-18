# AEGIS — React Native + Expo + Supabase

## 🚀 Installation (5 minutes)

### 1. Prérequis
```bash
node -v  # v18+ requis
npm install -g expo-cli eas-cli
```

### 2. Clone & Install
```bash
cd aegis-app
npm install
```

### 3. Configure Supabase

1. Va sur **supabase.com** → New project
2. SQL Editor → colle le contenu de `supabase/schema.sql` → Run
3. Settings → API → copie `URL` et `anon key`
4. Ouvre `lib/supabase.ts` et remplace :
```ts
const SUPABASE_URL = 'https://VOTRE_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'VOTRE_ANON_KEY';
```

### 4. Lance l'app
```bash
npx expo start
```
Scanne le QR code avec **Expo Go** sur ton iPhone.

---

## 📁 Structure
```
aegis-app/
├── app/
│   ├── _layout.tsx          # Root layout + auth guard
│   ├── auth/
│   │   ├── login.tsx         # Écran connexion
│   │   └── register.tsx      # Écran inscription
│   └── (tabs)/
│       ├── index.tsx         # Dashboard
│       ├── physical.tsx      # Corps
│       ├── mindset.tsx       # Mindset
│       ├── appearance.tsx    # Style
│       └── goals.tsx         # Vision
├── components/
│   └── ui.tsx               # Card, Toggle, Input, ScoreRing...
├── constants/
│   ├── colors.ts            # Palette
│   └── types.ts             # Types + helpers
├── hooks/
│   ├── useAuth.ts           # Auth Supabase
│   └── useDay.ts            # Données quotidiennes
├── lib/
│   └── supabase.ts          # Client Supabase
└── supabase/
    └── schema.sql           # Tables + RLS
```

---

## 📱 Tester sur iPhone

1. Installe **Expo Go** depuis l'App Store
2. `npx expo start`
3. Scanne le QR code avec l'appareil photo

---

## 🏪 Publier sur l'App Store

```bash
eas build --platform ios
eas submit --platform ios
```

---

## 💡 Stack
- **React Native + Expo** — app iOS/Android native
- **Expo Router** — navigation file-based
- **Supabase** — auth + base de données PostgreSQL
- **Expo Secure Store** — tokens auth sécurisés (iOS Keychain)
- **Expo Image Picker** — galerie photo
- **Expo Notifications** — rappels push natifs
