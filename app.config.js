// Adds secrets to the static config in app.json at build time, so they never live in git.
// Locally the key comes from .env.local (git-ignored); on EAS it comes from an EAS env variable.
// See README §2.
module.exports = ({ config }) => {
  const mapsKey = process.env.GOOGLE_MAPS_API_KEY;

  return {
    ...config,
    ios: {
      ...config.ios,
      config: { ...config.ios?.config, googleMapsApiKey: mapsKey },
    },
    android: {
      ...config.android,
      config: { ...config.android?.config, googleMaps: { apiKey: mapsKey } },
    },
  };
};
