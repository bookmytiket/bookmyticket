import 'react-native-get-random-values';
if (typeof global.crypto !== 'object') {
  global.crypto = {};
}
if (typeof global.crypto.getRandomValues !== 'function') {
  global.crypto.getRandomValues = (array) => {
    // This is a fallback, but the polyfill above should have handled it.
    // Some versions of the engine need the object to be explicitly defined.
    return global.crypto.getRandomValues ? global.crypto.getRandomValues(array) : array;
  };
}

import { Buffer } from 'buffer';
global.Buffer = Buffer;

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
