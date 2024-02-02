import { Object3D, Raycaster, Renderer, Vector2, Vector3 } from "three";
import { DragConfig } from "@/lib/interface";

export default class EarthController {
  earth: Object3D;
  isDragging: boolean;
  previousMousePosition: {
    x: number;
    y: number;
  };
  raycaster: Raycaster;
  options: DragConfig = {
    rotationSpeed: 1,
    inertiaFactor: 0.95,
    disableX: false,
    disableY: false,
  };
  rotationVelocity: {
    x: number;
    y: number;
  };
  mouse: Vector2;
  constructor(
    earth: Object3D,
    renderer: Renderer,
    options: Partial<DragConfig>
  ) {
    this.earth = earth;
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    Object.assign(this.options, options);
    this.options.inertiaFactor > 1
      ? (this.options.inertiaFactor = 1)
      : this.options.inertiaFactor;
    this.raycaster = new Raycaster();
    this.rotationVelocity = { x: 0, y: 0 };
    renderer.domElement.addEventListener(
      "mousedown",
      this.onMouseDown.bind(this),
      false
    );
    renderer.domElement.addEventListener(
      "mousemove",
      this.onMouseMove.bind(this),
      false
    );
    renderer.domElement.addEventListener(
      "mouseup",
      this.onMouseUp.bind(this),
      false
    );
  }

  onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.previousMousePosition.x = event.clientX;
    this.previousMousePosition.y = event.clientY;
  }

  onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      const deltaX = event.clientX - this.previousMousePosition.x;
      const deltaY = event.clientY - this.previousMousePosition.y;
      if (!this.options.disableY) {
        this.rotationVelocity.x = deltaY * this.options.rotationSpeed * 0.005;
      }
      if (!this.options.disableX) {
        this.rotationVelocity.y = deltaX * this.options.rotationSpeed * -0.005;
      }

      this.earth.rotateOnWorldAxis(
        new Vector3(0, 1, 0),
        -this.rotationVelocity.y
      );
      this.earth.rotateX(this.rotationVelocity.x);

      this.previousMousePosition.x = event.clientX;
      this.previousMousePosition.y = event.clientY;
    }
  }

  onMouseUp(event: MouseEvent) {
    this.isDragging = false;
  }

  // todo
  isDraggingEarth(event: MouseEvent) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // 更新射线与摄像机和鼠标位置
    // raycaster.setFromCamera(this.mouse, camera);

    // 检查射线与地球的交点
    const intersects = this.raycaster.intersectObject(this.earth);
    return intersects.length > 0;
  }
  update() {
    if (!this.isDragging) {
      this.earth.rotateOnWorldAxis(
        new Vector3(0, 1, 0),
        -this.rotationVelocity.y
      );
      this.earth.rotateX(this.rotationVelocity.x);
      this.rotationVelocity.x *= this.options.inertiaFactor;
      this.rotationVelocity.y *= this.options.inertiaFactor;
    }
  }
}
