import {
  BatchedMesh,
  Euler,
  Matrix4,
  OrthographicCamera,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';

import GitHubSVG from '@brybrant/svg-icons/GitHub.svg';

import { geometryCenter, geometryLarge, geometrySmall } from './geometry.ts';

import fragmentShader from './glsl/fragment.glsl';
import vertexShader from './glsl/vertex.glsl';

const renderer = new WebGLRenderer({
  alpha: true,
  antialias: true,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

let size = Math.min(window.innerWidth, window.innerHeight);

renderer.setSize(size, size, false);

/** Callback for `resize` window event */
function resize() {
  const lastSize = size;

  size = Math.min(window.innerWidth, window.innerHeight);

  if (lastSize === size) return;

  renderer.setSize(size, size, false);
}

const scene = new Scene();

const material = new ShaderMaterial({
  dithering: true,
  fragmentShader,
  vertexShader,
});

/** 30° = π / 6 */
const deg30 = Math.PI / 6;

/** 60° = π / 3 */
const deg60 = Math.PI / 3;

/** 90° = π / 2 */
const deg90 = Math.PI / 2;

/** 360° = π * 2 */
const deg360 = Math.PI * 2;

/**
 * ~35.264389682754654°
 *
 * `Math.atan(Math.sin(45°))`
 * https://en.wikipedia.org/wiki/Isometric_video_game_graphics
 */
const isoAngle = Math.atan(Math.sin(Math.PI / 4));

const vertexCount =
  geometryCenter.getAttribute('position').count +
  geometryLarge.getAttribute('position').count +
  geometrySmall.getAttribute('position').count;

const gearCube = new BatchedMesh(9, vertexCount, 0, material);

const transformMatrix = new Matrix4();

class BatchedMeshInstance extends Euler {
  /**
   * @param geometryID `BatchedMesh` geometry ID
   * @param x Initial rotation around X axis (in radians)
   * @param y Initial rotation around Y axis (in radians)
   * @param z Initial rotation around Z axis (in radians)
   */
  constructor(geometryID: number, x: number, y: number, z: number) {
    super(x, y, z, 'YXZ');

    const id = gearCube.addInstance(geometryID);

    /** Callback to apply rotation to this `BatchedMesh` geometry instance */
    this._onChange(() => {
      transformMatrix.makeRotationFromEuler(this);

      gearCube.setMatrixAt(id, transformMatrix);
    });
  }
}

/** Large Gears */
geometryLarge.rotateZ(deg30);
geometryLarge.translate(0, 0, 12.09);

const gearLargeGeometryId = gearCube.addGeometry(geometryLarge);

const largeGears: BatchedMeshInstance[] = [];

for (let i = 0; i < 4; i++) {
  largeGears.push(
    new BatchedMeshInstance(
      gearLargeGeometryId,
      isoAngle * (i & 1 ? 1 : -1),
      deg90 * i - deg90,
      deg60 * (i & 1),
    ),
  );
}

/** Small Gears */
geometrySmall.rotateZ(deg30);
geometrySmall.translate(0, 0, 16.85);

const gearSmallGeometryId = gearCube.addGeometry(geometrySmall);

const smallGears: BatchedMeshInstance[] = [];

for (let i = 0; i < 4; i++) {
  smallGears.push(
    new BatchedMeshInstance(
      gearSmallGeometryId,
      isoAngle * (i & 1 ? 1 : -1),
      deg90 * i,
      deg60 * (i & 1),
    ),
  );
}

/** Center */
geometryCenter.rotateX(deg90);
geometryCenter.computeBoundingBox();
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
geometryCenter.translate(0, geometryCenter.boundingBox!.min.y / -2, 0);

const gearCenterGeometryId = gearCube.addGeometry(geometryCenter);
gearCube.addInstance(gearCenterGeometryId);

const frustum = 42.5;

const camera = new OrthographicCamera(
  -frustum,
  frustum,
  frustum,
  -frustum,
  0,
  frustum * 3,
);

camera.position.setFromSphericalCoords(frustum * 2, deg90 - isoAngle, deg90);

camera.lookAt(gearCube.position);

scene.add(gearCube);

window.addEventListener('resize', resize);

const rotationAngle = 6e-5;

let lastTimestamp = performance.now();

const render = (timestamp: number) => {
  const deltaTime = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  for (let i = 0; i < 4; i++) {
    const largeGear = largeGears[i];
    const smallGear = smallGears[i];
    largeGear.z = (largeGear.z - rotationAngle * deltaTime) % deg360;
    smallGear.z = (smallGear.z + rotationAngle * deltaTime * 2) % deg360;
  }

  gearCube.rotateY(rotationAngle * deltaTime * 3);

  renderer.render(scene, camera);

  window.requestAnimationFrame(render);
};

document.body.appendChild(renderer.domElement);

window.requestAnimationFrame(render);

document.body.insertAdjacentHTML(
  'beforeend',
  `<main>
    <h1>GEAR CUBE</h1>
    <a
      class="button"
      href="https://github.com/brybrant/gear-cube"
      target="_blank"
      rel="noopener noreferrer"
      title="GitHub"
    >
      ${GitHubSVG}
    </a>
  </main>`,
);
