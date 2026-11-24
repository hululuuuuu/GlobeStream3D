import {
  BufferGeometry, Float32BufferAttribute, Group, LineBasicMaterial, LineLoop,
  MathUtils, Mesh, MeshBasicMaterial, SphereGeometry,
} from "three";
import type { OrbitData, OrbitState } from "../interface";

const fullTurn = Math.PI * 2;

export default class Orbit extends Group {
  private readonly plane = new Group();
  private readonly marker: Mesh;
  private readonly radius: number;
  private readonly period: number;
  private angleAtStart: number;
  private startedAt = performance.now();
  private paused = false;

  constructor(globeRadius: number, data: OrbitData) {
    super();
    const { inclination = 0, altitude = 0.12, period = 12, phase = 0, color = "#88cfff" } = data;
    if (!Number.isFinite(inclination) || inclination < 0 || inclination > 180) {
      throw new RangeError("Orbit inclination must be between 0 and 180 degrees");
    }
    if (!Number.isFinite(altitude) || altitude <= 0 || !Number.isFinite(period) || period <= 0 ||
        !Number.isFinite(phase) || typeof color !== "string") {
      throw new TypeError("Orbit requires positive altitude and period, a finite phase and a color string");
    }
    this.name = String(data.id);
    this.radius = globeRadius * (1 + altitude);
    if (!Number.isFinite(Math.fround(this.radius))) {
      throw new RangeError("Orbit radius exceeds the supported geometry range");
    }
    this.period = period;
    this.angleAtStart = MathUtils.degToRad(phase % 360);
    const segments = 192;
    const points = new Float32Array(segments * 3);
    for (let i = 0; i < segments; i++) {
      const angle = fullTurn * i / segments;
      points[i * 3] = this.radius * Math.cos(angle);
      points[i * 3 + 2] = -this.radius * Math.sin(angle);
    }
    const path = new BufferGeometry();
    path.setAttribute("position", new Float32BufferAttribute(points, 3));
    const line = new LineLoop(path, new LineBasicMaterial({ color, transparent: true, opacity: 0.72, depthWrite: false }));
    this.marker = new Mesh(new SphereGeometry(globeRadius * 0.018, 12, 8), new MeshBasicMaterial({ color }));
    line.userData = { ...data, type: "orbit", part: "path" };
    this.marker.userData = { ...data, type: "orbit", part: "marker" };
    this.plane.rotation.z = MathUtils.degToRad(inclination);
    this.plane.add(line, this.marker);
    this.add(this.plane);
    this.placeMarker(this.angleAtStart);
  }

  private angleAt(now: number) {
    const elapsed = (now - this.startedAt) / 1000;
    return this.angleAtStart + fullTurn * ((elapsed % this.period) / this.period);
  }

  private placeMarker(angle: number) {
    this.marker.position.set(this.radius * Math.cos(angle), 0, -this.radius * Math.sin(angle));
  }

  // Three.js updates parent matrices before its children for rendering and picking.
  override updateMatrix() {
    if (this.visible && this.plane.visible && !this.paused) this.placeMarker(this.angleAt(performance.now()));
    super.updateMatrix();
  }

  setState({ visible, paused }: OrbitState) {
    // The outer group's visibility belongs to setLayerVisible("orbit", ...).
    if (visible !== undefined) this.plane.visible = visible;
    if (paused === undefined || paused === this.paused) return;
    const now = performance.now();
    if (paused) {
      this.angleAtStart = this.angleAt(now) % fullTurn;
      this.placeMarker(this.angleAtStart);
    } else {
      this.startedAt = now;
    }
    this.paused = paused;
  }
}
