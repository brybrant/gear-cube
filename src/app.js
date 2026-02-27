import './app.scss';

import {
  Group,
  Mesh,
  MeshPhongMaterial,
  OrthographicCamera,
  PointLight,
  Scene,
  SRGBColorSpace,
  Texture,
  WebGLRenderer,
} from 'three';

import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

import DiffuseSVG from './diffuse.svg';
import SpecularSVG from './specular.svg';

import GitHubSVG from '@brybrant/svg-icons/GitHub.svg';

/** @typedef {import('three').BufferGeometry} Geometry */

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('background');

const renderer = new WebGLRenderer({
  alpha: true,
  antialias: true,
  canvas: canvas,
});

renderer.setPixelRatio(window.devicePixelRatio);

let size = Math.min(window.innerWidth, window.innerHeight);

renderer.setSize(size, size, false);

/**
 * @callback resizeCallback
 * @returns {void}
 */

/** @type {resizeCallback} */
function resize() {
  const lastSize = size;

  size = Math.min(window.innerWidth, window.innerHeight);

  if (lastSize === size) return;

  renderer.setSize(size, size, false);
}

const scene = new Scene();

const geometryLoader = new DRACOLoader();

geometryLoader.setPath('/gear-cube/');

// https://github.com/google/draco
geometryLoader.setDecoderPath(
  'https://www.gstatic.com/draco/versioned/decoders/1.5.7/',
);

// /** @param {string} elementID */
/** @param {string} svg */
function createTexture(svg) {
  const encodedSVG = encodeURIComponent(svg);

  return new Promise((resolve, reject) => {
    const textureImage = new Image(1024, 1024);

    /** Call after image loads */
    const finish = () => (textureImage.onload = textureImage.onerror = null);

    textureImage.onload = () => {
      const textureCanvas = document.createElement('canvas');
      textureCanvas.width = textureCanvas.height = 1024;
      textureCanvas.getContext('2d').drawImage(textureImage, 0, 0, 1024, 1024);

      const texture = new Texture(textureCanvas);
      texture.colorSpace = SRGBColorSpace;
      texture.needsUpdate = true;

      resolve(texture);

      finish();
    };

    textureImage.onerror = () => {
      reject('Failed to load texture');

      finish();
    };

    textureImage.src = `data:image/svg+xml;charset=utf-8,${encodedSVG}`;
  });
}

const diffuseTexturePromise = createTexture(DiffuseSVG);

const specularTexturePromise = createTexture(SpecularSVG);

const material = new MeshPhongMaterial({
  dithering: true,
  shininess: 20,
  specular: 0xbbbbbb,
});

const deg2rad = Math.PI / 180;

/** 90° = π / 2 */
const deg90 = Math.PI / 2;

/** 180° = π */
const deg180 = Math.PI;

/**
 * ~35.264389682754654°
 *
 * `Math.atan(Math.sin(45°))`
 * https://en.wikipedia.org/wiki/Isometric_video_game_graphics
 */
const isoAngle = Math.atan(Math.sin(Math.PI / 4));

const gearCube = new Group();

const gearLargePromise = geometryLoader.loadAsync('large-gear.drc').then(
  /** @param {Geometry} geometry */
  (geometry) => {
    // This axis to spin the gear (geometry Z)
    geometry.rotateZ(30 * deg2rad);
    geometry.translate(0, 0, 12.05);

    const gearLarge1 = new Mesh(geometry, material);

    const gearLarge2 = new Group();
    gearLarge2.add(gearLarge1.clone().rotateZ(60 * deg2rad));

    const gearLarge3 = gearLarge1.clone();

    const gearLarge4 = gearLarge2.clone();

    gearLarge1.rotateY(-deg90);
    gearLarge1.rotateX(-isoAngle);

    gearLarge2.rotateX(isoAngle);

    gearLarge3.rotateY(deg90);
    gearLarge3.rotateX(-isoAngle);

    gearLarge4.rotateY(deg180);
    gearLarge4.rotateX(isoAngle);

    gearCube.add(gearLarge1);
    gearCube.add(gearLarge2);
    gearCube.add(gearLarge3);
    gearCube.add(gearLarge4);

    return geometry;
  },
);

const gearSmallPromise = geometryLoader.loadAsync('small-gear.drc').then(
  /** @param {Geometry} geometry */
  (geometry) => {
    // This axis to spin the gear (geometry Z)
    geometry.rotateZ(30 * deg2rad);
    geometry.translate(0, 0, 16.85);

    const gearSmall1 = new Mesh(geometry, material);

    const gearSmall2 = new Group();
    gearSmall2.add(gearSmall1.clone().rotateZ(60 * deg2rad));

    const gearSmall3 = gearSmall1.clone();

    const gearSmall4 = gearSmall2.clone();

    gearSmall1.rotateX(-isoAngle);

    gearSmall2.rotateY(deg90);
    gearSmall2.rotateX(isoAngle);

    gearSmall3.rotateY(deg180);
    gearSmall3.rotateX(-isoAngle);

    gearSmall4.rotateY(-deg90);
    gearSmall4.rotateX(isoAngle);

    gearCube.add(gearSmall1);
    gearCube.add(gearSmall2);
    gearCube.add(gearSmall3);
    gearCube.add(gearSmall4);

    return geometry;
  },
);

const gearCenterPromise = geometryLoader.loadAsync('center.drc').then(
  /** @param {Geometry} geometry */
  (geometry) => {
    geometry.rotateX(deg90);
    geometry.computeBoundingBox();

    const gearCenter = new Mesh(geometry, material);

    gearCenter.position.set(0, geometry.boundingBox.min.y / -2, 0);

    gearCube.add(gearCenter);
  },
);

Promise.all([
  diffuseTexturePromise,
  specularTexturePromise,
  gearLargePromise,
  gearSmallPromise,
  gearCenterPromise,
]).then(([diffuseTexture, specularTexture, gearLarge, gearSmall]) => {
  material.map = diffuseTexture;
  material.specularMap = specularTexture;

  const frustum = 42.5;

  const cameraTheta = deg90;

  const camera = new OrthographicCamera(
    -frustum,
    frustum,
    frustum,
    -frustum,
    -frustum,
    frustum,
  );

  camera.position.setFromSphericalCoords(1, deg90 - isoAngle, cameraTheta);

  camera.lookAt(gearCube.position);

  const lightRadius = 200;
  const lightColor = 0xffffff;

  const light1 = new PointLight(lightColor, 8e3);
  const light2 = new PointLight(lightColor, 4e3);
  const light3 = new PointLight(lightColor, 2e3);

  light1.position.setFromSphericalCoords(
    lightRadius,
    deg2rad * 45,
    cameraTheta + deg2rad * 135,
  );

  light2.position.setFromSphericalCoords(
    lightRadius,
    deg2rad * 45,
    cameraTheta - deg2rad * 112.5,
  );

  light3.position.setFromSphericalCoords(
    lightRadius,
    deg2rad * 90,
    cameraTheta + deg2rad * 22.5,
  );

  scene.add(light1, light2, light3, gearCube);

  window.addEventListener('resize', resize);

  const rotationAngle = 6e-5;

  let frame = 0;

  let lastTimestamp = 0;

  /** @param {number} timestamp */
  function start(timestamp) {
    lastTimestamp = timestamp;

    frame = requestAnimationFrame(render);
  }

  /** @param {number} timestamp */
  function render(timestamp) {
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    try {
      gearLarge.rotateZ(-rotationAngle * deltaTime);
      gearSmall.rotateZ(rotationAngle * deltaTime * 2);
      gearCube.rotateY(rotationAngle * deltaTime * 3);

      renderer.render(scene, camera);

      frame = requestAnimationFrame(render);
    } catch (error) {
      console.error(error);
      return cancelAnimationFrame(frame);
    }
  }

  frame = requestAnimationFrame(start);

  const main = document.createElement('main');

  const h1 = document.createElement('h1');
  h1.innerText = 'GEAR CUBE';
  main.appendChild(h1);

  const githubLink = document.createElement('a');
  githubLink.className = 'button';
  githubLink.href = 'https://github.com/brybrant/gear-cube';
  githubLink.target = '_blank';
  githubLink.innerHTML = GitHubSVG;
  main.appendChild(githubLink);

  document.body.appendChild(main);
});
