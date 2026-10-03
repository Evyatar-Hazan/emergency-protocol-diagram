import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const repoRoot = resolve(import.meta.dirname, '..');
const clientDist = resolve(repoRoot, 'apps/client/dist');
const assetsDir = resolve(clientDist, 'assets');
const maxTotalGzipBytes = 12 * 1024;
const maxOfflineRouteGzipBytes = 1024;

const stylesheetLinks = (html) => [...html.matchAll(
  /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/g,
)].map((match) => match[1]);

const gzipBytes = (value) => gzipSync(value, { level: 9 }).length;
const readAsset = (href) => readFileSync(resolve(clientDist, href.replace(/^\//, '')));

const offlineHtml = readFileSync(resolve(clientDist, 'offline-learning.html'), 'utf8');
const mainHtml = readFileSync(resolve(clientDist, 'index.html'), 'utf8');
const offlineCssLinks = stylesheetLinks(offlineHtml);
const mainCssLinks = stylesheetLinks(mainHtml);

if (offlineCssLinks.length !== 1 || !offlineCssLinks[0].includes('/offline-learning-')) {
  throw new Error(`Offline route must link exactly one dedicated stylesheet; found ${offlineCssLinks.join(', ') || 'none'}`);
}
if (offlineCssLinks.some((href) => mainCssLinks.includes(href))) {
  throw new Error('Offline route must not reuse the main application stylesheet.');
}

const offlineCss = readAsset(offlineCssLinks[0]);
const offlineCssText = offlineCss.toString('utf8');
if (/@import|fonts\.googleapis\.com|url\(\s*["']?https?:/i.test(offlineCssText)) {
  throw new Error('Offline stylesheet must not depend on external fonts or URLs.');
}

const cssFiles = readdirSync(assetsDir).filter((file) => file.endsWith('.css')).sort();
const measurements = cssFiles.map((file) => {
  const content = readFileSync(resolve(assetsDir, file));
  return { file, rawBytes: content.length, gzipBytes: gzipBytes(content) };
});
const totalRawBytes = measurements.reduce((sum, item) => sum + item.rawBytes, 0);
const totalGzipBytes = measurements.reduce((sum, item) => sum + item.gzipBytes, 0);
const offlineRouteGzipBytes = gzipBytes(offlineCss);
const mainRouteGzipBytes = mainCssLinks.reduce((sum, href) => sum + gzipBytes(readAsset(href)), 0);

console.log(JSON.stringify({
  routes: {
    main: { stylesheets: mainCssLinks, gzipBytes: mainRouteGzipBytes },
    offline: { stylesheets: offlineCssLinks, gzipBytes: offlineRouteGzipBytes },
  },
  allCss: { files: measurements, rawBytes: totalRawBytes, gzipBytes: totalGzipBytes },
  budgets: { offlineRouteGzipBytes: maxOfflineRouteGzipBytes, totalGzipBytes: maxTotalGzipBytes },
}, null, 2));

if (offlineRouteGzipBytes > maxOfflineRouteGzipBytes) {
  throw new Error(`Offline route CSS is ${offlineRouteGzipBytes} gzip bytes; budget is ${maxOfflineRouteGzipBytes}.`);
}
if (totalGzipBytes > maxTotalGzipBytes) {
  throw new Error(`Total CSS is ${totalGzipBytes} gzip bytes; budget is ${maxTotalGzipBytes}.`);
}
