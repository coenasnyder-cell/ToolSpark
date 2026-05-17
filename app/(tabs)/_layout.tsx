import { Tabs } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Text } from 'react-native';
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
        backgroundColor: Colors.sidebar,
        borderTopColor: Colors.border,
        borderTopWidth: 1,
        height: 85,              // taller to account for home indicator
        paddingBottom: 28,       // pushes icons up above home indicator
        paddingTop: 10,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.text3,
        tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Community',
          tabBarIcon: ({ color }) => (
            <TabIcon symbol="💬" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color }) => (
            <TabIcon symbol="⊞" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Tools',
          tabBarIcon: ({ color }) => (
            <TabIcon symbol="✦" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <TabIcon symbol="👤" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ symbol, color }: { 
  symbol: string; 
  color: string; 
}) {
  return (
    <Text style={{ fontSize: 22, color }}>
      {symbol}
    </Text>
  );
}