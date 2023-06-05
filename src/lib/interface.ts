import { Group, Object3D } from "three";
type RGB = `rgb(${number}, ${number}, ${number})`;
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
type HEX = `#${string}`;

type Color = RGB | RGBA | HEX;
export interface Options {
  cameraType?: string;
  dom: HTMLElement;
  map: string;
  mode: "2d" | "3d";
  helper?: boolean;
  autoRotate?: boolean;
  rotateSpeed?: number;
  light?: "AmbientLight" | "PointLight" | "DirectionalLight" | "RectAreaLight";
  config?: Partial<configType>;
}
export interface PathLineStyle {
  color: Color;
  size: number;
}
export interface FlyWireStyle {
  color: Color;
  size: number;
}
export interface ScatterStyle {
  color: Color;
  size: number;
}
export interface Coordinates {
  id?: string | number;
  lon: number;
  lat: number;
  style?: ScatterStyle;
  [key: string]: any;
}
export interface LineStyle {
  flyWireStyle: Partial<FlyWireStyle>;
  pathLineStyle: Partial<PathLineStyle>;
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
  earth: Earth;
  mapStyle: MapStyle;
  spriteColor: Color;
  pathStyle: Partial<PathLineStyle>;
  flyWireStyle: Partial<FlyWireStyle>;
  scatterStyle: Partial<ScatterStyle>;
  regions?: RegionsStyle;
  hoverRegionStyle?: RegionBaseStyle;
}
export interface Coordinates3D {
  x: number;
  y: number;
  z: number;
}
export interface SetData {
  flyLine: {
    from: Coordinates;
    to: Coordinates;
    style?: Partial<LineStyle>;
    userData?: Record<any, any>;
  }[];
  point: [Coordinates];
}
export type OptDataFunc = <K extends keyof SetData>(
  type: K,
  data: SetData[K],
  mainContainer?: Object3D
) => Promise<Group[]>;
