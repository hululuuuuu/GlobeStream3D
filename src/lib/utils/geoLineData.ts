import {
  Feature,
  FeatureCollection,
  Geometry,
  GeometryCollection,
  MultiLineString,
  MultiPolygon,
  Polygon,
  Position,
} from "geojson";

export type GeoLineSource =
  | Position[][]
  | string
  | FeatureCollection<Geometry>
  | Feature<Geometry>
  | Geometry;

function isFeatureCollection(
  source: unknown
): source is FeatureCollection<Geometry> {
  return (
    !!source &&
    typeof source === "object" &&
    "type" in source &&
    (source as FeatureCollection<Geometry>).type === "FeatureCollection"
  );
}

function isFeature(source: unknown): source is Feature<Geometry> {
  return (
    !!source &&
    typeof source === "object" &&
    "type" in source &&
    (source as Feature<Geometry>).type === "Feature"
  );
}

function isGeometry(source: unknown): source is Geometry {
  const geometryType = (source as { type?: string } | null)?.type;

  return (
    !!source &&
    typeof source === "object" &&
    typeof geometryType === "string" &&
    geometryType !== "Feature" &&
    geometryType !== "FeatureCollection"
  );
}

function appendLine(line: Position[], lines: Position[][]) {
  if (line.length > 1) {
    lines.push(line);
  }
}

function appendPolygonRings(polygon: Polygon["coordinates"], lines: Position[][]) {
  polygon.forEach((ring) => appendLine(ring, lines));
}

function appendMultiPolygonRings(
  multiPolygon: MultiPolygon["coordinates"],
  lines: Position[][]
) {
  multiPolygon.forEach((polygon) => appendPolygonRings(polygon, lines));
}

function appendGeometryCollection(
  collection: GeometryCollection,
  lines: Position[][]
) {
  collection.geometries.forEach((geometry) => appendGeometry(geometry, lines));
}

function appendGeometry(geometry: Geometry | null, lines: Position[][]) {
  if (!geometry) return;

  switch (geometry.type) {
    case "LineString":
      appendLine(geometry.coordinates, lines);
      return;
    case "MultiLineString":
      (geometry as MultiLineString).coordinates.forEach((line) =>
        appendLine(line, lines)
      );
      return;
    case "Polygon":
      appendPolygonRings((geometry as Polygon).coordinates, lines);
      return;
    case "MultiPolygon":
      appendMultiPolygonRings((geometry as MultiPolygon).coordinates, lines);
      return;
    case "GeometryCollection":
      appendGeometryCollection(geometry as GeometryCollection, lines);
      return;
    default:
      return;
  }
}

function parseSource(source: string | GeoLineSource) {
  if (typeof source !== "string") {
    return source;
  }

  return JSON.parse(source) as FeatureCollection<Geometry> | Feature<Geometry> | Geometry;
}

export function normalizeGeoLineData(source: GeoLineSource): Position[][] {
  const parsed = parseSource(source);

  if (Array.isArray(parsed)) {
    return parsed;
  }

  const lines: Position[][] = [];

  if (isFeatureCollection(parsed)) {
    parsed.features.forEach((feature) => appendGeometry(feature.geometry, lines));
    return lines;
  }

  if (isFeature(parsed)) {
    appendGeometry(parsed.geometry, lines);
    return lines;
  }

  if (isGeometry(parsed)) {
    appendGeometry(parsed, lines);
  }

  return lines;
}
