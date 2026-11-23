uniform vec3 tint;
uniform float opacity;
uniform float phase;
uniform float direction;
varying vec2 disc;

void main() {
  float r = length(disc);
  float pixel = max(fwidth(r), 0.004);
  float ringDistance = abs(fract(r * 3.0 + 0.5) - 0.5) / 3.0;
  float rings = 1.0 - smoothstep(0.007, 0.007 + pixel, ringDistance);
  float hub = 1.0 - smoothstep(0.035, 0.035 + pixel, r);
  float bearing = atan(disc.y, disc.x + 0.000001) / 6.2831853;
  float age = fract((phase - bearing) * direction);
  float sweep = pow(max(1.0 - age / 0.24, 0.0), 2.0);
  float edge = 1.0 - smoothstep(0.002, 0.012, age);
  float alpha = max(hub, max(0.63 * rings, 0.06 + 0.64 * sweep + 0.3 * edge));
  gl_FragColor = vec4(tint, opacity * alpha);
  #include <encodings_fragment>
}
