import { BufferAttribute, BufferGeometry } from 'three';

import * as center from './models/gear-center.js';
import * as large from './models/gear-large.js';
import * as small from './models/gear-small.js';

/**
 * @param {number[]} vertices
 * @param {number[]} indices
 */
function createGeometry(vertices, indices) {
  const positions = new Float32Array(indices.length * 3);

  let dst = 0;

  for (let i = 0; i < indices.length; i++) {
    const src = indices[i] * 3;

    positions[dst++] = vertices[src];
    positions[dst++] = vertices[src + 1];
    positions[dst++] = vertices[src + 2];
  }

  const geometry = new BufferGeometry();

  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.computeVertexNormals();

  return geometry;
}

export const geometryCenter = createGeometry(center.vertices, center.indices);

export const geometryLarge = createGeometry(large.vertices, large.indices);

export const geometrySmall = createGeometry(small.vertices, small.indices);
