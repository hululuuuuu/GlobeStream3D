import ChartScene from "@/lib/chartScene";
import {
  Color,
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
  currentColor: Color;
  areaColorNeedChange: boolean | undefined = false;
  constructor(chartScene: ChartScene) {
    this._chartScene = chartScene;
    //需要hover事件
    this.areaColorNeedChange =
      this._chartScene.options.config &&
      this._chartScene.options.config.hoverRegionStyle &&
      Object.keys(this._chartScene.options.config?.hoverRegionStyle).length > 0;
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
    this._chartScene.options.dom.addEventListener(eventName, ((
      event: MouseEvent
    ) => {
      this.notification(event);
    }) as EventListener);
  }
  registerBuildInEventMap(eventName: string, cb: () => void) {
    this._chartScene.options.dom.addEventListener(eventName, ((
      event: MouseEvent
    ) => {
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
    }) as EventListener);
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
    const raycaster = new Raycaster();
    raycaster.setFromCamera(new Vector2(Sx, Sy), this._chartScene.camera);
    const intersects = raycaster.intersectObjects(
      this._chartScene.scene.children,
      true
    );
    if (intersects.length > 0) {
      // if(intersects[0].object.isTransformControls)
      return intersects[0].object as Mesh;
    }
  }
}
export default EventStore;
