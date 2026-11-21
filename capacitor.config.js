
import { defineConfig } from '@capacitor/cli';

export default defineConfig({
  appId: 'com.zora.zorfy',
  appName: 'ZORFY',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
});
