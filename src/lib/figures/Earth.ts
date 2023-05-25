import {
  Group,
  Mesh,
  MeshMatcapMaterial,
  MeshPhongMaterial,
  MeshPhysicalMaterial,
  SphereGeometry,
} from "three";
import store from "@/lib/store/store";
import { configType } from "@/lib/interface";
import Store from "@/lib/store/store";

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
  // 创建一个地球总对象earthGroup
  create() {
    const earthGroup = new Group(); //地球组对象
    earthGroup.add(this.createSphereMesh()); //球体Mesh插入earthGroup中
    earthGroup.name = "earthGroup";
    return earthGroup;
  }
}
export default CreateEarth;
