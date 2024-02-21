<script setup lang="ts">
import { onMounted } from "vue";
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
        enableZoom: false,
        stopRotateByHover: false,
        R: 140,
        earth: {
          color: "#13162c",
        },
        mapStyle: {
          lineColor: "#797eff",
          areaColor: "#2e3564",
        },
        spriteStyle: {
          color: "#797eff",
          show: true,
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
        roadStyle: {
          flyLineStyle: {
            //飞线样式配置
            color: "#cd79ff",
          },
          pathStyle: {
            color: "#cd79ff", //飞线路径配置
          },
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
        enableZoom: true,
        stopRotateByHover: false,
        R: 120,
        earth: {
          color: "#13162c",
          dragConfig: {
            disableY: true,
          },
        },

        mapStyle: {
          areaColor: "#2e3564",
          lineColor: "#797eff",
        },
        spriteStyle: {
          color: "#797eff",
          show: true,
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
        roadStyle: {
          flyLineStyle: {
            //飞线样式配置
            color: "#cd79ff",
          },
          pathStyle: {
            color: "#cd79ff", //飞线路径配置
          },
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
    ];
    // chartInstance.setData("flyLine", initData);
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
    chartInstance.setData("flyLine", initData);

    chartInstance.addData("point", [
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
    chartInstance1.on("click", (event: Event, mesh: any) => {
      // chartInstance1.options.autoRotate = false;
    });
  }
});
function add() {
  chartInstance.addData("road", [
    {
      id: "7-6",
      path: [
        {
          lon: -23.0075,
          lat: 50.4296,
        },
        {
          lon: -26.1223,
          lat: -7.8756,
        },
        {
          lon: -43.0075,
          lat: -40.4296,
        },
        {
          lon: -23.0075,
          lat: 50.4296,
        },
      ],
      style: {
        flyLineStyle: {
          //飞线样式配置
          color: "red",
        },
        pathStyle: {
          color: "red",
        },
      },
    },
  ]);
  chartInstance.addData("point", [
    {
      lon: -23.0075,
      lat: 50.4296,
    },
  ]);
}
function del() {
  chartInstance.remove("road", ["7-6"]);
}
</script>

<template>
  <div @click="del">移除</div>
  <div @click="add">新增</div>
  <div style="position: relative">
    <div id="container1"></div>
  </div>

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
