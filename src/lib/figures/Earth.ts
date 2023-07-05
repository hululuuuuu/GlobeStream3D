import {
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshMatcapMaterial,
  MeshPhongMaterial,
  MeshPhysicalMaterial,
  SphereGeometry,
  TextureLoader,
} from "three";
import store from "@/lib/store/store";
import { configType } from "@/lib/interface";
import Store from "@/lib/store/store";
import { Texture } from "three/src/textures/Texture";

class CreateEarth {
  config: configType;
  private _config: configType;
  constructor(store: Store) {
    this._config = store.getConfig();
  }
  createSphereMesh() {
    const geometry = new SphereGeometry(this._config.R - 1, 39, 39); //创建一个球体几何对象
    //材质对象Material
    const material = new MeshPhongMaterial({
      color: this._config.earth.color,
    });

    const earthMesh = new Mesh(geometry, material); //网格模型对象Mesh
    earthMesh.castShadow = true;
    earthMesh.name = "earthMesh";
    return earthMesh;
  }
  createTextureSphereMesh() {
    const materialConfig: {
      map: Texture;
    } = {
      map: new TextureLoader().load(this._config.texture),
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
    if (this._config.texture) {
      earthGroup.add(this.createTextureSphereMesh());
    } else {
      earthGroup.add(this.createSphereMesh());
    }
    earthGroup.name = "mapGroup";
    return earthGroup;
  }
}
export default CreateEarth;
