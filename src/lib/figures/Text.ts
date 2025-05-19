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
    const labelList: Object3D[] = [];
    const resultData = this.generateCountryData();

    resultData.forEach((item) => {
      // 创建单个 canvas 和 context
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d") as CanvasRenderingContext2D;

      // 设置字体样式，用于测量文字
      context.font = `${item.style.fontSize}px Arial`;

      // 测量文字的宽度和高度
      const textMetrics = context.measureText(item.text);
      const textWidth = textMetrics.width;
      const textHeight = item.style.fontSize * 1.5; // 高度可以根据字体大小适当调整，1.5 是一个经验值

      // 动态设置 canvas 尺寸，稍微增加一些边距
      canvas.width = textWidth + 20; // 增加边距
      canvas.height = textHeight + 10; // 增加边距

      // 重新设置字体和样式，因为调整 canvas 尺寸会重置 context
      context.font = `${item.style.fontSize}px Arial`;
      context.fillStyle = item.style.color;
      context.textAlign = "center";
      context.textBaseline = "middle"; // 垂直居中文字
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillText(item.text, canvas.width / 2, canvas.height / 2);

      // 创建纹理并应用材质
      const texture = new CanvasTexture(canvas);
      const textMaterial = new MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false, // 禁用文字的深度写入，防止文字重叠闪烁问题
      });

      // 动态计算 PlaneGeometry 的尺寸
      const baseSize = this._store.config.R * 0.2; // 基础尺寸比例
      const planeWidth = baseSize * (canvas.width / 100); // 根据 canvas 宽度调整平面宽度
      const planeHeight = baseSize * (canvas.height / 100); // 根据 canvas 高度调整平面高度
      const textPlane = new PlaneGeometry(planeWidth, planeHeight);

      const textMesh = new Mesh(textPlane, textMaterial);
      textMesh.userData = {
        ...item,
        type: "text",
      };

      const { x, y, z } = item.position;
      // 设定位置并使文字面朝摄像机
      textMesh.position.set(x, y, z * 1.01); // 设置 mesh 位置
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
