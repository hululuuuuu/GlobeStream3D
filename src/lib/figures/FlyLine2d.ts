import {
  Vector3,
  ArcCurve,
  Group,
  BufferGeometry,
  LineBasicMaterial,
  Line,
  Points,
  PointsMaterial,
  Color,
  BufferAttribute,
  CatmullRomCurve3,
  LineCurve3,
  QuadraticBezierCurve3,
  Matrix4,
  SplineCurve,
} from "three";
import {
  _3Dto2D,
  getFunctionExpression,
  radianAOB,
  threePointCenter,
} from "@/lib/utils/math";
import { setTween } from "@/lib/utils/tween";
import { configType } from "@/lib/interface";
import Store from "@/lib/store/store";

export default class FlyLine3d {
  _config: configType;
  _store: Store;
  constructor(store: Store) {
    this._store = store;
    this._config = store.getConfig();
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
    setTween({ index: 0 }, { index: points.length - tadpoleSize }, (params) => {
      tadpolePointsMesh.geometry.setFromPoints(
        points.slice(params.index, params.index + tadpoleSize)
      );
    });
    return group;
  }
  createPathLine = (points: Vector3[]) => {
    const geometry = new BufferGeometry().setFromPoints(points);
    const material = new LineBasicMaterial({
      color: this._config.pathStyle.color,
    });
    const pathLine = new Line(geometry, material);
    pathLine.name = "pathLine";
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
    const color1 = new Color(this._config.pathStyle.color); //尾拖线颜色
    const color2 = new Color(this._config.flyWireStyle.color); //飞线蝌蚪头颜色
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
  create(src: Vector3, dist: Vector3) {
    //创建线
    const flyLineMesh = this.createMesh([src, dist]);
    return flyLineMesh;
  }
}
