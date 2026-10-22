const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:5173';

const widths = [320, 360, 375, 390, 414, 480, 600, 768, 820, 1024, 1280, 1440, 1920, 2560];

async function deepQa() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Collect console errors & warnings
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });

  console.log('\n--- TEST A: Viewports & Orientations (Portrait & Landscape, RTL & LTR) ---');
  for (const lang of ['ar', 'en']) {
    const isAr = await page.evaluate(() => document.documentElement.getAttribute('dir') === 'rtl');
    if ((lang === 'ar' && !isAr) || (lang === 'en' && isAr)) {
      await page.click('.lang-switch-btn');
      await new Promise(r => setTimeout(r, 400));
    }
    const currentDir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
    console.log(`Testing direction: ${currentDir}`);

    for (const w of widths) {
      // Portrait
      const hPortrait = Math.round(w * 1.6);
      await page.setViewport({ width: w, height: Math.min(Math.max(hPortrait, 500), 1200) });
      await new Promise(r => setTimeout(r, 50));
      const overflowP = await page.evaluate((width) => {
        return Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - width;
      }, w);
      if (overflowP > 1) {
        console.error(`OVERFLOW PORTRAIT at ${w}px (${currentDir}): +${overflowP}px`);
      }

      // Landscape
      const wLand = Math.min(Math.max(Math.round(w * 1.5), 600), 2560);
      const hLand = Math.min(w, 800);
      await page.setViewport({ width: wLand, height: hLand });
      await new Promise(r => setTimeout(r, 50));
      const overflowL = await page.evaluate((width) => {
        return Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - width;
      }, wLand);
      if (overflowL > 1) {
        console.error(`OVERFLOW LANDSCAPE at ${wLand}x${hLand}px (${currentDir}): +${overflowL}px`);
      }
    }
  }

  console.log('\n--- TEST B: Browser Zoom 150% and 200% ---');
  for (const zoom of [1.5, 2.0]) {
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: zoom });
    await new Promise(r => setTimeout(r, 100));
    const overflowZ = await page.evaluate(() => {
      return Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth;
    });
    console.log(`Zoom ${(zoom * 100)}%: overflow = ${overflowZ}px`);
  }

  // Reset viewport
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

  console.log('\n--- TEST C: Navigation & Smooth Scroll Offsets ---');
  const sections = ['story', 'atmosphere', 'menu', 'gallery', 'reviews', 'reservations', 'locations'];
  for (const sec of sections) {
    const check = await page.evaluate((id) => {
      const el = document.getElementById(id);
      if (!el) return { found: false };
      el.scrollIntoView({ behavior: 'instant' });
      const rect = el.getBoundingClientRect();
      const header = document.querySelector('.site-header');
      const headerH = header ? header.offsetHeight : 84;
      return {
        found: true,
        top: rect.top,
        headerHeight: headerH,
        isCoveredByHeader: rect.top < (headerH - 5)
      };
    }, sec);
    console.log(`Section #${sec}: top = ${check.top}px, header = ${check.headerHeight}px, covered = ${check.isCoveredByHeader}`);
    if (check.isCoveredByHeader) {
      console.error(`WARNING: Section #${sec} is covered by the header!`);
    }
  }

  console.log('\n--- TEST D: Interactive Elements ---');
  // 1. Menu Category Tabs
  const catTabCount = await page.evaluate(() => {
    const tabs = document.querySelectorAll('.category-pills .cat-pill');
    return tabs.length;
  });
  console.log(`Menu Category Tabs found: ${catTabCount}`);
  if (catTabCount > 1) {
    await page.evaluate(() => {
      const tabs = document.querySelectorAll('.category-pills .cat-pill');
      tabs[1].click();
    });
    await new Promise(r => setTimeout(r, 200));
  }

  // 2. Menu Search Box
  await page.type('.menu-search-input', 'طاجن');
  await new Promise(r => setTimeout(r, 200));
  const filteredDishesCount = await page.evaluate(() => {
    return document.querySelectorAll('.menu-card').length;
  });
  console.log(`Search for "طاجن": found ${filteredDishesCount} dishes`);

  // Clear search
  await page.evaluate(() => {
    const input = document.querySelector('.menu-search-input');
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 200));

  // 3. Gallery Lightbox Modal
  console.log('Testing Gallery Lightbox...');
  await page.evaluate(() => {
    const firstImg = document.querySelector('.gallery-card');
    if (firstImg) firstImg.click();
  });
  await new Promise(r => setTimeout(r, 300));
  const lightboxOpen = await page.evaluate(() => {
    return !!document.querySelector('.lightbox-modal');
  });
  console.log(`Lightbox open: ${lightboxOpen}`);
  
  if (lightboxOpen) {
    // Test Next
    await page.evaluate(() => {
      const nextBtn = document.querySelector('.lightbox-btn.next');
      if (nextBtn) nextBtn.click();
    });
    await new Promise(r => setTimeout(r, 200));

    // Close on Esc
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 200));
    const lightboxClosed = await page.evaluate(() => !document.querySelector('.lightbox-modal'));
    console.log(`Lightbox closed on Escape: ${lightboxClosed}`);
  }

  // 4. Reservation Form Validation & Submission
  console.log('Testing Reservation Form...');
  await page.evaluate(() => {
    const form = document.querySelector('#reservations form');
    if (form) {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 200));
  const hasErrors = await page.evaluate(() => {
    return document.querySelectorAll('.form-error-msg').length > 0;
  });
  console.log(`Reservation Form validates required fields: ${hasErrors}`);

  // Fill and submit
  await page.type('#res-name', 'أحمد محمود');
  await page.type('#res-phone', '01012345678');
  await page.evaluate(() => {
    const form = document.querySelector('#reservations form');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  const resSuccess = await page.evaluate(() => {
    return !!document.querySelector('.reservation-success-box');
  });
  console.log(`Reservation submitted successfully: ${resSuccess}`);

  // 5. Standalone /menu Route
  console.log('\n--- TEST E: Standalone /menu Route ---');
  await page.goto(`${BASE_URL}/menu`, { waitUntil: 'networkidle2' });
  const menuInfo = await page.evaluate(() => {
    const title = document.querySelector('h1')?.innerText;
    const items = document.querySelectorAll('.menu-item-card').length;
    const overflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth;
    return { title, items, overflow };
  });
  console.log('Standalone Menu Page:', menuInfo);

  // Check /menu at 375px mobile
  await page.setViewport({ width: 375, height: 667 });
  await new Promise(r => setTimeout(r, 100));
  const menuMobileOverflow = await page.evaluate(() => {
    return Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth;
  });
  console.log(`Standalone Menu at 375px overflow: ${menuMobileOverflow}px`);

  // Console errors summary
  console.log(`\nTotal Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console Errors:', consoleErrors);
  }

  await browser.close();
}

deepQa().catch(err => {
  console.error('Deep QA Error:', err);
  process.exit(1);
});
