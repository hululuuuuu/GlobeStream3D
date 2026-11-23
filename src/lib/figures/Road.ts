import { RoadStyle, StoreConfig } from "@/lib/interface";
import Store from "@/lib/store/store";
import {
  ArcCurve,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Group,
  Line,
  LineBasicMaterial,
  Points,
  PointsMaterial,
  Quaternion,
  Vector2,
  Vector3,
} from "three";
import { _3Dto2D, radianAOB } from "@/lib/utils/math";
import { createTrailGeometry, createTrailUpdater } from "@/lib/utils/trail";
import { merge } from "lodash-es";
import { cloneDeep } from "lodash-es";

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
    this._currentConfig = cloneDeep({
      flyLineStyle: this._config.roadStyle.flyLineStyle!,
      pathStyle: this._config.roadStyle.pathStyle!,
    });
    if (currentData.style) {
      merge(this._currentConfig, currentData.style);
    }
  }
  calculateRoadPath = (points: Vector3[]): Group => {
    const group = new Group();
    for (let i = 1; i < points.length; i++) {
      const segment = [points[i - 1], points[i]];
      if (this._store.mode === "2d") {
        this.calculateRoadPath2D(segment);
      } else {
        this.calculateArcPath(segment);
      }
    }
    if (this._currentConfig.pathStyle.show !== false) {
      group.add(this.createPath(this.points));
    }
    this.tadpolePointsMesh = this.createShader(this.points);
    group.add(this.tadpolePointsMesh);
    return group;
  };
  calculateRoadPath2D = (points: Vector3[]) => {
    const path = new CatmullRomCurve3(points);
    const points3D = path.getPoints(200);
    this.points.push(...points3D);
  };
  calculateArcPath = (points: Vector3[]) => {
    const [start, end] = points;
    const { quaternion, startPoint3D } = _3Dto2D(start, end);
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
    this.points.push(...quaternionPoints);
  };
  createShader = (points: Vector3[]) => {
    const color = new Color(this._currentConfig.flyLineStyle.color);
    const geometry = createTrailGeometry(points, this.tadpoleSize, color, color);
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
    const roadPathGroup = this.calculateRoadPath(points);
    roadPathGroup.name = "roadLine";
    const updateTrail = createTrailUpdater(this.tadpolePointsMesh.geometry, this.points);
    this._store.animations.setTween(
      this.tadpolePointsMesh,
      { index: 0 },
      { index: Math.max(0, this.points.length - this.tadpoleSize) },
      (params) => updateTrail(params.index),
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
