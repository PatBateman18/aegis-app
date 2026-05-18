import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { C } from '@/constants/colors';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.s1,
          borderTopColor: C.s3,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: C.gold,
        tabBarInactiveTintColor: C.dim,
        tabBarLabelStyle: {
          fontSize: 9,
          letterSpacing: 1,
          textTransform: 'uppercase',
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({ focused }) => <TabIcon emoji="⚡" focused={focused} /> }} />
      <Tabs.Screen name="physical" options={{ title: 'Corps', tabBarIcon: ({ focused }) => <TabIcon emoji="💪" focused={focused} /> }} />
      <Tabs.Screen name="mindset" options={{ title: 'Mindset', tabBarIcon: ({ focused }) => <TabIcon emoji="🧠" focused={focused} /> }} />
      <Tabs.Screen name="appearance" options={{ title: 'Style', tabBarIcon: ({ focused }) => <TabIcon emoji="🪞" focused={focused} /> }} />
      <Tabs.Screen name="goals" options={{ title: 'Vision', tabBarIcon: ({ focused }) => <TabIcon emoji="🎯" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }} />
    </Tabs>
  );
}
