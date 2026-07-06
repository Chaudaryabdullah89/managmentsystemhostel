import { Platform } from "react-native";
import Constants from "expo-constants";
import api from "./api";

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "web") {
    return null;
  }

  let token = null;

  try {
    // Dynamic import to prevent evaluation crash on Expo Go startup
    const Notifications = require("expo-notifications");

    // Set default handler to show alerts in foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn("[Notifications] Setup skipped: No projectId found (EAS/Expo Config not set). Registering mock token for development.");
      const mockToken = "ExponentPushToken[MOCK_DEV_TOKEN]";
      try {
        await api.post("/api/auth/register-push-token", { pushToken: mockToken });
        console.log("[Notifications] [Dev Fallback] Mock token registered successfully on backend:", mockToken);
      } catch (err) {
        console.warn("[Notifications] [Dev Fallback] Failed to register mock token:", err.message);
      }
      return mockToken;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4F46E5",
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Notification permission was not granted.");
      return null;
    }

    const tokenObj = await Notifications.getExpoPushTokenAsync({ projectId });
    token = tokenObj.data;

    // Register token on the backend
    if (token) {
      await api.post("/api/auth/register-push-token", { pushToken: token });
      console.log("[Notifications] Token registered successfully on backend:", token);
    }
  } catch (error) {
    console.warn("[Notifications] Setup failed:", error.message);
  }

  return token;
}

