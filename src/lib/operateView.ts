import type { Coordinates, OptDataFunc, SetData } from "./interface";
import { Group, Object3D, Vector3 } from "three";
import FlyLine3d from "@/lib/figures/FlyLine3d";
import { lon2xyz } from "@/lib/utils/math";
import Scatter from "@/lib/figures/Scatter";
import Store from "@/lib/store/store";
import FlyLine2d from "@/lib/figures/FlyLine2d";
import { Road } from "@/lib/figures/Road";
import { Wall } from "@/lib/figures/Wall";
import TextMark from "@/lib/figures/Text";
import MapStreamLine from "@/lib/figures/MapStreamLine";
import Bar from "@/lib/figures/Bar";
import Orbit from "@/lib/figures/Orbit";
import { createRadar } from "@/lib/figures/Radar";
import { disposeObjectResources } from "@/lib/utils/dispose";

function layerGroups(container: Object3D | undefined, type: string) {
  return (container?.children ?? []).filter(
    (child): child is Group => child instanceof Group && child.userData.figureType === type
  );
}

function hasLayerId(id: Coordinates["id"]) {
  return id === 0 || Boolean(id);
}

type LayerBuilders = {
  [K in keyof SetData]: (
    store: Store, data: SetData[K], groups: Group[], reserveId: (id: string) => boolean
  ) => void;
};

const builders: LayerBuilders = {
  orbit: (store, data, groups, reserveId) => {
    if (store.mode !== "3d") throw new Error("Orbit layers require 3D mode");
    if (!Array.isArray(data)) throw new TypeError("Orbit data must be an array");
    for (const orbit of data) {
      if (typeof orbit.id !== "string" && !Number.isFinite(orbit.id)) {
        throw new TypeError("Orbit id must be a string or a finite number");
      }
      if (reserveId(String(orbit.id))) groups.push(new Orbit(store.config.R, orbit));
    }
  },
  flyLine: (store, data, groups, reserveId) => {
    data.forEach((item) => {
      const { from, to } = item;
      const id = hasLayerId(from.id) && hasLayerId(to.id)
        ? `${from.id}-${to.id}`
        : `${from.lon}${from.lat}-${to.lon}${to.lat}`;
      if (!reserveId(id)) return;
      const group = new Group();
      groups.push(group);
      const scatter = new Scatter(store);
      if (store.mode === "3d") {
        const from_position = lon2xyz(store.config.R, from.lon, from.lat);
        const to_position = lon2xyz(store.config.R, to.lon, to.lat);
        group.add(scatter.create(from));
        group.add(scatter.create(to));
        const flyLine = new FlyLine3d(store, item);
        group.add(
          flyLine.create(
            new Vector3(from_position.x, from_position.y, from_position.z),
            new Vector3(to_position.x, to_position.y, to_position.z)
          )
        );
      } else {
        const flyLine = new FlyLine2d(store, item);
        group.add(
          flyLine.create(
            new Vector3(from.lon, from.lat, 1),
            new Vector3(to.lon, to.lat, 1)
          )
        );
        group.add(scatter.create(from));
        group.add(scatter.create(to));
      }
      group.name = id;
    });
  },
  point: (store, data, groups, reserveId) => {
    data.forEach((item) => {
      const id = hasLayerId(item.id) ? String(item.id) : `${item.lon}-${item.lat}`;
      if (!reserveId(id)) return;
      const group = new Group();
      groups.push(group);
      const scatter = new Scatter(store);
      group.add(scatter.create(item));
      group.name = id;
    });
  },
  radar: (store, data, groups) => {
    data.forEach((station) => {
      const group = createRadar(store, station);
      if (group) groups.push(group);
    });
  },
  road: (store, data, groups) => {
    data.forEach((item) => {
      const subPoints: Vector3[] = item.path.map(
        ({ lon, lat }) => {
          if (store.mode === "2d") {
            return new Vector3(lon, lat, 0);
          } else {
            const position = lon2xyz(store.config.R * 1.1, lon, lat);
            return new Vector3(position.x, position.y, position.z);
          }
        }
      );
      const roadMesh = new Road(store, {
        path: subPoints,
        style: item.style,
      });
      const group = roadMesh.create(subPoints);
      groups.push(group);
      group.name = String(hasLayerId(item.id) ? item.id : group.uuid);
    });
  },
  wall: (store, data, groups) => {
    const wallMesh = new Wall(store).create(data);
    if (!wallMesh) return;
    const group = new Group();
    groups.push(group);
    group.add(wallMesh);
  },
  mapStreamLine: (store, data, groups) => {
    const mapStreamLineMesh = new MapStreamLine(store).create(data);
    if (!mapStreamLineMesh) return;
    const group = new Group();
    groups.push(group);
    group.add(mapStreamLineMesh);
  },
  bar: (store, data, groups) => {
    const group = new Group();
    groups.push(group);
    const bar = new Bar(store);
    const barMesh = bar.create(data);
    group.add(barMesh);
    group.name = "bar";
  },
  textMark: (store, data, groups) => {
    const textMark = new TextMark(store);
    data.forEach((item) => {
      groups.push(textMark.create(item));
    });
  },
};

export default class OperateView {
  private readonly hiddenLayers = new Set<keyof SetData>();
  private readonly layerIds: Partial<Record<keyof SetData, Set<string>>> = {
    orbit: new Set(),
    point: new Set(),
    flyLine: new Set(),
  };
  constructor(private readonly _store: Store) {}
  addData: OptDataFunc = async (type, data, mainContainer) => {
    return this.updateData(type, data, mainContainer, false);
  };
  setData: OptDataFunc = async (type, data, mainContainer) => {
    return this.updateData(type, data, mainContainer, true);
  };
  private updateData<K extends keyof SetData>(
    type: K, data: SetData[K], container: Group | undefined, replace: boolean
  ) {
    if (this._store.animations.disposed) throw new Error("Cannot update a destroyed chart");
    if (!Object.prototype.hasOwnProperty.call(builders, type)) return [];
    const mountedIds = container ? this.layerIds[type] : undefined;
    const pendingIds = new Set<string>();
    const reserveId = (id: string) => {
      if ((!replace && mountedIds?.has(id)) || pendingIds.has(id)) return false;
      pendingIds.add(id);
      return true;
    };
    const previous = replace ? layerGroups(container, type) : [];
    const meshList: Group[] = [];
    try {
      if (!Array.isArray(data) || data.length > 0) {
        builders[type](this._store, data, meshList, reserveId);
      }
      for (const group of meshList) {
        group.userData.figureType = type;
        if (this.hiddenLayers.has(type)) group.visible = false;
        container?.add(group);
      }
      if (container) {
        for (const group of meshList) this._store.animations.startLayer(group);
      }
    } catch (error) {
      this.discardGroups(meshList);
      throw error;
    }
    this.discardGroups(previous);
    if (mountedIds) {
      if (replace) this.layerIds[type] = pendingIds;
      else for (const id of pendingIds) mountedIds.add(id);
    }
    return meshList;
  }
  private discardGroups(groups: Group[]) {
    for (const group of groups) {
      group.removeFromParent();
      this.disposeGroup(group);
    }
  }
  remove(mainContainer: Object3D, type: string, ids: string[] | "removeAll") {
    const groups = layerGroups(mainContainer, type);
    const selected = ids === "removeAll" ? undefined : new Set(ids);
    const removed = selected ? groups.filter(group => selected.has(group.name)) : groups;
    this.discardGroups(removed);
    if (type === "point" || type === "flyLine" || type === "orbit") {
      for (const group of removed) this.layerIds[type]?.delete(group.name);
    }
  }
  setLayerVisible(container: Group, type: keyof SetData, visible: boolean) {
    if (this._store.animations.disposed || !Object.prototype.hasOwnProperty.call(builders, type)) return;
    if (visible) {
      if (!this.hiddenLayers.delete(type)) return;
    } else {
      if (this.hiddenLayers.has(type)) return;
      this.hiddenLayers.add(type);
    }
    for (const group of layerGroups(container, type)) group.visible = visible;
  }
  clearLayerState() {
    this.hiddenLayers.clear();
    for (const ids of Object.values(this.layerIds)) ids.clear();
  }
  disposeGroup(group: Group) {
    this._store.animations.stopLayer(group);
    group.traverse(disposeObjectResources);
  }
}
