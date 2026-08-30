/**
 * Expo config overlay so production AdMob app IDs and legal URLs can be
 * injected at EAS build time without editing app.json.
 *
 * Expo passes app.json's contents in as `config`; we modify and return it.
 * (Requiring app.json manually makes `expo doctor` flag the project.)
 */
const TEST_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const TEST_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';

module.exports = ({ config }) => {
  const androidAppId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || TEST_ANDROID_APP_ID;
  const iosAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || TEST_IOS_APP_ID;

  const plugins = (config.plugins || []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === 'react-native-google-mobile-ads') {
      return [
        'react-native-google-mobile-ads',
        {
          ...(plugin[1] || {}),
          androidAppId,
          iosAppId,
        },
      ];
    }
    return plugin;
  });

  return {
    ...config,
    plugins,
    extra: {
      ...(config.extra || {}),
      privacyPolicyUrl: process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || config.extra?.privacyPolicyUrl || '',
      termsOfServiceUrl: process.env.EXPO_PUBLIC_TERMS_URL || config.extra?.termsOfServiceUrl || '',
      supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || config.extra?.supportEmail || '',
    },
  };
};
