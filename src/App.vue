<script setup lang="ts">
import { onMounted } from "vue";
import world from "./map/world.json";
import chart from "@/entry";
import ChartScene from "@/lib/chartScene";
import triangle from "@/image/pipeLine.jpg";
import barData from "./devData/barData";
import { getScale } from "@/lib/utils/math";

const chinaData = world.features.find((item: any) => {
  return item.properties.name === "China";
})!.geometry.coordinates as any;
let chartInstance: ChartScene;
let chartInstance1: ChartScene;
const geoJson: any = world;
chart.registerMap("world", geoJson);
onMounted(() => {
  const dom = document.getElementById("container");
  const dom1 = document.getElementById("container1");
  if (dom && dom1) {
    // chartInstance = chart.init({
    //   dom,
    //   helper: true,
    //   map: "world",
    //   autoRotate: false,
    //   mode: "2d",
    //   debugHelper: true,
    //   config: {
    //     textMark: {
    //       style: {
    //         color: "#fff",
    //         fontSize: 20,
    //       },
    //       data: []
    //     },
    //     enableZoom: true,
    //     stopRotateByHover: false,
    //     R: 140,
    //     earth: {
    //       color: "#13162c",
    //       dragConfig: {
    //         disableY: false,
    //         disableX: false,
    //       },
    //     },
    //     mapStyle: {
    //       lineColor: "#797eff",
    //       areaColor: "#2e3564",
    //     },
    //     spriteStyle: {
    //       color: "#797eff",
    //       show: true,
    //     }, //光圈
    //     pathStyle: {
    //       color: "#cd79ff", //飞线路径配置
    //     },
    //     flyLineStyle: {
    //       //飞线样式配置
    //       color: "#cd79ff",
    //     },
    //     scatterStyle: {
    //       //涟漪
    //       color: "#cd79ff",
    //     },
    //     roadStyle: {
    //       flyLineStyle: {
    //         //飞线样式配置
    //         color: "#cd79ff",
    //       },
    //       pathStyle: {
    //         color: "#cd79ff", //飞线路径配置
    //       },
    //     },
    //     hoverRegionStyle: {
    //       areaColor: "#cd79ff",
    //       show: false,
    //     },
    //     regions: {
    //       China: {
    //         areaColor: "#2e3564",
    //       },
    //     },
    //     wallStyle: {
    //       color: "#cd79ff",
    //       opacity: 0.5,
    //       height: 0.5,
    //     },
    //   },
    // });
    chartInstance1 = chart.init({
      dom: dom1,
      helper: true,
      map: "world",
      autoRotate: true,
      mode: "3d",
      debugHelper: true,
      config: {
        enableZoom: true,
        stopRotateByHover: true,
        R: 120,
        textMark: {
          style: {
            color: "#fff",
            fontSize: 20,
          },
          data: [

          ],
        },
        earth: {
          color: "#13162c",
          dragConfig: {
            disableY: true,
          },
        },
        flyLineStyle: {
          duration: 5000,
        },
        bgStyle: {
          color: "#0e0c15",
        },
        hoverRegionStyle: {
          show: false,
        },
        spriteStyle: {
          color: "#272335",
          show: true,
        },
      },
    });
    // chartInstance1.scene.remove(chartInstance1.light)
    chartInstance1.light.visible = false;
    // chartInstance1.light.color.set('red')
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
            repeat: Infinity,
            onComplete: (data: any) => {
              //do something
            },
          },
        },
        to: { id: 2, lon: 26.1223, lat: -7.8756 },
        style: {
          flyLineStyle: {
            img: triangle,
          },
        },
      },
      {
        from: {
          lon: 142.8123,
          lat: -58.9813,
          style: {
            color: "yellow",
          },
        },
        to: {
          lon: 157.0064,
          lat: 10.7816,
          style: {
            color: "yellow",
          },
        },
        style: {
          pathStyle: {
            color: "yellow",
          },
          flyLineStyle: {
            color: "yellow",
          },
        },
      },
      {
        from: { lon: -175.6286, lat: 72.8359 },
        to: { lon: -39.071, lat: -35.438 },
      },
      {
        from: { lon: 178.7439, lat: 25.8303 },
        to: { lon: 137.19, lat: 17.118 },
      },
      {
        from: { lon: -162.6725, lat: 37.277 },
        to: { lon: -37.1681, lat: 38.5162 },
      },
      {
        from: { lon: -7.5945, lat: 37.2754 },
        to: { lon: 41.4114, lat: 41.5946 },
      },
    ];
    const initData1 = [
      {
        from: {
          id: "1",
          lon: -23.0075,
          lat: 50.4296,
        },
        to: { id: 2, lon: 26.1223, lat: -7.8756 },
      },
      {
        from: {
          lon: 142.8123,
          lat: -58.9813,
          style: {
            color: "yellow",
          },
        },
        to: {
          lon: 157.0064,
          lat: 10.7816,
          style: {
            color: "yellow",
          },
        },
        style: {
          pathStyle: {
            color: "yellow",
          },
          flyLineStyle: {
            color: "yellow",
          },
        },
      },
      {
        from: { lon: -175.6286, lat: 72.8359 },
        to: { lon: -39.071, lat: -35.438 },
      },
      {
        from: { lon: 178.7439, lat: 25.8303 },
        to: { lon: 137.19, lat: 17.118 },
      },
      {
        from: { lon: -162.6725, lat: 37.277 },
        to: { lon: -37.1681, lat: 38.5162 },
      },
      {
        from: { lon: -7.5945, lat: 37.2754 },
        to: { lon: 41.4114, lat: 41.5946 },
      },
    ];
    // chartInstance.setData("flyLine", initData);

    chartInstance1.setData("flyLine", initData);
    // chartInstance1.addData("point", [
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
    //             size: 11,
    //           },
    //           to: {
    //             size: 22,
    //           },
    //         },
    //       },
    //     },
    //   },
    // ]);
    // chartInstance.setData("flyLine", initData);
    // chartInstance.setData("textMark", [
    //   {
    //     text: "中国",
    //     position: {
    //       lon: 104.195397,
    //       lat: 35.86166,
    //     },
    //   },
    // ]);
    chartInstance1.setData("textMark", [
      {
        text: "中国",
        position: {
          lon: 104.195397,
          lat: 35.86166,
        },
      },
    ]);
    const maxHeight = getScale(
      barData.map((item) => item[2]),
      120
    );
    const initBarData = barData.map((item) => {
      return {
        position: {
          lon: item[0],
          lat: item[1],
        },
        value: item[2] * maxHeight,
      };
    });
    // chartInstance1.addData("bar", initBarData);

    let i = 0;
    function polling() {
      setTimeout(() => {
        i++;
        if (i < initData1.length) {
          polling();
          // chartInstance.addData("flyLine", [initData1[i]]);
          chartInstance1.addData("flyLine", [initData1[i]]);
        }
      }, 1000);
    }
    // polling();
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
    //             size: 11,
    //           },
    //           to: {
    //             size: 22,
    //           },
    //         },
    //       },
    //     },
    //   },
    // ]);
    chartInstance1.on("click", (event: Event, mesh: any) => {
      chartInstance1.options.autoRotate = false;
      console.log(mesh);
    });
    // chinaData.forEach((item: any) => {
    //   chartInstance1.addData("mapStreamLine", {
    //     data: item,
    //     style: {
    //       opacity: 1,
    //     },
    //   });
    // });
  }
});
// function add() {
//   chartInstance.addData("road", [
//     {
//       id: "7-6",
//       path: [
//         {
//           lon: -23.0075,
//           lat: 50.4296,
//         },
//         {
//           lon: -26.1223,
//           lat: -7.8756,
//         },
//         {
//           lon: -43.0075,
//           lat: -40.4296,
//         },
//         {
//           lon: -23.0075,
//           lat: 50.4296,
//         },
//       ],
//       style: {
//         flyLineStyle: {
//           //飞线样式配置
//           color: "red",
//         },
//         pathStyle: {
//           color: "red",
//         },
//       },
//     },
//   ]);
//   chartInstance.addData("point", [
//     {
//       lon: -23.0075,
//       lat: 50.4296,
//     },
//   ]);
// }
function del() {
  chartInstance1.remove("bar", "removeAll");
}
</script>

<template>
  <div @click="del">移除</div>

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
