const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:4173';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Desktop Home
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'screenshot-desktop-home.png' });
  console.log('Saved screenshot-desktop-home.png');

  // Mobile Home
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'screenshot-mobile-home.png' });
  console.log('Saved screenshot-mobile-home.png');

  // Menu Page
  await page.goto(`${BASE_URL}/menu`, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'screenshot-mobile-menu.png' });
  console.log('Saved screenshot-mobile-menu.png');

  // Admin Page
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'screenshot-admin-login.png' });
  console.log('Saved screenshot-admin-login.png');

  await browser.close();
  console.log('All screenshots captured successfully in real Google Chrome!');
})();
