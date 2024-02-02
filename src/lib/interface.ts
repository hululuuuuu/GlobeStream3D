import { Group } from "three";

type RGB = `rgb(${number}, ${number}, ${number})`;
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
type HEX = `#${string}`;
type Color = RGB | RGBA | HEX | string;
export const InitConfig = {
  R: 160,
  enableZoom: true,
  earth: {
    color: "#13162c",
    material: "MeshPhongMaterial",
    dragConfig: {
      rotationSpeed: 1,
      inertiaFactor: 0.95,
      disableX: false,
      disableY: false,
    },
  },
  map: "world",
  stopRotateByHover: true,
  texture: "",
  bgStyle: {
    color: "#040D21",
    opacity: 1,
  },
  mapStyle: {
    areaColor: "#2e3564",
    lineColor: "#797eff",
  },
  spriteStyle: {
    color: "#797eff",
    show: true,
  }, //光圈
  pathStyle: {
    color: "#cd79ff", //飞线路径配置
  },
  flyLineStyle: {
    //飞线样式配置
    color: "#cd79ff",
  },
  roadStyle: {
    //道路样式配置
    flyLineStyle: {
      color: "#cd79ff",
    },
    pathStyle: {
      color: "#cd79ff",
    },
  },
  scatterStyle: {
    //涟漪
    color: "#cd79ff",
  },
};
export interface Options {
  dom: HTMLElement;
  map: string;
  cameraType?: string;
  mode?: "2d" | "3d";
  helper?: boolean;
  limitFps?: boolean;
  autoRotate?: boolean;
  rotateSpeed?: number;
  light?: "AmbientLight" | "PointLight" | "DirectionalLight" | "RectAreaLight";
  config: Partial<configType>;
}
export type StoreConfig = typeof InitConfig & Partial<configType>;
export interface TweenParams {
  from: {
    size?: number;
    color?: Color;
    opacity?: number;
  };
  to: {
    size?: number | number[];
    color?: Color | Color[];
    opacity?: number | number[];
  };
}
export interface TweenConfig {
  duration?: number;
  delay?: number;
  repeat?: number;
  onComplete?: (data: any) => void;
  customFigure?: {
    texture: string;
    animate?: false | TweenParams;
  };
}
export interface PathStyle {
  color: Color;
  size: number;
}
export interface FlyLineStyle extends TweenConfig {
  color: Color;
  size: number;
}
export interface ScatterStyle extends TweenConfig {
  color: Color;
  size?: number;
}

export interface LessCoordinate {
  lon: number;
  lat: number;
}
export interface Coordinates extends LessCoordinate {
  id?: string | number;
  style?: ScatterStyle;
  [key: string]: any;
}
export interface LineStyle {
  flyLineStyle: Partial<FlyLineStyle>;
  pathStyle: Partial<PathStyle>;
}
export interface RoadStyle {
  flyLineStyle: Partial<FlyLineStyle>;
  pathStyle: Partial<PathStyle>;
}
export interface SpriteStyle {
  color: Color;
  show?: boolean;
  size?: number;
}
export interface DragConfig {
  rotationSpeed: number;
  inertiaFactor: number;
  disableX: boolean;
  disableY: boolean;
}
export interface Earth {
  color: Color;
  material?:
    | "MeshPhongMaterial"
    | "MeshBasicMaterial"
    | "MeshLambertMaterial"
    | "MeshMatcapMaterial"
    | "MeshNormalMaterial";
  dragConfig?: Partial<DragConfig>;
}

interface MapStyle {
  areaColor?: Color;
  lineColor?: Color;
}
export interface RegionBaseStyle {
  areaColor?: Color;
}
type RegionsStyle = Record<string, RegionBaseStyle>;
export interface configType {
  R: number;
  map: string;
  texture: string;
  enableZoom?: boolean;
  stopRotateByHover: boolean;
  bgStyle: {
    color: Color;
    opacity?: number;
  };
  earth: Earth;
  mapStyle: MapStyle;
  spriteStyle: SpriteStyle;
  pathStyle: Partial<PathStyle>;
  flyLineStyle: Partial<FlyLineStyle>;
  scatterStyle: Partial<ScatterStyle>;
  roadStyle: Partial<RoadStyle>;
  regions?: RegionsStyle;
  hoverRegionStyle?: RegionBaseStyle;
}
export interface Coordinates3D {
  x: number;
  y: number;
  z: number;
}
export interface FlyLineData {
  from: Coordinates;
  to: Coordinates;
  style?: Partial<LineStyle>;
  [key: string]: any;
}

export interface RoadData {
  path: LessCoordinate[];
  style?: Partial<RoadStyle>;
  id: string | number;
}
export interface SetData {
  flyLine: FlyLineData[];
  point: Coordinates[];
  road: RoadData[];
}
export type OptDataFunc = (
  type: keyof SetData,
  data: any,
  mainContainer?: Group
) => Promise<Group[]>;
