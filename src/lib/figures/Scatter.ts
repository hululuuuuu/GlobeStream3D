import pointImg from "@/assets/image/point.png";
import scatterImg from "@/assets/image/scatter.png";
import { lon2xyz } from "../utils/math";
import { Coordinates, ScatterStyle, StoreConfig } from "@/lib/interface";
import {
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  TextureLoader,
  Vector3,
} from "three";
import Store from "@/lib/store/store";
import { merge } from "lodash-es";
import { ownTexture } from "@/lib/utils/dispose";

const textureLoader = new TextureLoader();
const POINT_TEXTURE = textureLoader.load(pointImg);
const SCATTER_TEXTURE = textureLoader.load(scatterImg);

export default class Scatter {
  private readonly _config: StoreConfig;
  private readonly _store: Store;
  _currentStyle: ScatterStyle;

  constructor(store: Store) {
    this._config = store.getConfig();
    this._store = store;
    this._currentStyle = this._config.scatterStyle as ScatterStyle;
  }

  setMeshAttr(
    geometry: PlaneGeometry,
    material: MeshBasicMaterial,
    { lon, lat, ...rest }: Coordinates,
  ) {
    const mesh = new Mesh(geometry, material);
    const zOffset =
      material.name === "scatter"
        ? this._config.R * 1.001
        : this._config.R * 1.002;

    const size = this._currentStyle.size ?? this._config.R * 0.05;
    mesh.scale.set(size * 1.3, size * 1.3, size * 1.3);
    if (this._store.mode === "3d") {
      const { x, y, z } = lon2xyz(zOffset, lon, lat);
      mesh.position.set(x, y, z); //设置mesh位置
      const meshNormal = new Vector3(0, 0, 1);
      const coordVec3 = new Vector3(x, y, z).normalize();
      mesh.quaternion.setFromUnitVectors(meshNormal, coordVec3);
    } else {
      mesh.position.set(lon, lat, 0.1);
    }

    mesh.userData = rest;
    return { mesh, size };
  }

  createScatterMesh = (data: Coordinates) => {
    const { geometry, material } = this.createScatter();
    const { mesh, size } = this.setMeshAttr(geometry, material, data);
    mesh.name = "scatter";
    //设置动画
    this._store.animations.setTween(
      mesh,
      { size: size * 1.5, opacity: 0 },
      { size: [size * 2.8, size * 3.5], opacity: [1, 0.1] },
      function (params) {
        mesh.scale.set(params.size, params.size, params.size);
        mesh.material.opacity = params.opacity;
      },
      {
        ...this._currentStyle,
        data,
      },
    );
    return mesh;
  };

  createScatter() {
    const geometry = new PlaneGeometry(1, 1);
    const material = new MeshBasicMaterial({
      map: SCATTER_TEXTURE,
      transparent: true,
      color: this._currentStyle.color,
      opacity: 1.0,
      // side: DoubleSide, //双面可见
      depthWrite: false, //禁止写入深度缓冲区数据
    });
    material.name = "scatter";
    return { geometry, material };
  }

  createPointMesh = (data: Coordinates) => {
    const { geometry, material } = this.createPoint();
    const { mesh } = this.setMeshAttr(geometry, material, data);
    mesh.name = "point";
    return mesh;
  };

  createPoint() {
    const geometry = new PlaneGeometry(1, 1);
    const material = new MeshBasicMaterial({
      map: POINT_TEXTURE,
      transparent: true,
      color: this._currentStyle.color,
    });
    material.name = "point";

    return { geometry, material };
  }

  createCustomMesh = (data: Coordinates) => {
    const { geometry, material, texture } = this.createCustom();
    const { mesh } = this.setMeshAttr(geometry, material, data);
    ownTexture(mesh, texture);
    mesh.name = "scatter";
    if (this._currentStyle.customFigure?.rotate) {
      mesh.rotation.z =
        this._currentStyle.customFigure.rotate * (Math.PI / 180);
    }
    const animation = this._currentStyle.customFigure?.animate;
    if (animation) {
      //设置动画
      this._store.animations.setTween(
        mesh,
        animation.from,
        animation.to,
        function (params) {
          const { size, opacity } = params;
          if (size !== undefined) mesh.scale.setScalar(size);
          if (opacity !== undefined) mesh.material.opacity = opacity;
        },
        {
          ...this._currentStyle,
          data,
        },
      );
    }
    return mesh;
  };
  createCustom() {
    const geometry = new PlaneGeometry(1, 1);
    const texture = new TextureLoader().load(
      this._currentStyle.customFigure?.texture!,
    );
    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      color: this._currentStyle.color,
      opacity: 1.0,
      // side: DoubleSide, //双面可见
      depthWrite: false, //禁止写入深度缓冲区数据
    });
    material.name = "scatter";
    return { geometry, material, texture };
  }
  create(data: Coordinates) {
    this._currentStyle = merge({}, this._config.scatterStyle, data.style);
    const show =
      this._currentStyle.show ?? this._config.scatterStyle.show ?? true;
    const group = new Group();
    if (!show) {
      group.name = "pointScatter";
      return group;
    }
    if (!this._currentStyle.customFigure?.texture) {
      const point = this.createPointMesh(data);
      const scatter = this.createScatterMesh(data);
      point.userData = { ...data };
      scatter.userData = { ...data };
      group.add(point, scatter);
    } else {
      const scatter = this.createCustomMesh(data);
      scatter.userData = { ...data };
      group.add(scatter);
    }
    group.name = "pointScatter";
    return group;
  }
}
