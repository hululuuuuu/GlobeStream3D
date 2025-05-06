import {
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshMatcapMaterial,
  MeshPhongMaterial,
  SphereGeometry,
  TextureLoader,
} from "three";
import { StoreConfig } from "@/lib/interface";
import Store from "@/lib/store/store";
import { Texture } from "three/src/textures/Texture";

class CreateEarth {
  materialMap: Record<string, any> = {
    MeshPhongMaterial: () => {
      return new MeshPhongMaterial({
        ...this._config.earth,
      });
    },
    MeshBasicMaterial: () => {
      return new MeshBasicMaterial({
        ...this._config.earth,
      });
    },
    MeshLambertMaterial: () => {
      return new MeshLambertMaterial({
        ...this._config.earth,
      });
    },
    MeshMatcapMaterial: () => {
      return new MeshMatcapMaterial({
        ...this._config.earth,
      });
    },

    default: () => {
      return new MeshPhongMaterial({
        ...this._config.earth,
      });
    },
  };
  private _config: StoreConfig;
  private _store: Store;
  constructor(store: Store) {
    this._config = store.getConfig();
    this._store = store;
  }
  createSphereMesh() {
    const geometry = new SphereGeometry(this._config.R - 1, 39, 39); //创建一个球体几何对象
    //材质对象Material
    const material = this.materialMap[this._config.earth.material]();

    const earthMesh = new Mesh(geometry, material); //网格模型对象Mesh
    earthMesh.castShadow = true;
    earthMesh.name = "earthMesh";

    return earthMesh;
  }
  createTextureSphereMesh() {
    const materialConfig: {
      map: Texture;
    } = {
      map: new TextureLoader().load(this._config.texture?.path),
    };
    materialConfig.map.colorSpace = "srgb"; // "" | "srgb" | "srgb-linear" | "display-p3"
    const geometry = new SphereGeometry(this._config.R - 1, 39, 39); //创建一个球体几何对象
    //材质对象Material
    const material = new MeshPhongMaterial({
      ...materialConfig,
    });

    const earthMesh = new Mesh(geometry, material); //网格模型对象Mesh
    earthMesh.castShadow = true;
    earthMesh.name = "earthMesh";
    return earthMesh;
  }
  // 创建一个地球总对象earthGroup
  create() {
    const earthGroup = new Group(); //地球组对象
    if (this._config.texture?.path) {
      earthGroup.add(this.createTextureSphereMesh());
    } else {
      earthGroup.add(this.createSphereMesh());
    }
    earthGroup.name = "mapGroup";
    return earthGroup;
  }
}
export default CreateEarth;
