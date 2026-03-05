import { chromium } from 'playwright';

const PAGES = [
  { name: 'welcome-catalog', path: '/welcome', desc: 'Landing / Catalog' },
  { name: 'login', path: '/login', desc: 'Login Page' },
  { name: 'catalog-popular', path: '/catalog?sort=popular', desc: 'Catalog (Popular)' },
  { name: 'pricing', path: '/pricing', desc: 'Pricing Page' },
];

const BASE = 'http://localhost:5001';
const OUT = '/Users/laijingchu/Desktop/Syllabind/repo/screenshots';

const browser = await chromium.launch();

for (const { name, path, desc } of PAGES) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000); // let animations settle
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
    console.log(`✓ ${desc} → ${name}.png`);
  } catch (e) {
    console.log(`✗ ${desc} → ${e.message}`);
  }
  await page.close();
}

await browser.close();
console.log('\nDone!');
