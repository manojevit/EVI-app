import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { STATIONS_CAMERA, embedUrl } from '@/constants/map-style';

const page = (src: string) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>html,body{margin:0;height:100%;background:#E4EBE1;overflow:hidden}iframe{border:0;width:100%;height:100%;display:block}</style>
</head><body><iframe src="${src}" title="Google map"></iframe></body></html>`;

/**
 * A real Google map via the keyless embed, shown in a WebView. Used in Expo Go,
 * where the native map SDK can't load. Touches pass through (pins sit on top),
 * and the camera matches projectFromCenter() so overlay pins line up.
 */
export default function GoogleMapEmbed({ camera = STATIONS_CAMERA }: { camera?: typeof STATIONS_CAMERA }) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.bg]} pointerEvents="none">
      <WebView
        source={{ html: page(embedUrl(camera)), baseUrl: 'https://maps.google.com' }}
        originWhitelist={['*']}
        scrollEnabled={false}
        overScrollMode="never"
        style={styles.bg}
      />
    </View>
  );
}

const styles = StyleSheet.create({ bg: { flex: 1, backgroundColor: '#E4EBE1' } });
