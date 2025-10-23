const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

const withGoogleMaps = (config) => {
  // Configuration Android
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;

    // Ajouter la clé Google Maps dans AndroidManifest.xml
    const application = androidManifest.application[0];

    // Vérifier si la meta-data existe déjà
    if (!application['meta-data']) {
      application['meta-data'] = [];
    }

    // Récupérer la clé depuis app.json
    const apiKey = config.android?.config?.googleMaps?.apiKey || 'AIzaSyCuKs4ucoYrHcU16fsZJw9dP2BsrXR9LyQ';

    const googleMapsMetaData = {
      $: {
        'android:name': 'com.google.android.geo.API_KEY',
        'android:value': apiKey,
      },
    };

    // Retirer l'ancienne si elle existe
    application['meta-data'] = application['meta-data'].filter(
      (item) => item.$['android:name'] !== 'com.google.android.geo.API_KEY'
    );

    // Ajouter la nouvelle
    application['meta-data'].push(googleMapsMetaData);

    return config;
  });

  // Configuration iOS
  config = withInfoPlist(config, (config) => {
    const apiKey = config.ios?.config?.googleMapsApiKey || 'AIzaSyCuKs4ucoYrHcU16fsZJw9dP2BsrXR9LyQ';

    config.modResults.GMSApiKey = apiKey;

    return config;
  });

  return config;
};

module.exports = withGoogleMaps;
