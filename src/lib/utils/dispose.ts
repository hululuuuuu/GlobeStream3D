import type { BufferGeometry, Material, Object3D, Texture } from "three";

// Textures created for one figure follow that object even if its material is replaced.
// Shared marker textures are intentionally never registered here.
const ownedTextures = new WeakMap<Object3D, Texture>();

export function ownTexture(owner: Object3D, texture: Texture) {
  ownedTextures.set(owner, texture);
}

export function disposeObjectResources(object: Object3D) {
  const node = object as Object3D & {
    geometry?: BufferGeometry;
    material?: Material | Material[];
    isSprite?: boolean;
  };
  // Three.js sprites all use the same built-in geometry.
  if (!node.isSprite) node.geometry?.dispose();
  if (Array.isArray(node.material)) {
    node.material.forEach(material => material.dispose());
  } else {
    node.material?.dispose();
  }
  const texture = ownedTextures.get(node);
  if (texture) {
    ownedTextures.delete(node);
    texture.dispose();
  }
}
