import {
  BufferAttribute,
  BufferGeometry,
  Color,
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
import { setTween } from "@/lib/utils/tween";
import { FlyLineData, LineStyle, StoreConfig } from "@/lib/interface";
import Store from "@/lib/store/store";
import { addUserDataToMesh } from "@/lib/utils";
import { cloneDeep } from "lodash-es";

export default class FlyLine2d {
  private readonly _config: StoreConfig;
  _store: Store;
  _currentData: FlyLineData;
  _currentConfig: LineStyle;
  constructor(store: Store, currentData: FlyLineData) {
    this._store = store;
    this._config = store.getConfig();
    this._currentData = currentData;
    this._currentConfig = cloneDeep({
      flyLineStyle: this._config.flyLineStyle,
      pathStyle: this._config.pathStyle,
    });
    if (currentData.style) {
      Object.assign(this._currentConfig, currentData.style);
    }
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
    const pathLine = this.createPathLine(points);
    const tadpoleSize = 40;
    const tadpolePointsMesh = this.createShader(points, tadpoleSize);
    group.add(pathLine, tadpolePointsMesh);

    group.name = "flyLine";
    setTween(
      { index: 0 },
      { index: points.length - tadpoleSize },
      (params) => {
        tadpolePointsMesh.geometry.setFromPoints(
          points.slice(params.index, params.index + tadpoleSize)
        );
      },
      { ...this._currentConfig.flyLineStyle, data: this._currentData }
    );
    return group;
  }
  createPathLine = (points: Vector3[]) => {
    const geometry = new BufferGeometry().setFromPoints(points);
    const material = new LineBasicMaterial({
      color: this._currentConfig.pathStyle.color,
    });
    const pathLine = new Line(geometry, material);
    pathLine.name = "pathLine";
    addUserDataToMesh(pathLine, this._currentData);
    return pathLine;
  };
  createShader = (points: Vector3[], tadpoleSize: number) => {
    // Create the final object to add to the scene
    const geometry = new BufferGeometry();
    const newPoints = points.slice(0, tadpoleSize); //获取更多的点数
    const percentArr = []; //attributes.percent的数据
    for (let i = 0; i < newPoints.length; i++) {
      percentArr.push(i / newPoints.length);
    }
    const colorArr = [];
    const color1 = new Color(this._currentConfig.pathStyle.color); //尾拖线颜色
    const color2 = new Color(this._currentConfig.flyLineStyle.color); //飞线蝌蚪头颜色
    for (let i = 0; i < newPoints.length; i++) {
      const color = color1.lerp(color2, i / newPoints.length);
      colorArr.push(color.r, color.g, color.b);
    }
    geometry.setFromPoints(newPoints);
    geometry.attributes.percent = new BufferAttribute(
      new Float32Array(percentArr),
      1
    );
    geometry.attributes.color = new BufferAttribute(
      new Float32Array(colorArr),
      3
    );
    const material = new PointsMaterial({
      vertexColors: true, //使用顶点颜色渲染
      size: 3.0, //点大小
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
    // 创建精灵材质，使用加载的纹理
    const spriteMaterial = new SpriteMaterial({
      map: texture,
      color: new Color(this._currentConfig.flyLineStyle.color),
      transparent: true,
      depthTest: true,
    });

    // 创建精灵
    const sprite = new Sprite(spriteMaterial);
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
