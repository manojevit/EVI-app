import { Palette } from '@/constants/theme';

/**
 * The map page shown inside a WebView (device) or iframe (web).
 *
 * Free stack, no API key or billing: MapLibre GL JS renders OpenFreeMap's
 * OpenStreetMap vector tiles. The "positron" style is recoloured to the app's
 * light green palette. Station pins are HTML markers that report taps back to
 * React Native with postMessage; "you are here" is a car marker.
 *
 * React Native drives the map after load through window.__cmd(...):
 *   {type:'select', id}            highlight a pin and glide to it
 *   {type:'user', latitude, longitude, fit?}  move the car (and optionally re-fit)
 *   {type:'locate'}                glide back to the car
 *   {type:'fit', points}           fit these [lng, lat] points into view
 */
export type MapPin = { id: string; latitude: number; longitude: number; available: boolean };
export type MapPadding = { top: number; bottom: number; left: number; right: number };
export type MapPoint = { latitude: number; longitude: number };
export type MapCommand =
  | { type: 'select'; id: string | null }
  | { type: 'user'; latitude: number; longitude: number; fit?: [number, number][] }
  | { type: 'locate' }
  | { type: 'fit'; points: [number, number][] };

const MAPLIBRE = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl';
const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

const BOLT = `<svg width="16" height="16" viewBox="0 0 24 24"><path fill="${Palette.forest}" d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>`;
const BOLT_OFF = BOLT.replace(Palette.forest, '#99A49D');
const BOLT_SEL = BOLT.replace(Palette.forest, '#FFFFFF');
const CAR = `<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#fff" d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`;
export const USER_BLUE = '#2563EB';

export function liveMapHtml(o: {
  pins: MapPin[];
  interactive: boolean;
  padding: MapPadding;
  animatePins: boolean;
  user?: MapPoint | null;
  /** [lng, lat] points to fit on load; defaults to every pin (+ the user) */
  fit?: [number, number][];
}) {
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="${MAPLIBRE}.css">
<script src="${MAPLIBRE}.js"></script>
<style>
html,body,#map{margin:0;height:100%;width:100%;background:#EEF3EC;overflow:hidden}
.pin{width:44px;height:52px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.in{position:relative;width:44px;height:52px;transform-origin:50% 100%;transition:transform .25s cubic-bezier(.2,1.4,.4,1)}
.dot{position:absolute;left:4px;top:4px;width:36px;height:36px;border-radius:18px;background:#fff;border:3px solid ${Palette.volt};box-sizing:border-box;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(26,59,40,.2);transition:background .2s}
.stem{position:absolute;left:20.5px;top:38px;width:3px;height:10px;border-radius:2px;background:${Palette.volt}}
.pulse{position:absolute;left:0;top:0;width:44px;height:44px;border-radius:22px;background:${Palette.volt};opacity:0;animation:pulse 1.8s ease-out infinite}
.off .dot{border-color:#99A49D}.off .stem{background:#99A49D}.off .pulse{display:none}
.sel{z-index:5}.sel .in{transform:scale(1.28)}.sel .dot{background:${Palette.forest};border-color:#fff;box-shadow:0 6px 16px rgba(23,113,58,.45)}.sel .stem{background:${Palette.forest}}
.sel.off .dot{background:#8E9A92}
.b-sel{display:none}.sel .b-def{display:none}.sel .b-sel{display:block}
@keyframes pulse{0%{transform:scale(.55);opacity:.45}100%{transform:scale(1.45);opacity:0}}
.drop{animation:drop .65s cubic-bezier(.2,1.5,.4,1) both}
@keyframes drop{0%{transform:translateY(-30px) scale(.6);opacity:0}100%{transform:none;opacity:1}}
.me{position:relative;width:40px;height:40px;pointer-events:none}
.me .halo{position:absolute;left:-14px;top:-14px;width:68px;height:68px;border-radius:34px;background:${USER_BLUE};opacity:.16;animation:halo 2.4s ease-out infinite}
.me .car{position:absolute;left:0;top:0;width:40px;height:40px;border-radius:20px;background:${USER_BLUE};border:3px solid #fff;box-sizing:border-box;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(37,99,235,.45)}
@keyframes halo{0%{transform:scale(.6);opacity:.35}100%{transform:scale(1.25);opacity:0}}
.maplibregl-ctrl-attrib{font:10px/1.4 sans-serif}
/* map credit (i) sits bottom-left, just above whatever covers the bottom of the map */
.maplibregl-ctrl-bottom-right{bottom:${Math.max(0, o.padding.bottom - 60)}px;right:auto;left:0}
</style></head><body><div id="map"></div><script>
var O = ${JSON.stringify(o)};
function post(m){var s=JSON.stringify(m);if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(s);else window.parent.postMessage(s,'*');}
var map, me, user = O.user || null, els = {}, coords = {}, selected = null;
function fitPoints(pts, animate){
  if (!pts || !pts.length) return;
  var b = new maplibregl.LngLatBounds();
  pts.forEach(function(p){b.extend(p);});
  map.fitBounds(b,{padding:O.padding,animate:!!animate,duration:700,maxZoom:13});
}
function setUser(lat, lng){
  user = {latitude:lat, longitude:lng};
  if (!me) {
    var el=document.createElement('div');
    el.className='me';
    el.innerHTML='<div class="halo"></div><div class="car">${CAR}</div>';
    me = new maplibregl.Marker({element:el,anchor:'center'}).setLngLat([lng,lat]).addTo(map);
  } else me.setLngLat([lng,lat]);
}
window.__cmd = function(c){
  try {
    if (c.type==='select') {
      if (selected && els[selected]) els[selected].classList.remove('sel');
      selected = c.id;
      if (c.id && els[c.id]) {
        els[c.id].classList.add('sel');
        map.easeTo({center:coords[c.id],zoom:Math.max(map.getZoom(),12),padding:O.padding,duration:650});
      }
    } else if (c.type==='user') {
      setUser(c.latitude, c.longitude);
      if (c.fit) fitPoints(c.fit, true);
    } else if (c.type==='locate') {
      if (user) map.easeTo({center:[user.longitude,user.latitude],zoom:Math.max(map.getZoom(),12.5),padding:O.padding,duration:700});
    } else if (c.type==='fit') fitPoints(c.points, true);
  } catch (e) { post({type:'error',message:String(e)}); }
};
window.addEventListener('message', function(e){ if (typeof e.data==='string' && e.data.indexOf('"type"')>0 && e.source===window.parent) { try { window.__cmd(JSON.parse(e.data)); } catch (x) {} } });
try {
  map = new maplibregl.Map({container:'map',style:'${STYLE_URL}',interactive:O.interactive,attributionControl:{compact:true},dragRotate:false,pitchWithRotate:false,center:[77.12,28.6],zoom:9});
  if (map.touchZoomRotate) map.touchZoomRotate.disableRotation();
  var initial = O.fit || O.pins.map(function(p){return [p.longitude,p.latitude];}).concat(user?[[user.longitude,user.latitude]]:[]);
  fitPoints(initial, false);
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
    el.innerHTML='<div class="in'+(O.animatePins?' drop':'')+'" style="animation-delay:'+(250+i*110)+'ms"><div class="pulse" style="animation-delay:'+(i*260)+'ms"></div><div class="dot"><span class="b-def">'+(p.available?'${BOLT}':'${BOLT_OFF}')+'</span><span class="b-sel">${BOLT_SEL}</span></div><div class="stem"></div></div>';
    el.addEventListener('click',function(e){e.stopPropagation();post({type:'station',id:p.id});});
    els[p.id]=el; coords[p.id]=[p.longitude,p.latitude];
    new maplibregl.Marker({element:el,anchor:'bottom'}).setLngLat([p.longitude,p.latitude]).addTo(map);
  });
  if (user) setUser(user.latitude, user.longitude);
} catch (e) { post({type:'error',message:String(e)}); }
</script></body></html>`;
}
