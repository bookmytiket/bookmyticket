// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix: react-native-qrcode-svg uses the `qrcode` npm package which is NOT
// web-compatible. It tries to require internal modules (./utils, etc.) that
// Metro can't resolve on web. We stub the entire qrcode package on web.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    // Stub the entire qrcode package and all its internal modules on web
    if (
      moduleName === 'qrcode' ||
      moduleName.startsWith('qrcode/') ||
      (context.originModulePath &&
        context.originModulePath.includes('/qrcode/') &&
        (moduleName.startsWith('./') || moduleName.startsWith('../')))
    ) {
      return {
        filePath: path.resolve(__dirname, 'stubs/qrcode-stub.js'),
        type: 'sourceFile',
      };
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
