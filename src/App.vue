<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { MathUtils, OrthographicCamera, Raycaster, Vector2 } from "three";
import type { MultiPolygon, Polygon } from "geojson";
import chart from "@/entry";
import world from "./map/world.json";
import chinaBoundary from "./map/ChinaAdditionalRouteMap.geojson?raw";

const globeRadius = 174;
const radarStyle = { color: "#50f5cc", radius: 10, speed: 0.25 };
const stations = [
  {
    name: "上海",
    point: { id: "shanghai", lon: 121.47, lat: 31.23 },
    style: radarStyle,
  },
  {
    name: "东京",
    point: { id: "tokyo", lon: 139.69, lat: 35.68 },
    style: { color: "#b6abfa", radius: 6, speed: 0 },
  },
  {
    name: "新加坡",
    point: { id: "singapore", lon: 103.82, lat: 1.35 },
    style: { color: "#7bcafa", radius: 8, speed: 0.18 },
  },
].map(station => ({ ...station, settings: reactive({ ...station.style }) }));
type Station = typeof stations[number];
const routes = stations.slice(1).map(to => ({ from: stations[0], to }));
const selected = ref(stations[0].point.id);
const station = computed(() => stations.find(item => item.point.id === selected.value)!);
const isDefault = computed(() => station.value.settings.speed === station.value.style.speed &&
  station.value.settings.radius === station.value.style.radius);

const globeHost = ref<HTMLDivElement | null>(null);
const layerVisible = reactive({ radar: true, flyLine: true, mapStreamLine: true, bar: false });
const sceneFailed = ref(false);
let scene: ReturnType<typeof chart.init> | undefined;
let observer: ResizeObserver | undefined;
let editFrame: number | undefined;
const pending = new Set<Station>();
let barsDirty = true;

function radarData({ point, settings }: Station) {
  return { ...point, style: { ...settings } };
}

function refreshBars() {
  if (!scene || !layerVisible.bar || !barsDirty) return;
  void scene.setData("bar", stations.map(({ point, settings }) => ({
    position: point,
    value: globeRadius * MathUtils.degToRad(settings.radius),
    style: { color: settings.color, width: 2.5, height: 2.5 },
  })));
  barsDirty = false;
}

function queueEdit(item: Station) {
  pending.add(item);
  if (editFrame !== undefined) return;
  editFrame = requestAnimationFrame(() => {
    editFrame = undefined;
    if (scene) {
      for (const edited of pending) {
        scene.remove("radar", [edited.point.id]);
        void scene.addData("radar", [radarData(edited)]);
      }
      refreshBars();
    }
    pending.clear();
  });
}

function editSetting(key: "speed" | "radius", event: Event) {
  if (!scene || !layerVisible.radar) return;
  const value = (event.currentTarget as HTMLInputElement).valueAsNumber;
  if (!Number.isFinite(value) || value === station.value.settings[key]) return;
  station.value.settings[key] = value;
  if (key === "radius") barsDirty = true;
  queueEdit(station.value);
}

function resetSettings() {
  if (!scene || !layerVisible.radar) return;
  if (station.value.settings.radius !== station.value.style.radius) barsDirty = true;
  Object.assign(station.value.settings, station.value.style);
  queueEdit(station.value);
}

function formatSpeed(value: number) {
  return (value > 0 ? "+" : "") + value.toFixed(2);
}

function toggleLayer(type: keyof typeof layerVisible) {
  if (!scene) return;
  const visible = !layerVisible[type];
  scene.setLayerVisible(type, visible);
  layerVisible[type] = visible;
  if (type === "bar" && visible) refreshBars();
}

function centerView(lon: number, lat: number) {
  if (!scene || !("reset" in scene.controls)) return;
  scene.controls.reset();
  scene.mainContainer.rotation.set(MathUtils.degToRad(lat), MathUtils.degToRad(-90 - lon), 0);
}

function resetView() {
  centerView(115, 22);
}

function focusStation(item: Station) {
  selected.value = item.point.id;
  centerView(item.point.lon, item.point.lat);
}

let press: PointerEvent | undefined;
function pickStation(event: MouseEvent) {
  const start = press;
  press = undefined;
  if (!scene || !layerVisible.radar) return;
  if (start && Math.hypot(event.clientX - start.clientX, event.clientY - start.clientY) > 5) return;
  const rect = scene.renderer.domElement.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const pointer = new Vector2((event.clientX - rect.left) / rect.width * 2 - 1,
    1 - (event.clientY - rect.top) / rect.height * 2);
  const ray = new Raycaster();
  ray.setFromCamera(pointer, scene.camera);
  // Routes and bars share station centers. Pick the radar below them, with the globe occluding its far side.
  const targets = scene.mainContainer.children.filter(group => group.visible && group.userData.figureType === "radar");
  const globe = scene.mainContainer.getObjectByName("earthMesh");
  if (globe) targets.push(globe);
  const hit = ray.intersectObjects(targets)[0]?.object.userData;
  if (hit?.type === "radar") selected.value = hit.id;
}

function fitGlobe() {
  if (!globeHost.value || !scene) return;
  const { width, height } = globeHost.value.getBoundingClientRect();
  if (!width || !height) return;
  const camera = scene.camera;
  if (!(camera instanceof OrthographicCamera)) return;

  // 以容器短边为基准，竖屏和横屏都能容纳完整球体。
  const aspect = width / height;
  const halfHeight = 200 * Math.max(1, 1 / aspect);
  camera.top = halfHeight;
  camera.bottom = -halfHeight;
  camera.right = halfHeight * aspect;
  camera.left = -camera.right;
  camera.updateProjectionMatrix();
  scene.renderer.setSize(width, height);
}

onMounted(() => {
  if (!globeHost.value) return;
  chart.registerMap("world", {
    type: "FeatureCollection",
    features: world.features.map(({ geometry, properties }) => ({
      type: "Feature",
      geometry: geometry as Polygon | MultiPolygon,
      properties,
    })),
  });
  try {
    scene = chart.init({
      dom: globeHost.value,
      map: "world",
      mode: "3d",
      controls: "builtIn",
      cameraType: "OrthographicCamera",
      autoRotate: false,
      config: {
        R: globeRadius,
        enableZoom: true,
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        bgStyle: { color: "#0c141b", opacity: 0 },
        earth: { color: "#182d3d", material: "MeshPhongMaterial" },
        mapStyle: { areaColor: "#385865", lineColor: "#547481", material: "MeshLambertMaterial" },
        regions: { China: { areaColor: "#426572" } },
        hoverRegionStyle: { show: false },
        spriteStyle: { color: "#335463", size: 2.4 },
        radarStyle,
        flyLineRFactor: 0.3,
        pathStyle: { color: "rgba(227, 175, 104, 0.65)", size: 1.7 },
        flyLineStyle: { color: "#ffd49b", size: 3, duration: 3000 },
        scatterStyle: { show: false },
      },
    });
  } catch (error) {
    sceneFailed.value = true;
    console.error("地球视图初始化失败", error);
    return;
  }

  if ("minZoom" in scene.controls) {
    scene.controls.minZoom = 0.75;
    scene.controls.maxZoom = 3;
  }
  resetView();
  fitGlobe();
  observer = new ResizeObserver(fitGlobe);
  observer.observe(globeHost.value);

  scene.setData("mapStreamLine", {
    data: chinaBoundary,
    style: { color: "#83b6ce", opacity: 0.8, speed: 0 },
  });
  scene.setData("flyLine", routes.map(({ from, to }) => ({ from: from.point, to: to.point })));
  scene.setData("textMark", stations.map(({ name, point, style }) => ({
    text: name,
    position: { lon: point.lon, lat: point.lat - style.radius - 2 },
    style: { color: "#e2edf1", fontSize: 25 },
  })));
  scene.setData("radar", stations.map(radarData));
});

onBeforeUnmount(() => {
  observer?.disconnect();
  if (editFrame !== undefined) cancelAnimationFrame(editFrame);
  pending.clear();
  scene?.destroy();
  scene = undefined;
});
</script>

<template>
  <header class="masthead">
    <div class="page-width masthead-inner">
      <div class="brand"><span class="radar-mark" aria-hidden="true"></span>地球观测台</div>
      <span class="wordmark" lang="en">Earth Flyline</span>
    </div>
  </header>

  <main class="page-width">
    <header class="page-heading">
      <div>
        <p class="region">东亚与东南亚</p>
        <h1>城市雷达</h1>
      </div>
      <button class="layer-switch" type="button" role="switch" :aria-checked="layerVisible.radar"
        :disabled="sceneFailed" aria-controls="globe" @click="toggleLayer('radar')">
        雷达图层<span class="switch-track" aria-hidden="true"></span>
      </button>
    </header>

    <div class="workspace">
      <figure class="globe-panel">
        <div class="globe-stage">
          <div id="globe" ref="globeHost" class="globe-host" role="img"
            @pointerdown.capture="press = $event" @click="pickStation"
            aria-label="以上海、东京和新加坡为站点的三维地球"></div>
          <p v-if="sceneFailed" class="scene-error" role="status">地球视图加载失败，请检查浏览器的 WebGL 支持。</p>
          <button v-else class="view-reset" type="button" @click="resetView">
            <span aria-hidden="true">↺</span> 复位视角
          </button>
        </div>
        <figcaption class="map-caption">
          <button class="legend-toggle" type="button" :aria-pressed="layerVisible.flyLine"
            :disabled="sceneFailed" aria-controls="globe" @click="toggleLayer('flyLine')">
            <i class="key-line key-route" aria-hidden="true"></i>城际飞线
          </button>
          <button class="legend-toggle" type="button" :aria-pressed="layerVisible.mapStreamLine"
            :disabled="sceneFailed" aria-controls="globe" @click="toggleLayer('mapStreamLine')">
            <i class="key-line key-boundary" aria-hidden="true"></i>中国边界
          </button>
          <button class="legend-toggle" type="button" :aria-pressed="layerVisible.bar"
            :disabled="sceneFailed" aria-controls="globe" @click="toggleLayer('bar')">
            <i class="key-bars" aria-hidden="true"></i>覆盖半径柱
          </button>
          <span class="drag-hint">拖动旋转 · 滚轮或双指缩放</span>
          <span v-if="layerVisible.bar" class="bar-units">柱高按各站覆盖半径（°）等比显示</span>
        </figcaption>
      </figure>

      <aside class="details" aria-label="站点与航线">
        <section>
          <header class="section-heading"><h2>观测站点</h2><span>{{ stations.length }} 站</span></header>
          <ul class="stations">
            <li v-for="item in stations" :key="item.point.id" :style="{ '--station-color': item.style.color }">
              <button class="station-row" type="button" :aria-pressed="selected === item.point.id"
                :disabled="sceneFailed" aria-controls="globe station-inspector" @click="focusStation(item)">
                <i class="station-marker" aria-hidden="true"></i>
                <span>
                  <strong class="station-name">{{ item.name }}</strong>
                  <span class="coordinates">{{ item.point.lat.toFixed(2) }}°N · {{ item.point.lon.toFixed(2) }}°E</span>
                </span>
                <span class="station-reading">
                  <span>{{ item.settings.speed === 0 ? '静止' : formatSpeed(item.settings.speed) + ' 圈/秒' }}</span>
                  <span>{{ item.settings.speed < 0 ? '反向 · ' : '' }}{{ item.settings.radius }}°</span>
                </span>
              </button>
            </li>
          </ul>
        </section>
        <section id="station-inspector" class="inspector" aria-labelledby="inspector-title"
          :style="{ '--station-color': station.style.color }">
          <header class="inspector-heading">
            <h2 id="inspector-title"><i class="station-marker" aria-hidden="true"></i>{{ station.name }}雷达</h2>
            <button class="defaults" type="button" :disabled="isDefault || !layerVisible.radar || sceneFailed"
              @click="resetSettings">恢复默认</button>
          </header>
          <p v-if="!layerVisible.radar" class="edit-status">开启雷达图层后可调整参数</p>
          <fieldset :disabled="!layerVisible.radar || sceneFailed" aria-labelledby="inspector-title">
            <div class="control-label"><label for="scan-speed">扫描速度</label><output for="scan-speed">{{ formatSpeed(station.settings.speed) }} 圈/秒</output></div>
            <input id="scan-speed" type="range" min="-1" max="1" step="0.01" :value="station.settings.speed"
              :aria-valuetext="formatSpeed(station.settings.speed) + ' 圈/秒'" @input="editSetting('speed', $event)">
            <div class="speed-scale" aria-hidden="true"><span>反向</span><span>0</span><span>正向</span></div>
            <div class="control-label"><label for="coverage-radius">覆盖半径</label><output for="coverage-radius">{{ station.settings.radius }}°</output></div>
            <input id="coverage-radius" type="range" min="2" max="20" step="1" :value="station.settings.radius"
              :aria-valuetext="station.settings.radius + ' 度'" @input="editSetting('radius', $event)">
          </fieldset>
        </section>
        <section class="routes">
          <header class="section-heading"><h2>飞线路径</h2><span>{{ routes.length }} 条</span></header>
          <ul>
            <li v-for="{ from, to } in routes" :key="to.point.id">
              {{ from.name }}<span class="route-arrow" aria-hidden="true">→</span>{{ to.name }}
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </main>
</template>
