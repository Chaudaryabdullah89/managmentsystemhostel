import { Tabs } from 'expo-router';
import { Home, Users, BedDouble, BookOpen, UtensilsCrossed, CreditCard, Bell, ArrowLeftRight, FileText, User } from 'lucide-react-native';
import React from 'react';

export default function WardenTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          backgroundColor: '#FFFFFF',
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
        },
        headerTitleStyle: {
          fontWeight: '900',
          fontSize: 15,
          color: '#111827',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen name="home"      options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Home size={20} color={color} /> }} />
      <Tabs.Screen name="residents" options={{ title: 'Residents', tabBarIcon: ({ color }) => <Users size={20} color={color} /> }} />
      <Tabs.Screen name="rooms"     options={{ title: 'Rooms', tabBarIcon: ({ color }) => <BedDouble size={20} color={color} /> }} />
      <Tabs.Screen name="bookings"  options={{ title: 'Bookings', tabBarIcon: ({ color }) => <BookOpen size={20} color={color} /> }} />
      <Tabs.Screen name="mess"      options={{ title: 'Mess', tabBarIcon: ({ color }) => <UtensilsCrossed size={20} color={color} /> }} />
      <Tabs.Screen name="payments"  options={{ title: 'Finance', tabBarIcon: ({ color }) => <CreditCard size={20} color={color} /> }} />
      <Tabs.Screen name="notices"   options={{ title: 'Notices', tabBarIcon: ({ color }) => <Bell size={20} color={color} /> }} />
      <Tabs.Screen name="swaps"     options={{ title: 'Swaps', tabBarIcon: ({ color }) => <ArrowLeftRight size={20} color={color} /> }} />
      <Tabs.Screen name="salary"    options={{ title: 'Salary', tabBarIcon: ({ color }) => <CreditCard size={20} color={color} /> }} />
      <Tabs.Screen name="audit"     options={{ title: 'Audit', tabBarIcon: ({ color }) => <FileText size={20} color={color} /> }} />
      <Tabs.Screen name="complaints" options={{ title: 'Issues', tabBarIcon: ({ color }) => <Bell size={20} color={color} /> }} />
      <Tabs.Screen name="profile"   options={{ title: 'Profile', tabBarIcon: ({ color }) => <User size={20} color={color} /> }} />
    </Tabs>
  );
}
