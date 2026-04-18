import OneSignal from 'onesignal-cordova-plugin';
import { Capacitor } from '@capacitor/core';

export const initOneSignal = () => {
  if (Capacitor.isNativePlatform()) {
    const appId = (import.meta as any).env.VITE_ONESIGNAL_APP_ID;
    
    if (!appId) {
      console.warn('OneSignal App ID is not set in VITE_ONESIGNAL_APP_ID');
      return;
    }

    // Initialize OneSignal
    OneSignal.initialize(appId);

    // Add event listeners for notifications
    OneSignal.Notifications.addEventListener('click', (event: any) => {
      console.log('OneSignal: Notification Clicked', event);
    });

    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
      console.log('OneSignal: Notification Foreground', event.notification);
    });

    // iOS Only: Prompt for push notifications
    if (Capacitor.getPlatform() === 'ios') {
      OneSignal.Notifications.requestPermission(true).then((accepted: boolean) => {
        console.log('OneSignal: User accepted notifications: ', accepted);
      });
    }
  }
};

export const setOneSignalExternalId = (userId: string) => {
  if (Capacitor.isNativePlatform()) {
    OneSignal.login(userId);
  }
};

export const removeOneSignalExternalId = () => {
  if (Capacitor.isNativePlatform()) {
    OneSignal.logout();
  }
};
