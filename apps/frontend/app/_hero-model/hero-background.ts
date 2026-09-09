type ThreeModule = typeof import("three");
type Mesh = InstanceType<ThreeModule["Mesh"]>;
type Vector2 = InstanceType<ThreeModule["Vector2"]>;

export type HeroBackground = {
  mesh: Mesh;
  uniforms: {
    uTime: { value: number };
    uPointer: { value: Vector2 };
    uResolution: { value: Vector2 };
    uScroll: { value: number };
    uIntensity: { value: number };
  };
  dispose: () => void;
};

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec2 uPointer;
uniform vec2 uResolution;
uniform float uScroll;
uniform float uIntensity;

varying vec2 vUv;

const vec3 BASE = vec3(0.0027, 0.0033, 0.0024);
const vec3 ACCENT = vec3(0.109, 0.930, 0.275);

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float valueNoise(vec2 p) {
  vec2 cell = floor(p);
  vec2 offset = fract(p);
  vec2 weight = offset * offset * (3.0 - 2.0 * offset);
  float a = hash(cell);
  float b = hash(cell + vec2(1.0, 0.0));
  float c = hash(cell + vec2(0.0, 1.0));
  float d = hash(cell + vec2(1.0, 1.0));
  return mix(mix(a, b, weight.x), mix(c, d, weight.x), weight.y);
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    sum += amplitude * valueNoise(p);
    p = p * 2.02 + 11.3;
    amplitude *= 0.5;
  }
  return sum;
}

void main() {
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 p = (vUv - 0.5) * aspect;
  vec2 pointer = uPointer * 0.5 * aspect;

  float t = uTime * 0.05;
  vec2 warp = vec2(fbm(p * 1.7 + t), fbm(p * 1.7 - t + 5.2)) - 0.5;
  float field = fbm(p * 2.6 + warp * 0.9 + vec2(-t, t * 0.4));
  float toPointer = length(p - pointer);
  float halo = exp(-toPointer * 2.8);

  vec2 stageOffset = (p - vec2(0.0, 0.04)) / vec2(0.40, 0.32);
  float stageLight = exp(-dot(stageOffset, stageOffset) * 1.7);

  vec2 groundOffset = (p - vec2(0.0, -0.34)) / vec2(0.42, 0.11);
  float ground = exp(-dot(groundOffset, groundOffset) * 1.9);

  vec2 cell = (p - pointer * 0.12) * 7.0;
  vec2 grid = abs(fract(cell) - 0.5) / max(fwidth(cell), vec2(0.0001));
  float line = 1.0 - min(min(grid.x, grid.y), 1.0);
  line *= smoothstep(1.1, 0.0, toPointer);

  float vignette = smoothstep(1.15, 0.15, length(p));

  vec3 color = BASE;
  color += ACCENT * stageLight * 0.011 * uIntensity;
  color += ACCENT * ground * 0.009 * uIntensity;
  color += ACCENT * field * field * 0.004 * vignette * uIntensity;
  color += ACCENT * halo * 0.007 * uIntensity;
  color += ACCENT * line * 0.004 * uIntensity;
  color = mix(color, BASE * 0.35, uScroll);

  gl_FragColor = vec4(color, 1.0);
}
`;

export function createHeroBackground(THREE: ThreeModule, intensity: number): HeroBackground {
  const uniforms = {
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uScroll: { value: 0 },
    uIntensity: { value: intensity },
  };

  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;

  return {
    mesh,
    uniforms,
    dispose: () => {
      mesh.removeFromParent();
      geometry.dispose();
      material.dispose();
    },
  };
}
