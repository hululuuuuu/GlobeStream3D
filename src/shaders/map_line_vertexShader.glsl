varying vec2 vUv;
attribute float percent;
uniform float u_time;
uniform float number;
uniform float speed;
uniform float length;
varying float opacity;
uniform float size;
void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float l = clamp(1.0 - length, 0.0, 1.0);
    gl_PointSize = clamp(fract(percent * number + l - u_time * number * speed) - l, 0.0, 1.0) * size * (1.0 / length);
    opacity = gl_PointSize / size;
    gl_Position = projectionMatrix * mvPosition;
}
