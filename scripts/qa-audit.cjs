const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:5173';

const widths = [320, 360, 375, 390, 414, 480, 600, 768, 820, 1024, 1280, 1440, 1920, 2560];

async function runAudit() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  console.log('=== 1. Checking Demo Banner & Navbar Position ===');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });

  const bannerCheck = await page.evaluate(() => {
    const demo = document.querySelector('.demo-top-banner') || document.querySelector('.demo-banner');
    const header = document.querySelector('.site-header');
    const headerRect = header ? header.getBoundingClientRect() : null;
    return {
      hasDemoBanner: !!demo,
      demoText: demo ? demo.innerText : null,
      headerTop: headerRect ? headerRect.top : null,
      headerHeight: headerRect ? headerRect.height : null,
      bodyPaddingTop: window.getComputedStyle(document.body).paddingTop
    };
  });
  console.log('Banner Check:', bannerCheck);

  console.log('\n=== 2. Checking Hero Elements Readability & Styles ===');
  const heroCheck = await page.evaluate(() => {
    const hero = document.querySelector('.hero-section');
    const overlay = document.querySelector('.hero-overlay');
    const title = document.querySelector('.hero-headline');
    const eyebrow = document.querySelector('.hero-eyebrow');
    const subtitle = document.querySelector('.hero-subtitle');
    const badges = Array.from(document.querySelectorAll('.hero-content .badge')).map(b => ({
      text: b.innerText,
      color: window.getComputedStyle(b).color,
      bg: window.getComputedStyle(b).backgroundColor,
      border: window.getComputedStyle(b).border,
      opacity: window.getComputedStyle(b).opacity,
      backdropFilter: window.getComputedStyle(b).backdropFilter
    }));
    const buttons = Array.from(document.querySelectorAll('.hero-ctas .btn')).map(b => ({
      text: b.innerText,
      className: b.className,
      color: window.getComputedStyle(b).color,
      bg: window.getComputedStyle(b).backgroundColor,
      border: window.getComputedStyle(b).border
    }));
    const hoursPill = document.querySelector('.hero-hours-pill');

    return {
      overlayBg: overlay ? window.getComputedStyle(overlay).backgroundImage : null,
      overlayOpacity: overlay ? window.getComputedStyle(overlay).opacity : null,
      heroMinHeight: hero ? window.getComputedStyle(hero).minHeight : null,
      titleColor: title ? window.getComputedStyle(title).color : null,
      titleShadow: title ? window.getComputedStyle(title).textShadow : null,
      eyebrowColor: eyebrow ? window.getComputedStyle(eyebrow).color : null,
      eyebrowShadow: eyebrow ? window.getComputedStyle(eyebrow).textShadow : null,
      subtitleColor: subtitle ? window.getComputedStyle(subtitle).color : null,
      subtitleShadow: subtitle ? window.getComputedStyle(subtitle).textShadow : null,
      badges,
      buttons,
      hoursPillColor: hoursPill ? window.getComputedStyle(hoursPill).color : null,
      hoursPillBg: hoursPill ? window.getComputedStyle(hoursPill).backgroundColor : null,
      hoursPillBorder: hoursPill ? window.getComputedStyle(hoursPill).border : null
    };
  });
  console.log('Hero Check:', JSON.stringify(heroCheck, null, 2));

  console.log('\n=== 3. Testing Viewport Widths for Overflow (RTL & LTR) ===');
  for (const dir of ['rtl', 'ltr']) {
    if (dir === 'ltr') {
      // Toggle language to English
      await page.click('.lang-switch-btn');
      await new Promise(r => setTimeout(r, 400));
    }
    const overflows = [];
    for (const w of widths) {
      await page.setViewport({ width: w, height: 800 });
      await new Promise(r => setTimeout(r, 100));
      const overflow = await page.evaluate((width) => {
        const docWidth = document.documentElement.offsetWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        const diff = Math.max(scrollWidth, bodyScrollWidth) - width;
        return { diff, scrollWidth, bodyScrollWidth, width };
      }, w);
      if (overflow.diff > 1) {
        overflows.push(`Width ${w}px: overflow by ${overflow.diff}px`);
      }
    }
    console.log(`[${dir.toUpperCase()}] Overflows (${overflows.length}):`, overflows);
  }

  console.log('\n=== 4. Checking Mobile Drawer Behavior ===');
  await page.setViewport({ width: 375, height: 667 });
  const drawerCheck = await page.evaluate(async () => {
    const toggle = document.querySelector('.mobile-menu-toggle');
    if (!toggle) return { error: 'No mobile-menu-toggle found' };
    
    toggle.click();
    await new Promise(r => setTimeout(r, 300));
    const drawer = document.querySelector('.mobile-drawer');
    const isOpen = drawer ? drawer.classList.contains('open') : false;
    const bodyOverflow = document.body.style.overflow;
    const transform = drawer ? window.getComputedStyle(drawer).transform : null;
    
    return { isOpen, bodyOverflow, transform };
  });
  console.log('Mobile Drawer Check:', drawerCheck);

  await browser.close();
}

runAudit().catch(err => {
  console.error('Audit Error:', err);
  process.exit(1);
});
