const { chromium } = require('/home/hatch/tools/shots/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  const out = '/home/hatch/workspace/invilab/shots';

  await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: out + '/01-login.png' });

  await page.fill('#email', 'admin@invilab.test');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/barang', { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: out + '/02-barang.png', fullPage: true });

  await page.goto('http://localhost:8080/peminjaman', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: out + '/03-peminjaman.png', fullPage: true });

  await page.goto('http://localhost:8080/kategori', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: out + '/04-kategori.png', fullPage: true });

  console.log('errors:', JSON.stringify(errors));
  await browser.close();
})();
