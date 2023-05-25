import { Feature } from "geojson";

class MapStore {
  hashMap: Record<any, Feature[]> = {};
  registerMap(name: string, json: Feature[]) {
    this.hashMap[name] = json;
  }
}
export default new MapStore();
