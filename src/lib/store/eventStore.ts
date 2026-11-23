import type ChartScene from "@/lib/chartScene";
import { Intersection, Mesh, MeshBasicMaterial, Object3D, Raycaster, Vector2 } from "three";

type ChartListener = (event: Event, mesh: Object3D | undefined) => void;

export default class EventStore {
  private readonly callbacks = new Map<string, ChartListener>();
  private readonly events = new Set<string>();
  private readonly pointer = new Vector2();
  private readonly hits: Intersection[] = [];
  private currentMesh?: Mesh;
  readonly raycaster = new Raycaster();

  constructor(private readonly chart: ChartScene) {
    this.listen("mousemove");
    this.listen("mouseleave");
  }

  private listen(name: string) {
    if (this.events.has(name)) return;
    this.chart.options.dom.addEventListener(name, this.dispatch);
    this.events.add(name);
  }

  registerEventMap(name: string, callback: ChartListener) {
    if (this.chart._store.animations.disposed) return;
    this.callbacks.set(name, callback);
    this.listen(name);
  }

  private dispatch = (event: Event) => {
    const { config, dom } = this.chart.options;
    const canvas = this.chart.renderer.domElement;
    if (event.target !== dom && event.target !== canvas) return;

    const callback = this.callbacks.get(event.type);
    if (event.type === "mouseleave") {
      this.chart.earthHovered = false;
      this.clearRegionHover();
    }
    const trackHover = event.type === "mousemove" &&
      (config.hoverRegionStyle?.show || config.stopRotateByHover);
    if (!callback && !trackHover) {
      if (event.type === "mousemove") {
        this.chart.earthHovered = false;
        this.clearRegionHover();
      }
      return;
    }

    const hit = this.handleRaycaster(event as MouseEvent);
    if (event.type === "mousemove") {
      this.chart.earthHovered = !!hit && hit.type !== "TransformControlsPlane";
      const country = config.hoverRegionStyle?.show && hit?.userData.type === "country"
        ? hit as Mesh : undefined;
      if (country !== this.currentMesh) this.clearRegionHover();
      if (country) {
        const material = country.material as MeshBasicMaterial;
        const style = config.hoverRegionStyle!;
        if (style.areaColor !== undefined) material.color.set(style.areaColor);
        if (style.opacity !== undefined) {
          material.opacity = style.opacity;
          material.transparent = style.opacity < 1;
        }
        this.currentMesh = country;
      }
    }
    if (hit) callback?.(event, hit);
  };

  clearRegionHover() {
    if (!this.currentMesh) return;
    const material = this.currentMesh.material as MeshBasicMaterial;
    const { backupColor, opacity } = this.currentMesh.userData;
    material.color.set(backupColor);
    material.opacity = opacity;
    material.transparent = opacity < 1;
    this.currentMesh = undefined;
  }

  private intersectVisible = (object: Object3D) => {
    if (object.layers.test(this.raycaster.layers)) object.raycast(this.raycaster, this.hits);
  };

  handleRaycaster(event: MouseEvent) {
    const rect = this.chart.renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.pointer.set(
      (event.clientX - rect.left) / rect.width * 2 - 1,
      1 - (event.clientY - rect.top) / rect.height * 2
    );
    this.raycaster.setFromCamera(this.pointer, this.chart.camera);
    this.chart.scene.traverseVisible(this.intersectVisible);
    let nearest: Intersection | undefined;
    for (const hit of this.hits) {
      if (!nearest || hit.distance < nearest.distance) nearest = hit;
    }
    this.hits.length = 0;
    return nearest?.object;
  }

  destroy() {
    for (const event of this.events) this.chart.options.dom.removeEventListener(event, this.dispatch);
    this.events.clear();
    this.callbacks.clear();
    this.currentMesh = undefined;
  }
}
