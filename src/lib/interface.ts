import { Group, Object3D } from "three";
type RGB = `rgb(${number}, ${number}, ${number})`;
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
type HEX = `#${string}`;

type Color = RGB | RGBA | HEX | string;
export interface Options {
  cameraType?: string;
  dom: HTMLElement;
  map: string;
  mode: "2d" | "3d";
  helper?: boolean;
  autoRotate?: boolean;
  rotateSpeed?: number;
  light?: "AmbientLight" | "PointLight" | "DirectionalLight" | "RectAreaLight";
  config: Partial<configType>;
}
export interface TweenConfig {
  duration: number;
  delay: number;
  repeat: number;
  onComplete: (data: any) => void;
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
export interface Coordinates {
  id?: string | number;
  lon: number;
  lat: number;
  style?: ScatterStyle;
  [key: string]: any;
}
export interface LineStyle {
  flyLineStyle: Partial<FlyLineStyle>;
  pathStyle: Partial<PathStyle>;
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
  earth: Earth;
  mapStyle: MapStyle;
  spriteColor: Color;
  pathStyle: Partial<PathStyle>;
  flyLineStyle: Partial<FlyLineStyle>;
  scatterStyle: Partial<ScatterStyle>;
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
export interface SetData {
  flyLine: FlyLineData[];
  point: [Coordinates];
}
export type OptDataFunc = <K extends keyof SetData>(
  type: K,
  data: SetData[K],
  mainContainer?: Group
) => Promise<Group[]>;
