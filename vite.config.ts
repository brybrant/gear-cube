import viteConfig from '@brybrant/vite-config';

import threeMinifyPlugin from 'rollup-plugin-three-minify';

export default viteConfig({
  base: '/gear-cube/',
  plugins: [
    threeMinifyPlugin({
      features: ['batching', 'colorspace', 'dithering', 'normals', 'vertices'],
      chunks: ['worldpos_vertex'],
    }),
  ],
});
