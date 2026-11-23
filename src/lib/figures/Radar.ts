import { Color, Group, MathUtils, Mesh, RingGeometry, ShaderMaterial } from "three";
import type { RadarStation, RadarStyle } from "../interface";
import type Store from "../store/store";
import fragmentShader from "../../shaders/radar_fragment.glsl";

const vertexShader = `
  varying vec2 disc;
  void main() {
    disc = uv * 2.0 - 1.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Keep editing state private while event payloads and Three.js groups remain ordinary objects.
const editors = new WeakMap<Group, (patch: Partial<RadarStyle>) => void>();

function validRadius(radius: number) {
  return Number.isFinite(radius) && radius > 0 && radius <= 45;
}

export function updateRadarStyle(container: Group, id: string | number, patch: Partial<RadarStyle>) {
  if ((patch.radius !== undefined && !validRadius(patch.radius)) ||
      (patch.speed !== undefined && !Number.isFinite(patch.speed)) ||
      (patch.opacity !== undefined && !Number.isFinite(patch.opacity)) ||
      (patch.color !== undefined && typeof patch.color !== "string")) return false;
  const name = String(id);
  let matched = false;
  for (const child of container.children) {
    if (!(child instanceof Group) || child.name !== name) continue;
    const edit = editors.get(child);
    if (edit) {
      edit(patch);
      matched = true;
    }
  }
  return matched;
}

function resizeFootprint(mesh: Mesh<RingGeometry>, radius: number, surface: number | undefined) {
  if (surface === undefined) {
    mesh.scale.set(radius, radius, 1);
    return;
  }
  // Retain the existing buffers unless a wider footprint needs finer subdivision.
  const segments = Math.ceil(radius / 3);
  if (mesh.geometry.parameters.phiSegments < segments) {
    const previous = mesh.geometry;
    mesh.geometry = new RingGeometry(0, 1, 80, segments);
    previous.dispose();
  }
  const { position, uv } = mesh.geometry.attributes;
  const angularRadius = MathUtils.degToRad(radius);
  for (let i = 0; i < position.count; i++) {
    const x = uv.getX(i) * 2 - 1;
    const y = uv.getY(i) * 2 - 1;
    const r = Math.hypot(x, y);
    const angle = angularRadius * r;
    const scale = r > 0 ? surface * Math.sin(angle) / r : 0;
    position.setXYZ(i, x * scale, y * scale, surface * (Math.cos(angle) - 1));
  }
  position.needsUpdate = true;
  mesh.geometry.computeBoundingSphere();
  if (mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
}

export function createRadar(store: Store, station: RadarStation): Group | undefined {
  const { lon, lat } = station;
  const config = store.getConfig();
  const {
    color = config.radarStyle.color,
    radius = config.radarStyle.radius,
    opacity = config.radarStyle.opacity,
    speed = config.radarStyle.speed,
  } = station.style ?? {};
  if (![lon, lat, opacity, speed].every(Number.isFinite) || Math.abs(lat) > 90 || !validRadius(radius)) return;

  const globe = store.mode === "3d";
  const geometry = new RingGeometry(0, 1, 80, globe ? Math.ceil(radius / 3) : 1);
  const style = { speed, radius, color, opacity: MathUtils.clamp(opacity, 0, 1) };
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      tint: { value: new Color(color) },
      opacity: { value: style.opacity },
      phase: { value: 0 },
      direction: { value: speed < 0 ? -1 : 1 },
    },
    extensions: { derivatives: true },
    transparent: true,
    depthWrite: false,
  });
  const mesh = new Mesh(geometry, material);
  const group = new Group();
  const surface = globe ? config.R * 1.003 : undefined;
  if (surface !== undefined) {
    mesh.position.z = surface;
    group.rotation.set(-MathUtils.degToRad(lat), MathUtils.degToRad(lon + 90), 0, "YXZ");
  } else {
    mesh.position.set(lon, lat, 0.15);
  }
  resizeFootprint(mesh, radius, surface);
  let since = performance.now();
  let offset = 0;
  const phaseAt = (now: number) => (offset + (now - since) * style.speed / 1000) % 1;
  mesh.onBeforeRender = () => {
    if (style.speed !== 0) material.uniforms.phase.value = phaseAt(performance.now());
  };

  group.name = String(station.id ?? `${lon}-${lat}`);
  group.userData.figureType = "radar";
  mesh.userData = { ...station, type: "radar" };
  group.add(mesh);
  editors.set(group, patch => {
    // Anchor the old sweep at the instant of the edit, even if the layer is hidden.
    if (patch.speed !== undefined && patch.speed !== style.speed) {
      const now = performance.now();
      offset = phaseAt(now);
      since = now;
      style.speed = patch.speed;
      material.uniforms.phase.value = offset;
      if (style.speed !== 0) material.uniforms.direction.value = Math.sign(style.speed);
    }
    if (patch.radius !== undefined && patch.radius !== style.radius) {
      resizeFootprint(mesh, patch.radius, surface);
      style.radius = patch.radius;
    }
    if (patch.color !== undefined) {
      style.color = patch.color;
      material.uniforms.tint.value.set(style.color);
    }
    if (patch.opacity !== undefined) {
      style.opacity = MathUtils.clamp(patch.opacity, 0, 1);
      material.uniforms.opacity.value = style.opacity;
    }
    mesh.userData.style = { ...style };
  });
  return group;
}
