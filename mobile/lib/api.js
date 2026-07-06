import axios from 'axios';
import * as SecureStore from './storage';
import { router } from 'expo-router';

import Constants from 'expo-constants';

// Dynamically resolve local computer's IP address when running locally.
// If using physical device, 'localhost' points to device. Using hostUri resolves dev computer.
let localUrl = 'http://localhost:3000';
if (Constants.expoConfig?.hostUri) {
  const host = Constants.expoConfig.hostUri.split(':')[0];
  localUrl = `http://${host}:3000`;
}

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || localUrl,
  timeout: 15000,
});

// Auto-inject JWT on every outbound request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('user_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Global response listener to clear local session upon HTTP 401 Unauthorized errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await SecureStore.deleteItemAsync('user_token');
      await SecureStore.deleteItemAsync('user_role');
      router.replace('/auth/login');
    }
    return Promise.reject(error);
  }
);

export default api;
