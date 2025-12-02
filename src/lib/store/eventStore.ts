import ChartScene from "@/lib/chartScene";
import {
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Raycaster,
  Vector2,
} from "three";

class EventStore {
  eventMap: Record<
    string,
    (event: Event, mesh: Object3D | Group | Mesh | undefined) => void
  > = {};
  buildInEventMap: Record<
    string,
    (event: Event, mesh: Object3D | Group | Mesh | undefined) => void
  > = {};
  _chartScene: ChartScene;
  currentMesh: Mesh | null;
  areaColorNeedChange: boolean | undefined = false;
  raycaster: Raycaster;
  listeners: { event: string; handler: EventListener }[] = [];
  constructor(chartScene: ChartScene) {
    this._chartScene = chartScene;
    this.raycaster = new Raycaster();
    //需要hover事件
    this.areaColorNeedChange =
      this._chartScene.options.config &&
      this._chartScene.options.config.hoverRegionStyle &&
      this._chartScene.options.config.hoverRegionStyle.show;
    this.registerBuildInEventMap("mousemove", () => {
      if (this.areaColorNeedChange) {
        if (this.currentMesh) {
          (this.currentMesh.material as MeshBasicMaterial).color.set(
            this.currentMesh.userData.backupColor
          );
          (this.currentMesh.material as MeshBasicMaterial).opacity =
            this.currentMesh.userData.opacity;
        }
      }
    });
  }
  registerEventMap(
    eventName: string,
    cb: (event: Event, mesh: Object3D | Group | Mesh | undefined) => void
  ) {
    this.eventMap[eventName] = cb;
    const handler = ((event: MouseEvent) => {
      this.notification(event);
    }) as EventListener;
    this.listeners.push({ event: eventName, handler });
    this._chartScene.options.dom.addEventListener(eventName, handler);
  }
  registerBuildInEventMap(eventName: string, cb: () => void) {
    const handler = ((event: MouseEvent) => {
      const eventMesh = this.handleRaycaster(event);
      //说明hover的是地球
      if (eventMesh && eventMesh.type !== "TransformControlsPlane") {
        this._chartScene.earthHovered = true;
      } else {
        this._chartScene.earthHovered = false;
      }
      cb();
      if (
        eventMesh &&
        eventMesh.userData.type === "country" &&
        this.areaColorNeedChange
      ) {
        this.buildInEventMap[eventName] = cb;

        this.currentMesh = eventMesh;
        (this.currentMesh.material as MeshBasicMaterial).color.set(
          this._chartScene.options.config!.hoverRegionStyle!.areaColor!
        );

        (this.currentMesh.material as MeshBasicMaterial).opacity =
          this._chartScene.options.config!.hoverRegionStyle!.opacity!;
      } else {
        this.currentMesh = null;
      }
    }) as EventListener;
    this.listeners.push({ event: eventName, handler });
    this._chartScene.options.dom.addEventListener(eventName, handler);
  }
  notification(event: MouseEvent) {
    const eventMesh = this.handleRaycaster(event);
    if (eventMesh) {
      this.eventMap[event.type](event, eventMesh);
    }
  }
  getMousePosition(event: MouseEvent) {
    const rect = this._chartScene.renderer.domElement.getBoundingClientRect();
    return {
      clientX: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      clientY: -((event.clientY - rect.top) / rect.height) * 2 + 1,
    };
  }
  handleRaycaster(event: MouseEvent) {
    const mouse = this.getMousePosition(event);
    const Sx = mouse.clientX; //鼠标单击位置横坐标
    const Sy = mouse.clientY; //鼠标单击位置纵坐标
    //屏幕坐标转WebGL标准设备坐标
    this.raycaster.setFromCamera(new Vector2(Sx, Sy), this._chartScene.camera);
    const intersects = this.raycaster.intersectObjects(
      this._chartScene.scene.children,
      true
    );
    if (intersects.length > 0) {
      // if(intersects[0].object.isTransformControls)
      return intersects[0].object as Mesh;
    }
  }
  destroy() {
    this.listeners.forEach(({ event, handler }) => {
      this._chartScene.options.dom.removeEventListener(event, handler);
    });
    this.listeners = [];
    this.eventMap = {};
    this.buildInEventMap = {};
    this.currentMesh = null;
  }
}
export default EventStore;
