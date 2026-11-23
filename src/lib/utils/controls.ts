import { Camera, Object3D, Raycaster, Renderer, Vector2, Vector3 } from "three";
import { DragConfig } from "@/lib/interface";

const worldYAxis = new Vector3(0, 1, 0);

export default class EarthController {
  private readonly domElement: HTMLCanvasElement;
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
    panSpeed: 1,
    disableX: false,
    disableY: false,
  };
  rotationVelocity: {
    x: number;
    y: number;
  };
  mouse = new Vector2();
  constructor(
    earth: Object3D,
    renderer: Renderer,
    options: Partial<DragConfig>,
    camera?: Camera,
  ) {
    this.earth = earth;
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    Object.assign(this.options, options);
    this.options.inertiaFactor > 1
      ? (this.options.inertiaFactor = 1)
      : this.options.inertiaFactor;
    this.raycaster = new Raycaster();
    if (camera) this.raycaster.camera = camera;
    this.rotationVelocity = { x: 0, y: 0 };
    this.domElement = renderer.domElement;
    this.domElement.addEventListener("mousedown", this.onMouseDown);
    this.domElement.addEventListener("mousemove", this.onMouseMove);
    this.domElement.addEventListener("mouseup", this.onMouseUp);
  }

  dispose() {
    this.domElement.removeEventListener("mousedown", this.onMouseDown);
    this.domElement.removeEventListener("mousemove", this.onMouseMove);
    this.domElement.removeEventListener("mouseup", this.onMouseUp);
    this.onMouseUp();
  }

  onMouseDown = (event: MouseEvent) => {
    this.isDragging = true;
    this.previousMousePosition.x = event.clientX;
    this.previousMousePosition.y = event.clientY;
    const view = this.domElement.ownerDocument.defaultView;
    view?.addEventListener("mouseup", this.onMouseUp, true);
    view?.addEventListener("blur", this.onMouseUp);
  };

  onMouseMove = (event: MouseEvent) => {
    if (this.isDragging) {
      const deltaX = event.clientX - this.previousMousePosition.x;
      const deltaY = event.clientY - this.previousMousePosition.y;
      if (event.ctrlKey || event.metaKey) {
        const scale = this.earth.scale?.x || 1;
        const panScale = this.options.panSpeed / scale;
        this.earth.position.x += deltaX * panScale;
        this.earth.position.y -= deltaY * panScale;
      } else {
        if (!this.options.disableY) {
          this.rotationVelocity.x = deltaY * this.options.rotationSpeed * 0.005;
        }
        if (!this.options.disableX) {
          this.rotationVelocity.y =
            deltaX * this.options.rotationSpeed * -0.005;
        }

        this.applyRotation();
      }

      this.previousMousePosition.x = event.clientX;
      this.previousMousePosition.y = event.clientY;
    }
  };

  onMouseUp = (_event?: Event) => {
    if (!this.isDragging) return;
    this.isDragging = false;
    const view = this.domElement.ownerDocument.defaultView;
    view?.removeEventListener("mouseup", this.onMouseUp, true);
    view?.removeEventListener("blur", this.onMouseUp);
  };

  isDraggingEarth(event: MouseEvent): boolean {
    const camera = this.raycaster.camera;
    if (!camera) return false;
    const { left, top, width, height } = this.domElement.getBoundingClientRect();
    if (!width || !height) return false;
    this.mouse.set(
      (event.clientX - left) / width * 2 - 1,
      1 - (event.clientY - top) / height * 2,
    );
    if (Math.abs(this.mouse.x) > 1 || Math.abs(this.mouse.y) > 1) return false;
    this.raycaster.setFromCamera(this.mouse, camera);
    return this.raycaster.intersectObject(this.earth).length > 0;
  }
  private applyRotation() {
    const { x, y } = this.rotationVelocity;
    if (y !== 0) this.earth.rotateOnWorldAxis(worldYAxis, -y);
    if (x !== 0) this.earth.rotateX(x);
  }

  update() {
    const velocity = this.rotationVelocity;
    if (this.isDragging || (velocity.x === 0 && velocity.y === 0)) return;
    this.applyRotation();
    const factor = this.options.inertiaFactor;
    velocity.x *= factor;
    velocity.y *= factor;
    // Stop once the entire remaining inertial turn is below one microradian.
    if (Math.abs(velocity.x) + Math.abs(velocity.y) < 1e-6 * (1 - Math.abs(factor))) {
      velocity.x = 0;
      velocity.y = 0;
    }
  }
}
