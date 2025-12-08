import {
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshMatcapMaterial,
  MeshPhongMaterial,
  MeshNormalMaterial,
  SphereGeometry,
  TextureLoader,
} from "three";
import { StoreConfig } from "@/lib/interface";
import Store from "@/lib/store/store";
import { Texture } from "three/src/textures/Texture";

class CreateEarth {
  materialMap: Record<string, (map?: Texture) => any> = {
    MeshPhongMaterial: (map?: Texture) => {
      return new MeshPhongMaterial({
        ...this._config.earth,
        map,
      });
    },
    MeshBasicMaterial: (map?: Texture) => {
      return new MeshBasicMaterial({
        ...this._config.earth,
        map,
      });
    },
    MeshLambertMaterial: (map?: Texture) => {
      return new MeshLambertMaterial({
        ...this._config.earth,
        map,
      });
    },
    MeshMatcapMaterial: () => {
      return new MeshMatcapMaterial({
        ...this._config.earth,
      });
    },
    MeshNormalMaterial: () => {
      return new MeshNormalMaterial();
    },
    default: (map?: Texture) => {
      return new MeshPhongMaterial({
        ...this._config.earth,
        map,
      });
    },
  };
  private _config: StoreConfig;
  private _store: Store;
  constructor(store: Store) {
    this._config = store.getConfig();
    this._store = store;
    this._config.earth.material = this.normalizeMaterialKey(
      this._config.earth.material
    ) as any;
  }
  private normalizeMaterialKey(material?: string) {
    if (!material) return "MeshPhongMaterial";
    const key = material.toLowerCase();
    if (key.includes("basic")) return "MeshBasicMaterial";
    if (key.includes("lambert")) return "MeshLambertMaterial";
    if (key.includes("matcap")) return "MeshMatcapMaterial";
    if (key.includes("normal")) return "MeshNormalMaterial";
    return "MeshPhongMaterial";
  }
  createSphereMesh() {
    const geometry = new SphereGeometry(this._config.R - 1, 39, 39); //创建一个球体几何对象
    //材质对象Material
    const materialKey = this.normalizeMaterialKey(this._config.earth.material);
    this._config.earth.material = materialKey as any;
    const materialCreator =
      this.materialMap[materialKey] || this.materialMap.default;
    const material = materialCreator();

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
    const materialKey = this.normalizeMaterialKey(this._config.earth.material);
    this._config.earth.material = materialKey as any;
    const materialCreator =
      this.materialMap[materialKey] || this.materialMap.default;
    const material = materialCreator(materialConfig.map);

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
