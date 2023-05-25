import { Group, Object3D } from "three";

export interface Options {
  cameraType?: string;
  dom: HTMLElement;
  map: string;
  helper?: boolean;
  autoRotate?: boolean;
  rotateSpeed?: number;
  light?: "AmbientLight" | "PointLight" | "DirectionalLight" | "RectAreaLight";
  config?: Partial<configType>;
}
export interface PathLineStyle {
  color: string;
  size: number;
}
export interface FlyWireStyle {
  color: string;
  size: number;
}
export interface ScatterStyle {
  color: string;
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
  color: string;
}
interface MapStyle {
  areaColor?: string;
  lineColor?: string;
}
type Regions = Record<
  any,
  {
    areaColor?: string;
    lineColor?: string;
  }
>;
export interface configType {
  R: number;
  map: string;
  earth: Earth;
  mapStyle: MapStyle;
  spriteColor: string;
  regions?: Regions;
  pathStyle: Partial<PathLineStyle>;
  flyWireStyle: Partial<FlyWireStyle>;
  scatterStyle: Partial<ScatterStyle>;
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
  earthContainer?: Object3D
) => Promise<Group[]>;
