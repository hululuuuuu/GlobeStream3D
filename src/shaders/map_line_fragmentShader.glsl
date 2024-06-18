#ifdef GL_ES
precision mediump float;
#endif
varying float opacity;
uniform vec3 color;
void main() {
    if (opacity <= 0.2) {
        discard;
    }
    gl_FragColor = vec4(color, 1.0);
}
