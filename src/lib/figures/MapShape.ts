import {
  BasicMaterial,
  Options,
  RegionBaseStyle,
  StoreConfig,
} from "@/lib/interface";
import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshLambertMaterial,
  MeshPhongMaterial,
  MeshBasicMaterial,
} from "three";
import { Feature, Position } from "geojson";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
import { lon2xyz } from "@/lib/utils/math";
import Delaunator from "delaunator";
import MapStore from "@/lib/store/mapStore";
import ChartScene from "@/lib/chartScene";

export default class MapShape {
  private readonly _config: StoreConfig;
  currentStyle: RegionBaseStyle;
  features: Feature[];
  _options: Options;

  constructor(chartScene: ChartScene) {
    this._config = chartScene._store.getConfig();
    this._options = chartScene.options;

    this.features = MapStore.hashMap[chartScene.options.map];
  }
  create() {
    const regions: Group[] = [];
    for (const feature of this.features) {
      const geometry = feature.geometry;
      if (geometry?.type !== "Polygon" && geometry?.type !== "MultiPolygon") continue;
      const name = feature.properties?.name;
      this.getCurrentStyle(name);
      if (this.currentStyle.show === false) continue;

      const region = new Group();
      region.name = `countryGroup-${name}`;
      const surfaces: BufferGeometry[] = [];
      const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
      for (const [ring] of polygons) {
        if (!ring || ring.length < 3) continue;
        const { positions, outline, indices } = this.gridPoint(ring);
        surfaces.push(this.createShapeGeometry(indices, positions));
        region.add(this.createLineMesh(outline));
      }
      if (!surfaces.length) continue;
      const surface = surfaces.length === 1 ? surfaces[0] : mergeGeometries(surfaces);
      surface.computeVertexNormals();
      const mesh = new Mesh(surface, this.createMaterial());
      mesh.name = name;
      mesh.userData = {
        ...feature.properties,
        type: "country",
        backupColor: this.currentStyle.areaColor,
        opacity: this.currentStyle.opacity,
      };
      region.add(mesh);
      regions.push(region);
    }
    return regions;
  }

  createShapeGeometry(indices: number[], positions: Float32Array) {
    const geometry = new BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    return geometry;
  }

  createLineMesh(positions: Float32Array) {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    const material = new LineBasicMaterial({ color: this._config.mapStyle.lineColor });
    return new LineLoop(geometry, material);
  }

  createMaterial() {
    const materialType: BasicMaterial =
      this.currentStyle.material ||
      this._config.mapStyle.material ||
      "MeshBasicMaterial";
    const transparent =
      typeof this.currentStyle.opacity === "number" &&
      this.currentStyle.opacity < 1;
    const baseConfig = {
      color: this.currentStyle.areaColor,
      side: BackSide,
      opacity: this.currentStyle.opacity,
      transparent,
    };
    if (materialType === "MeshLambertMaterial") {
      return new MeshLambertMaterial(baseConfig);
    }
    if (materialType === "MeshPhongMaterial") {
      return new MeshPhongMaterial(baseConfig);
    }
    return new MeshBasicMaterial(baseConfig);
  }
  gridPoint(polygon: Position[]) {
    let minLon = Infinity, maxLon = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;
    for (const [lon, lat] of polygon) {
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }

    // Keep the original two-degree grid origin, extent and insertion order for Delaunay.
    const west = Math.floor(minLon), south = Math.floor(minLat);
    const step = 2;
    const columns = Math.ceil((Math.ceil(maxLon) - west) / step);
    const rows = Math.ceil((Math.ceil(maxLat) - south) / step);
    const points = polygon.slice();
    for (let col = 0; col <= columns; col++) {
      const lon = west + col * step;
      for (let row = 0; row <= rows; row++) {
        const lat = south + row * step;
        if (this.pointInPolygon(lon, lat, polygon)) points.push([lon, lat]);
      }
    }

    const positions = new Float32Array(points.length * 3);
    let outline: Float32Array;
    if (this._options.mode === "2d") {
      for (let i = 0; i < points.length; i++) {
        positions[3 * i] = points[i][0];
        positions[3 * i + 1] = points[i][1];
      }
      outline = positions.slice(0, polygon.length * 3);
    } else {
      const radius = this._config.R, lineRadius = radius + 0.1;
      outline = new Float32Array(polygon.length * 3);
      for (let i = 0; i < points.length; i++) {
        const { x, y, z } = lon2xyz(1, points[i][0], points[i][1]);
        const offset = 3 * i;
        positions[offset] = radius * x;
        positions[offset + 1] = radius * y;
        positions[offset + 2] = radius * z;
        if (i < polygon.length) {
          outline[offset] = lineRadius * x;
          outline[offset + 1] = lineRadius * y;
          outline[offset + 2] = lineRadius * z;
        }
      }
    }
    return { positions, outline, indices: this.trianglePlan(points, polygon) };
  }

  pointInPolygon(x: number, y: number, polygon: Position[]) {
    let inside = false;
    let previous = polygon[polygon.length - 1];
    for (const current of polygon) {
      const yi = current[1], yj = previous[1];
      if ((yi > y) !== (yj > y)
        && x < ((previous[0] - current[0]) * (y - yi)) / (yj - yi) + current[0]) {
        inside = !inside;
      }
      previous = current;
    }
    return inside;
  }

  trianglePlan(points: Position[], polygon: Position[]) {
    const triangles = Delaunator.from(points).triangles;
    const indices: number[] = [];
    for (let i = 0; i < triangles.length; i += 3) {
      const a = points[triangles[i]];
      const b = points[triangles[i + 1]];
      const c = points[triangles[i + 2]];
      const lon = (a[0] + b[0] + c[0]) / 3;
      const lat = (a[1] + b[1] + c[1]) / 3;
      if (this.pointInPolygon(lon, lat, polygon)) {
        indices.push(triangles[i], triangles[i + 1], triangles[i + 2]);
      }
    }
    return indices;
  }

  getCurrentStyle(name: string) {
    this.currentStyle = { ...this._config.mapStyle };
    if (this._config.regions?.[name]) {
      Object.assign(this.currentStyle, this._config.regions[name]);
    }
  }
}
