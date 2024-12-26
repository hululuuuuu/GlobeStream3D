import Store from "@/lib/store/store";
import {
  CanvasTexture,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Vector3,
} from "three";

import { lon2xyz } from "@/lib/utils/math";
import { LessCoordinate, TextStyle } from "@/lib/interface";

export default class CountryNamesText {
  constructor(store: Store) {
    this._store = store;
    this.countryData = store.config.textMark.data;
  }

  private _store: Store;

  countryData: {
    text: string;
    position: LessCoordinate;
    style: TextStyle;
  }[];
  generateCountryData() {
    const commonStyle = this._store.config.textMark.style;
    return this.countryData.map(({ text, position, style }) => {
      let positionVec3: Vector3;
      if (this._store.mode === "3d") {
        const { x, y, z } = lon2xyz(
          this._store.config.R,
          position.lon,
          position.lat,
          1.01
        );
        positionVec3 = new Vector3(x, y, z);
      } else {
        positionVec3 = new Vector3(position.lon, position.lat, 0.1);
      }

      return {
        text,
        position: positionVec3,
        style: Object.assign({}, { ...commonStyle }, { ...style }),
      };
    });
  }
  init() {
    const size = this._store.config.R * 0.2;

    const labelList: Object3D[] = [];
    const resultData = this.generateCountryData();

    resultData.forEach((item) => {
      // 创建单个 canvas 和 context
      const canvas = document.createElement("canvas");
      canvas.width = 226;
      canvas.height = 113;
      // 清空 canvas 内容
      const context = canvas.getContext("2d") as CanvasRenderingContext2D;
      context.font = `${item.style.fontSize}px Arial`;
      context.fillStyle = item.style.color;
      context.textAlign = "center";
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillText(item.text, canvas.width / 2, canvas.height / 2);

      // 创建纹理并应用材质
      const texture = new CanvasTexture(canvas);
      const textMaterial = new MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false, //禁用文字的深度写入防止文字重叠闪烁问题
      });
      // 创建一个平面用于显示文字
      const textPlane = new PlaneGeometry(size * 1.3, (size * 1.3) / 2);
      const textMesh = new Mesh(textPlane, textMaterial);
      textMesh.userData = {
        ...item,
        type: "text",
      };
      const { x, y, z } = item.position;
      // 设定位置并使文字面朝摄像机
      textMesh.position.set(x, y, z * 1.01); //设置mesh位置
      if (this._store.mode === "3d") {
        const meshNormal = new Vector3(0, 0, 1);
        const coordVec3 = new Vector3(x, y, z).normalize();
        textMesh.quaternion.setFromUnitVectors(meshNormal, coordVec3);

        // 旋转平面使文字始终面朝摄像机
        const lookAtVector = new Vector3().copy(item.position).normalize();
        textMesh.lookAt(lookAtVector);
        textMesh.rotateY(Math.PI); // 翻转文字使其正确显示
      }
      // 添加到 labelList
      labelList.push(textMesh);
    });

    return labelList;
  }
  create() {
    return this.init();
  }
}
