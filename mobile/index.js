import 'react-native-get-random-values';

// Define global object
const g = typeof global !== 'undefined' ? global : window;

// Define crypto object
if (!g.crypto) {
  g.crypto = {};
}

// React native get random values polyfills g.crypto.getRandomValues automatically.
// Make crypto globally available directly.
if (typeof crypto === 'undefined') {
  // Provide explicit access 
  Object.defineProperty(g, 'crypto', {
    get() {
      return g.crypto;
    }
  });
}

import { Buffer } from 'buffer';
g.Buffer = Buffer;

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
