// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// The list of file replacements can be found in `angular.json`.
import * as uuid from 'uuid';
import { system } from '../assets/system.js';

// NEW

export const environment = {
  name: "local",
  production: false,
  apiUrl: 'http://localhost:9000/',
  isCordovaAvailable: false,
  showDownloadMobileAppNotification: false,
  platform: null, //ios, android, web
  screenType: null,
  debug: true,
  appVersion: system.appVersion,
  latestVersion: null,
  defaultLanguage: "en",
  sessionId: uuid.v4(),
  deviceID: null,
};
