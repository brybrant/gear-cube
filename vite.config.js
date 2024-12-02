import { defineConfig } from 'vite';
import eslintPlugin from 'vite-plugin-eslint2';
import stylelintPlugin from 'vite-plugin-stylelint';
import svgoPlugin from 'vite-plugin-svgo';
import threeCompressPlugin from './compressTHREE.js';

import * as configs from '@brybrant/configs';

export default defineConfig(({ mode }) => {
  const development = mode === 'development';

  return {
    base: '/gear-cube/',
    build: {
      minify: development ? true : 'terser',
      ...(!development && {
        terserOptions: configs.terserConfig,
      }),
    },
    css: {
      postcss: configs.postCSSConfig,
    },
    plugins: [
      threeCompressPlugin({
        materials: {
          phong: true,
        },
        shaders: {
          begin_vertex: true,
          beginnormal_vertex: true,
          bsdfs: true,
          common: true,
          defaultnormal_vertex: true,
          colorspace_fragment: true,
          colorspace_pars_fragment: true,
          lights_pars_begin: true,
          lights_phong_fragment: true,
          lights_phong_pars_fragment: true,
          lights_fragment_begin: true,
          lights_fragment_end: true,
          normal_fragment_begin: true,
          normal_pars_fragment: true,
          normal_pars_vertex: true,
          normal_vertex: true,
          opaque_fragment: true,
          project_vertex: true,
          specularmap_fragment: true,
        },
      }),
      stylelintPlugin({
        lintInWorker: true,
        config: configs.stylelintConfig,
      }),
      svgoPlugin(configs.svgoConfig),
      eslintPlugin({
        lintInWorker: true,
      }),
    ],
    server: {
      host: '127.0.0.1',
      port: 3000,
      strictPort: true,
    },
  };
});
