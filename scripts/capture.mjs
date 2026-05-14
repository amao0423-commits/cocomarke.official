import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const BASE_URL = 'http://localhost:4321';

const PAGES = [
  { url: '/',                  file: 'old/index.html' },
  { url: '/about/',            file: 'old/about/index.html' },
  { url: '/blog/',             file: 'old/blog/index.html' },
  { url: '/contact/',          file: 'old/contact/index.html' },
  { url: '/contact/thanks/',   file: 'old/contact/thanks/index.html' },
  { url: '/blog/sample/',      file: 'old/blog/sample/index.html' },
];

const browser = await chromium.launch();
const page = await browser.newPage();

for (const { url, file } of PAGES) {
  process.stdout.write(`Capturing ${url} ... `);

  await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for spinner to disappear (React rendered via RSC payload)
  await page.waitForFunction(
    () => !document.querySelector('.animate-spin'),
    { timeout: 15000 }
  ).catch(() => process.stdout.write('(spinner still visible) '));

  // Extra settle time for final renders
  await page.waitForTimeout(1500);

  const html = await page.content();
  fs.writeFileSync(path.join(ROOT, file), html, 'utf-8');

  // Verify main has real content
  const mainLength = await page.$eval('main', el => el.innerHTML.length);
  console.log(`saved ${html.length} bytes, main=${mainLength} chars`);
}

await browser.close();
console.log('\nDone! Re-check with: curl http://localhost:4321/');
