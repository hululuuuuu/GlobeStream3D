import {
  Color,
  MathUtils,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from "three";

export default class Track {
  radius: number;
  maxImpacts: number;
  impacts: any[];
  uniforms: any;
  material: any;
  track: any;
  tweens: any[];
  constructor(radius: number, maxImpacts = 5) {
    this.radius = radius;
    this.maxImpacts = maxImpacts; // 最大冲击波数量
    this.impacts = [];
    this.uniforms = this.createUniforms();
    this.material = this.createMaterial();
    this.track = this.createTrack();
    this.tweens = [];
    this.initImpacts();
  }

  createUniforms() {
    return {
      impacts: { value: [] },
      maxSize: { value: 0.04 }, // 冲击波最大点大小
      minSize: { value: 0.02 }, // 冲击波最小点大小
      waveHeight: { value: 0.1 }, // 冲击波高度
      scaling: { value: 1 }, // 冲击波缩放比例
      gradInner: { value: new Color("#8ae66e") }, // 冲击波内侧颜色
      gradOuter: { value: new Color("#03c03c") }, // 冲击波外侧颜色
      opacity: { value: 0.5 }, // 球体透明度
    };
  }

  createMaterial() {
    return new ShaderMaterial({
      transparent: true,
      uniforms: this.uniforms,
      vertexShader: `
        struct impact {
          vec3 impactPosition;
          float impactMaxRadius;
          float impactRatio;
        };

        uniform impact impacts[${this.maxImpacts}];
        uniform float maxSize;
        uniform float minSize;
        uniform float waveHeight;
        uniform float scaling;

        varying float vFinalStep;

        void main() {
          vec3 center = position; // 球体顶点的中心位置
          float finalStep = 0.0;

          // 遍历所有冲击波，计算当前顶点的影响值
          for (int i = 0; i < ${this.maxImpacts}; i++) {
            float dist = distance(center, impacts[i].impactPosition); // 顶点到冲击波中心的距离
            float curRadius = impacts[i].impactMaxRadius * impacts[i].impactRatio; // 当前冲击波的半径
            float sstep = smoothstep(0.0, curRadius, dist) - smoothstep(curRadius - (0.25 * impacts[i].impactRatio), curRadius, dist);
            sstep *= 1.0 - impacts[i].impactRatio; // 影响值随扩散比例衰减
            finalStep += sstep;
          }

          finalStep = clamp(finalStep, 0.0, 1.0); // 限制影响值范围
          vFinalStep = finalStep;

          // 动态调整顶点位置
          float scale = scaling;
          vec3 transformed = position * mix(1.0, scale * 1.25, finalStep);
          transformed += normal * finalStep * waveHeight; // 冲击波的高度变化

          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 gradInner;
        uniform vec3 gradOuter;
        uniform float opacity;

        varying float vFinalStep;

        void main() {
          vec3 grad = mix(gradInner, gradOuter, vFinalStep); // 根据影响值插值颜色
          gl_FragColor = vec4(grad, opacity); // 应用透明度
        }
      `,
    });
  }

  createTrack() {
    const geometry = new SphereGeometry(this.radius, 64, 64);
    return new Mesh(geometry, this.material);
  }

  initImpacts() {
    for (let i = 0; i < this.maxImpacts; i++) {
      this.impacts.push({
        impactPosition: new Vector3()
          .random()
          .subScalar(0.5)
          .setLength(this.radius), // 随机冲击波位置
        impactMaxRadius: MathUtils.randFloat(1, 2), // 冲击波最大半径
        impactRatio: 0, // 当前冲击波扩散比例
      });
    }
    this.uniforms.impacts.value = this.impacts;
  }

  triggerImpact(index: number) {
    const impact = this.impacts[index];
    impact.impactPosition.random().subScalar(0.5).setLength(this.radius); // 重新生成随机位置
    impact.impactMaxRadius = MathUtils.randFloat(1, 2); // 随机最大半径
    impact.impactRatio = 0; // 重置扩散比例

    // // 使用 TWEEN 动画扩散冲击波
    // new TWEEN.Tween({ value: 0 })
    //   .to({ value: 1 }, MathUtils.randInt(2000, 4000)) // 动画持续时间
    //   .onUpdate((val) => {
    //     impact.impactRatio = val.value; // 更新冲击波扩散比例
    //   })
    //   .start();
  }

  triggerRandomImpact() {
    const randomIndex = Math.floor(Math.random() * this.maxImpacts);
    this.triggerImpact(randomIndex);
  }
}

// // 使用示例
// const scene = new Scene();
// const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// camera.position.set(0, 0, 15);

// const renderer = new WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);

// const earth = new Mesh(
//   new SphereGeometry(5, 64, 64),
//   new MeshBasicMaterial({ color: 0x0077ff })
// );
// scene.add(earth);

// // 创建冲击波球体
// const rippleSphere = new RippleSphere(5.1);
// rippleSphere.addToScene(scene);

// // 动画循环
// function animate() {
//   requestAnimationFrame(animate);
//   TWEEN.update();
//   earth.rotation.y += 0.001; // 地球自转
//   rippleSphere.sphere.rotation.y -= 0.002; // 冲击波球体反向旋转
//   renderer.render(scene, camera);
// }
// animate();

// // 定时触发冲击波
// setInterval(() => {
//   rippleSphere.triggerRandomImpact();
// }, 2000);
