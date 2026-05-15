import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  publicDir: './old',
  adapter: vercel({
    includeFiles: ['./templates/**/*'],
  }),
});
