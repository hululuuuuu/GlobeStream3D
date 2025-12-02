import { BarData, BarStyle, StoreConfig } from "@/lib/interface";
import Store from "@/lib/store/store";
import { cloneDeep } from "lodash-es";
import {
  BoxGeometry,
  BufferAttribute,
  Color,
  Mesh,
  MeshMatcapMaterial,
  Vector3,
} from "three";
import { lon2xyz } from "@/lib/utils/math";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";

export default class Bar {
  private readonly _config: StoreConfig;
  _store: Store;
  _currentData: BarData;
  _commonStyle: BarStyle;
  constructor(store: Store) {
    this._store = store;
    this._config = store.getConfig();
    this._commonStyle = cloneDeep(this._config.barStyle as BarStyle);
  }
  createMesh = (data: BarData[]): Mesh => {
    const geometryList: BoxGeometry[] = [];
    data.forEach((item) => {
      const barHeight = item.value;
      const position = item.position;
      const style = this.getCurrentStyle(item);
      const geometry = new BoxGeometry(style.width, style.height, barHeight);
      const color = new Color(style.color);
      const colorArr = [];
      const attrPosition = geometry.attributes.position;
      for (let i = 0; i < attrPosition.count; i++) {
        colorArr.push(color.r, color.g, color.b);
      }
      geometry.attributes.color = new BufferAttribute(
        new Float32Array(colorArr),
        3
      );

      if (this._store.mode === "2d") {
        geometry.translate(position.lon, position.lat, barHeight / 2);
        // geometry.lookAt(new Vector3(position.lon, position.lat, 0));
      } else {
        geometry.translate(0, 0, this._config.R + barHeight / 2);
        const pos = lon2xyz(this._config.R, position.lon, position.lat);
        geometry.lookAt(new Vector3(pos.x, pos.y, pos.z));
      }

      geometryList.push(geometry);
    });
    const mergeBufferGeometry = mergeGeometries(geometryList);
    const material = new MeshMatcapMaterial({
      vertexColors: true, //使用顶点颜色渲染
    });
    return new Mesh(mergeBufferGeometry, material);
  };
  getCurrentStyle = (data: BarData): BarStyle => {
    const { style = {} } = data;
    return {
      ...this._commonStyle,
      ...style,
    };
  };
  create(data: BarData[]) {
    return this.createMesh(data);
  }
}
