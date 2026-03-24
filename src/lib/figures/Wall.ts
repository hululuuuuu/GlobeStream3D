import {
  CatmullRomCurve3,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Shape,
  Vector3,
} from "three";
import Store from "@/lib/store/store";
import { StoreConfig, WallStyle } from "@/lib/interface";
import { Position } from "geojson";
import { lon2xyz } from "@/lib/utils/math";
import { GeoLineSource, normalizeGeoLineData } from "@/lib/utils/geoLineData";

export class Wall {
  private readonly _config: StoreConfig;
  private readonly _store: Store;
  private _currentStyle: WallStyle;
  constructor(store: Store) {
    this._config = store.getConfig();
    this._store = store;
    this._currentStyle = {
      ...this._config.wallStyle,
    };
  }
  createShape(points: Vector3[], closed: boolean) {
    const shape = new Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0, this._currentStyle.height);
    shape.lineTo(0.05, this._currentStyle.width); // 光墙的宽度
    shape.lineTo(0.05, 0);
    shape.closePath();
    const extrudePath = new CatmullRomCurve3(points, closed);

    const extrudeSettings = {
      steps: 150,
      bevelEnabled: false,
      extrudePath: extrudePath,
    };

    // 创建几何体并应用材质
    const geometry = new ExtrudeGeometry(shape, extrudeSettings);
    const material = new MeshBasicMaterial({
      color: this._currentStyle.color,
      transparent: true,
      opacity: this._currentStyle.opacity,
    });
    return new Mesh(geometry, material);
  }
  create(data: { data: GeoLineSource; style?: Partial<WallStyle> }) {
    this.getCurrentStyle(data.style);
    const wallGroup = new Group();
    const lineData = normalizeGeoLineData(data.data);

    if (this._store.mode === "3d") {
      lineData.forEach((point: Position[]) => {
        if (point.length < 2) return;
        let allPoints: Vector3[] = [];
        point.forEach((item: number[]) => {
          const { x, y, z } = lon2xyz(this._config.R, item[0], item[1], 1.01);
          allPoints.push(new Vector3(x, y, z));
        });
        const closed = this.isClosedLine(point);
        wallGroup.add(this.createShape(allPoints, closed));
      });
    } else {
      lineData.forEach((point: Position[]) => {
        if (point.length < 2) return;
        let allPoints: Vector3[] = [];
        point.forEach((item: number[]) => {
          allPoints.push(new Vector3(item[0], item[1], 1));
        });
        const closed = this.isClosedLine(point);
        wallGroup.add(this.createShape(allPoints, closed));
      });
    }

    return wallGroup.children.length ? wallGroup : undefined;
  }
  getCurrentStyle(style?: Partial<WallStyle>) {
    if (style) {
      this._currentStyle = {
        ...this._currentStyle,
        ...style,
      };
    }
  }
  isClosedLine(points: Position[]) {
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    if (!firstPoint || !lastPoint) return false;

    return firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];
  }
}
