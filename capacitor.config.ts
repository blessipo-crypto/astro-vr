import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.uranie.vr.autonome',
  appName: 'Uranie VR Autonome',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#05070e',
  },
};

export default config;
