import { Group } from "three";
import { Position } from "geojson";

type RGB = `rgb(${number}, ${number}, ${number})`;
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
type HEX = `#${string}`;
type Color = RGB | RGBA | HEX | string;
export type BasicMaterial =
  | "MeshBasicMaterial"
  | "MeshLambertMaterial"
  | "MeshPhongMaterial";
export type EarthMaterial = BasicMaterial | "MeshMatcapMaterial";
export const InitConfig = {
  R: 160,
  enableZoom: true,
  zoom: 1,
  pixelRatio: undefined as number | undefined,
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
  texture: {
    path: "",
    mixed: false,
  },
  bgStyle: {
    color: "#040D21",
    opacity: 1,
  },
  mapStyle: {
    areaColor: "#2e3564",
    lineColor: "#797eff",
    opacity: 1.0,
    material: "MeshBasicMaterial" as BasicMaterial,
  },
  spriteStyle: {
    color: "#797eff",
    show: true,
  }, //光圈
  pathStyle: {
    color: "#cd79ff", //飞线路径配置
    show: true,
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
  barStyle: {
    //柱状图样式配置
    color: "#cd79ff",
    width: 0.5,
    height: 0.5,
  },
  hoverRegionStyle: {
    areaColor: "#cd79ff",
    opacity: 1,
    show: true,
  },
  scatterStyle: {
    //涟漪
    color: "#cd79ff",
  },
  wallStyle: {
    color: "#cd79ff",
    opacity: 0.5,
    height: 2,
    width: 2,
  },
  mapStreamStyle: {
    color: "#f0f0f0",
    opacity: 0.5,
    speed: 1,
    splitLine: 3,
  },
  textMark: {
    style: {
      fontSize: 20,
      color: "#fff",
    },
    data: [],
  },
};
export interface Options {
  dom: HTMLElement;
  map: string;
  debugHelper?: boolean;
  cameraType?: string;
  mode?: "2d" | "3d";
  helper?: boolean;
  limitFps?: boolean;
  autoRotate?: boolean;
  rotateSpeed?: number;
  controls?: "custom" | "builtIn";
  light?: "AmbientLight" | "PointLight" | "DirectionalLight" | "RectAreaLight";
  config: Partial<configType>;
}
export type StoreConfig = typeof InitConfig & configType;
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
    rotate?: false | number;
  };
}
export interface PathStyle {
  color: Color;
  size: number;
  show: boolean;
}
export interface FlyLineStyle extends TweenConfig {
  color: Color;
  size: number;
  img?: string;
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
export interface BarStyle {
  color: Color;
  width?: number;
  height?: number;
}

export interface DragConfig {
  rotationSpeed: number;
  inertiaFactor: number;
  disableX: boolean;
  disableY: boolean;
}
export interface Earth {
  color: Color;
  material?: EarthMaterial | "MeshNormalMaterial";
  dragConfig?: Partial<DragConfig>;
}

interface MapStyle {
  areaColor?: Color;
  lineColor?: Color;
  opacity?: number | undefined;
  material?: BasicMaterial;
}
export interface RegionBaseStyle {
  areaColor?: Color;
  opacity?: number | undefined;
  show?: boolean;
  material?: BasicMaterial;
}
export interface TextStyle {
  fontSize: number;
  color: Color;
}
export interface TextMarkItem {
  id?: string | number;
  text: string;
  position: LessCoordinate;
  style?: Partial<TextStyle>;
}
export type TextMarkConfig = {
  style?: TextStyle;
  data: TextMarkItem[];
};
type RegionsStyle = Record<string, RegionBaseStyle>;
export interface configType {
  R: number;
  map: string;
  texture?: {
    path: string;
    mixed: boolean;
  };
  pixelRatio?: number;
  enableZoom?: boolean;
  zoom?: number;
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
  barStyle: Partial<BarStyle>;
  regions?: RegionsStyle;
  hoverRegionStyle?: RegionBaseStyle;
  wallStyle: Partial<WallStyle>;
  mapStreamStyle: Partial<MapStreamStyle>;
  textMark?: Partial<TextMarkConfig>;
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

export interface BarData {
  position: LessCoordinate;
  value: number;
  style?: Partial<BarStyle>;
  id?: string | number;
}
export interface WallStyle {
  color: Color;
  opacity: number;
  height: number;
  width: number;
}
export interface MapStreamStyle {
  color: Color;
  opacity: number;
  speed: number;
  splitLine: number;
}
export interface SetData {
  flyLine: FlyLineData[];
  point: Coordinates[];
  road: RoadData[];
  wall: {
    data: Position[][];
    style?: Partial<WallStyle>;
  };
  mapStreamLine: {
    data: Position[][];
    style?: Partial<MapStreamStyle>;
  };
  bar: BarData[];
  textMark: TextMarkItem[];
}
export type OptDataFunc = (
  type: keyof SetData,
  data: any,
  mainContainer?: Group
) => Promise<Group[]>;
