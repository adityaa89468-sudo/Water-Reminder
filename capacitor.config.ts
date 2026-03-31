import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.water.reminder.app',
  appName: 'Water Reminder',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    AdMob: {
      // These are the IDs you provided
      androidAppId: 'ca-app-pub-9364231981895017~9211342199'
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"]
    }
  }
};

export default config;
