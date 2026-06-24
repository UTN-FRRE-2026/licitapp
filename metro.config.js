const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

// Firebase JS SDK + Metro issue: when unstable_enablePackageExports is ON,
// Metro can resolve @firebase/component to its CJS build from some require()
// calls and to its ESM build from others. This creates two separate module
// instances with separate component registries, so registerAuth() and
// initializeApp() end up on different instances → "Component auth has not
// been registered yet". Disabling package exports forces Metro to use the
// legacy react-native > browser > main field resolution, which is consistent.
config.resolver.unstable_enablePackageExports = false

// Also pin all @firebase/* packages to the root node_modules copy so there is
// never more than one instance in the bundle.
const firebasePackages = [
  '@firebase/app',
  '@firebase/component',
  '@firebase/util',
  '@firebase/logger',
  '@firebase/installations',
]

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  ...Object.fromEntries(
    firebasePackages.map((pkg) => [
      pkg,
      path.resolve(__dirname, 'node_modules', pkg),
    ])
  ),
}

module.exports = config
