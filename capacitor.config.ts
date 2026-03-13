import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bookmyticket.app',
  appName: 'BookMyTicket',
  webDir: 'out',
  server: {
    // For local dev use 'http://10.0.2.2:3000' (Android Emulator maps this to your PC's localhost:3000)
    // For Production, replace this with your Vercel/Production URL
    // url: 'http://10.0.2.2:3000',
    cleartext: true,
    allowNavigation: [
      '10.0.2.2:3000',
      '*.vercel.app',
      '*.bookmyticket.com' // Example production domains
    ]
  }
};

export default config;
