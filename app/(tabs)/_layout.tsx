import { Tabs } from 'expo-router';
import { Image } from 'react-native';
import { C } from '@/constants/colors';

const ICONS = {
  accueil: require('@/assets/tabs/tab_accueil2.png'),
  corps:   require('@/assets/tabs/tab_corps.png'),
  mindset: require('@/assets/tabs/tab_mindset.png'),
  style:   require('@/assets/tabs/tab_style.png'),
  vision:  require('@/assets/tabs/tab_vision.png'),
  profil:  require('@/assets/tabs/tab_profil.png'),
};

function TabIcon({ icon, focused }: { icon: any; focused: boolean }) {
  return (
    <Image
      source={icon}
      style={{ width: 35, height: 35, opacity: focused ? 1 : 0.4 }}
      resizeMode="contain"
    />
  );
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
        sceneContainerStyle: { backgroundColor: C.bg },
        animation: 'fade',
      }}
    >
      <Tabs.Screen name="index"      options={{ title: 'Accueil', tabBarIcon: ({ focused }) => <TabIcon icon={ICONS.accueil} focused={focused} /> }} />
      <Tabs.Screen name="physical"   options={{ title: 'Corps',   tabBarIcon: ({ focused }) => <TabIcon icon={ICONS.corps}   focused={focused} /> }} />
      <Tabs.Screen name="mindset"    options={{ title: 'Mindset', tabBarIcon: ({ focused }) => <TabIcon icon={ICONS.mindset} focused={focused} /> }} />
      <Tabs.Screen name="appearance" options={{ title: 'Style',   tabBarIcon: ({ focused }) => <TabIcon icon={ICONS.style}   focused={focused} /> }} />
      <Tabs.Screen name="goals"      options={{ title: 'Vision',  tabBarIcon: ({ focused }) => <TabIcon icon={ICONS.vision}  focused={focused} /> }} />
      <Tabs.Screen name="profile"    options={{ title: 'Profil',  tabBarIcon: ({ focused }) => <TabIcon icon={ICONS.profil}  focused={focused} /> }} />
    </Tabs>
  );
}
