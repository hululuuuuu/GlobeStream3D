import type { OptDataFunc } from "./interface";
import { Group, Mesh, Object3D, Vector3 } from "three";
import FlyLine3d from "@/lib/figures/FlyLine3d";
import { lon2xyz } from "@/lib/utils/math";
import Scatter from "@/lib/figures/Scatter";
import Store from "@/lib/store/store";
import FlyLine2d from "@/lib/figures/FlyLine2d";

export default class OperateView {
  private readonly _store: Store;
  constructor(store: Store) {
    this._store = store;
  }
  addData: OptDataFunc = (type, data) => {
    const meshList: Group[] = [];
    const storeConfig = this._store.getConfig();
    if (type === "flyLine") {
      data.forEach((item) => {
        const { from, to, style } = item;
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
          const flyLine = new FlyLine3d(this._store);
          group.add(
            flyLine.create(
              new Vector3(from_position.x, from_position.y, from_position.z),
              new Vector3(to_position.x, to_position.y, to_position.z)
            )
          );
        } else {
          const flyLine = new FlyLine2d(this._store);
          group.add(
            flyLine.create(
              new Vector3(from.lon, from.lat, 0),
              new Vector3(to.lon, to.lat, 0)
            )
          );
          group.add(scatter.create(from), scatter.create(to));
        }

        group.name = id;
        meshList.push(group);
      });
    }
    return Promise.resolve(meshList);
  };
  setData: OptDataFunc = (type, data) => {
    return this.addData(type, data);
  };
  remove(mainContainer: Object3D, type: string, ids: string[] | "removeAll") {
    console.log(mainContainer);
    if (mainContainer.children.length !== 0) {
      mainContainer.children.forEach((item) => {
        if (item instanceof Group && item.name !== "mapGroup") {
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
      });
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
