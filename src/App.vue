<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { MathUtils, OrthographicCamera } from "three";
import type { MultiPolygon, Polygon } from "geojson";
import chart from "@/entry";
import world from "./map/world.json";
import chinaBoundary from "./map/ChinaAdditionalRouteMap.geojson?raw";

const radarStyle = { color: "#50f5cc", radius: 10, speed: 0.25 };
const stations = [
  {
    name: "上海",
    point: { id: "shanghai", lon: 121.47, lat: 31.23 },
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
];
const routes = stations.slice(1).map(to => ({ from: stations[0], to }));
const radars = stations.map(({ point, style }) => ({ ...point, style }));

const globeHost = ref<HTMLDivElement | null>(null);
const layerVisible = reactive({ radar: true, flyLine: true, mapStreamLine: true });
const sceneFailed = ref(false);
let scene: ReturnType<typeof chart.init> | undefined;
let observer: ResizeObserver | undefined;

function toggleLayer(type: keyof typeof layerVisible) {
  if (!scene) return;
  const visible = !layerVisible[type];
  scene.setLayerVisible(type, visible);
  layerVisible[type] = visible;
}

function resetView() {
  if (scene && "reset" in scene.controls) scene.controls.reset();
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
        R: 174,
        enableZoom: false,
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

  // 经度 −90° 面向默认相机，将东经 115°、北纬 22° 转到视图中央。
  scene.mainContainer.rotation.set(MathUtils.degToRad(22), MathUtils.degToRad(-205), 0);
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
    position: { lon: point.lon, lat: point.lat - (style?.radius ?? radarStyle.radius) - 2 },
    style: { color: "#e2edf1", fontSize: 25 },
  })));
  scene.setData("radar", radars);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  scene?.destroy();
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
          <span class="drag-hint">拖动旋转</span>
        </figcaption>
      </figure>

      <aside class="details" aria-label="站点与航线">
        <section>
          <header class="section-heading"><h2>观测站点</h2><span>{{ stations.length }} 站</span></header>
          <ul class="stations">
            <li v-for="station in stations" :key="station.point.id"
              :style="{ '--station-color': station.style?.color ?? radarStyle.color }">
              <i class="station-marker" aria-hidden="true"></i>
              <div>
                <h3>{{ station.name }}</h3>
                <p class="coordinates">{{ station.point.lat.toFixed(2) }}°N · {{ station.point.lon.toFixed(2) }}°E</p>
              </div>
              <span class="scan-rate">{{ station.style?.speed === 0 ? '静止' : (station.style?.speed ?? radarStyle.speed) + ' 圈/秒' }}</span>
            </li>
          </ul>
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
