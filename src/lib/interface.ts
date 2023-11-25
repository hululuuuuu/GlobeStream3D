import { Group } from "three";

type RGB = `rgb(${number}, ${number}, ${number})`;
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
type HEX = `#${string}`;

type Color = RGB | RGBA | HEX | string;
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
interface Earth {
  color: Color;
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
