/**
 * Cross-platform storage utility.
 * - On native (iOS/Android): delegates to expo-secure-store (encrypted).
 * - On web: falls back to localStorage (secure-store is unavailable on web).
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export async function getItemAsync(key) {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

export async function setItemAsync(key, value) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  return SecureStore.setItemAsync(key, value);
}

export async function deleteItemAsync(key) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  return SecureStore.deleteItemAsync(key);
}
