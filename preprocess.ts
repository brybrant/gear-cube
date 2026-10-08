import { mkdir } from 'node:fs/promises';
import { file, write } from 'bun';

const output = (vertices: number[], indices: number[]) =>
  [
    '/* eslint-disable prettier/prettier */',
    `export const vertices = new Float32Array([${vertices.join(',')}]);\n`,
    `export const indices = new Uint16Array([${indices.join(',')}]);\n`,
  ].join('\n');

const threeDecimals = (number: number) => Math.round(number * 1e3) / 1e3;

const parseOBJ = (data: string) => {
  const vertices: number[] = [];
  const indices: number[] = [];

  const lines = data.split('\n');

  for (const line of lines) {
    if (line.startsWith('v ')) {
      const [, x, y, z] = line.split(/\s+/);

      vertices.push(
        threeDecimals(Number(x)),
        threeDecimals(Number(y)),
        threeDecimals(Number(z)),
      );
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

const gearLarge = await file('./models/gear-large.obj').text();
const gearSmall = await file('./models/gear-small.obj').text();
const gearCenter = await file('./models/gear-center.obj').text();

await mkdir('./src/models', { recursive: true });

await write('./src/models/gear-large.ts', parseOBJ(gearLarge));
await write('./src/models/gear-small.ts', parseOBJ(gearSmall));
await write('./src/models/gear-center.ts', parseOBJ(gearCenter));

console.log('Success!');
