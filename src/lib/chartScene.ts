import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Options, OrbitState, RadarStyle, SetData } from "@/lib/interface";
import OperateView from "@/lib/operateView";
import {
  AmbientLight,
  AxesHelper,
  Camera,
  DirectionalLight,
  Group,
  Light,
  Mesh,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  PointLight,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { updateRadarStyle } from "@/lib/figures/Radar";
import Orbit from "@/lib/figures/Orbit";
import CreateEarth from "@/lib/figures/Earth";
import MapShape from "@/lib/figures/MapShape";
import sprite from "@/lib/figures/Sprite";
import Store from "@/lib/store/store";
import EventStore from "@/lib/store/eventStore";
import { merge } from "lodash-es";
import CustomOrbitControls from "@/lib/utils/controls";
import DebugHelper from "@/lib/utils/debugHelper";
import { disposeObjectResources } from "@/lib/utils/dispose";

/**
 * ChartScene class is used to create a 3D scene using Three.js.
 * It provides methods to initialize the scene, create camera, light, helper, figures, and renderer.
 * It also provides methods to control the animation and transformation of the scene.
 */
export default class ChartScene {
  options: Options;
  initOptions: Pick<
    Options,
    "helper" | "autoRotate" | "rotateSpeed" | "mode" | "controls" | "debugHelper"
  > = {
    helper: false,
    autoRotate: true,
    rotateSpeed: 0.01,
    mode: "3d",
    controls: "custom",
    debugHelper: false,
  };
  style = {
    width: 0,
    height: 0,
  };
  light: Light;
  earthHovered: boolean = false;
  camera: Camera;
  notLockFps: () => boolean;
  mainContainer: Group;
  scene: Scene;
  renderer: WebGLRenderer;
  controls: CustomOrbitControls | OrbitControls;
  _orbitControls?: OrbitControls;
  _store: Store;
  _eventStore: EventStore;
  _OperateView: OperateView;
  animationFrameId: number | null = null;
  private readonly animateFrame = () => this.animate();
  _debugHelper: DebugHelper | null = null;

  /**
   * Constructor for the ChartScene class.
   * @param {Partial<Options>} params - The initial options for the scene.
   */
  constructor(params: Partial<Options>) {
    this._store = new Store();
    this._OperateView = new OperateView(this._store);
    this.options = {
      ...this.options,
      config: this._store.getConfig(),
    };
    this.options = merge({}, this.options, this.initOptions, params);

    this.notLockFps = this.lockFps(this.options.limitFps);
    this.init();
    this._eventStore = new EventStore(this);
  }

  /**
   * Method to register an event.
   * @param {string} eventName - The name of the event.
   * @param {(event: Event, mesh: Object3D | Group | Mesh | undefined) => void} cb - The callback function to be executed when the event is triggered.
   */
  on(
    eventName: string,
    cb: (event: Event, mesh: Object3D | Group | Mesh | undefined) => void
  ) {
    this._eventStore.registerEventMap(eventName, cb);
  }

  /**
   * Method to clear Three.js objects.
   * @param {any} obj - The Three.js object to be cleared.
   */
  clearThree(obj: any) {
    while (obj.children.length > 0) {
      this.clearThree(obj.children[0]);
      obj.remove(obj.children[0]);
    }
    disposeObjectResources(obj);
    if (obj.texture && obj.texture.dispose) obj.texture.dispose();
  }

  /**
   * Method to destroy the scene.
   */
  destroy() {
    if (this._store.animations.disposed) return;
    this._store.animations.dispose();
    this._OperateView.clearLayerState();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.clearThree(this.scene);
    this._eventStore?.destroy?.();
    this._debugHelper?.destroy();
    if (this.controls instanceof CustomOrbitControls) {
      this.controls.dispose();
    }
    this._orbitControls?.dispose();
    this._orbitControls = undefined;
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
  }

  /**
   * Method to initialize the scene.
   */
  init() {
    const {
      dom,
      cameraType = "OrthographicCamera",
      light = "DirectionalLight",
      helper = false,
    } = this.options;

    this._store.setConfig(this.options);
    this.mainContainer = this.createCube();
    this.style = dom.getBoundingClientRect();
    this.scene = this.createScene();
    if (cameraType === "OrthographicCamera") {
      this.camera = this.createOrthographicCamera();
    } else {
      this.camera = this.createCamera();
    }
    this.light = this.createLight(light);
    if (helper) {
      this.createHelper();
    }
    this.renderer = this.createRender();
    this.createCountryNamesText();
    const useCustomControls = this.options.controls === "custom";
    const allowZoom = this._store.config.enableZoom !== false;
    let obControl: OrbitControls | undefined;
    if (!useCustomControls || allowZoom) {
      obControl = new OrbitControls(this.camera, this.renderer.domElement);
      this._orbitControls = obControl;
      if (useCustomControls) {
        obControl.enableRotate = false;
        obControl.enablePan = false;
        obControl.enableZoom = true;
      } else if (!allowZoom) {
        obControl.enableZoom = false;
      }
    }
    if (useCustomControls) {
      this.controls = new CustomOrbitControls(
        this.mainContainer,
        this.renderer,
        this.options.config.earth?.dragConfig!,
        this.camera
      );
    } else {
      this.controls = obControl!;
    }
    if (this._store.mode === "2d") {
      this.addFigures2d();
    } else if (this._store.mode === "3d") {
      this.addFigures3d();
    }
    const zoom = this.options.config.zoom as number;
    this.mainContainer.scale.set(zoom, zoom, zoom);
    this.animate();
    dom.appendChild(this.renderer.domElement);
    this.initDebugHelper();
  }

  /**
   * Method to create an orthographic camera.
   * @returns {OrthographicCamera} The created orthographic camera.
   */
  createOrthographicCamera(): OrthographicCamera {
    const k = this.style.width / this.style.height;
    const s = 200;
    const camera = new OrthographicCamera(-s * k, s * k, s, -s, 1, 1500);
    camera.position.set(0, 0, 500);
    camera.lookAt(0, 0, 0);
    return camera;
  }

  /**
   * Method to create a scene.
   * @returns {Scene} The created scene.
   */
  createScene(): Scene {
    return new Scene();
  }

  /**
   * Method to create a perspective camera.
   * @returns {PerspectiveCamera} The created perspective camera.
   */
  createCamera(): PerspectiveCamera {
    const camera = new PerspectiveCamera(
      95,
      this.style.width / this.style.height,
      1,
      1500
    );
    camera.position.set(350, 350, 350);
    camera.lookAt(new Vector3(0, 0, 0));
    return camera;
  }

  /**
   * Method to create a light.
   * @param {string} lightType - The type of the light.
   */
  createLight(lightType: string) {
    const color: string = "#fff";
    if (lightType === "DirectionalLight") {
      const light = new DirectionalLight(color, 1);
      light.position.set(2000, 2000, 3000);
      light.castShadow = true;
      this.scene.add(light);
      return light;
    } else if (lightType === "AmbientLight") {
      const light = new AmbientLight(color, 1);
      this.scene.add(light);
      return light;
    } else if (lightType == "PointLight") {
      const light = new PointLight(color, 1, 100);
      light.position.set(200, 200, 40);
      this.scene.add(light);
      return light;
    } else {
      const light = new DirectionalLight(color, 1);
      light.position.set(2000, 2000, 3000);
      light.castShadow = true;
      this.scene.add(light);
      return light;
    }
  }

  /**
   * Method to create a helper.
   */
  createHelper() {
    const helper = new AxesHelper(250);
    this.scene.add(helper);
  }

  /**
   * Method to add 3D figures to the scene.
   */
  addFigures3d() {
    const groupEarth = new CreateEarth(this._store).create();
    // 如果是混合纹理或者不使用纹理
    if (
      this.options.config.texture?.mixed ||
      !this.options.config.texture?.path
    ) {
      const mapShape = new MapShape(this);
      for (const country of mapShape.create()) groupEarth.add(country);
    }
    if (this._store.config.spriteStyle.show) {
      this.mainContainer.add(sprite(this._store.getConfig()));
    }
    this.mainContainer.add(groupEarth);

    this.scene.add(this.mainContainer);
  }

  /**
   * Method to add 2D figures to the scene.
   */
  addFigures2d() {
    const mapGroup = new Group();
    mapGroup.name = "mapGroup";
    const mapShape = new MapShape(this);
    for (const country of mapShape.create()) mapGroup.add(country);
    this.mainContainer.add(mapGroup);
    this.scene.add(this.mainContainer);
  }

  /**
   * Method to create a cube.
   * @returns {Group} The created cube.
   */
  createCube(): Group {
    const obj = new Group();
    obj.name = "mainContainer";
    return obj;
  }
  addWall(): Group {
    const obj = new Group();
    obj.name = "wall";
    return obj;
  }
  /**
   * Method to create a renderer.
   * @returns {WebGLRenderer} The created renderer.
   */
  createRender(): WebGLRenderer {
    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    const pixelRatio =
      this.options.config.pixelRatio ?? window.devicePixelRatio;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(this.style.width, this.style.height);
    renderer.setClearColor(
      this.options.config.bgStyle?.color!,
      this.options.config.bgStyle?.opacity
    );
    return renderer;
  }

  /**
   * Method to limit the frames per second.
   * @param {boolean | undefined} isLimit - Whether to limit the frames per second.
   * @returns {Function} The function to check whether to render the next frame.
   */
  lockFps(isLimit: boolean = false): () => boolean {
    if (!isLimit) return () => true;
    let start: number | undefined;
    let lastFrame = 0;
    return () => {
      const now = performance.now();
      start ??= now;
      // Keep a fixed 30 Hz timeline. Allow for roundoff at an exact frame boundary.
      const frame = Math.floor((now - start) * 30 / 1000 + 1e-9);
      if (frame === lastFrame) return false;
      lastFrame = frame;
      return true;
    };
  }

  /**
   * Method to check whether to rotate the scene.
   * @returns {boolean} Whether to rotate the scene.
   */
  shouldRotate(): boolean | undefined {
    if (this.options.mode === "3d") {
      if (this.options.config.stopRotateByHover) {
        if (this.earthHovered) {
          return false;
        } else {
          return this.options.autoRotate;
        }
      } else {
        return this.options.autoRotate;
      }
    } else {
      return false;
    }
  }
  /**
   * Method to create a group for country names.
   */
  createCountryNamesText() {
    const textConfig = this.options.config.textMark;
    if (!textConfig?.data?.length) {
      return null;
    }
    return this._OperateView.addData("textMark", textConfig.data, this.mainContainer);
  }

  /**
   * Method to animate the scene.
   */
  animate() {
    const animations = this._store.animations;
    if (animations.disposed) return;
    if (this.notLockFps()) {
      animations.update();
      // A completion callback can destroy this scene during update.
      if (animations.disposed) return;
      if (this.shouldRotate()) {
        this.mainContainer.rotateY(this.options.rotateSpeed!);
      }
      this.renderer.render(this.scene, this.camera);
    }
    if (this.options.mode === "3d") {
      this.controls.update(); // 确保平滑效果
    }
    this.animationFrameId = requestAnimationFrame(this.animateFrame);
  }

  initDebugHelper() {
    if (this.options.debugHelper) {
      this._debugHelper?.destroy();
      this._debugHelper = new DebugHelper(this);
    }
  }

  setRotateSpeed(speed: number) {
    if (Number.isNaN(speed)) return;
    this.options.rotateSpeed = speed;
  }

  /**
   * Method to set data to the scene.
   * @param {K} type - The type of the data.
   * @param {SetData[K]} data - The data to be set.
   */
  setData = async <K extends keyof SetData>(type: K, data: SetData[K]) => {
    await this._OperateView.setData(type, data, this.mainContainer);
  };

  /**
   * Method to add data to the scene.
   * @param {K} type - The type of the data.
   * @param {SetData[K]} data - The data to be added.
   */
  addData = async <K extends keyof SetData>(type: K, data: SetData[K]) => {
    await this._OperateView.addData(type, data, this.mainContainer);
  };

  /** Change matching radar stations in place, preserving their current sweep angle. */
  updateRadarStyle(id: string | number, patch: Partial<RadarStyle>): boolean {
    return !this._store.animations.disposed && updateRadarStyle(this.mainContainer, id, patch);
  }

  /** Change one orbit's visibility or pause its marker at its current position. */
  setOrbitState(id: string | number, state: OrbitState): boolean {
    if (this._store.animations.disposed || !state || typeof state !== "object" ||
        (state.visible !== undefined && typeof state.visible !== "boolean") ||
        (state.paused !== undefined && typeof state.paused !== "boolean")) return false;
    const name = String(id);
    const orbit = this.mainContainer.children.find((child): child is Orbit => child instanceof Orbit && child.name === name);
    if (!orbit) return false;
    orbit.setState(state);
    return true;
  }

  /** Toggle drawing and picking for a data layer while its animation clock keeps running. */
  setLayerVisible(type: keyof SetData, visible: boolean): void {
    this._OperateView.setLayerVisible(this.mainContainer, type, visible);
  }

  /**
   * Method to remove data from the scene.
   * @param {string} type - The type of the data.
   * @param {string[] | "removeAll"} ids - The ids of the data to be removed.
   */
  remove(type: string, ids: string[] | "removeAll" = "removeAll") {
    this._OperateView.remove(this.mainContainer, type, ids);
  }
}
