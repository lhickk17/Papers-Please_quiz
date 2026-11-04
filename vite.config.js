import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

function preserveOriginalAssets() {
  return {
    name: 'preserve-original-assets',
    closeBundle() {
      const output = resolve(process.cwd(), 'dist');
      mkdirSync(output, { recursive: true });
      for (const folder of ['assets', 'assets-sounds']) {
        const source = resolve(process.cwd(), folder);
        if (existsSync(source)) cpSync(source, resolve(output, folder), { recursive: true });
      }
    }
  };
}

export default defineConfig({
  base: '/Papers-Please_quiz/',
  plugins: [preserveOriginalAssets()]
});
