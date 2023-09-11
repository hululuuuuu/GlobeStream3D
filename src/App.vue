<script setup lang="ts">
import { onMounted } from "vue";
import worldTexture from "./image/earth.png";
import triangle from "./image/triangel.svg";
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
        spriteStyle: {
          color: "#797eff",
        }, //光圈
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
      autoRotate: false,
      mode: "3d",
      config: {
        stopRotateByHover: true,
        R: 140,
        earth: {
          color: "#13162c",
        },
        mapStyle: {
          areaColor: "#2e3564",
          lineColor: "#797eff",
        },
        spriteStyle: {
          color: "#797eff",
          show: false,
        }, //光圈
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
          },
        },
      },
      {
        from: { lon: 142.8123, lat: -58.9813 },
        to: { lon: 157.0064, lat: 10.7816 },
      },
    ];
    chartInstance.setData("flyLine", initData);
    chartInstance1.setData("flyLine", initData);
    chartInstance1.addData("point", [
      {
        lon: -43.0075,
        lat: -40.4296,
        style: {
          color: "yellow",
          duration: 2000,
          customFigure: {
            texture: triangle,
            animate: {
              from: {
                size: 11,
              },
              to: {
                size: 22,
              },
            },
          },
        },
      },
    ]);
    // chartInstance.addData("point", [
    //   {
    //     lon: -43.0075,
    //     lat: -40.4296,
    //     style: {
    //       color: "yellow",
    //       duration: 2000,
    //       customFigure: {
    //         texture: triangle,
    //         animate: {
    //           from: {
    //             size: 0.1,
    //           },
    //           to: {
    //             size: 1,
    //           },
    //         },
    //       },
    //     },
    //   },
    // ]);
    chartInstance1.on("click", (event: Event, mesh: any) => {
      chartInstance.options.autoRotate = false;
      console.log(event, mesh);
    });
  }
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
