import './app.scss';

import {
  Group,
  Mesh,
  MeshPhongMaterial,
  OrthographicCamera,
  PointLight,
  Scene,
  WebGLRenderer,
} from 'three';

import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

import GitHubSVG from '../node_modules/@brybrant/svg-icons/GitHub.svg';

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('background');

const renderer = new WebGLRenderer({
  alpha: true,
  antialias: true,
  canvas: canvas,
});

renderer.setPixelRatio(window.devicePixelRatio);

const scene = new Scene();

const loader = new DRACOLoader();

loader.setPath('/gear-cube/');

loader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

const material = new MeshPhongMaterial({ shininess: 1000 });

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

const gearLargeLoaded = loader.loadAsync('large-gear.drc').then((geometry) => {
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
});

const gearSmallLoaded = loader.loadAsync('small-gear.drc').then((geometry) => {
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
});

const gearCenterLoaded = loader.loadAsync('center.drc').then((geometry) => {
  geometry.rotateX(deg90);
  geometry.computeBoundingBox();

  const gearCenter = new Mesh(geometry, material);

  gearCenter.position.set(0, geometry.boundingBox.min.y / -2, 0);

  gearCube.add(gearCenter);
});

Promise.all([gearLargeLoaded, gearSmallLoaded, gearCenterLoaded]).then(
  ([gearLarge, gearSmall]) => {
    const frustum = 0.05;

    const cameraTheta = deg90;

    let aspectRatio = window.innerHeight / window.innerWidth;
    let aspectMultiplier = Math.max(aspectRatio, 1);

    const camera = new OrthographicCamera(
      window.innerWidth * aspectMultiplier * -frustum,
      window.innerWidth * aspectMultiplier * frustum,
      window.innerHeight * aspectMultiplier * frustum,
      window.innerHeight * aspectMultiplier * -frustum,
      -45,
      45,
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

    renderer.setSize(window.innerWidth, window.innerHeight);

    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);

      aspectRatio = window.innerHeight / window.innerWidth;
      aspectMultiplier = Math.max(aspectRatio, 1);

      camera.left = window.innerWidth * aspectMultiplier * -frustum;
      camera.right = window.innerWidth * aspectMultiplier * frustum;
      camera.top = window.innerHeight * aspectMultiplier * frustum;
      camera.bottom = window.innerHeight * aspectMultiplier * -frustum;

      camera.updateProjectionMatrix();
    });

    const rotationAngle = 0.05 * deg2rad;

    let frameId = 0;

    function render(/* time */) {
      try {
        gearLarge.rotateZ(-rotationAngle);
        gearSmall.rotateZ(rotationAngle * 2);
        gearCube.rotateY(rotationAngle * 3);

        renderer.render(scene, camera);

        frameId = requestAnimationFrame(render);
      } catch (error) {
        console.error(error);
        return cancelAnimationFrame(frameId);
      }
    }

    frameId = requestAnimationFrame(render);

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
  },
);
