import { PIN_MARK } from '@/components/evit-pin-mark';
import { Palette } from '@/constants/theme';

/**
 * The map page shown inside a WebView (device) or iframe (web).
 *
 * Free stack, no API key or billing: MapLibre GL JS renders OpenFreeMap's
 * OpenStreetMap vector tiles. The "positron" style is recoloured to the app's
 * light green palette, and station pins are HTML markers (the EVIT logo on a green
 * badge, grey when nothing is free) that report taps back to React Native with postMessage.
 */
export type MapPin = { id: string; latitude: number; longitude: number; available: boolean };
export type MapPadding = { top: number; bottom: number; left: number; right: number };

const MAPLIBRE = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl';
const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';


export function liveMapHtml(o: { pins: MapPin[]; interactive: boolean; padding: MapPadding; animatePins: boolean }) {
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="${MAPLIBRE}.css">
<script src="${MAPLIBRE}.js"></script>
<style>
html,body,#map{margin:0;height:100%;width:100%;background:#EEF3EC;overflow:hidden}
.pin{width:58px;height:46px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.in{position:relative;width:58px;height:46px}
.body{position:absolute;z-index:1;left:0;top:0;width:58px;height:36px;border-radius:12px;background:linear-gradient(135deg,#2BAF5F,${Palette.forest});border:2.5px solid #fff;box-sizing:border-box;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 14px rgba(23,113,58,.35)}
.body img{width:38px;height:auto;display:block;pointer-events:none}
.tail{position:absolute;left:23px;top:29px;width:12px;height:12px;background:${Palette.forest};border-right:2.5px solid #fff;border-bottom:2.5px solid #fff;border-radius:0 0 3px 0;transform:rotate(45deg)}
.pulse{position:absolute;left:-7px;top:-7px;width:72px;height:50px;border-radius:18px;background:${Palette.volt};opacity:0;animation:pulse 1.9s ease-out infinite}
.off .body{background:#8E9A92;box-shadow:0 4px 10px rgba(26,59,40,.22)}.off .tail{background:#8E9A92}.off .pulse{display:none}
@keyframes pulse{0%{transform:scale(.8);opacity:.45}100%{transform:scale(1.35);opacity:0}}
.drop{animation:drop .65s cubic-bezier(.2,1.5,.4,1) both}
@keyframes drop{0%{transform:translateY(-30px) scale(.6);opacity:0}100%{transform:none;opacity:1}}
.maplibregl-ctrl-attrib{font:10px/1.4 sans-serif}
.maplibregl-ctrl-bottom-right{bottom:${Math.max(0, o.padding.bottom - 40)}px}
</style></head><body><div id="map"></div><script>
var O = ${JSON.stringify(o)};
function post(m){var s=JSON.stringify(m);if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(s);else window.parent.postMessage(s,'*');}
try {
  var map = new maplibregl.Map({container:'map',style:'${STYLE_URL}',interactive:O.interactive,attributionControl:{compact:true},dragRotate:false,pitchWithRotate:false,center:[77.12,28.6],zoom:9});
  if (map.touchZoomRotate) map.touchZoomRotate.disableRotation();
  var b = new maplibregl.LngLatBounds();
  O.pins.forEach(function(p){b.extend([p.longitude,p.latitude]);});
  if (O.pins.length) map.fitBounds(b,{padding:O.padding,animate:false,maxZoom:12});
  map.on('load',function(){
    // recolour positron to the app palette and hide points of interest
    map.getStyle().layers.forEach(function(l){
      try {
        if (l.type==='background') map.setPaintProperty(l.id,'background-color','#EEF3EC');
        else if (l.type==='fill' && /water/.test(l.id)) map.setPaintProperty(l.id,'fill-color','#BFE3CF');
        else if (l.type==='fill' && /park|wood|grass|landcover|forest/.test(l.id)) map.setPaintProperty(l.id,'fill-color','#D6F0DB');
        else if (l.type==='symbol' && /poi/.test(l.id)) map.setLayoutProperty(l.id,'visibility','none');
      } catch (e) {}
    });
    // keep the OpenStreetMap credit as the small (i) button instead of a wide banner
    var a=document.querySelector('.maplibregl-ctrl-attrib');
    if (a) a.classList.remove('maplibregl-compact-show');
    post({type:'ready'});
  });
  O.pins.forEach(function(p,i){
    var el=document.createElement('div');
    el.className='pin'+(p.available?'':' off');
    el.innerHTML='<div class="in'+(O.animatePins?' drop':'')+'" style="animation-delay:'+(250+i*110)+'ms"><div class="pulse" style="animation-delay:'+(i*260)+'ms"></div><div class="tail"></div><div class="body"><img alt="EVIT" src="${PIN_MARK}"></div></div>';
    el.addEventListener('click',function(e){e.stopPropagation();post({type:'station',id:p.id});});
    new maplibregl.Marker({element:el,anchor:'bottom'}).setLngLat([p.longitude,p.latitude]).addTo(map);
  });
} catch (e) { post({type:'error',message:String(e)}); }
</script></body></html>`;
}
