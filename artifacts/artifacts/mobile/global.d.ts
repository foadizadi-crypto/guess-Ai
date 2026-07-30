/**
 * React Native / Node.js global variable declaration.
 *
 * TypeScript's DOM+ESNext lib does not include `global` (a Node.js/React Native
 * runtime global). This declaration makes it available so third-party packages
 * that reference it (e.g. react-native-iap) type-check correctly.
 */
declare var global: typeof globalThis;
