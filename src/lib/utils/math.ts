import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { Coordinates3D } from "@/lib/interface";

/**
 * 经纬度坐标转球面坐标
 * @param {地球半径} R
 * @param {经度(角度值)} longitude
 * @param {维度(角度值)} latitude
 */
const lon2xyz = (
  R: number,
  longitude: number,
  latitude: number,
  offset: number = 1
): Coordinates3D => {
  let lon = (longitude * Math.PI) / 180; //转弧度值
  let lat = (latitude * Math.PI) / 180; //转弧度值
  lon = -lon; // three.js坐标系z坐标轴对应经度-90度，而不是90度
  // 经纬度坐标转球面坐标计算公式
  const x = R * offset * Math.cos(lat) * Math.cos(lon);
  const y = R * offset * Math.sin(lat);
  const z = R * offset * Math.cos(lat) * Math.sin(lon);
  // 返回球面坐标
  return {
    x,
    y,
    z,
  };
};
const _3Dto2D = (start: Vector3, end: Vector3) => {
  const u = start.clone().normalize();
  const v = end.clone().normalize();
  const cosine = u.dot(v);
  // Crossing the small difference (or sum near antipodes) avoids subtracting
  // nearly equal products when computing the plane normal.
  const offset = v.clone().addScaledVector(u, cosine < 0 ? 1 : -1);
  const normal = new Vector3().crossVectors(u, offset);
  const sine = normal.length();
  const halfAngle = Math.atan2(sine, cosine) / 2;
  if (sine <= 8 * Number.EPSILON) {
    // Collinear endpoints have no unique plane. Use the northward tangent,
    // or the +X tangent near a pole, consistently in both travel directions.
    const reference = Math.abs(u.y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
    normal.crossVectors(u, reference);
  }
  normal.normalize();
  const yAxis = u.clone().applyAxisAngle(normal, halfAngle);
  const xAxis = new Vector3().crossVectors(yAxis, normal);
  const quaternion = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(xAxis, yAxis, normal));
  const x = Math.sin(halfAngle);
  const y = Math.cos(halfAngle);
  return {
    quaternion,
    startPoint3D: new Vector3(x, y, 0).multiplyScalar(start.length()),
    endPoint3D: new Vector3(-x, y, 0).multiplyScalar(end.length()),
  };
};
const radianAOB = (A: Vector3, B: Vector3, O: Vector3) => {
  // dir1、dir2：球面上两个点和球心构成的方向向量
  const dir1 = A.clone().sub(O).normalize();
  const dir2 = B.clone().sub(O).normalize();
  return Math.acos(MathUtils.clamp(dir1.dot(dir2), -1, 1));
};
//求三个点的外接圆圆心，p1, p2, p3表示三个点的坐标Vector3。
const threePointCenter = (p1: Vector3, p2: Vector3, p3: Vector3) => {
  const L1 = p1.lengthSq(); //p1到坐标原点距离的平方
  const L2 = p2.lengthSq();
  const L3 = p3.lengthSq();
  const x1 = p1.x,
    y1 = p1.y,
    x2 = p2.x,
    y2 = p2.y,
    x3 = p3.x,
    y3 = p3.y;
  const S = x1 * y2 + x2 * y3 + x3 * y1 - x1 * y3 - x2 * y1 - x3 * y2;
  const x = (L2 * y3 + L1 * y2 + L3 * y1 - L2 * y1 - L3 * y2 - L1 * y3) / S / 2;
  const y = (L3 * x2 + L2 * x1 + L1 * x3 - L1 * x2 - L2 * x3 - L3 * x1) / S / 2;
  // 三点外接圆圆心坐标
  return new Vector3(x, y, 0);
};
// 2D 飞线的控制点沿弦的垂线偏移五分之一弦长。
function getFunctionExpression(src: Vector3, dist: Vector3) {
  const midpoint = new Vector3((src.x + dist.x) / 2, (src.y + dist.y) / 2, 0);
  const normal = new Vector3(dist.y - src.y, src.x - dist.x, 0);
  // 保留普通路线向东弯曲的方向；同纬度时统一向北，交换端点仍沿同一条弧线。
  if (normal.x < 0 || (normal.x === 0 && normal.y < 0)) normal.negate();
  return midpoint.add(normal.setLength(src.distanceTo(dist) / 5));
}
//根据已知函数距离求点位
function getPointByDistance(
  x1: number,
  y1: number,
  k: number,
  b: number,
  s: number
) {
  // 求解一元二次方程
  const x = s / Math.sqrt(1 + Math.pow(k, 2));
  const y = (s * k) / Math.sqrt(1 + Math.pow(k, 2));
  return new Vector3(x1 + x, y1 + y, 0);
}
const uuid = MathUtils.generateUUID;
//计算比例尺
function getScale(data: number[], base: number) {
  const maxData = Math.max(...data);
  return base / maxData;
}
export {
  lon2xyz,
  _3Dto2D,
  radianAOB,
  threePointCenter,
  getFunctionExpression,
  getPointByDistance,
  uuid,
  getScale,
};
