import { readFile, writeFile } from 'node:fs/promises';

/**
 * @param {number[]} vertices
 * @param {number[]} indices
 */
const output = (vertices, indices) => `/* eslint-disable prettier/prettier */
export const vertices = new Float32Array([${vertices}]);

export const indices = new Uint16Array([${indices}]);
`;

/** @param {number} number */
const threeDecimals = (number) => Math.round(number * 1e3) / 1e3;

const parseOBJ = (data) => {
  const vertices = [];
  const indices = [];

  const lines = data.split('\n');

  for (const line of lines) {
    if (line.startsWith('v ')) {
      const [, x, y, z] = line.split(/\s+/);

      vertices.push(threeDecimals(x), threeDecimals(y), threeDecimals(z));
    }

    if (line.startsWith('f ')) {
      const parts = line.slice(2).trim().split(/\s+/);

      const face = parts.map((part) => {
        const slash = part.indexOf('/');

        return parseInt(slash === -1 ? part : part.slice(0, slash), 10) - 1;
      });

      for (let i = 1; i < face.length - 1; i++) {
        indices.push(face[0], face[i], face[i + 1]);
      }
    }
  }

  return output(vertices, indices);
};

const gearLarge = await readFile('./models/gear-large.obj', 'utf8');

const gearSmall = await readFile('./models/gear-small.obj', 'utf8');

const gearCenter = await readFile('./models/gear-center.obj', 'utf8');

await writeFile('./src/models/gear-large.js', parseOBJ(gearLarge));

await writeFile('./src/models/gear-small.js', parseOBJ(gearSmall));

await writeFile('./src/models/gear-center.js', parseOBJ(gearCenter));

console.log('Success!');
