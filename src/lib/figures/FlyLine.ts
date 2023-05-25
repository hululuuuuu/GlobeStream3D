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
} from "three";
import { _3Dto2D, radianAOB, threePointCenter } from "@/lib/utils/math";
import { setTween } from "@/lib/utils/tween";
import { configType, LineStyle } from "@/lib/interface";
import Store from "@/lib/store/store";

export default class FlyWire {
  _config: configType;
  constructor(store: Store) {
    this._config = store.getConfig();
  }
  createMesh(positionInfo: [Vector3, Vector3]) {
    const group = new Group();
    const [sourcePoint, targetPoint] = positionInfo;

    //算出两点之间的中点向量
    const middleV3 = new Vector3()
      .addVectors(sourcePoint, targetPoint)
      .clone()
      .multiplyScalar(0.5);
    //然后计算方向向量
    const dir = middleV3.clone().normalize();
    const s = radianAOB(sourcePoint, targetPoint, new Vector3(0, 0, 0));
    const middlePos = dir.multiplyScalar(
      this._config.R + s * this._config.R * 0.2
    );
    //寻找三个圆心的坐标
    const centerPosition = threePointCenter(
      sourcePoint,
      targetPoint,
      middlePos
    );
    //求得半径
    const R = middlePos.clone().sub(centerPosition).length();
    // group.add(createPoint(centerPosition))
    const c = radianAOB(sourcePoint, new Vector3(0, -1, 0), centerPosition);
    const startDeg = -Math.PI / 2 + c; //飞线圆弧开始角度
    const endDeg = Math.PI - startDeg; //飞线圆弧结束角度
    const pathLine = this.createPathLine(centerPosition, R, startDeg, endDeg);
    const flyAngle = (endDeg - startDeg) / 7; //飞线圆弧的弧度和轨迹线弧度相关 也可以解释为飞线的长度

    const tadpolePointsMesh = this.createShader(
      R,
      startDeg,
      startDeg + flyAngle
    );
    tadpolePointsMesh.position.y = centerPosition.y;
    tadpolePointsMesh.name = "tadpolePointsMesh";
    // tadpolePointsMesh.userData.flyEndAngle = endDeg - startDeg - flyAngle;
    // tadpolePointsMesh.userData.startAngle = startDeg;
    setTween({ z: 0 }, { z: endDeg - startDeg }, (params) => {
      tadpolePointsMesh.rotation.z = params.z;
    });
    group.add(tadpolePointsMesh);
    group.add(pathLine);
    group.name = "flyLine";
    return group;
  }
  createPathLine = (
    middlePos: Vector3,
    r: number,
    startDeg: number,
    endDeg: number
  ) => {
    const curve = new ArcCurve(
      middlePos.x,
      middlePos.y, // ax, aY
      r, // xRadius, yRadius
      startDeg,
      endDeg, // aStartAngle, aEndAngle
      false // aClockwise
    );
    const points = curve.getSpacedPoints(200);
    const geometry = new BufferGeometry().setFromPoints(points);
    const material = new LineBasicMaterial({
      color: this._config.pathStyle.color,
    });
    const pathLine = new Line(geometry, material);
    pathLine.name = "pathLine";
    return pathLine;
  };
  createShader = (r: number, startAngle: number, endAngle: number) => {
    const points = new ArcCurve(
      0,
      0, // ax, aY
      r, // xRadius, yRadius
      startAngle,
      endAngle, // aStartAngle, aEndAngle
      false // aClockwise
    ).getSpacedPoints(200);
    // Create the final object to add to the scene
    const geometry = new BufferGeometry();
    const newPoints = points; //获取更多的点数
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
      // color: 0xffff00,
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
    const { quaternion, startPoint3D, endPoint3D } = _3Dto2D(src, dist);
    const flyLineMesh = this.createMesh([startPoint3D, endPoint3D]);
    flyLineMesh.quaternion.multiply(quaternion);
    return flyLineMesh;
  }
}
