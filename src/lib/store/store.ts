import { configType, Options } from "@/lib/interface";
import { merge } from "lodash";
class Store {
  mode: "2d" | "3d" = "3d";
  config: configType = {
    R: 150,
    earth: {
      color: "#13162c",
    },
    map: "world",
    stopRotateByHover: true,
    texture: "",
    bgStyle: {
      color: "#040D21",
      opacity: 1,
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
  };
  //存储以存在的飞线
  flyLineMap: Record<any, true> = {};
  setConfig(options: Partial<Options>) {
    this.mode = options.mode || "3d";
    merge(this.config, options.config);
  }
  getConfig(): configType {
    return this.config;
  }
}
export default Store;
