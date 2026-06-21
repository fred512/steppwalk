<template>
  <div ref="mapEl" class="route-map" :class="{ 'no-interaction': !interactive }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoPoint } from 'src/types';

const props = withDefaults(
  defineProps<{
    route: GeoPoint[];
    follow?: boolean; // segue a posição atual (modo ao vivo)
    interactive?: boolean;
  }>(),
  { follow: false, interactive: true },
);

const ROUTE_COLOR = '#F3751B'; // coral — alto contraste sobre tiles do OSM
const mapEl = ref<HTMLElement | null>(null);

let map: L.Map | null = null;
let line: L.Polyline | null = null;
let meMarker: L.CircleMarker | null = null;
let startMarker: L.CircleMarker | null = null;
let endMarker: L.CircleMarker | null = null;

const toLatLng = (p: GeoPoint): L.LatLngExpression => [p.lat, p.lng];

function buildMap() {
  if (!mapEl.value) return;
  map = L.map(mapEl.value, {
    zoomControl: props.interactive,
    attributionControl: true,
    dragging: props.interactive,
    scrollWheelZoom: props.interactive,
    doubleClickZoom: props.interactive,
    touchZoom: props.interactive,
  }).setView([-23.55, -46.63], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(map);

  line = L.polyline([], {
    color: ROUTE_COLOR,
    weight: 5,
    lineJoin: 'round',
    lineCap: 'round',
  }).addTo(map);

  render();
}

function render() {
  if (!map || !line) return;
  const pts = props.route.map(toLatLng);
  line.setLatLngs(pts);

  // marcador de início
  if (props.route.length > 0) {
    const first = props.route[0]!;
    if (!startMarker) {
      startMarker = L.circleMarker(toLatLng(first), {
        radius: 6,
        color: '#0B1110',
        weight: 2,
        fillColor: '#F2B10D',
        fillOpacity: 1,
      }).addTo(map);
    } else {
      startMarker.setLatLng(toLatLng(first));
    }
  }

  const last = props.route[props.route.length - 1];
  if (last) {
    if (props.follow) {
      // posição atual (ponto vivo teal)
      if (!meMarker) {
        meMarker = L.circleMarker(toLatLng(last), {
          radius: 8,
          color: '#0B1110',
          weight: 3,
          fillColor: '#0D968B',
          fillOpacity: 1,
        }).addTo(map);
      } else {
        meMarker.setLatLng(toLatLng(last));
      }
      map.setView(toLatLng(last), map.getZoom(), { animate: true });
    } else if (props.route.length > 1) {
      // fim do trajeto (coral)
      if (!endMarker) {
        endMarker = L.circleMarker(toLatLng(last), {
          radius: 6,
          color: '#0B1110',
          weight: 2,
          fillColor: '#F3751B',
          fillOpacity: 1,
        }).addTo(map);
      } else {
        endMarker.setLatLng(toLatLng(last));
      }
    }
  }

  // enquadra o trajeto salvo
  if (!props.follow && props.route.length > 1) {
    map.fitBounds(line.getBounds(), { padding: [28, 28] });
  }
}

onMounted(async () => {
  await nextTick();
  buildMap();
  // garante render após o container ter tamanho
  setTimeout(() => map?.invalidateSize(), 120);
});

onBeforeUnmount(() => {
  map?.remove();
  map = null;
});

watch(() => props.route.length, render);
</script>

<style scoped lang="scss">
.route-map {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: #0e1817;
  z-index: 0;
}
.no-interaction {
  pointer-events: none;
}
</style>
