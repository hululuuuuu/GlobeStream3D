import { Line, Mesh } from "three";

export function addUserDataToMesh(mesh: Mesh | Line, userData: any) {
  mesh.userData = {
    ...mesh.userData,
    ...userData,
  };
}
