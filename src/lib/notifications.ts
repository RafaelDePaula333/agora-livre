// src/lib/notifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Configure how the app handles notifications while in foreground
 */
export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}



/**
 * Request permissions and return status
 */
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
}

/**
 * Schedule multiple strategic reminders throughout the day
 */
export async function scheduleSmartReminders() {
  await cancelAllNotifications();

  // 1. Morning - Intention
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Um novo dia, uma nova chance 🌅",
      body: "Qual sua intenção para sua sobriedade hoje?",
      data: { screen: 'Home' },
    },
    trigger: { hour: 9, minute: 0, repeats: true, type: Notifications.SchedulableTriggerInputTypes.CALENDAR },
  });

  // 2. Afternoon - Check-in
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Como você está se sentindo? 📋",
      body: "Reserve 30 segundos para o seu check-in da tarde.",
      data: { screen: 'CheckIn' },
    },
    trigger: { hour: 15, minute: 0, repeats: true, type: Notifications.SchedulableTriggerInputTypes.CALENDAR },
  });

  // 3. Evening - Reflection
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Mais um dia de vitória! 🏆",
      body: "Parabéns por hoje. Como foi sua jornada?",
      data: { screen: 'Progress' },
    },
    trigger: { hour: 21, minute: 0, repeats: true, type: Notifications.SchedulableTriggerInputTypes.CALENDAR },
  });
}

/**
 * Schedule a simple daily reminder (deprecated in favor of smart reminders)
 */
export async function scheduleDailyReminder(hour = 9, minute = 0) {
  await cancelAllNotifications();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Como está sua jornada hoje? 🌅",
      body: "Não esqueça de fazer seu check-in diário no Agora Livre.",
      data: { screen: 'CheckIn' },
    },
    trigger: { hour, minute, repeats: true, type: Notifications.SchedulableTriggerInputTypes.CALENDAR },
  });
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
