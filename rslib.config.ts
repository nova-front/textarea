import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  source: {
    entry: {
      index: ['./src/**'],
    },
    exclude: ['**/*.test.*', '**/*.spec.*', '**/__tests__/**'],
  },
  lib: [
    {
      bundle: false,
      dts: true, // 启用类型生成
      format: 'esm',
    },
  ],
  output: {
    target: 'web',
    copy: [
      // `./assets/image.png` -> `./dist/assets/image.png`
      { from: './assets', to: 'assets' },
    ],
  },
  plugins: [pluginReact()],
});
