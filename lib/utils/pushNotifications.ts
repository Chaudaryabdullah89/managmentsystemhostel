import { prisma } from "@/lib/prisma";

/**
 * Sends a real-time Expo push notification to a specific user and logs it in the database.
 * 
 * @param userId - The ID of the recipient user
 * @param title - The push notification title
 * @param body - The push notification body content
 * @param screen - The target destination screen for routing on click ("payments", "support", "notices")
 * @param senderId - Optional ID of the user who triggered the notification (defaults to first system Admin)
 */
export async function sendPushNotificationToUser(
  userId: string,
  title: string,
  body: string,
  screen: string = "notices",
  senderId?: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, pushToken: true }
    });

    if (!user || !user.pushToken) {
      console.log(`[Push Notification] Skipped: No push token registered for user: ${userId}`);
      return false;
    }

    // Prepare payload for Expo Push API
    const expoMessage = {
      to: user.pushToken,
      sound: "default",
      title,
      body: body.length > 150 ? body.substring(0, 150) + "..." : body,
      data: { title, body, screen }
    };

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expoMessage)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Push Notification] Expo API error: ${response.status} - ${errText}`);
      return false;
    }

    // Determine target sender ID for relational history logging
    let actualSenderId = senderId;
    if (!actualSenderId) {
      const systemAdmin = await prisma.user.findFirst({
        where: { role: "ADMIN" },
        select: { id: true }
      });
      actualSenderId = systemAdmin?.id || userId;
    }

    // Save MobileNotification log in DB so it shows up in Notice Board
    await prisma.mobileNotification.create({
      data: {
        title,
        body,
        targetType: "specific_users",
        recipientCount: 1,
        sentById: actualSenderId
      }
    });

    console.log(`[Push Notification] Dispatched and logged: "${title}" to user ${userId}`);
    return true;
  } catch (err: any) {
    console.error("[Push Notification] Failed to dispatch push notification:", err.message);
    return false;
  }
}
