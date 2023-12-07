import { RoadStyle, StoreConfig } from "@/lib/interface";
import Store from "@/lib/store/store";
import {
  ArcCurve,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  Points,
  PointsMaterial,
  Quaternion,
  Vector2,
  Vector3,
} from "three";
import { _3Dto2D, radianAOB } from "@/lib/utils/math";
import { setTween } from "@/lib/utils/tween";
import { merge } from "lodash";

export class Road {
  private readonly _config: StoreConfig;
  _store: Store;
  _currentData: {
    path: Vector3[];
    style?: Partial<RoadStyle>;
  };
  _currentConfig: RoadStyle;
  tadpolePointsMesh: Points;
  points: Vector3[] = [];
  tadpoleSize: number = 40;
  constructor(
    store: Store,
    currentData: {
      path: Vector3[];
      style?: Partial<RoadStyle>;
    }
  ) {
    this._store = store;
    this._config = store.getConfig();
    this._currentData = currentData;
    this._currentConfig = {
      flyLineStyle: this._config.roadStyle.flyLineStyle!,
      pathStyle: this._config.roadStyle.pathStyle!,
    };
    if (currentData.style) {
      merge(this._currentConfig, currentData.style);
    }
  }
  calculateRoadPath = (points: Vector3[]): Group => {
    const group = new Group();
    const groupList: Group[] & Mesh[] = [];
    points.forEach((p, i, array) => {
      if (i < array.length - 1) {
        if (this._store.mode === "2d") {
          this.calculateRoadPath2D([p, array[i + 1]]);
        } else {
          this.calculateArcPath([p, array[i + 1]]);
        }
      }
    });
    group.add(this.createPath(this.points));
    this.tadpolePointsMesh = this.createShader(this.points);
    group.add(this.tadpolePointsMesh);
    return group;
  };
  calculateRoadPath2D = (points: Vector3[]) => {
    const path = new CatmullRomCurve3(points);
    const points3D = path.getPoints(200);
    this.points = [...this.points, ...points3D];
  };
  calculateArcPath = (points: Vector3[]) => {
    const [start, end] = points;
    const { quaternion, startPoint3D, endPoint3D } = _3Dto2D(start, end);
    const centerPosition = new Vector3(0, 0, 0);
    const c = radianAOB(startPoint3D, new Vector3(0, -1, 0), centerPosition);
    const startDeg = -Math.PI / 2 + c;
    const endDeg = Math.PI - startDeg;
    //计算路径点位
    const tubeQuaternionPoints = this.roadPathLine3D(startDeg, endDeg);
    const quaternionPoints = this.generateLinePoints(
      tubeQuaternionPoints,
      quaternion
    );
    this.points = [...this.points, ...quaternionPoints];
  };
  createShader = (points: Vector3[]) => {
    // Create the final object to add to the scene
    const geometry = new BufferGeometry();
    const slicePoints = points.slice(0, this.tadpoleSize); //获取更多的点数
    const percentArr = []; //attributes.percent的数据
    for (let i = 0; i < slicePoints.length; i++) {
      percentArr.push(i / slicePoints.length);
    }
    const colorArr = [];
    const color1 = new Color(this._currentConfig.flyLineStyle.color); //尾拖线颜色
    const color2 = new Color(this._currentConfig.flyLineStyle.color); //飞线蝌蚪头颜色
    for (let i = 0; i < slicePoints.length; i++) {
      const color = color1.lerp(color2, i / slicePoints.length);
      colorArr.push(color.r, color.g, color.b);
    }
    geometry.setFromPoints(slicePoints);
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
      shader.vertexShader = shader.vertexShader.replace(
        "void main() {",
        ["attribute float percent;", "void main() {"].join("\n")
      );
      // 调整点渲染大小计算方式
      shader.vertexShader = shader.vertexShader.replace(
        "gl_PointSize = size;",
        ["gl_PointSize = percent * size;"].join("\n")
      );
    };
    tadpolePointsMesh.name = "RoadTadpolePointsMesh";
    return tadpolePointsMesh;
  };

  createMesh(points: Vector3[]) {
    let roadPathGroup: Group;
    if (this._store.mode === "2d") {
      roadPathGroup = this.calculateRoadPath(points);
    } else {
      roadPathGroup = this.calculateRoadPath(points);
    }
    roadPathGroup.name = "roadLine";
    setTween(
      { index: 0 },
      { index: this.points.length - this.tadpoleSize },
      (params) => {
        this.tadpolePointsMesh.geometry.setFromPoints(
          this.points.slice(params.index, params.index + this.tadpoleSize)
        );
      },
      {
        ...this._currentConfig.flyLineStyle,
        data: this._currentData,
      }
    );
    return roadPathGroup;
  }
  generateLinePoints = (points: Vector2[], quaternion: Quaternion) => {
    return points.map(function (point) {
      const point3D = new Vector3(point.x, point.y, 0);
      point3D.applyQuaternion(quaternion);
      return point3D;
    });
  };
  createPath = (points: Vector3[]) => {
    const geometry = new BufferGeometry().setFromPoints(points);
    const material = new LineBasicMaterial({
      color: this._currentConfig.pathStyle.color,
    });
    const tube = new Line(geometry, material);
    tube.name = "roadPathLine";
    return tube;
  };
  roadPathLine3D = (startDeg: number, endDeg: number) => {
    const curve = new ArcCurve(
      0,
      0, // ax, aY
      this._config.R, // xRadius, yRadius
      startDeg,
      endDeg, // aStartAngle, aEndAngle
      false // aClockwise
    );
    return curve.getSpacedPoints(200);
  };
  roadPathLine2D = (start: Vector3, end: Vector3) => {};
  create(points: Vector3[]) {
    return this.createMesh(points);
  }
}
