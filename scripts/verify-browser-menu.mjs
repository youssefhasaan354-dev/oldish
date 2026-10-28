import puppeteer from 'puppeteer-core';
import { preview } from 'vite';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runTest() {
  console.log('--- Starting Vite Preview Server ---');
  const server = await preview({
    preview: {
      port: 4199,
      strictPort: false,
    },
  });

  const rawUrl = server.resolvedUrls.local[0] || 'http://localhost:4199';
  const previewUrl = rawUrl.replace(/\/$/, '');
  console.log(`Preview server running at: ${previewUrl}`);

  console.log('--- Launching Chrome via Puppeteer ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
    ],
  });

  let allPassed = true;

  try {
    const viewports = [
      { name: 'Desktop Viewport (1400x900)', width: 1400, height: 900 },
      { name: 'Mobile Viewport (390x844)', width: 390, height: 844 },
    ];

    for (const vp of viewports) {
      console.log(`\n========================================`);
      console.log(`TESTING: ${vp.name}`);
      console.log(`========================================`);

      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });

      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      page.on('pageerror', (err) => {
        consoleErrors.push(err.toString());
      });

      console.log(`Navigating to ${previewUrl}...`);
      await page.goto(previewUrl, { waitUntil: 'networkidle0', timeout: 30000 });

      // Slowly scroll down the full page
      console.log('Scrolling slowly through the full page...');
      const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      const step = 250;
      for (let y = 0; y <= scrollHeight; y += step) {
        await page.evaluate((top) => window.scrollTo(0, top), y);
        await new Promise((r) => setTimeout(r, 60));
      }
      // Wait a moment for transitions/safety net
      await new Promise((r) => setTimeout(r, 600));

      // 1. Assert horizontal overflow
      const overflowCheck = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        return { docWidth, winWidth, hasOverflow: docWidth > winWidth };
      });
      if (overflowCheck.hasOverflow) {
        console.error(`❌ Horizontal overflow detected: scrollWidth (${overflowCheck.docWidth}px) > innerWidth (${overflowCheck.winWidth}px)`);
        allPassed = false;
      } else {
        console.log(`✅ Zero horizontal overflow: scrollWidth (${overflowCheck.docWidth}px) <= innerWidth (${overflowCheck.winWidth}px)`);
      }

      // 2. Assert #menu computed opacity & visibility
      const menuStatus = await page.evaluate(() => {
        const menuEl = document.getElementById('menu');
        if (!menuEl) return { exists: false };
        const style = window.getComputedStyle(menuEl);
        const rect = menuEl.getBoundingClientRect();
        const parent = menuEl.parentElement;
        const parentHasReveal = parent ? parent.classList.contains('reveal-on-scroll') : false;
        return {
          exists: true,
          opacity: style.opacity,
          display: style.display,
          visibility: style.visibility,
          height: rect.height,
          parentHasReveal,
        };
      });

      if (!menuStatus.exists) {
        console.error(`❌ #menu element NOT found in DOM!`);
        allPassed = false;
      } else {
        console.log(`✅ #menu exists in DOM. Height: ${menuStatus.height}px`);
        if (menuStatus.opacity === '1' && menuStatus.visibility === 'visible') {
          console.log(`✅ #menu computed opacity is 1 and visibility is visible (computed opacity: ${menuStatus.opacity})`);
        } else {
          console.error(`❌ #menu is invisible! opacity: ${menuStatus.opacity}, visibility: ${menuStatus.visibility}`);
          allPassed = false;
        }

        if (menuStatus.parentHasReveal) {
          console.error(`❌ #menu parent still has .reveal-on-scroll wrapper!`);
          allPassed = false;
        } else {
          console.log(`✅ #menu is NOT wrapped in .reveal-on-scroll.`);
        }
      }

      // 3. Assert all .reveal-on-scroll wrappers have .is-revealed and opacity 1
      const revealStatus = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('.reveal-on-scroll'));
        return elements.map((el, i) => {
          const style = window.getComputedStyle(el);
          const hasClass = el.classList.contains('is-revealed');
          const childSection = el.querySelector('section, div[id]')?.id || `wrapper-${i}`;
          return {
            id: childSection,
            hasClass,
            opacity: style.opacity,
          };
        });
      });

      console.log(`Checking ${revealStatus.length} .reveal-on-scroll sections:`);
      let unrevealedCount = 0;
      for (const item of revealStatus) {
        if (item.hasClass && item.opacity === '1') {
          console.log(`  ✅ Section [${item.id}]: .is-revealed = true, opacity = ${item.opacity}`);
        } else {
          console.error(`  ❌ Section [${item.id}]: .is-revealed = ${item.hasClass}, opacity = ${item.opacity}`);
          unrevealedCount++;
          allPassed = false;
        }
      }
      if (unrevealedCount === 0) {
        console.log(`✅ All ${revealStatus.length} scroll-reveal sections are revealed with opacity 1!`);
      }

      // 4. Assert #menu pagination (12 items initially rendered)
      const menuCardsCount = await page.evaluate(() => {
        return document.querySelectorAll('#menu .menu-card').length;
      });
      console.log(`Menu cards rendered on load: ${menuCardsCount}`);
      if (menuCardsCount === 12) {
        console.log(`✅ Initial menu card count is exactly 12 (pagination working as expected).`);
      } else {
        console.error(`❌ Expected 12 initial menu cards, got: ${menuCardsCount}`);
        allPassed = false;
      }

      // 5. Test "Show more" button (+12 each click)
      const showMoreResult = await page.evaluate(async () => {
        const buttons = Array.from(document.querySelectorAll('#menu button'));
        const showMoreBtn = buttons.find(b => b.textContent && (b.textContent.includes('عرض المزيد') || b.textContent.includes('Show more')));
        if (!showMoreBtn) return { found: false };
        showMoreBtn.click();
        return { found: true };
      });

      if (showMoreResult.found) {
        await new Promise(r => setTimeout(r, 200));
        const newCount = await page.evaluate(() => document.querySelectorAll('#menu .menu-card').length);
        console.log(`Menu cards after clicking "Show more": ${newCount}`);
        if (newCount === 24) {
          console.log(`✅ "Show more" added 12 items (total now 24).`);
        } else {
          console.error(`❌ Expected 24 menu cards after show more, got: ${newCount}`);
          allPassed = false;
        }
      } else {
        console.error(`❌ "Show more" button not found!`);
        allPassed = false;
      }

      // 6. Test search showing all matches without cutoff
      console.log('Testing search functionality in #menu...');
      await page.evaluate(() => {
        const input = document.querySelector('#menu input[type="text"]');
        if (input) {
          // React synthetic input event
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(input, 'بيتزا');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await new Promise(r => setTimeout(r, 300));

      const searchTest = await page.evaluate(() => {
        const count = document.querySelectorAll('#menu .menu-card').length;
        const buttons = Array.from(document.querySelectorAll('#menu button'));
        const showMoreVisible = buttons.some(b => b.textContent && (b.textContent.includes('عرض المزيد') || b.textContent.includes('Show more')));
        return { count, showMoreVisible };
      });
      console.log(`Search for "بيتزا" yielded ${searchTest.count} dishes (all matches shown, showMoreVisible: ${searchTest.showMoreVisible})`);
      if (searchTest.count > 0 && !searchTest.showMoreVisible) {
        console.log(`✅ Search shows all matches and hides "Show more" button.`);
      } else {
        console.error(`❌ Search test failed: count=${searchTest.count}, showMoreVisible=${searchTest.showMoreVisible}`);
        allPassed = false;
      }

      // Clear search
      await page.evaluate(() => {
        const input = document.querySelector('#menu input[type="text"]');
        if (input) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(input, '');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await new Promise(r => setTimeout(r, 300));

      // 7. Assert console errors
      console.log(`Console error count: ${consoleErrors.length}`);
      if (consoleErrors.length > 0) {
        console.error(`❌ Console errors detected:\n  ${consoleErrors.join('\n  ')}`);
        allPassed = false;
      } else {
        console.log(`✅ Zero console errors.`);
      }

      await page.close();
    }

    // Now test standalone /menu page
    console.log(`\n========================================`);
    console.log(`TESTING: Standalone /menu Page`);
    console.log(`========================================`);
    const menuPage = await browser.newPage();
    await menuPage.setViewport({ width: 1400, height: 900 });

    const menuConsoleErrors = [];
    menuPage.on('console', (msg) => {
      if (msg.type() === 'error') menuConsoleErrors.push(msg.text());
    });
    menuPage.on('pageerror', (err) => {
      menuConsoleErrors.push(err.toString());
    });

    console.log(`Navigating to ${previewUrl}/menu...`);
    await menuPage.goto(`${previewUrl}/menu`, { waitUntil: 'networkidle0', timeout: 30000 });
    const currentPath = await menuPage.evaluate(() => window.location.pathname);
    console.log(`Current pathname: ${currentPath}`);
    await menuPage.waitForSelector('.menu-item-card', { timeout: 10000 });

    const publicMenuInitialCount = await menuPage.evaluate(() => {
      // Screen-visible items (not .menu-item-print-only)
      const allCards = Array.from(document.querySelectorAll('.menu-item-card'));
      const visibleOnScreen = allCards.filter(c => window.getComputedStyle(c).display !== 'none');
      return { totalDom: allCards.length, visibleOnScreen: visibleOnScreen.length };
    });
    console.log(`PublicMenuPage items on screen: ${publicMenuInitialCount.visibleOnScreen}`);
    if (publicMenuInitialCount.visibleOnScreen === 12) {
      console.log(`✅ Standalone /menu displays 12 items initially on screen.`);
    } else {
      console.error(`❌ Standalone /menu visible items expected 12, got: ${publicMenuInitialCount.visibleOnScreen}`);
      allPassed = false;
    }

    // Assert print layout includes all items
    const printStylesCheck = await menuPage.evaluate(() => {
      const allCards = Array.from(document.querySelectorAll('.menu-item-card'));
      const printOnlyCards = document.querySelectorAll('.menu-item-print-only');
      return {
        totalDomCards: allCards.length,
        printOnlyCardsCount: printOnlyCards.length,
      };
    });
    console.log(`PublicMenuPage total DOM cards (for screen + print): ${printStylesCheck.totalDomCards}`);
    if (printStylesCheck.totalDomCards >= 60) {
      console.log(`✅ All ${printStylesCheck.totalDomCards} menu items are present in DOM for print output.`);
    } else {
      console.error(`❌ Expected at least 60 items in DOM for print, got: ${printStylesCheck.totalDomCards}`);
      allPassed = false;
    }

    if (menuConsoleErrors.length > 0) {
      console.error(`❌ Console errors on /menu:\n  ${menuConsoleErrors.join('\n  ')}`);
      allPassed = false;
    } else {
      console.log(`✅ Zero console errors on /menu.`);
    }

    await menuPage.close();

  } finally {
    await browser.close();
    await server.close();
    console.log('--- Servers and browser closed ---');
  }

  if (allPassed) {
    console.log('\n🎉 ALL REAL BROWSER ASSERTIONS PASSED! 🎉\n');
    process.exit(0);
  } else {
    console.error('\n❌ SOME BROWSER ASSERTIONS FAILED! ❌\n');
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});

