import { readFile } from 'node:fs/promises';

import compressShader from './compressShader';

// THREE shader chunks
const shaderOptions = Object.seal({
  default_vertex: false,
  default_fragment: false,

  alphahash_fragment: false,
  alphahash_pars_fragment: false,
  alphamap_fragment: false,
  alphamap_pars_fragment: false,
  alphatest_fragment: false,
  alphatest_pars_fragment: false,
  aomap_fragment: false,
  aomap_pars_fragment: false,
  batching_pars_vertex: false,
  batching_vertex: false,
  begin_vertex: false,
  beginnormal_vertex: false,
  bsdfs: false,
  iridescence_fragment: false,
  bumpmap_pars_fragment: false,
  clipping_planes_fragment: false,
  clipping_planes_pars_fragment: false,
  clipping_planes_pars_vertex: false,
  clipping_planes_vertex: false,
  color_fragment: false,
  color_pars_fragment: false,
  color_pars_vertex: false,
  color_vertex: false,
  common: false,
  cube_uv_reflection_fragment: false,
  defaultnormal_vertex: false,
  displacementmap_pars_vertex: false,
  displacementmap_vertex: false,
  emissivemap_fragment: false,
  emissivemap_pars_fragment: false,
  colorspace_fragment: false,
  colorspace_pars_fragment: false,
  envmap_fragment: false,
  envmap_common_pars_fragment: false,
  envmap_pars_fragment: false,
  envmap_pars_vertex: false,
  envmap_physical_pars_fragment: false,
  envmap_vertex: false,
  fog_vertex: false,
  fog_pars_vertex: false,
  fog_fragment: false,
  fog_pars_fragment: false,
  gradientmap_pars_fragment: false,
  lightmap_pars_fragment: false,
  lights_lambert_fragment: false,
  lights_lambert_pars_fragment: false,
  lights_pars_begin: false,
  lights_toon_fragment: false,
  lights_toon_pars_fragment: false,
  lights_phong_fragment: false,
  lights_phong_pars_fragment: false,
  lights_physical_fragment: false,
  lights_physical_pars_fragment: false,
  lights_fragment_begin: false,
  lights_fragment_maps: false,
  lights_fragment_end: false,
  logdepthbuf_fragment: false,
  logdepthbuf_pars_fragment: false,
  logdepthbuf_pars_vertex: false,
  logdepthbuf_vertex: false,
  map_fragment: false,
  map_pars_fragment: false,
  map_particle_fragment: false,
  map_particle_pars_fragment: false,
  metalnessmap_fragment: false,
  metalnessmap_pars_fragment: false,
  morphinstance_vertex: false,
  morphcolor_vertex: false,
  morphnormal_vertex: false,
  morphtarget_pars_vertex: false,
  morphtarget_vertex: false,
  normal_fragment_begin: false,
  normal_fragment_maps: false,
  normal_pars_fragment: false,
  normal_pars_vertex: false,
  normal_vertex: false,
  normalmap_pars_fragment: false,
  clearcoat_normal_fragment_begin: false,
  clearcoat_normal_fragment_maps: false,
  clearcoat_pars_fragment: false,
  iridescence_pars_fragment: false,
  opaque_fragment: false,
  packing: false,
  premultiplied_alpha_fragment: false,
  project_vertex: false,
  dithering_fragment: false,
  dithering_pars_fragment: false,
  roughnessmap_fragment: false,
  roughnessmap_pars_fragment: false,
  shadowmap_pars_fragment: false,
  shadowmap_pars_vertex: false,
  shadowmap_vertex: false,
  shadowmask_pars_fragment: false,
  skinbase_vertex: false,
  skinning_pars_vertex: false,
  skinning_vertex: false,
  skinnormal_vertex: false,
  specularmap_fragment: false,
  specularmap_pars_fragment: false,
  tonemapping_fragment: false,
  tonemapping_pars_fragment: false,
  transmission_fragment: false,
  transmission_pars_fragment: false,
  uv_pars_fragment: false,
  uv_pars_vertex: false,
  uv_vertex: false,
  worldpos_vertex: false,

  _occlusion_vertex: false,
  _occlusion_fragment: false,
});

// THREE material shaders
const materialShaders = {
  background: 'background', // Scene.background == Texture
  backgroundCube: 'backgroundCube', // Scene.background == CubeTexture
  cube: 'cube',
  depth: 'depth', // MeshDepthMaterial
  distance: 'distanceRGBA', // MeshDistanceMaterial
  equirect: 'equirect',
  lineDashed: 'linedashed', // LineDashedMaterial
  basic: 'meshbasic', // LineBasicMaterial || MeshBasicMaterial
  lambert: 'meshlambert', // MeshLambertMaterial
  matcap: 'meshmatcap', // MeshMatcapMaterial
  normal: 'meshnormal', // MeshNormalMaterial
  phong: 'meshphong', // MeshPhongMaterial
  physical: 'meshphysical', // MeshStandardMaterial || MeshPhysicalMaterial
  toon: 'meshtoon', // MeshToonMaterial
  points: 'points', // PointsMaterial
  shadow: 'shadow', // ShadowMaterial
  sprite: 'sprite', // SpriteMaterial
};

const materialOptions = Object.seal({
  background: false,
  backgroundCube: false,
  cube: false,
  depth: false,
  distance: false,
  equirect: false,
  lineDashed: false,
  basic: false,
  lambert: false,
  matcap: false,
  normal: false,
  phong: false,
  physical: false,
  toon: false,
  points: false,
  shadow: false,
  sprite: false,
});

// THREE inline shader code is preceded by "/* glsl */"
const inlineShaderRegex = /(?<=\/\* glsl \*\/\s*`)[\s\S]+?(?=`)/g;

const q = '[\'`"]';

export default function threeCompressPlugin({
  colorKeywords = false,
  materials = {},
  shaders = {},
}) {
  try {
    Object.assign(materialOptions, materials);
  } catch (error) {
    console.error(error);
  }

  try {
    Object.assign(shaderOptions, shaders);
  } catch (error) {
    console.error(error);
  }

  return {
    name: 'vite-plugin-three-precompress',
    enforce: 'pre',
    async load(path) {
      if (!path.includes('node_modules/three/build/')) return;

      /** @type {string} */
      let code;

      try {
        code = await readFile(path, 'utf8');
      } catch (error) {
        return console.error('\n' + error);
      }

      // Remove color keywords
      if (colorKeywords === false) {
        code = code.replace(/(?<=_colorKeywords = {)[\s\S]+?(?=};)/, '');
      }

      // Remove unwanted ("bad") shader chunks
      /** @type {string[]} */
      const badShaders = [];

      /** @type {string[]} */
      const goodShaders = [];

      Object.entries(shaderOptions).map(([shader, include]) => {
        if (include === true) return goodShaders.push(shader);
        badShaders.push(shader);
      });

      code = code.replace(
        new RegExp(
          `(?<= (${badShaders.join('|')}) = )${q}[\\s\\S]+?${q}(?=;)`,
          'g',
        ),
        '``',
      );

      // Find unwanted ("bad") material shaders
      /** @type {string[]} */
      const badMaterials = [];

      Object.entries(materialOptions).map(([material, include]) => {
        const materialShaderNames = code.match(
          new RegExp(
            `(?<=${materialShaders[material]}_(?:vert|frag): )\\S+(?=\\b)`,
            'g',
          ),
        );

        if (Array.isArray(materialShaderNames)) {
          const safeMaterialShaderNames = materialShaderNames.map((name) => {
            return name.replace('$', '\\$');
          });

          if (include === true) {
            return goodShaders.push(...safeMaterialShaderNames);
          }
          badMaterials.push(...safeMaterialShaderNames);
        }
      });

      // Remove unwanted ("bad") material shaders
      code = code.replace(
        new RegExp(
          `(?<= (${badMaterials.join('|')}) = )${q}[\\s\\S]+?${q}(?=;)`,
          'g',
        ),
        '``',
      );

      // Remove unwanted ("bad") shader includes
      code = code.replace(
        new RegExp(`#include <(${badShaders.join('|')})>`, 'g'),
        '',
      );

      // Compress wanted ("good") shader chunks
      const shaderChunks = code.match(
        new RegExp(
          `(?<= (${goodShaders.join('|')}) = )${q}[\\s\\S]+?${q}(?=;)`,
          'g',
        ),
      );

      if (Array.isArray(shaderChunks)) {
        for (const shaderChunk of shaderChunks) {
          code = code.replace(
            shaderChunk,
            '`\n' +
              compressShader(
                shaderChunk
                  .substring(1, shaderChunk.length - 1)
                  .replaceAll('\\n', '\n')
                  .replaceAll('\\t', '\t'),
              ) +
              '`',
          );
        }
      }

      // Compress inline shader code
      const inlineShaders = code.match(inlineShaderRegex);

      if (Array.isArray(inlineShaders)) {
        for (const shader of inlineShaders) {
          code = code.replace(shader, compressShader(shader));
        }
      }

      return code;
    },
  };
}
