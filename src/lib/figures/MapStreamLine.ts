import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Line,
  ShaderMaterial,
  Vector3,
} from "three";
import vertexShader from "@/shaders/map_line_vertexShader.glsl";
import fragmentShader from "@/shaders/map_line_fragmentShader.glsl";
import { MapStreamStyle, StoreConfig } from "@/lib/interface";
import Store from "@/lib/store/store";
import { Position } from "geojson";
import { lon2xyz } from "@/lib/utils/math";
import { setTween } from "@/lib/utils/tween";

export default class MapStreamLine {
  private readonly _config: StoreConfig;
  private readonly _store: Store;
  private _currentStyle: MapStreamStyle;
  singleUniforms: {
    u_time: { value: number };
    number: { type: string; value: number };
    speed: { type: string; value: number };
    length: { type: string; value: number };
    size: { type: string; value: number };
    color: { type: string; value: Color };
  };
  constructor(store: Store) {
    this._config = store.getConfig();
    this._store = store;
    this._currentStyle = {
      ...this._config.mapStreamStyle,
    };
  }

  createFlowingLight(points: Vector3[]) {
    const vertices: number[] = [];
    const percents: number[] = [];
    const numberOfPoints = points.length;

    points.forEach((point: Vector3, i: number) => {
      vertices.push(point.x, point.y, point.z);
      percents.push(i / numberOfPoints);
    });

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("percent", new Float32BufferAttribute(percents, 1));

    const material = new ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: this.singleUniforms,
      transparent: true,
    });
    this.startAnimation();
    return new Line(geometry, material);
  }
  create(data: { data: Position[][]; style: MapStreamStyle }) {
    let currentMesh;
    this.getCurrentStyle(data.style);
    if (this._store.mode === "3d") {
      data.data.forEach((point: Position[]) => {
        let allPoints: Vector3[] = [];
        point.forEach((item: number[]) => {
          const { x, y, z } = lon2xyz(this._config.R, item[0], item[1], 1.001);
          allPoints.push(new Vector3(x, y, z));
        });
        currentMesh = this.createFlowingLight(allPoints);
      });
    } else {
      data.data.forEach((point: Position[]) => {
        let allPoints: Vector3[] = [];
        point.forEach((item: number[]) => {
          allPoints.push(new Vector3(item[0], item[1], 1));
        });
        currentMesh = this.createFlowingLight(allPoints);
      });
    }
    return currentMesh;
  }
  getCurrentStyle(style: MapStreamStyle) {
    if (style) {
      this._currentStyle = {
        ...this._currentStyle,
        ...style,
      };
    }
    this.singleUniforms = {
      u_time: { value: 1.0 },
      number: { type: "f", value: this._currentStyle.splitLine },
      speed: { type: "f", value: this._currentStyle.speed },
      length: { type: "f", value: 2.2 },
      size: { type: "f", value: 10 },
      color: { type: "v3", value: new Color(this._currentStyle.color) },
    };
  }
  startAnimation() {
    setTween(
      { u_time: 0 },
      { u_time: 1 },
      (params) => {
        this.singleUniforms.u_time.value = params.u_time;
      },
      { ...this._currentStyle, duration: 10000 }
    );
  }
}
