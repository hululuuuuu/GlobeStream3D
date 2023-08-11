import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Options, SetData } from "@/lib/interface";
import OperateView from "@/lib/operateView";
import {
  AmbientLight,
  AxesHelper,
  Camera,
  Clock,
  DirectionalLight,
  Group,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  PointLight,
  Renderer,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import CreateEarth from "@/lib/figures/Earth";
import MapShape from "@/lib/figures/MapShape";
import sprite from "@/lib/figures/Sprite";
import { update as tweenUpdate } from "@tweenjs/tween.js";
import Store from "@/lib/store/store";
import EventStore from "@/lib/store/eventStore";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import { merge } from "lodash";

export default class ChartScene {
  options: Options;
  initOptions: Pick<Options, "helper" | "autoRotate" | "rotateSpeed" | "mode"> =
    {
      helper: false,
      autoRotate: true,
      rotateSpeed: 0.01,
      mode: "3d",
    };
  style = {
    width: 0,
    height: 0,
  };
  earthHovered: boolean = false;
  camera: Camera;
  isPass: Function;
  mainContainer: Object3D;
  scene: Scene;
  renderer: Renderer;
  _store = new Store();
  _eventStore: EventStore;
  _OperateView = new OperateView(this._store);
  constructor(params: Partial<Options>) {
    this.options = {
      ...this.options,
      config: this._store.config,
    };
    merge(this.options, this.initOptions, params);
    this.isPass = this.limitFPS(true);
    this.init();
    this._eventStore = new EventStore(this);
  }
  on(eventName: string, cb: (params: any) => void) {
    this._eventStore.registerEventMap(eventName, cb);
  }
  init() {
    const {
      dom,
      cameraType = "OrthographicCamera",
      light = "DirectionalLight",
      helper = false,
      map = "world",
      config,
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
    this.createLight(light);
    if (helper) {
      this.createHelper();
    }
    //添加组件
    this.renderer = this.createRender();
    this.animate();
    if (this._store.mode === "2d") {
      this.addFigures2d();
    } else if (this._store.mode === "3d") {
      this.addFigures3d();
    }
    //设置控制器
    const obControl = new OrbitControls(this.camera, this.renderer.domElement);
    if (this._store.mode === "3d") {
      obControl.enableRotate = false;
      obControl.enablePan = false;
    }
    dom.appendChild(this.renderer.domElement);
  }
  createOrthographicCamera() {
    const k = this.style.width / this.style.height;
    const s = 200;
    const camera = new OrthographicCamera(-s * k, s * k, s, -s, 1, 1500);
    camera.position.set(0, 0, 500); //沿着z轴观察
    camera.lookAt(0, 0, 0); //相机指向Three.js坐标系原点
    return camera;
  }
  createScene() {
    return new Scene();
  }
  createCamera() {
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
  createLight(lightType: string) {
    const color: string = "#fff";
    if (lightType === "DirectionalLight") {
      const light = new DirectionalLight(color, 1);
      // 设置光源位置
      light.position.set(2000, 2000, 3000);
      // 设置用于计算阴影的光源对象
      light.castShadow = true;
      this.scene.add(light);
    } else if (lightType === "AmbientLight") {
      const light = new AmbientLight(color, 1);
      this.scene.add(light);
    } else if (lightType == "PointLight") {
      const light = new PointLight(color, 1, 100);
      light.position.set(200, 200, 40);
      this.scene.add(light);
    }
  }
  createHelper() {
    const helper = new AxesHelper(250);
    // const h = new DirectionalLightHelper(scene);
    this.scene.add(helper);
  }
  addFigures3d() {
    const groupEarth = new CreateEarth(this._store).create();
    //如果非贴图 则正常加载地图文件
    if (!this.options.config.texture) {
      const mapShape = new MapShape(this);
      groupEarth.add(...mapShape.create());
    }
    this.mainContainer.add(groupEarth, sprite(this._store.config));
    this.scene.add(this.mainContainer);
    this.transformControl();
  }
  addFigures2d() {
    const mapGroup = new Group();
    mapGroup.name = "mapGroup";
    const mapShape = new MapShape(this);
    mapGroup.add(...mapShape.create());
    this.mainContainer.add(mapGroup);
    this.scene.add(this.mainContainer);
  }
  createCube() {
    const obj = new Group();
    obj.name = "mainContainer";
    return obj;
  }
  createRender() {
    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(this.style.width, this.style.height);
    renderer.setClearColor(this.options.config.bgColor!, 1);
    return renderer;
  }
  //限制帧数
  limitFPS(isLimit: boolean) {
    // 创建一个时钟对象Clock
    const clock = new Clock();
    // 设置渲染频率为30FBS，也就是每秒调用渲染器render方法大约30次
    const FPS = 30;
    const renderT = 1 / FPS; //单位秒  间隔多长时间渲染渲染一次
    // 声明一个变量表示render()函数被多次调用累积时间
    // 如果执行一次renderer.render，timeS重新置0
    let timeS = 0;
    return function () {
      if (isLimit) return true;
      const T = clock.getDelta();
      timeS = timeS + T;
      if (timeS > renderT) {
        timeS = 0;
        return true;
      }
    };
  }
  shouldRotate() {
    if (this.options.mode === "3d") {
      //hover停止旋转
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
  animate() {
    if (this.isPass()) {
      tweenUpdate();
      if (this.shouldRotate()) {
        this.mainContainer.rotateY(this.options.rotateSpeed!);
      }
      this.renderer.render(this.scene, this.camera);
    }
    requestAnimationFrame(() => {
      this.animate();
    });
  }
  setData = async <K extends keyof SetData>(type: K, data: SetData[K]) => {
    try {
      // this._OperateView.remove(this.mainContainer, type, "removeAll");
      const group = await this._OperateView.setData(type, data);
      this.mainContainer.add(...group);
    } catch (e) {
      console.log(e);
    }
  };
  addData = async <K extends keyof SetData>(type: K, data: SetData[K]) => {
    try {
      const group = await this._OperateView.setData(type, data);
      this.mainContainer.add(...group);
    } catch (e) {
      console.log(e);
    }
  };
  remove(type: string, ids: string[] | "removeAll" = "removeAll") {
    this._OperateView.remove(this.mainContainer, type, ids);
  }
  transformControl() {
    const controls = new TransformControls(
      this.camera,
      this.renderer.domElement
    );
    controls.attach(this.mainContainer);
    controls.setMode("rotate");
    controls.showX = false;
    controls.axis = null;
    controls.showZ = false;
    controls.size = 2;
    controls.visible = false;
    this.scene.add(controls);
  }
}
