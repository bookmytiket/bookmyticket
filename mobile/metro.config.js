const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the workspace root (including root convex)
config.watchFolders = [workspaceRoot];

// 2. resolver setup for monorepo/cross-folder support
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Define an ALIAS for the root convex folder
// Use absolute path for reliability
config.resolver.extraNodeModules = {
  '@convex': path.resolve(workspaceRoot, 'convex'),
};

module.exports = config;
