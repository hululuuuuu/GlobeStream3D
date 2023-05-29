<script setup lang="ts">
import { onMounted } from "vue";
import world from "./map/world.json";
import chart from "@/entry";
import ChartScene from "@/lib/chartScene";
let chartInstance: ChartScene;
const geoJson: any = world;
chart.registerMap("world", geoJson);
onMounted(() => {
  const dom = document.getElementById("container");
  if (dom) {
    chartInstance = chart.init({
      dom,
      map: "world",
      config: {
        R: 140,
        earth: {
          color: "#13162c",
        },
        mapStyle: {
          areaColor: "#2e3564",
          lineColor: "#797eff",
        },
        spriteColor: "#797eff", //光圈
        pathStyle: {
          color: "#cd79ff", //飞线路径配置
        },
        flyWireStyle: {
          //飞线样式配置
          color: "#cd79ff",
        },
        scatterStyle: {
          //涟漪
          color: "#cd79ff",
        },
      },
    });
    chartInstance.setData("flyLine", [
      {
        from: {
          id: 1,
          lon: 112.45, //经度
          lat: 34.62, //维度
        },
        to: {
          id: 2,
          lon: 14, //经度
          lat: 52, //维度
        },
        style: {
          pathLineStyle: {
            color: "red",
          },
        },
      },
    ]);
    // chartInstance.on("click", (event: Event, params: any) => {});
    chartInstance.on("mouseover", () => {
      chartInstance.options.autoRotate = false;
    });
    chartInstance.on("mouseout", () => {
      chartInstance.options.autoRotate = true;
    });
    // chart.init({
    //   dom: document.getElementById("container1"),
    //   helper: false,
    //   map: "world",
    //   config: {
    //     R: 140,
    //   },
    // });
  }

  // scene.add(shape())
});
let pre = "1-2";
function add() {
  chartInstance.addData("flyLine", [
    {
      from: { id: 1, lon: 112.45, lat: 34.62 },
      to: { id: 2, lon: 114, lat: 22 },
    },
  ]);
}
function set() {
  chartInstance.setData("flyLine", [
    {
      from: { lon: 112.45, lat: 34.62 },
      to: { lon: 114, lat: 22 },
    },
  ]);
}
function del() {
  chartInstance.remove("flyLine", []);
}
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
</script>

<template>
  <div @click="add">+</div>
  <div @click="set">set</div>
  <div @click="del">-</div>
  <div id="container"></div>
  <div id="container1"></div>
</template>

<style lang="less" scoped>
#container {
  width: 800px;
  height: 800px;
}
#container1 {
  width: 800px;
  height: 800px;
}
</style>
