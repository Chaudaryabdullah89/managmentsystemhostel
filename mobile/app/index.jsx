import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as SecureStore from '../lib/storage';
import { router } from 'expo-router';

export default function Trampoline() {
  useEffect(() => {
    async function checkSession() {
      try {
        const token = await SecureStore.getItemAsync('user_token');
        const role = await SecureStore.getItemAsync('user_role');

        if (!token || !role) {
          router.replace('/auth/login');
          return;
        }

        // Map role to respective mobile layout stack
        const formattedRole = role.toUpperCase();
        if (formattedRole === 'ADMIN' || formattedRole === 'WARDEN') {
          router.replace('/auth/restricted'); 
        } else if (formattedRole === 'STAFF') {
          router.replace('/(staff)/home');
        } else {
          // Resident / Guest
          router.replace('/(resident)/home');
        }
      } catch (err) {
        console.error('Session verify error:', err);
        router.replace('/auth/login');
      }
    }

    checkSession();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' }}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );
}
