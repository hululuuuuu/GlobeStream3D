import type { Coordinates, OptDataFunc, RoadData } from "./interface";
import { FlyLineData, LessCoordinate } from "./interface";
import { Group, Mesh, Object3D, Vector3 } from "three";
import FlyLine3d from "@/lib/figures/FlyLine3d";
import { lon2xyz, uuid } from "@/lib/utils/math";
import Scatter from "@/lib/figures/Scatter";
import Store from "@/lib/store/store";
import FlyLine2d from "@/lib/figures/FlyLine2d";
import { Road } from "@/lib/figures/Road";
import { Wall } from "@/lib/figures/Wall";

export default class OperateView {
  private readonly _store: Store;
  constructor(store: Store) {
    this._store = store;
  }
  addData: OptDataFunc = (type, data) => {
    const meshList: Group[] = [];
    const storeConfig = this._store.getConfig();
    if (type === "flyLine") {
      (data as FlyLineData[]).forEach((item: FlyLineData) => {
        const { from, to } = item;
        //生成一个id 规则是优先取id 否则from和to的经纬度字符串拼接
        let id: string;
        if (from.id && to.id) {
          id = `${from.id}-${to.id}`;
        } else {
          id = `${from.lon}${from.lat}-${to.lon}${to.lat}`;
        }
        if (this._store.flyLineMap[id]) return;
        const group = new Group();
        const scatter = new Scatter(this._store);
        if (this._store.mode === "3d") {
          const from_position = lon2xyz(storeConfig.R, from.lon, from.lat);
          const to_position = lon2xyz(storeConfig.R, to.lon, to.lat);
          group.add(scatter.create(from), scatter.create(to));
          const flyLine = new FlyLine3d(this._store, item);
          group.add(
            flyLine.create(
              new Vector3(from_position.x, from_position.y, from_position.z),
              new Vector3(to_position.x, to_position.y, to_position.z)
            )
          );
        } else {
          const flyLine = new FlyLine2d(this._store, item);
          group.add(
            flyLine.create(
              new Vector3(from.lon, from.lat, 1),
              new Vector3(to.lon, to.lat, 1)
            )
          );
          group.add(scatter.create(from), scatter.create(to));
        }
        group.name = id;
        group.userData.figureType = "flyLine";
        meshList.push(group);
      });
    } else if (type === "point") {
      (data as Coordinates[]).forEach((item: Coordinates) => {
        let id: string | number = item.id || `${item.lon}-${item.lat}`;
        if (this._store.flyLineMap[id]) return;
        const group = new Group();
        const scatter = new Scatter(this._store);
        group.add(scatter.create(item));
        group.name = id.toString();
        group.userData.figureType = "point";
        meshList.push(group);
      });
    } else if (type === "road") {
      (data as RoadData[]).forEach((item: RoadData) => {
        let id: string | number = item.id || uuid();
        const subPoints: Vector3[] = item.path.map(
          ({ lon, lat }: LessCoordinate, index) => {
            if (this._store.mode === "2d") {
              return new Vector3(lon, lat, 0);
            } else {
              const position = lon2xyz(storeConfig.R * 1.1, lon, lat);
              return new Vector3(position.x, position.y, position.z);
            }
          }
        );
        const roadMesh = new Road(this._store, {
          path: subPoints,
          style: item.style,
        });
        const group = roadMesh.create(subPoints);
        group.name = id.toString();
        group.userData.figureType = "road";
        meshList.push(group);
      });
    } else if (type === "wall") {
      const group = new Group();
      group.userData.figureType = "walls";
      const wall = new Wall(this._store);
      const wallMesh = wall.create(data);
      if (wallMesh) {
        group.add(wallMesh);
      }
      meshList.push(group);
    }
    return Promise.resolve(meshList);
  };
  setData: OptDataFunc = (type, data) => {
    return this.addData(type, data);
  };
  remove(mainContainer: Object3D, type: string, ids: string[] | "removeAll") {
    if (mainContainer.children.length !== 0) {
      for (let i = mainContainer.children.length - 1; i >= 0; i--) {
        let item = mainContainer.children[i];
        if (
          item instanceof Group &&
          item.name !== "mapGroup" &&
          item.userData.figureType === type
        ) {
          if (ids === "removeAll") {
            this.disposeGroup(item);
            mainContainer.remove(item);
          } else {
            if (ids.includes(item.name)) {
              this.disposeGroup(item);
              mainContainer.remove(item);
            }
          }
        }
      }
    }
  }
  disposeGroup(group: Group) {
    group.traverse((item) => {
      if (!(item instanceof Group)) {
        (item as Mesh).geometry.dispose(); // 删除几何体
      }
    });
  }
}
