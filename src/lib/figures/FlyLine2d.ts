import {
  BufferGeometry,
  Group,
  Line,
  LineBasicMaterial,
  Points,
  PointsMaterial,
  QuadraticBezierCurve3,
  Sprite,
  SpriteMaterial,
  TextureLoader,
  Vector3,
} from "three";
import { getFunctionExpression } from "@/lib/utils/math";
import { createTrailGeometry, createTrailUpdater } from "@/lib/utils/trail";
import { ownTexture } from "@/lib/utils/dispose";
import { FlyLineData, LineStyle, StoreConfig } from "@/lib/interface";
import Store from "@/lib/store/store";
import { addUserDataToMesh, mergeFlyLineStyle, parseColorOpacity } from "@/lib/utils";

export default class FlyLine2d {
  private readonly _config: StoreConfig;
  _store: Store;
  _currentData: FlyLineData;
  _currentConfig: LineStyle;
  constructor(store: Store, currentData: FlyLineData) {
    this._store = store;
    this._config = store.getConfig();
    this._currentData = currentData;
    this._currentConfig = mergeFlyLineStyle(this._config, currentData.style);
  }

  createMesh(positionInfo: [Vector3, Vector3]) {
    const group = new Group();
    const [sourcePoint, targetPoint] = positionInfo;
    const controlPoint = getFunctionExpression(sourcePoint, targetPoint);
    const curve = new QuadraticBezierCurve3(
      sourcePoint,
      controlPoint,
      targetPoint
    );
    const points = curve.getSpacedPoints(200);
    if (this._currentConfig.pathStyle.show !== false) {
      group.add(this.createPathLine(points));
    }
    const tadpoleSize = 40;
    const tadpolePointsMesh = this.createShader(points, tadpoleSize);
    group.add(tadpolePointsMesh);

    group.name = "flyLine";
    const updateTrail = createTrailUpdater(tadpolePointsMesh.geometry, points);
    this._store.animations.setTween(
      tadpolePointsMesh,
      { index: 0 },
      { index: points.length - tadpoleSize },
      (params) => updateTrail(params.index),
      { ...this._currentConfig.flyLineStyle, data: this._currentData }
    );
    return group;
  }
  createPathLine = (points: Vector3[]) => {
    const geometry = new BufferGeometry().setFromPoints(points);
    const { color, opacity } = parseColorOpacity(
      this._currentConfig.pathStyle.color
    );
    const material = new LineBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
    });
    const pathLine = new Line(geometry, material);
    pathLine.name = "pathLine";
    addUserDataToMesh(pathLine, this._currentData);
    return pathLine;
  };
  createShader = (points: Vector3[], tadpoleSize: number) => {
    const { color: color1, opacity: opacity1 } = parseColorOpacity(
      this._currentConfig.pathStyle.color
    ); //尾拖线颜色
    const { color: color2, opacity: opacity2 } = parseColorOpacity(
      this._currentConfig.flyLineStyle.color
    ); //飞线蝌蚪头颜色
    const geometry = createTrailGeometry(points, tadpoleSize, color1, color2);
    const material = new PointsMaterial({
      vertexColors: true, //使用顶点颜色渲染
      size: 3.0, //点大小
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
        ].join("\n") // .join()把数组元素合成字符串
      );
      // 调整点渲染大小计算方式
      shader.vertexShader = shader.vertexShader.replace(
        "gl_PointSize = size;",
        ["gl_PointSize = percent * size;"].join("\n") // .join()把数组元素合成字符串
      );
    };
    tadpolePointsMesh.name = "tadpolePointsMesh";
    return tadpolePointsMesh;
  };
  createImg(R: number, startAngle: number, endAngle: number) {
    // 创建曲线（与 createPathLine 中的曲线一致）
    const group = new Group();
    // 创建纹理加载器
    const textureLoader = new TextureLoader();
    const texture = textureLoader.load(this._currentConfig.flyLineStyle.img!);
    const { color, opacity } = parseColorOpacity(
      this._currentConfig.flyLineStyle.color
    );
    // 创建精灵材质，使用加载的纹理
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
    const x = R * Math.cos(startAngle);
    const y = R * Math.sin(startAngle);
    sprite.position.set(x, y, 0);
    // 设置精灵的缩放（大小）
    const size = this._currentConfig.flyLineStyle.size || 3;
    sprite.scale.set(size, size, 1);
    group.add(sprite);
    sprite.name = "flyLineSprite";
    return group;
  }
  create(src: Vector3, dist: Vector3) {
    //创建线
    const flyLineMesh = this.createMesh([src, dist]);
    return flyLineMesh;
  }
}
