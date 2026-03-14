// Stub for the qrcode npm package on web.
// react-native-qrcode-svg is NOT web-compatible, so we provide safe empty exports
// to prevent Metro from crashing with "Utils.getBCHDigit is not a function" etc.
module.exports = {
  default: {},
  create: () => ({ modules: [], version: 0 }),
  toString: () => '',
};
