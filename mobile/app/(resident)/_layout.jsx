import { Tabs, router } from 'expo-router';
import { Home, BedDouble, UtensilsCrossed, CreditCard, User } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { colors } from '../../lib/theme';
import { registerForPushNotificationsAsync } from '../../lib/notifications';
import * as Notifications from 'expo-notifications';

export default function ResidentTabsLayout() {
  useEffect(() => {
    registerForPushNotificationsAsync();

    // Listen to notification clicks (tap events)
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      const screen = data?.screen;

      if (screen === "payments") {
        router.push("/(resident)/payments");
      } else if (screen === "mess") {
        router.push("/(resident)/mess");
      } else if (screen === "support") {
        router.push({ pathname: "/(resident)/home", params: { openModal: "support" } });
      } else {
        router.push({ pathname: "/(resident)/home", params: { openModal: "notices" } });
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textPlaceholder,
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          height: 80,
          paddingBottom: 18,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
          letterSpacing: 0.2,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 0.5 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4,
        },
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 16,
          color: colors.textPrimary,
          letterSpacing: -0.3,
        },
        headerShadowVisible: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Home size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-room"
        options={{
          title: 'My Room',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <BedDouble size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="mess"
        options={{
          title: 'Mess',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <UtensilsCrossed size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <CreditCard size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      {/* Hidden screens — accessible via modals inside home.jsx */}
      <Tabs.Screen name="bookings" options={{ href: null }} />
      <Tabs.Screen name="complaints" options={{ href: null }} />
    </Tabs>
  );
}
