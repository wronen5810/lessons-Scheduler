import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lessonscheduler.app',
  appName: 'Lessons Scheduler',
  webDir: 'public',
  server: {
    url: 'https://lessons-scheduler.com',
    cleartext: false,
    androidScheme: 'https'
  }
};
export default config;
