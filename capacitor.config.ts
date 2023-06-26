import { CapacitorConfig } from '@capacitor/cli';
import {KeyboardResize} from "@capacitor/keyboard";

const config: CapacitorConfig = {
  appId: 'io.fliproom.mobile',
  appName: 'Fliproom',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      androidClientId: '288612213063-sjkvk48q4et5cce5pj7a6k9hou61itss.apps.googleusercontent.com',
      iosClientId: '288612213063-plusin72tml7bu1hp5lo1s66tkaf63hp.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    SplashScreen: {
      launchShowDuration: 50000, // use this to avoid white screen (splashscreen closing before app loads)
    },
    plugins: {
      Keyboard: {
        resize: KeyboardResize.None,
      },
    },
  }
};

export default config;
