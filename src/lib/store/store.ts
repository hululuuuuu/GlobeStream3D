import { configType } from "@/lib/interface";
import { merge } from "lodash";
class Store {
  config: configType = {
    R: 150,
    earth: {
      color: "#13162c",
    },
    map: "world",
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
  };
  //存储以存在的飞线
  flyWireMap: Record<any, true> = {};
  setConfig(conf?: Partial<configType>) {
    console.log(conf);
    merge(this.config, conf);
  }
  getConfig(): configType {
    return this.config;
  }
}
export default Store;
