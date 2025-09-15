import ChartScene from "./chartScene";
import MapStore from "./store/mapStore";
import { Options } from "@/lib/interface";
import { FeatureCollection } from "geojson";
function init(params: Partial<Options>) {
  return new ChartScene(params);
}
//注册地图
function registerMap(name: string, map: FeatureCollection) {
  const features = map.features;
  MapStore.registerMap(name, features);
}

export default { init, registerMap };
