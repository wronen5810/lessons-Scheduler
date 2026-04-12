import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lessonscheduler.app',
  appName: 'My App',
  webDir: 'public',
  server: {
    url: 'https://lessons-scheduler.vercel.app',
    cleartext: false,
    androidScheme: 'https'
  }
};
export default config;
