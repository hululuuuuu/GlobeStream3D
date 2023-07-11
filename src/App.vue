<script setup lang="ts">
import { onMounted } from "vue";
import worldTexture from "./image/earth.png";
import world from "./map/world.json";
import chart from "@/entry";
import ChartScene from "@/lib/chartScene";
let chartInstance: ChartScene;
let chartInstance1: ChartScene;

const geoJson: any = world;
chart.registerMap("world", geoJson);
onMounted(() => {
  const dom = document.getElementById("container");
  const dom1 = document.getElementById("container1");
  if (dom && dom1) {
    chartInstance = chart.init({
      dom,
      helper: false,
      map: "world",
      autoRotate: false,
      mode: "2d",
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
        flyLineStyle: {
          //飞线样式配置
          color: "#cd79ff",
        },
        scatterStyle: {
          //涟漪
          color: "#cd79ff",
        },
        hoverRegionStyle: {
          areaColor: "#cd79ff",
        },
        regions: {
          China: {
            areaColor: "#2e3564",
          },
        },
      },
    });
    chartInstance1 = chart.init({
      dom: dom1,
      helper: false,
      map: "world",
      autoRotate: true,
      mode: "3d",
      config: {
        R: 140,
        texture: worldTexture,
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
        flyLineStyle: {
          //飞线样式配置
          color: "#cd79ff",
        },
        scatterStyle: {
          //涟漪
          color: "#cd79ff",
        },
        hoverRegionStyle: {
          areaColor: "#cd79ff",
        },
        regions: {
          China: {
            areaColor: "#2e3564",
          },
        },
      },
    });
    const initData = [
      {
        from: {
          id: "1",
          lon: -23.0075,
          lat: 50.4296,
          style: {
            color: "#ff0000",
            duration: 2000,
            delay: 0,
            repeat: 1,
            onComplete: (data: any) => {
              //do something
            },
          },
        },
        to: { id: 2, lon: 26.1223, lat: -7.8756 },
        style: {
          pathStyle: {
            color: "#ff0000", //飞线路径配置
          },
          flyLineStyle: {
            //飞线样式配置
            color: "#0000ff",
            duration: 2000,
            delay: 0,
            repeat: 1,
            onComplete: (data: any) => {
              //do something
            },
          },
        },
      },
      {
        from: { lon: 142.8123, lat: -58.9813 },
        to: { lon: 157.0064, lat: 10.7816 },
      },
      // {
      //   from: { lon: -175.6286, lat: 72.8359 },
      //   to: { lon: -39.071, lat: -35.438 },
      // },
      // {
      //   from: { lon: 178.7439, lat: 25.8303 },
      //   to: { lon: 137.19, lat: 17.118 },
      // },
      // {
      //   from: { lon: -162.6725, lat: 37.277 },
      //   to: { lon: -37.1681, lat: 38.5162 },
      // },
      // {
      //   from: { lon: -7.5945, lat: 37.2754 },
      //   to: { lon: 41.4114, lat: 41.5946 },
      // },
      // {
      //   from: { lon: -32.529, lat: -75.5152 },
      //   to: { lon: 153.8553, lat: -39.7648 },
      // },
      // {
      //   from: { lon: -59.8013, lat: -19.3771 },
      //   to: { lon: 171.8885, lat: 71.9592 },
      // },
      // {
      //   from: { lon: 103.1917, lat: 40.3037 },
      //   to: { lon: 38.4639, lat: 89.3409 },
      // },
      // {
      //   from: { lon: 92.6181, lat: -75.1948 },
      //   to: { lon: 23.1154, lat: 54.6066 },
      // },
      // {
      //   from: { lon: -25.6806, lat: 32.5669 },
      //   to: { lon: 26.8173, lat: -23.3473 },
      // },
      // {
      //   from: { lon: -144.6571, lat: 15.0555 },
      //   to: { lon: 114.9389, lat: 25.1615 },
      // },
      // {
      //   from: { lon: 11.6155, lat: -19.31 },
      //   to: { lon: 88.6194, lat: 33.1181 },
      // },
      // {
      //   from: { lon: 162.8275, lat: 50.742 },
      //   to: { lon: -128.8369, lat: 8.1522 },
      // },
      // {
      //   from: { lon: -89.4121, lat: -47.4232 },
      //   to: { lon: -148.0117, lat: -7.9949 },
      // },
      // {
      //   from: { lon: -146.2076, lat: -83.4571 },
      //   to: { lon: 133.6261, lat: -37.512 },
      // },
      // {
      //   from: { lon: -105.7075, lat: 8.3978 },
      //   to: { lon: 48.2922, lat: 57.0248 },
      // },
      // {
      //   from: { lon: 39.599, lat: 81.3458 },
      //   to: { lon: 113.3542, lat: 44.2259 },
      // },
      // {
      //   from: { lon: -154.6959, lat: -20.9316 },
      //   to: { lon: -95.5265, lat: -74.9423 },
      // },
      // {
      //   from: { lon: -168.7863, lat: 85.2333 },
      //   to: { lon: -84.0216, lat: -35.0322 },
      // },
    ];
    // chartInstance.setData("flyLine", initData);
    chartInstance1.setData("flyLine", initData);
    chartInstance1.addData("point", [
      {
        lon: -43.0075,
        lat: -40.4296,
        style: {
          color: "#ff0000",
          duration: 2000,
          delay: 0,
          repeat: 1,
          onComplete: (data: any) => {
            //do something
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
  }
  // scene.add(shape())
});
function add() {
  chartInstance.addData("flyLine", [
    {
      from: { id: 1, lon: 112.45, lat: 34.62 },
      to: { id: 2, lon: 114, lat: 22 },
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
  <div id="container1"></div>
  <div id="container"></div>
</template>

<style lang="less" scoped>
#container {
  width: 800px;
  height: 800px;
  margin-bottom: 40px;
}
#container1 {
  width: 800px;
  height: 800px;
}
</style>
