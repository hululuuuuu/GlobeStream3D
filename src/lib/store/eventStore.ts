import ChartScene from "@/lib/chartScene";
import { Group, Mesh, Object3D, Raycaster, Vector2 } from "three";

class EventStore {
  eventMap: Record<
    string,
    (event: Event, mesh: Object3D | Group | Mesh | undefined) => void
  > = {};
  _chartScene: ChartScene;
  constructor(chartScene: ChartScene) {
    this._chartScene = chartScene;
  }
  registerEventMap(eventName: string, cb: (params: any) => void) {
    this.eventMap[eventName] = cb;
    this._chartScene.options.dom.addEventListener(eventName, ((
      event: MouseEvent
    ) => {
      this.notification(event);
    }) as EventListener);
  }
  notification(event: MouseEvent) {
    const eventMesh = this.handleRaycaster(event);
    if (eventMesh) {
      this.eventMap[event.type](event, eventMesh);
    }
  }
  handleRaycaster(event: MouseEvent) {
    const Sx = event.clientX; //鼠标单击位置横坐标
    const Sy = event.clientY; //鼠标单击位置纵坐标
    //屏幕坐标转WebGL标准设备坐标
    const x =
      ((Sx - this._chartScene.options.dom.offsetLeft) /
        this._chartScene.options.dom.clientWidth) *
        2 -
      1; //WebGL标准设备横坐标
    const y =
      -(
        (Sy - this._chartScene.options.dom.offsetTop) /
        this._chartScene.options.dom.clientHeight
      ) *
        2 +
      1; //WebGL标准设备纵坐标
    const raycaster = new Raycaster();
    raycaster.setFromCamera(new Vector2(x, y), this._chartScene.camera);
    const intersects = raycaster.intersectObjects(
      this._chartScene.scene.children,
      true
    );
    if (intersects.length > 0) {
      // if(intersects[0].object.isTransformControls)
      return intersects[0].object;
    }
  }
}
export default EventStore;
