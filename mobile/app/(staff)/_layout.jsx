import { Tabs } from 'expo-router';
import { Home, CreditCard, User } from 'lucide-react-native';
import React from 'react';

export default function StaffTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          backgroundColor: '#FFFFFF',
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
        },
        headerShown: true,
        headerStyle: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
        headerTitleStyle: { fontWeight: '900', fontSize: 15, color: '#111827', letterSpacing: 0.5 },
      }}
    >
      <Tabs.Screen name="home"    options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
      <Tabs.Screen name="salary"  options={{ title: 'My Salary', tabBarIcon: ({ color }) => <CreditCard size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <User size={22} color={color} /> }} />
    </Tabs>
  );
}
