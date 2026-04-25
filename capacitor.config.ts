import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.saderot.app',
  appName: 'saderOT',
  webDir: 'public',
  server: {
    url: 'https://saderot.com',
    cleartext: false,
    androidScheme: 'https'
  }
};
export default config;
