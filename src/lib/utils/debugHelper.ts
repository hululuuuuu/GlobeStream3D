import type ChartScene from "@/lib/chartScene";
import {
  Color,
  Line,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshMatcapMaterial,
  MeshNormalMaterial,
  MeshPhongMaterial,
  Sprite,
} from "three";

type ControlConfig = {
  label: string;
  type: "color" | "checkbox" | "range" | "number" | "select";
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
  value: string | number | boolean;
  onChange: (value: any) => void;
};

/**
 * Lightweight in-page helper panel for tweaking runtime options.
 * Intended for dev/debug use only and guarded by a config flag.
 */
export default class DebugHelper {
  chart: ChartScene;
  panel: HTMLDivElement;
  controlsContainer: HTMLDivElement;
  dragState: {
    isDragging: boolean;
    offsetX: number;
    offsetY: number;
  } = { isDragging: false, offsetX: 0, offsetY: 0 };

  constructor(chart: ChartScene) {
    this.chart = chart;
    this.panel = document.createElement("div");
    this.panel.style.position = "absolute";
    this.panel.style.top = "12px";
    this.panel.style.right = "12px";
    this.panel.style.width = "260px";
    this.panel.style.maxHeight = "none";
    this.panel.style.overflow = "visible";
    this.panel.style.padding = "12px";
    this.panel.style.background = "rgba(0,0,0,0.65)";
    this.panel.style.color = "#fff";
    this.panel.style.fontSize = "12px";
    this.panel.style.lineHeight = "1.4";
    this.panel.style.borderRadius = "8px";
    this.panel.style.backdropFilter = "blur(6px)";
    this.panel.style.zIndex = "9999";
    this.panel.style.boxShadow = "0 6px 24px rgba(0,0,0,0.35)";
    const header = document.createElement("div");
    header.textContent = "Debug Helper";
    header.style.fontWeight = "600";
    header.style.marginBottom = "6px";
    header.style.cursor = "grab";

    this.controlsContainer = document.createElement("div");
    this.panel.appendChild(header);
    this.panel.appendChild(this.controlsContainer);

    this.buildControls();
    const mountTarget =
      this.chart.options.dom.parentElement || this.chart.options.dom;
    mountTarget.style.position = mountTarget.style.position || "relative";
    mountTarget.appendChild(this.panel);
    this.enableDrag(header);
  }

  enableDrag(handle: HTMLElement) {
    const onMouseDown = (e: MouseEvent) => {
      this.dragState.isDragging = true;
      handle.style.cursor = "grabbing";
      const rect = this.panel.getBoundingClientRect();
      this.panel.style.position = "fixed";
      this.panel.style.right = "auto";
      this.panel.style.left = `${rect.left}px`;
      this.panel.style.top = `${rect.top}px`;
      this.dragState.offsetX = e.clientX - rect.left;
      this.dragState.offsetY = e.clientY - rect.top;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!this.dragState.isDragging) return;
      const left = e.clientX - this.dragState.offsetX;
      const top = e.clientY - this.dragState.offsetY;
      this.panel.style.left = `${left}px`;
      this.panel.style.top = `${top}px`;
    };

    const onMouseUp = () => {
      this.dragState.isDragging = false;
      handle.style.cursor = "grab";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    handle.addEventListener("mousedown", onMouseDown);
  }

  buildControls() {
    const cfg = this.chart._store.getConfig();
    const defaultRotateSpeed =
      this.chart.initOptions.rotateSpeed !== undefined
        ? this.chart.initOptions.rotateSpeed
        : 0.01;
    const controls: ControlConfig[] = [
      {
        label: "Auto Rotate",
        type: "checkbox",
        value: this.chart.options.autoRotate ?? true,
        onChange: (checked: boolean) => {
          this.chart.options.autoRotate = checked;
          this.syncOptionsConfig();
        },
      },
      {
        label: "停悬停止旋转",
        type: "checkbox",
        value: cfg.stopRotateByHover,
        onChange: (checked: boolean) => {
          cfg.stopRotateByHover = checked;
          this.syncOptionsConfig();
          if (this.chart._eventStore) {
            this.chart._eventStore.areaColorNeedChange = checked;
          }
        },
      },
      {
        label: "启用缩放",
        type: "checkbox",
        value: cfg.enableZoom ?? true,
        onChange: (checked: boolean) => {
          cfg.enableZoom = checked;
          const controls = this.chart.controls as any;
          if (controls && "enableZoom" in controls) {
            controls.enableZoom = checked;
          }
          this.syncOptionsConfig();
        },
      },
      {
        label: "Rotate Speed",
        type: "range",
        min: -0.1,
        max: 0.1,
        step: 0.001,
        value: defaultRotateSpeed,
        onChange: (value: number) => {
          this.chart.setRotateSpeed(value);
          this.syncOptionsConfig();
        },
      },
      {
        label: "Earth Material",
        type: "select",
        value: cfg.earth.material || "MeshPhongMaterial",
        options: [
          { label: "Phong", value: "MeshPhongMaterial" },
          { label: "Basic", value: "MeshBasicMaterial" },
          { label: "Lambert", value: "MeshLambertMaterial" },
          { label: "Matcap", value: "MeshMatcapMaterial" },
          { label: "Normal", value: "MeshNormalMaterial" },
        ],
        onChange: (val: string) => {
          cfg.earth.material = val as any;
          this.updateEarthMaterial(val);
          this.syncOptionsConfig();
        },
      },
      {
        label: "Background",
        type: "color",
        value: cfg.bgStyle.color as string,
        onChange: (color: string) => {
          cfg.bgStyle.color = color;
          this.chart.renderer.setClearColor(color, cfg.bgStyle.opacity);
          this.syncOptionsConfig();
        },
      },
      {
        label: "背景透明度",
        type: "range",
        min: 0,
        max: 1,
        step: 0.05,
        value: cfg.bgStyle.opacity ?? 1,
        onChange: (val: number) => {
          cfg.bgStyle.opacity = val;
          this.chart.renderer.setClearColor(cfg.bgStyle.color as string, val);
          this.syncOptionsConfig();
        },
      },
      {
        label: "Earth Color",
        type: "color",
        value: cfg.earth.color as string,
        onChange: (color: string) => {
          cfg.earth.color = color;
          this.updateEarthColor(color);
          this.syncOptionsConfig();
        },
      },
      {
        label: "精灵光圈",
        type: "checkbox",
        value: cfg.spriteStyle.show ?? true,
        onChange: (checked: boolean) => {
          cfg.spriteStyle.show = checked;
          this.updateSpriteVisibility(checked);
          this.syncOptionsConfig();
        },
      },
      {
        label: "光圈尺寸",
        type: "number",
        min: 0.5,
        max: 6,
        step: 0.1,
        value: cfg.spriteStyle.size ?? 3,
        onChange: (val: number) => {
          cfg.spriteStyle.size = val;
          this.updateSpriteSize(val);
          this.syncOptionsConfig();
        },
      },
      {
        label: "Map Fill",
        type: "color",
        value: cfg.mapStyle.areaColor as string,
        onChange: (color: string) => {
          cfg.mapStyle.areaColor = color;
          this.updateCountryAreaColor(color);
          this.syncOptionsConfig();
        },
      },
      {
        label: "Map 透明度",
        type: "range",
        min: 0.1,
        max: 1,
        step: 0.05,
        value: cfg.mapStyle.opacity ?? 1,
        onChange: (val: number) => {
          cfg.mapStyle.opacity = val;
          this.updateCountryOpacity(val);
          this.syncOptionsConfig();
        },
      },
      {
        label: "Map Border",
        type: "color",
        value: cfg.mapStyle.lineColor as string,
        onChange: (color: string) => {
          cfg.mapStyle.lineColor = color;
          this.updateCountryLineColor(color);
          this.syncOptionsConfig();
        },
      },
      {
        label: "Sprite Color",
        type: "color",
        value: cfg.spriteStyle.color as string,
        onChange: (color: string) => {
          cfg.spriteStyle.color = color;
          this.updateSpriteColor(color);
          this.syncOptionsConfig();
        },
      },
      {
        label: "Fly Path Color",
        type: "color",
        value: cfg.pathStyle.color as string,
        onChange: (color: string) => {
          cfg.pathStyle.color = color;
          this.updatePathColor(color);
          this.syncOptionsConfig();
        },
      },
      {
        label: "飞行路径显示",
        type: "checkbox",
        value: cfg.pathStyle.show ?? true,
        onChange: (checked: boolean) => {
          cfg.pathStyle.show = checked;
          this.updatePathVisibility(checked);
          this.syncOptionsConfig();
        },
      },
      {
        label: "Fly Head Color",
        type: "color",
        value: cfg.flyLineStyle.color as string,
        onChange: (color: string) => {
          cfg.flyLineStyle.color = color;
          this.syncOptionsConfig();
        },
      },
      {
        label: "Scatter Color",
        type: "color",
        value: cfg.scatterStyle.color as string,
        onChange: (color: string) => {
          cfg.scatterStyle.color = color;
          this.updateScatterColor(color);
          this.syncOptionsConfig();
        },
      },
      {
        label: "Scatter Size",
        type: "number",
        min: 0.2,
        max: 5,
        step: 0.1,
        value: cfg.scatterStyle.size ?? 1,
        onChange: (val: number) => {
          cfg.scatterStyle.size = val;
          this.updateScatterSize(val);
          this.syncOptionsConfig();
        },
      },
      {
        label: "Hover 显示",
        type: "checkbox",
        value: cfg.hoverRegionStyle?.show ?? true,
        onChange: (checked: boolean) => {
          cfg.hoverRegionStyle = { ...(cfg.hoverRegionStyle || {}), show: checked };
          if (this.chart._eventStore) {
            this.chart._eventStore.areaColorNeedChange = checked;
          }
          this.syncOptionsConfig();
        },
      },
      {
        label: "Hover 颜色",
        type: "color",
        value: (cfg.hoverRegionStyle?.areaColor as string) ?? "#cd79ff",
        onChange: (color: string) => {
          cfg.hoverRegionStyle = { ...(cfg.hoverRegionStyle || {}), areaColor: color };
          this.syncOptionsConfig();
        },
      },
      {
        label: "Hover 透明度",
        type: "range",
        min: 0.1,
        max: 1,
        step: 0.05,
        value: cfg.hoverRegionStyle?.opacity ?? 1,
        onChange: (val: number) => {
          cfg.hoverRegionStyle = { ...(cfg.hoverRegionStyle || {}), opacity: val };
          this.syncOptionsConfig();
        },
      },
      {
        label: "Pixel Ratio",
        type: "number",
        min: 0.5,
        max: 3,
        step: 0.1,
        value: cfg.pixelRatio ?? window.devicePixelRatio,
        onChange: (value: number) => {
          cfg.pixelRatio = value;
          this.chart.renderer.setPixelRatio(value);
          this.syncOptionsConfig();
        },
      },
    ];

    controls.forEach((control) => this.addControl(control));

    const exportBtn = document.createElement("button");
    exportBtn.textContent = "复制当前配置";
    exportBtn.style.width = "100%";
    exportBtn.style.marginTop = "8px";
    exportBtn.style.padding = "6px";
    exportBtn.style.border = "none";
    exportBtn.style.borderRadius = "6px";
    exportBtn.style.cursor = "pointer";
    exportBtn.style.background = "#3b82f6";
    exportBtn.style.color = "#fff";
    exportBtn.onclick = () => {
      const data = JSON.stringify(this.chart._store.getConfig(), null, 2);
      navigator.clipboard?.writeText(data);
    };
    this.controlsContainer.appendChild(exportBtn);
  }

  addControl(control: ControlConfig) {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "space-between";
    wrapper.style.marginBottom = "8px";
    const label = document.createElement("label");
    label.textContent = control.label;
    label.style.marginRight = "8px";
    label.style.flex = "1 1 auto";
    let inputEl: HTMLInputElement | HTMLSelectElement;

    if (control.type === "select") {
      const select = document.createElement("select");
      select.style.flex = "0 0 130px";
      control.options?.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.label;
        if (opt.value === control.value) option.selected = true;
        select.appendChild(option);
      });
      select.onchange = (e: Event) => {
        const target = e.target as HTMLSelectElement;
        control.onChange(target.value);
      };
      inputEl = select;
    } else {
      const input = document.createElement("input");
      input.type = control.type;
      if (control.type === "color") {
        input.value = control.value as string;
      } else if (control.type === "checkbox") {
        input.checked = Boolean(control.value);
      } else {
        const numericValue =
          typeof control.value === "number"
            ? control.value
            : Number(control.value);
        if (control.min !== undefined) input.min = String(control.min);
        if (control.max !== undefined) input.max = String(control.max);
        if (control.step !== undefined) input.step = String(control.step);
        input.value = numericValue.toString();
        input.valueAsNumber = numericValue;
      }
      input.style.flex = "0 0 110px";
      input.oninput = (e: Event) => {
        const target = e.target as HTMLInputElement;
        let val: any = target.value;
        if (control.type === "checkbox") {
          val = target.checked;
        } else if (control.type === "number" || control.type === "range") {
          val = Number(target.value);
        }
        control.onChange(val);
      };
      inputEl = input;
    }

    wrapper.appendChild(label);
    wrapper.appendChild(inputEl);
    this.controlsContainer.appendChild(wrapper);
  }

  updateEarthColor(color: string) {
    const earth = this.chart.scene.getObjectByName("earthMesh") as Mesh | null;
    if (earth && (earth.material as any).color) {
      ((earth.material as any).color as Color).set(color);
      (earth.material as any).needsUpdate = true;
    }
  }

  updateCountryAreaColor(color: string) {
    this.chart.scene.traverse((obj) => {
      if (obj instanceof Mesh && obj.userData.type === "country") {
        const material = obj.material as any;
        if (material.color) {
          (material.color as Color).set(color);
          material.needsUpdate = true;
        }
      }
    });
  }

  updateCountryLineColor(color: string) {
    this.chart.scene.traverse((obj) => {
      if (obj instanceof LineLoop || obj instanceof Line) {
        const material = obj.material as any;
        if (material.color) {
          material.color.set(color);
          material.needsUpdate = true;
        }
      }
    });
  }

  updateCountryOpacity(opacity: number) {
    this.chart.scene.traverse((obj) => {
      if (obj instanceof Mesh && obj.userData.type === "country") {
        const material = obj.material as any;
        material.transparent = opacity < 1;
        material.opacity = opacity;
        material.needsUpdate = true;
      }
    });
  }

  updateSpriteColor(color: string) {
    this.chart.scene.traverse((obj) => {
      if (obj instanceof Sprite && (obj.material as any).color) {
        ((obj.material as any).color as Color).set(color);
        obj.material.needsUpdate = true;
      }
    });
  }

  updateSpriteVisibility(show: boolean) {
    this.chart.scene.traverse((obj) => {
      if (obj instanceof Sprite) {
        obj.visible = show;
      }
    });
  }

  updateSpriteSize(size: number) {
    this.chart.scene.traverse((obj) => {
      if (obj instanceof Sprite) {
        obj.scale.set(this.chart._store.getConfig().R * size, this.chart._store.getConfig().R * size, 1);
      }
    });
  }

  updatePathColor(color: string) {
    this.chart.scene.traverse((obj) => {
      if (obj.name === "pathLine") {
        const material = (obj as any).material;
        if (material && material.color) {
          material.color.set(color);
          material.needsUpdate = true;
        }
      }
    });
  }

  updatePathVisibility(show: boolean) {
    this.chart.scene.traverse((obj) => {
      if (obj.name === "pathLine") {
        obj.visible = show;
      }
    });
  }

  updateScatterColor(color: string) {
    this.chart.scene.traverse((obj) => {
      if (
        obj instanceof Mesh &&
        (obj.name === "scatter" || obj.name === "point")
      ) {
        const material = obj.material as any;
        if (material && material.color) {
          material.color.set(color);
          material.needsUpdate = true;
        }
      }
    });
  }

  updateScatterSize(size: number) {
    this.chart.scene.traverse((obj) => {
      if (
        obj instanceof Mesh &&
        (obj.name === "scatter" || obj.name === "point")
      ) {
        obj.scale.set(size, size, size);
      }
    });
  }

  updateEarthMaterial(materialKey: string) {
    this.chart.scene.traverse((obj) => {
      if (obj instanceof Mesh && obj.name === "earthMesh") {
        const prevMaterial = obj.material as any;
        const mat = this.createEarthMaterial(materialKey, prevMaterial?.map);
        if (mat) {
          if (prevMaterial?.dispose) {
            prevMaterial.dispose();
          }
          obj.material = mat;
        }
      }
    });
  }

  private createEarthMaterial(materialKey: string, map?: any) {
    const cfg = this.chart._store.getConfig();
    const common = { ...cfg.earth, map };
    switch (materialKey) {
      case "MeshBasicMaterial":
        return new MeshBasicMaterial(common);
      case "MeshLambertMaterial":
        return new MeshLambertMaterial(common);
      case "MeshMatcapMaterial":
        return new MeshMatcapMaterial(common);
      case "MeshNormalMaterial":
        return new MeshNormalMaterial();
      case "MeshPhongMaterial":
      default:
        return new MeshPhongMaterial(common);
    }
  }

  private syncOptionsConfig() {
    this.chart.options.config = this.chart._store.getConfig();
  }

  destroy() {
    this.panel?.remove();
  }
}
