import {
  BufferAttribute,
  BufferGeometry,
  Group,
  Points,
  PointsMaterial,
  Sprite,
  SpriteMaterial,
  TextureLoader,
  Vector3,
} from "three";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { _3Dto2D } from "@/lib/utils/math";
import { ownTexture } from "@/lib/utils/dispose";
import { FlyLineData, LineStyle, StoreConfig } from "@/lib/interface";
import Store from "@/lib/store/store";
import { addUserDataToMesh, mergeFlyLineStyle, parseColorOpacity } from "@/lib/utils";

// sin(x)/x converts angular distance to chord length, including a straight arc.
function sinc(x: number) {
  return x === 0 ? 1 : Math.sin(x) / x;
}

export default class FlyLine3d {
  private readonly _config: StoreConfig;
  _store: Store;
  _currentData: FlyLineData;
  _currentConfig: LineStyle;
  textureLoader = new TextureLoader();
  constructor(store: Store, currentData: FlyLineData) {
    this._store = store;
    this._config = store.getConfig();
    this._currentData = currentData;
    this._currentConfig = mergeFlyLineStyle(this._config, currentData.style);
  }
  createMesh(positionInfo: [Vector3, Vector3]) {
    const group = new Group();
    const [sourcePoint, targetPoint] = positionInfo;

    const halfChord = (sourcePoint.x - targetPoint.x) / 2;
    const chordY = (sourcePoint.y + targetPoint.y) / 2;
    const angle = 2 * Math.atan2(halfChord, chordY);
    const height = this._config.R * angle * (this._config.flyLineRFactor ?? 0.2);
    const rise = height + halfChord * Math.tan(angle / 4);
    // Keep the globe-radius translation out of the Float32 vertex attributes.
    group.position.y = chordY;
    // A circle segment is fixed by its chord and sagitta. Sampling from the
    // apex avoids solving for a distant (or infinite) center on shallow arcs.
    const halfSweep = 2 * Math.atan2(rise, halfChord);
    const arcLength = 2 * Math.hypot(halfChord, rise) / sinc(halfSweep / 2);
    const pointAt = (progress: number, out: Vector3) => {
      const offset = progress - 0.5;
      const halfRotation = offset * halfSweep;
      const chord = offset * arcLength * sinc(halfRotation);
      return out.set(-chord * Math.cos(halfRotation), rise - chord * Math.sin(halfRotation), 0);
    };

    const segments = 200;
    const origin = pointAt(0, new Vector3());
    const marker = this._currentConfig.flyLineStyle.img
      ? this.createImg()
      : this.createShader(Array.from({ length: segments + 1 }, (_, i) =>
          pointAt(i / segments / 7, new Vector3()).sub(origin)));
    marker.position.copy(origin);
    this._store.animations.setTween(
      marker, { progress: 0 }, { progress: 1 },
      ({ progress }) => {
        pointAt(progress, marker.position);
        marker.rotation.z = 2 * halfSweep * progress;
      },
      { ...this._currentConfig.flyLineStyle, data: this._currentData }
    );
    group.add(marker);
    if (this._currentConfig.pathStyle.show !== false) {
      const points = Array.from({ length: segments + 1 }, (_, i) => pointAt(i / segments, new Vector3()));
      group.add(this.createPathLine(points));
    }
    group.name = "flyLine";
    return group;
  }
  private createImg() {
    const group = new Group();
    // 创建纹理加载器
    const texture = this.textureLoader.load(
      this._currentConfig.flyLineStyle.img!,
    );
    // 创建精灵材质，使用加载的纹理
    const { color, opacity } = parseColorOpacity(
      this._currentConfig.flyLineStyle.color
    );
    const spriteMaterial = new SpriteMaterial({
      map: texture,
      color,
      transparent: opacity < 1,
      opacity,
      depthTest: true,
    });

    // 创建精灵
    const sprite = new Sprite(spriteMaterial);
    ownTexture(sprite, texture);
    // 设置精灵的缩放（大小）
    const size = this._currentConfig.flyLineStyle.size || 3;
    sprite.scale.set(size, size, 1);
    group.add(sprite);
    sprite.name = "flyLineSprite";
    return group;
  }

  private createPathLine(points: Vector3[]) {
    const geometry = new LineGeometry();
    geometry.setPositions(points.flatMap(({ x, y, z }) => [x, y, z]));
    const { color, opacity } = parseColorOpacity(
      this._currentConfig.pathStyle.color
    );
    const material = new LineMaterial({
      color: color.getHex(),
      linewidth: (this._currentConfig.pathStyle.size || 1) / 1000,
      vertexColors: false,
      dashed: false,
      alphaToCoverage: false,
      transparent: opacity < 1,
      opacity,
    });
    const pathLine = new Line2(geometry, material);
    pathLine.name = "pathLine";
    addUserDataToMesh(pathLine, this._currentData);
    return pathLine;
  }
  private createShader(points: Vector3[]) {
    const geometry = new BufferGeometry();
    const percentArr = []; //attributes.percent的数据
    for (let i = 0; i < points.length; i++) {
      percentArr.push(i / points.length);
    }
    const colorArr = [];
    const { color: color1, opacity: opacity1 } = parseColorOpacity(
      this._currentConfig.pathStyle.color
    ); //尾拖线颜色
    const { color: color2, opacity: opacity2 } = parseColorOpacity(
      this._currentConfig.flyLineStyle.color
    ); //飞线蝌蚪头颜色
    for (let i = 0; i < points.length; i++) {
      const color = color1.clone().lerp(color2, i / points.length);
      colorArr.push(color.r, color.g, color.b);
    }
    geometry.setFromPoints(points);
    geometry.attributes.percent = new BufferAttribute(
      new Float32Array(percentArr),
      1,
    );
    geometry.attributes.color = new BufferAttribute(
      new Float32Array(colorArr),
      3,
    );
    const material = new PointsMaterial({
      vertexColors: true, //使用顶点颜色渲染
      size: this._currentConfig.flyLineStyle.size || 3.0, //点大小
      transparent: Math.min(opacity1, opacity2) < 1,
      opacity: Math.min(opacity1, opacity2),
    });
    const tadpolePointsMesh = new Points(geometry, material);
    material.onBeforeCompile = function (shader) {
      // 顶点着色器中声明一个attribute变量:百分比
      shader.vertexShader = shader.vertexShader.replace(
        "void main() {",
        [
          "attribute float percent;", //顶点大小百分比变量，控制点渲染大小
          "void main() {",
        ].join("\n"), // .join()把数组元素合成字符串
      );
      // 调整点渲染大小计算方式
      shader.vertexShader = shader.vertexShader.replace(
        "gl_PointSize = size;",
        ["gl_PointSize = percent * size;"].join("\n"), // .join()把数组元素合成字符串
      );
    };
    tadpolePointsMesh.name = "tadpolePointsMesh";
    return tadpolePointsMesh;
  }
  create(src: Vector3, dist: Vector3) {
    //创建线
    const { quaternion, startPoint3D, endPoint3D } = _3Dto2D(src, dist);
    const flyLineMesh = this.createMesh([startPoint3D, endPoint3D]);
    flyLineMesh.position.applyQuaternion(quaternion);
    flyLineMesh.quaternion.copy(quaternion);
    return flyLineMesh;
  }
}
