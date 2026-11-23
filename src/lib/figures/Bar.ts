import { BarData, BarStyle, StoreConfig } from "@/lib/interface";
import Store from "@/lib/store/store";
import { cloneDeep } from "lodash-es";
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  MeshMatcapMaterial,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
  Vector3,
} from "three";
import { lon2xyz } from "@/lib/utils/math";

const unitBox = new BoxGeometry();
const { position: corners, normal: faceNormals, uv } = unitBox.attributes;
const boxIndex = unitBox.index!;

// BoxGeometry tests the signed face depth. Both faces point negative at zero depth.
function faceNormal(component: number, size: number) {
  if (component === 0) return 0;
  return component * size > 0 ? 1 : -1;
}

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
    // forEach skips holes in sparse input, as did the original merge.
    const count = data.reduce((n) => n + 1, 0);
    if (!count) throw new TypeError("Cannot build bar geometry without bars");
    const vertices = count * corners.count;
    const positions = new Float32Array(vertices * 3);
    const normals = new Float32Array(vertices * 3);
    const colors = new Float32Array(vertices * 3);
    const uvs = new Float32Array(vertices * 2);
    const Index = vertices > 65535 ? Uint32BufferAttribute : Uint16BufferAttribute;
    const index = new Index(count * boxIndex.count, 1);

    // Refill one working box so translate/lookAt retain Three's Float32 rounding.
    const box = new BoxGeometry();
    const { position: boxPositions, normal: boxNormals } = box.attributes;
    const target = new Vector3();
    let vertexOffset = 0;
    let indexOffset = 0;
    data.forEach((item) => {
      const { position, value } = item;
      const { width = 1, height = 1, color } = this.getCurrentStyle(item);
      const rgb = new Color(color);
      for (let i = 0; i < corners.count; i++) {
        boxPositions.setXYZ(i, corners.getX(i) * width, corners.getY(i) * height, corners.getZ(i) * value);
        boxNormals.setXYZ(
          i,
          faceNormal(faceNormals.getX(i), width),
          faceNormal(faceNormals.getY(i), height),
          faceNormal(faceNormals.getZ(i), value)
        );
        rgb.toArray(colors, (vertexOffset + i) * 3);
      }
      if (this._store.mode === "2d") {
        box.translate(position.lon, position.lat, value / 2);
      } else {
        box.translate(0, 0, this._config.R + value / 2);
        const pos = lon2xyz(this._config.R, position.lon, position.lat);
        box.lookAt(target.set(pos.x, pos.y, pos.z));
      }
      positions.set(boxPositions.array, vertexOffset * 3);
      normals.set(boxNormals.array, vertexOffset * 3);
      uvs.set(uv.array, vertexOffset * 2);
      for (let i = 0; i < boxIndex.count; i++) {
        index.setX(indexOffset++, vertexOffset + boxIndex.getX(i));
      }
      vertexOffset += corners.count;
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new BufferAttribute(normals, 3));
    geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    geometry.setIndex(index);
    return new Mesh(geometry, new MeshMatcapMaterial({ vertexColors: true }));
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
