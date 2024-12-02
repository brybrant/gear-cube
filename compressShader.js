// Adapted from vite-plugin-glsl
// https://github.com/UstymUkhman/vite-plugin-glsl/blob/main/src/loadShader.js

/**
 * Removes comments from shader source code
 *
 * @param {string} shader Shader source code
 *
 * @returns {string} Shader source code without comments
 */
function removeComments(shader) {
  if (shader.includes('/*') && shader.includes('*/')) {
    shader =
      shader.slice(0, shader.indexOf('/*')) +
      shader.slice(shader.indexOf('*/') + 2, shader.length);
  }

  const lines = shader.split('\\n');

  for (let l = lines.length; l--; ) {
    const index = lines[l].indexOf('//');

    if (index > -1) {
      lines[l] = lines[l].slice(0, lines[l].indexOf('//'));
    }
  }

  return lines.join('\n');
}

/**
 * Compress the shader code
 *
 * @param {string} shader Shader code
 *
 * @returns {string} Compressed shader code
 */
export default function (shader) {
  const compressedShader = removeComments(shader);

  let newLine = false;

  return compressedShader
    .split(/\n+/)
    .reduce((result, line) => {
      line = line
        .trim()
        .replace(/\s{2,}/g, ' ') // 2 or more consecutive whitespace to 1
        .replace(/\b0(\.\d+)/g, '$1') // Floats starting with 0 (0.1 → .1)
        .replace(/(\d+\.)0\b/g, '$1'); // Floats ending with 0 (1.0 → 1.)

      if (line[0] === '#') {
        newLine && result.push('\n');
        result.push(line, '\n');
        newLine = false;
      } else {
        !line.startsWith('{') &&
          result.length &&
          result[result.length - 1].endsWith('else') &&
          result.push(' ');

        result.push(
          line.replace(
            /\s*({|}|=|\*|,|\+|\/|>|<|&|\||\[|\]|\(|\)|-|!|\?|:|;)\s*/g,
            '$1',
          ),
        );
        newLine = true;
      }

      return result;
    }, [])
    .join('')
    .replace(/\n+/g, '\n');
}
