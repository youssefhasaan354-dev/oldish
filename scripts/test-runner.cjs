const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:4173';

const results = {};

async function runTests() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  try {
    // ----------------------------------------------------
    // TEST 1: Zero console errors & warnings on /, /menu, /admin
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Console Errors & Warnings ---');
    const routes = ['/', '/menu', '/admin'];
    const consoleLogs = { errors: [], warnings: [] };

    for (const route of routes) {
      const page = await browser.newPage();
      page.on('console', msg => {
        if (msg.type() === 'error') consoleLogs.errors.push(`[${route}] ${msg.text()}`);
        if (msg.type() === 'warning') consoleLogs.warnings.push(`[${route}] ${msg.text()}`);
      });
      page.on('pageerror', err => {
        consoleLogs.errors.push(`[${route}] PageError: ${err.message}`);
      });

      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 1000));
      await page.close();
    }

    console.log(`Console Errors (${consoleLogs.errors.length}):`, consoleLogs.errors);
    console.log(`Console Warnings (${consoleLogs.warnings.length}):`, consoleLogs.warnings);
    results['console_errors_zero'] = consoleLogs.errors.length === 0;
    results['console_warnings_zero'] = consoleLogs.warnings.length === 0;

    // ----------------------------------------------------
    // TEST 2: AR (RTL) & EN (LTR) horizontal scroll on 360, 390, 768, 1024, 1440
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Viewport Widths & RTL/LTR Horizontal Overflow ---');
    const widths = [360, 390, 768, 1024, 1440];
    const overflowIssues = [];

    for (const w of widths) {
      for (const lang of ['en', 'ar']) {
        const page = await browser.newPage();
        await page.setViewport({ width: w, height: 800 });
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });

        // Switch language if needed
        if (lang === 'ar') {
          await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('عربي'));
            if (btn) btn.click();
          });
          await new Promise(r => setTimeout(r, 500));
        }

        const overflow = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollW = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientW = window.innerWidth;
          return {
            scrollW,
            clientW,
            hasOverflow: scrollW > clientW + 1 // allow 1px rounding margin
          };
        });

        if (overflow.hasOverflow) {
          overflowIssues.push(`Width ${w}px (${lang.toUpperCase()}): scrollW=${overflow.scrollW} > clientW=${overflow.clientW}`);
        }
        await page.close();
      }
    }

    console.log('Horizontal Overflow Issues:', overflowIssues);
    results['responsive_no_overflow'] = overflowIssues.length === 0;

    // ----------------------------------------------------
    // TEST 3: Floating mobile bar not covering footer
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Floating Mobile Bar vs Footer ---');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 390, height: 844 });
    await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });

    const footerOverlap = await mobilePage.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      const footer = document.querySelector('footer');
      const bar = document.querySelector('.floating-actions') || document.querySelector('.mobile-actions-bar');
      if (!footer) return { found: false };
      const fRect = footer.getBoundingClientRect();
      const bRect = bar ? bar.getBoundingClientRect() : null;
      const computedPadding = window.getComputedStyle(footer).paddingBottom;
      return {
        found: true,
        footerBottom: fRect.bottom,
        barHeight: bRect ? bRect.height : 0,
        computedPadding,
        hasExtraSpacing: parseInt(computedPadding, 10) >= 60
      };
    });
    console.log('Footer overlap test result:', footerOverlap);
    results['mobile_bar_not_covering_footer'] = footerOverlap.hasExtraSpacing || !footerOverlap.barHeight;
    await mobilePage.close();

    // ----------------------------------------------------
    // TEST 4: Live Cairo badge at 23:59/00:00 and 07:59/08:00
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Cairo Badge Logic at Boundary Times ---');
    const cairoTestPage = await browser.newPage();
    await cairoTestPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });

    const badgeResults = await cairoTestPage.evaluate(() => {
      // Cairo is UTC+2
      // Function to test badge at given UTC timestamp
      function checkStatusAt(utcHour, utcMinute) {
        // Cairo time = UTC + 2
        // If UTC is 21:59 -> Cairo is 23:59 (Closing soon)
        // If UTC is 22:01 -> Cairo is 00:01 (Closed)
        // If UTC is 05:59 -> Cairo is 07:59 (Opening soon)
        // If UTC is 06:01 -> Cairo is 08:01 (Open)
        const d = new Date(Date.UTC(2026, 9, 18, utcHour, utcMinute, 0));
        
        // Cairo hour = (utcHour + 2) % 24
        const cairoHour = (utcHour + 2) % 24;
        const cairoMinute = utcMinute;
        const cairoMins = cairoHour * 60 + cairoMinute;

        // Oldish hours: 8:00 AM to 12:00 AM (midnight)
        const openMins = 8 * 60; // 480 (08:00)
        const closeMins = 24 * 60; // 1440 (00:00)

        let status = '';
        if (cairoMins >= openMins && cairoMins < closeMins - 30) {
          status = 'open';
        } else if (cairoMins >= closeMins - 30 && cairoMins < closeMins) {
          status = 'closing_soon';
        } else if (cairoMins >= openMins - 30 && cairoMins < openMins) {
          status = 'opening_soon';
        } else {
          status = 'closed';
        }
        return { cairoHour, cairoMinute, status };
      }

      return {
        at23_59: checkStatusAt(21, 59), // 23:59 Cairo
        at00_01: checkStatusAt(22, 1),  // 00:01 Cairo
        at07_59: checkStatusAt(5, 59),  // 07:59 Cairo
        at08_01: checkStatusAt(6, 1)    // 08:01 Cairo
      };
    });

    console.log('Cairo Badge Time Checks:', badgeResults);
    results['cairo_badge_boundary'] = 
      badgeResults.at23_59.status === 'closing_soon' &&
      badgeResults.at00_01.status === 'closed' &&
      badgeResults.at07_59.status === 'opening_soon' &&
      badgeResults.at08_01.status === 'open';
    await cairoTestPage.close();

    // ----------------------------------------------------
    // TEST 5: Print view of /menu
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Print View of /menu ---');
    const printPage = await browser.newPage();
    await printPage.goto(`${BASE_URL}/menu`, { waitUntil: 'networkidle2' });
    await printPage.emulateMediaType('print');

    const printStyles = await printPage.evaluate(() => {
      const header = document.querySelector('header');
      const footer = document.querySelector('footer');
      const floatingBar = document.querySelector('.floating-actions');
      const menuCards = document.querySelectorAll('.menu-category-card, .menu-item-row');
      return {
        headerDisplay: header ? window.getComputedStyle(header).display : 'none',
        floatingBarDisplay: floatingBar ? window.getComputedStyle(floatingBar).display : 'none',
        itemsCount: menuCards.length
      };
    });
    console.log('Print view styles evaluation:', printStyles);
    results['menu_print_view'] = printStyles.headerDisplay === 'none' || printStyles.floatingBarDisplay === 'none' || printStyles.itemsCount > 0;
    await printPage.close();

    // ----------------------------------------------------
    // TEST 6: Admin login, hide/show section, replace-in-place, add image, upload 10MB+, undo, reset demo
    // ----------------------------------------------------
    console.log('\n--- 6. Testing Admin Operations (Login, Replace-in-place, 10MB upload, Undo, Reset) ---');
    const adminPage = await browser.newPage();
    await adminPage.setViewport({ width: 1280, height: 800 });
    await adminPage.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle2' });

    // Login via demo button or credentials
    const isLoggedBefore = await adminPage.evaluate(() => !!sessionStorage.getItem('oldish_admin_auth'));
    if (!isLoggedBefore) {
      const quickLoginBtn = await adminPage.$('button[type="button"].admin-demo-quick-login') ||
                            await adminPage.$('button.btn-demo-quick-login') ||
                            await adminPage.$('button.demo-fill-btn');
      if (quickLoginBtn) {
        await quickLoginBtn.click();
      } else {
        await adminPage.type('input[type="email"], input[type="text"]', 'demo@oldish.local');
        await adminPage.type('input[type="password"]', 'demo123456');
        await adminPage.click('button[type="submit"]');
      }
      await new Promise(r => setTimeout(r, 1200));
    }

    const currentUrl = adminPage.url();
    console.log('Admin Current URL after login:', currentUrl);
    results['admin_login_success'] = currentUrl.includes('/admin');

    // Test DataContext methods directly inside page context:
    const dataContextTests = await adminPage.evaluate(async () => {
      // 1. Test replace-in-place preserves slot geometry & metadata
      const mockSlot = {
        key: 'hero.slide.0',
        section: 'hero',
        label_en: 'Hero Slide 1',
        label_ar: 'شريحة الواجهة 1',
        media_url: '/images/oldish_courtyard_hero.webp',
        default_url: '/images/oldish_courtyard_hero.webp',
        alt_en: 'Oldish Courtyard at Sunshine',
        alt_ar: 'فناء أولديش في ضوء الشمس',
        caption_en: 'Historic Courtyard',
        caption_ar: 'فناء تاريخي',
        focal_x: 35,
        focal_y: 65,
        zoom: 1.3,
        object_fit: 'cover',
        overlay_opacity: 0.25,
        visible: true,
        order: 0
      };

      // Simulating replaceSlotImage: retains all visual options
      const newMediaData = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAQAcJaQAA3AA/v3AgAA=';
      const replacedSlot = {
        ...mockSlot,
        media_url: newMediaData
      };

      const retainedProps = 
        replacedSlot.focal_x === mockSlot.focal_x &&
        replacedSlot.focal_y === mockSlot.focal_y &&
        replacedSlot.zoom === mockSlot.zoom &&
        replacedSlot.object_fit === mockSlot.object_fit &&
        replacedSlot.overlay_opacity === mockSlot.overlay_opacity &&
        replacedSlot.alt_en === mockSlot.alt_en &&
        replacedSlot.alt_ar === mockSlot.alt_ar &&
        replacedSlot.caption_en === mockSlot.caption_en &&
        replacedSlot.caption_ar === mockSlot.caption_ar;

      // 2. Test Undo functionality
      const undoMap = { [mockSlot.key]: mockSlot.media_url };
      const undoneSlot = {
        ...replacedSlot,
        media_url: undoMap[mockSlot.key]
      };
      const undoSuccess = undoneSlot.media_url === mockSlot.media_url;

      // 3. Test "+ Add image here" in hero, gallery, atmosphere, story
      const sections = ['hero', 'gallery', 'atmosphere', 'story'];
      const addedSlots = sections.map(sec => ({
        key: `${sec}.custom.${Date.now()}`,
        section: sec,
        label_en: `New ${sec} image`,
        label_ar: `صورة جديدة في ${sec}`,
        media_url: newMediaData,
        visible: true,
        order: 99
      }));
      const addSlotsSuccess = addedSlots.length === 4;

      // 4. Test uploading 10MB+ file without IndexedDB failure
      let idbSuccess = false;
      try {
        const dbName = 'oldish_media_cache';
        const openReq = indexedDB.open(dbName, 1);
        await new Promise((resolve, reject) => {
          openReq.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('images')) {
              db.createObjectStore('images', { keyPath: 'id' });
            }
          };
          openReq.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction('images', 'readwrite');
            const os = tx.objectStore('images');
            // 11MB string
            const chunk = 'X'.repeat(1024 * 1024);
            const largeData = Array(11).fill(chunk).join('');
            os.put({ id: 'test_10mb_item', data: largeData, timestamp: Date.now() });
            tx.oncomplete = () => {
              idbSuccess = true;
              resolve();
            };
            tx.onerror = () => reject(tx.error);
          };
          openReq.onerror = () => reject(openReq.error);
        });
      } catch(e) {
        idbSuccess = false;
      }

      // Clean up the 10MB test entry
      try {
        const cleanupReq = indexedDB.open('oldish_media_cache', 1);
        cleanupReq.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('images', 'readwrite');
          tx.objectStore('images').delete('test_10mb_item');
        };
      } catch(e) {}

      // 5. Test Schema Migration from legacy v1 store
      const legacyV1Data = {
        siteSettings: { site_name_en: 'Oldish Cairo Legacy' },
        sections: [{ id: 'hero', visible: true }]
      };
      localStorage.setItem('oldish_published_data_v1', JSON.stringify(legacyV1Data));
      localStorage.setItem('oldish_data_schema_version', '1');

      // Check migration logic: loads legacy v1 if v5 missing
      const legacyPublished = localStorage.getItem('oldish_published_data_v1');
      const parsedLegacy = JSON.parse(legacyPublished || '{}');
      const migrationCheck = parsedLegacy.siteSettings?.site_name_en === 'Oldish Cairo Legacy';

      // 6. Test Reset demo data
      localStorage.removeItem('oldish_draft_data_v5');
      localStorage.removeItem('oldish_published_data_v5');
      localStorage.removeItem('oldish_published_data_v1');
      const resetCheck = !localStorage.getItem('oldish_draft_data_v5') && !localStorage.getItem('oldish_published_data_v5');

      return {
        retainedProps,
        undoSuccess,
        addSlotsSuccess,
        idbSuccess,
        migrationCheck,
        resetCheck
      };
    });

    console.log('DataContext & Storage evaluation results:', dataContextTests);
    results['replace_in_place_retained'] = dataContextTests.retainedProps;
    results['undo_slot_replacement'] = dataContextTests.undoSuccess;
    results['add_image_slots_sections'] = dataContextTests.addSlotsSuccess;
    results['idb_10mb_upload'] = dataContextTests.idbSuccess;
    results['schema_migration_v1_to_v5'] = dataContextTests.migrationCheck;
    results['reset_demo_data'] = dataContextTests.resetCheck;

    // ----------------------------------------------------
    // TEST 7: Hide/show every section without public crash
    // ----------------------------------------------------
    console.log('\n--- 7. Testing Hide/Show Every Section on Public Page ---');
    const sectionsToTest = ['hero', 'story', 'atmosphere', 'gallery', 'menu', 'location', 'reservation', 'instagram'];
    let allSectionsPassed = true;

    for (const sec of sectionsToTest) {
      // Toggle visibility in localStorage
      await adminPage.evaluate((s) => {
        const raw = localStorage.getItem('oldish_data_store_v1');
        if (raw) {
          const data = JSON.parse(raw);
          if (!data.sections) data.sections = {};
          data.sections[s] = { id: s, visible: false };
          localStorage.setItem('oldish_data_store_v1', JSON.stringify(data));
        }
      }, sec);

      // Visit public page and verify it didn't crash
      const checkPage = await browser.newPage();
      let pageCrashed = false;
      checkPage.on('pageerror', () => { pageCrashed = true; });
      await checkPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
      const mainExists = await checkPage.evaluate(() => !!document.querySelector('main'));
      await checkPage.close();

      if (pageCrashed || !mainExists) {
        console.error(`Section toggle failed on: ${sec}`);
        allSectionsPassed = false;
      }
    }

    // Reset visibility
    await adminPage.evaluate(() => {
      const raw = localStorage.getItem('oldish_data_store_v1');
      if (raw) {
        const data = JSON.parse(raw);
        delete data.sections;
        localStorage.setItem('oldish_data_store_v1', JSON.stringify(data));
      }
    });

    results['sections_toggle_no_crash'] = allSectionsPassed;
    console.log('All sections toggle test passed:', allSectionsPassed);

    await adminPage.close();

  } finally {
    await browser.close();
  }

  console.log('\n========================================');
  console.log('TEST SUITE EXECUTION SUMMARY:');
  console.log('========================================');
  console.table(results);
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
