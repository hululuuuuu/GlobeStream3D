import Store from "@/lib/store/store";
import {
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Vector3,
} from "three";
import { lon2xyz } from "@/lib/utils/math";
import { LessCoordinate, TextMarkItem, TextStyle } from "@/lib/interface";

const DEFAULT_TEXT_STYLE: TextStyle = {
  fontSize: 20,
  color: "#fff",
};

export default class TextMark {
  private readonly _store: Store;

  constructor(store: Store) {
    this._store = store;
  }

  create(data: TextMarkItem): Group {
    const config = this._store.getConfig();
    const style = this.mergeStyle(config.textMark?.style, data.style);
    const { texture, width, height } = this.createTexture(data.text, style);

    const baseSize = config.R * 0.2;
    const planeWidth = baseSize * (width / 100);
    const planeHeight = baseSize * (height / 100);
    const geometry = new PlaneGeometry(planeWidth, planeHeight);
    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });

    const textMesh = new Mesh(geometry, material);
    const position = this.toVector3(config.R, data.position);
    const { x, y, z } = position;

    if (this._store.mode === "3d") {
      textMesh.position.set(x, y, z * 1.01);
      this.alignToSurface(textMesh, position);
    } else {
      textMesh.position.set(x, y, z);
    }

    textMesh.userData = {
      ...data,
      style,
      type: "text",
    };

    const group = new Group();
    group.add(textMesh);
    const name = data.id ?? `${data.position.lon}-${data.position.lat}-${data.text}`;
    group.name = name.toString();
    group.userData.figureType = "textMark";

    return group;
  }

  private mergeStyle(
    commonStyle?: TextStyle,
    override?: Partial<TextStyle>
  ): TextStyle {
    return {
      fontSize: override?.fontSize ?? commonStyle?.fontSize ?? DEFAULT_TEXT_STYLE.fontSize,
      color: override?.color ?? commonStyle?.color ?? DEFAULT_TEXT_STYLE.color,
    };
  }

  private createTexture(text: string, style: TextStyle): {
    texture: CanvasTexture;
    width: number;
    height: number;
  } {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;

    context.font = `${style.fontSize}px Arial`;
    const textMetrics = context.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = style.fontSize * 1.5;

    canvas.width = Math.ceil(textWidth + 20);
    canvas.height = Math.ceil(textHeight + 10);

    context.font = `${style.fontSize}px Arial`;
    context.fillStyle = style.color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new CanvasTexture(canvas);

    return { texture, width: canvas.width, height: canvas.height };
  }

  private toVector3(R: number, position: LessCoordinate): Vector3 {
    if (this._store.mode === "3d") {
      const { x, y, z } = lon2xyz(R, position.lon, position.lat, 1.01);
      return new Vector3(x, y, z);
    }
    return new Vector3(position.lon, position.lat, 0.1);
  }

  private alignToSurface(mesh: Mesh, position: Vector3): void {
    const meshNormal = new Vector3(0, 0, 1);
    const coordVec3 = position.clone().normalize();
    mesh.quaternion.setFromUnitVectors(meshNormal, coordVec3);

    const lookAtVector = position.clone().normalize();
    mesh.lookAt(lookAtVector);
    mesh.rotateY(Math.PI);
  }
}
