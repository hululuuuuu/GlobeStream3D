import { BufferAttribute, BufferGeometry, Color, DynamicDrawUsage, Vector3 } from "three";

export function createTrailGeometry(
  points: Vector3[], size: number, tailColor: Color, headColor: Color
) {
  const count = Math.min(points.length, size);
  const position = new BufferAttribute(new Float32Array(count * 3), 3).setUsage(DynamicDrawUsage);
  const colors = new BufferAttribute(new Float32Array(count * 3), 3);
  const percents = new Float32Array(count);
  const color = new Color();
  for (let i = 0; i < count; i++) {
    const point = points[i];
    position.setXYZ(i, point.x, point.y, point.z);
    const percent = i / count;
    percents[i] = percent;
    color.copy(tailColor).lerp(headColor, percent);
    colors.setXYZ(i, color.r, color.g, color.b);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", position);
  geometry.setAttribute("percent", new BufferAttribute(percents, 1));
  geometry.setAttribute("color", colors);
  return geometry;
}

export function createTrailUpdater(geometry: BufferGeometry, points: Vector3[]) {
  const position = geometry.getAttribute("position");
  const lastStart = points.length - position.count;
  let previousStart = 0;
  return (index: number) => {
    const start = Math.max(0, Math.min(Math.floor(index), lastStart));
    if (start === previousStart) return;
    for (let i = 0; i < position.count; i++) {
      const point = points[start + i];
      position.setXYZ(i, point.x, point.y, point.z);
    }
    previousStart = start;
    position.needsUpdate = true;
    // Three caches these bounds for culling and raycasting.
    if (geometry.boundingSphere) geometry.computeBoundingSphere();
    if (geometry.boundingBox) geometry.computeBoundingBox();
  };
}
