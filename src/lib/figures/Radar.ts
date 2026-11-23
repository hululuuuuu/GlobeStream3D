import { Color, Group, MathUtils, Mesh, RingGeometry, ShaderMaterial } from "three";
import type { RadarStation } from "../interface";
import type Store from "../store/store";
import fragmentShader from "../../shaders/radar_fragment.glsl";

const vertexShader = `
  varying vec2 disc;
  void main() {
    disc = uv * 2.0 - 1.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export function createRadar(store: Store, station: RadarStation): Group | undefined {
  const { lon, lat } = station;
  const config = store.getConfig();
  const {
    color = config.radarStyle.color,
    radius = config.radarStyle.radius,
    opacity = config.radarStyle.opacity,
    speed = config.radarStyle.speed,
  } = station.style ?? {};
  if (![lon, lat, radius, opacity, speed].every(Number.isFinite)) return;
  if (Math.abs(lat) > 90 || radius <= 0 || radius > 45) return;

  const globe = store.mode === "3d";
  const geometry = new RingGeometry(0, 1, 80, globe ? Math.ceil(radius / 3) : 1);
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      tint: { value: new Color(color) },
      opacity: { value: MathUtils.clamp(opacity, 0, 1) },
      phase: { value: 0 },
      direction: { value: speed < 0 ? -1 : 1 },
    },
    extensions: { derivatives: true },
    transparent: true,
    depthWrite: false,
  });
  const mesh = new Mesh(geometry, material);
  const group = new Group();
  if (globe) {
    // Bend each concentric ring along the sphere, preserving its bearing and arc length.
    const surface = config.R * 1.003;
    const angularRadius = MathUtils.degToRad(radius);
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const r = Math.hypot(x, y);
      const angle = angularRadius * r;
      const scale = r > 0 ? surface * Math.sin(angle) / r : 0;
      position.setXYZ(i, x * scale, y * scale, surface * (Math.cos(angle) - 1));
    }
    mesh.position.z = surface;
    group.rotation.set(-MathUtils.degToRad(lat), MathUtils.degToRad(lon + 90), 0, "YXZ");
  } else {
    mesh.position.set(lon, lat, 0.15);
    mesh.scale.set(radius, radius, 1);
  }
  if (speed !== 0) {
    const start = performance.now();
    mesh.onBeforeRender = () => {
      material.uniforms.phase.value = ((performance.now() - start) * speed / 1000) % 1;
    };
  }
  group.name = String(station.id ?? `${lon}-${lat}`);
  group.userData.figureType = "radar";
  mesh.userData = { ...station, type: "radar" };
  group.add(mesh);
  return group;
}
