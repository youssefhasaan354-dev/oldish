const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:5173';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Desktop
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });

  // Slide 0 Desktop
  await page.screenshot({ path: 'screenshot-desktop-slide-0.png' });
  console.log('Saved screenshot-desktop-slide-0.png');

  // Next slide (Slide 1)
  await page.evaluate(() => {
    const nextBtn = document.querySelectorAll('.hero-slide-btn')[1];
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: 'screenshot-desktop-slide-1.png' });
  console.log('Saved screenshot-desktop-slide-1.png');

  // Next slide (Slide 2)
  await page.evaluate(() => {
    const nextBtn = document.querySelectorAll('.hero-slide-btn')[1];
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: 'screenshot-desktop-slide-2.png' });
  console.log('Saved screenshot-desktop-slide-2.png');

  // Mobile Viewport (iPhone 14 / 390px)
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'screenshot-mobile-hero.png' });
  console.log('Saved screenshot-mobile-hero.png');

  // Mobile Menu Drawer Open
  await page.evaluate(() => {
    const toggle = document.querySelector('.mobile-menu-toggle');
    if (toggle) toggle.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'screenshot-mobile-drawer.png' });
  console.log('Saved screenshot-mobile-drawer.png');

  await browser.close();
})();
