import { Quaternion, Vector3 } from "three";
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
  //球心坐标
  const origin = new Vector3(0, 0, 0); //球心坐标
  const startDir = start.clone().sub(origin); //飞线起点与球心构成方向向量
  const endDir = end.clone().sub(origin); //飞线结束点与球心构成方向向量
  // startDir和endDir构成一个三角形，.cross()叉乘计算该三角形法线normal
  const normal = new Vector3().crossVectors(startDir, endDir).normalize();
  const xoy_quaternion = new Quaternion().setFromUnitVectors(
    normal,
    new Vector3(0, 0, 1)
  );
  const start_xoy = start.clone().applyQuaternion(xoy_quaternion);
  const end_xoy = end.clone().applyQuaternion(xoy_quaternion);

  const middle_xoy = new Vector3()
    .addVectors(start_xoy, end_xoy)
    .multiplyScalar(0.5)
    .normalize();
  const xoy_quaternion_middle = new Quaternion().setFromUnitVectors(
    middle_xoy,
    new Vector3(0, 1, 0)
  );
  const start_xoy_middle = start_xoy
    .clone()
    .applyQuaternion(xoy_quaternion_middle);
  const end_xoy_middle = end_xoy.clone().applyQuaternion(xoy_quaternion_middle);

  const quaternionInverse = xoy_quaternion
    .clone()
    .invert()
    .multiply(xoy_quaternion_middle.clone().invert());
  return {
    // 返回两次旋转四元数的逆四元数
    quaternion: quaternionInverse,
    // 范围两次旋转后在XOY平面上关于y轴对称的圆弧起点和结束点坐标
    startPoint3D: start_xoy_middle,
    endPoint3D: end_xoy_middle,
  };
};
const radianAOB = (A: Vector3, B: Vector3, O: Vector3) => {
  // dir1、dir2：球面上两个点和球心构成的方向向量
  const dir1 = A.clone().sub(O).normalize();
  const dir2 = B.clone().sub(O).normalize();
  //点乘.dot()计算夹角余弦值
  const cosAngle = dir1.clone().dot(dir2);
  return Math.acos(cosAngle); //余弦值转夹角弧度值,通过余弦值可以计算夹角范围是0~180度
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
//根据两点生成直角坐标系 函数表达式
function getFunctionExpression(src: Vector3, dist: Vector3) {
  // 计算斜率
  const k = (dist.y - src.y) / (dist.x - src.x);
  // 计算截距
  const b = src.y - k * src.x;

  // 计算垂直函数的斜率
  const k_perpendicular = -1 / k;

  // 计算截距
  const x1 = (dist.x + src.x) / 2,
    y1 = (dist.y + src.y) / 2;
  const b_perpendicular = x1 - k_perpendicular * y1;
  const distance = src.distanceTo(dist);
  return getPointByDistance(
    x1,
    y1,
    k_perpendicular,
    b_perpendicular,
    distance / 5
  );
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
function uuid() {
  let s: any[] = [];
  const hexDigits = "0123456789abcdef";
  for (let i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  // bits 12-15 of the time_hi_and_version field to 0010
  s[14] = "4";
  // bits 6-7 of the clock_seq_hi_and_reserved to 01
  // tslint:disable-next-line:no-bitwise
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
  // tslint:disable-next-line:no-bitwise
  s[8] = s[13] = s[18] = s[23] = "-";
  return s.join("");
}
export {
  lon2xyz,
  _3Dto2D,
  radianAOB,
  threePointCenter,
  getFunctionExpression,
  getPointByDistance,
  uuid,
};
