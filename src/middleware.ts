import { defineMiddleware } from 'astro:middleware';
import fs from 'node:fs';
import path from 'node:path';

export const onRequest = defineMiddleware(async (context, next) => {
  const rscHeader = context.request.headers.get('rsc');

  if (rscHeader === '1') {
    const url = new URL(context.request.url);
    let pathname = url.pathname;

    if (!pathname.endsWith('/') && !pathname.includes('.')) {
      pathname = pathname + '/';
    }

    let txtPath: string;
    if (pathname === '/') {
      txtPath = path.join(process.cwd(), 'old', '__next._index.txt');
    } else {
      const cleanPath = pathname.replace(/^\//, '').replace(/\/$/, '');
      txtPath = path.join(process.cwd(), 'old', cleanPath, '__next._index.txt');
    }

    if (fs.existsSync(txtPath)) {
      const content = fs.readFileSync(txtPath, 'utf-8');
      return new Response(content, {
        status: 200,
        headers: {
          'Content-Type': 'text/x-component',
          'Cache-Control': 'no-store',
          'vary': 'RSC, Next-Router-State-Tree, Next-Router-Prefetch',
        },
      });
    }
  }

  return next();
});
