import { readFile, writeFile } from 'node:fs/promises';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { createEncoderModule } from 'draco3d';

/** @typedef {import('three').Mesh} Mesh */

const objLoader = new OBJLoader();

/** @param {string} data */
const parseOBJ = (data) => {
  const group = objLoader.parse(data);
  /** @type {Mesh} */
  const mesh = group.children[0];
  return mesh.removeFromParent();
};

const gearLargePromise = readFile('./models/large-gear.obj', 'utf8').then(
  parseOBJ,
);

const gearSmallPromise = readFile('./models/small-gear.obj', 'utf8').then(
  parseOBJ,
);

const gearCenterPromise = readFile('./models/center.obj', 'utf8').then(
  parseOBJ,
);

/**
 * Adapted from `three/addons/exporters/DRACOExporter.js`
 * @param {Mesh} mesh
 */
async function dracoCompressMesh(mesh) {
  const geometry = mesh.geometry;

  const encoderModule = await createEncoderModule();

  const dracoBuilder = new encoderModule.MeshBuilder();
  const dracoEncoder = new encoderModule.Encoder();
  const dracoMesh = new encoderModule.Mesh();

  const vertices = geometry.getAttribute('position');

  dracoBuilder.AddFloatAttribute(
    dracoMesh,
    encoderModule.POSITION,
    vertices.count,
    vertices.itemSize,
    vertices.array,
  );

  const faces = new (vertices.count > 65535 ? Uint32Array : Uint16Array)(
    vertices.count,
  );

  for (let i = 0; i < faces.length; i++) faces[i] = i;

  dracoBuilder.AddFacesToMesh(dracoMesh, vertices.count, faces);

  const normals = geometry.getAttribute('normal');

  if (normals !== undefined) {
    dracoBuilder.AddFloatAttribute(
      dracoMesh,
      encoderModule.NORMAL,
      normals.count,
      normals.itemSize,
      normals.array,
    );
  }

  const uvs = geometry.getAttribute('uv');

  if (uvs !== undefined) {
    dracoBuilder.AddFloatAttribute(
      dracoMesh,
      encoderModule.TEX_COORD,
      uvs.count,
      uvs.itemSize,
      uvs.array,
    );
  }

  const encodedData = new encoderModule.DracoInt8Array();

  dracoEncoder.SetSpeedOptions(0, 0);

  dracoEncoder.SetEncodingMethod(encoderModule.MESH_EDGEBREAKER_ENCODING);

  dracoEncoder.SetAttributeQuantization(encoderModule.POSITION, 12);
  dracoEncoder.SetAttributeQuantization(encoderModule.NORMAL, 12);
  dracoEncoder.SetAttributeQuantization(encoderModule.TEX_COORD, 12);

  const length = dracoEncoder.EncodeMeshToDracoBuffer(dracoMesh, encodedData);

  if (length < 1) {
    console.error('Draco encoding failed :(');
    return new Int8Array();
  }

  // Copy encoded data to buffer.
  const outputData = new Int8Array(new ArrayBuffer(length));

  for (let i = 0; i < length; i++) outputData[i] = encodedData.GetValue(i);

  encoderModule.destroy(dracoBuilder);
  encoderModule.destroy(dracoEncoder);
  encoderModule.destroy(dracoMesh);
  encoderModule.destroy(encodedData);

  return outputData;
}

Promise.all([gearLargePromise, gearSmallPromise, gearCenterPromise])
  .then(([gearLarge, gearSmall, gearCenter]) => {
    return Promise.all([
      dracoCompressMesh(gearLarge),
      dracoCompressMesh(gearSmall),
      dracoCompressMesh(gearCenter),
    ]);
  })
  .then(([gearLarge, gearSmall, gearCenter]) => {
    return Promise.all([
      writeFile('./public/large-gear.drc', gearLarge),
      writeFile('./public/small-gear.drc', gearSmall),
      writeFile('./public/center.drc', gearCenter),
    ]);
  })
  .then(() => {
    console.log('Success!');
  });
