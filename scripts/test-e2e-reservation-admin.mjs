import puppeteer from 'puppeteer-core';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROD_BUILD_DIR = 'dist-test-prod';
const DEMO_BUILD_DIR = 'dist-test-demo';

async function runTest() {
  console.log('🧪 Starting End-to-End Puppeteer Reservation & Admin Security Verification Suite...\n');

  let allPassed = true;
  let prodServer = null;
  let demoServer = null;
  let browser = null;

  try {
    // =========================================================================
    // STEP 1: Build & Verify Production Build (Security Assertion)
    // In production build with Firebase configured, injecting oldish_admin_auth_session
    // in localStorage must NOT grant access to /admin and MUST show the Login page.
    // =========================================================================
    console.log('--- [1/2] Building and verifying production build security assertion ---');
    console.log('Building bundle with VITE_DEMO_MODE=false and Firebase configured...');
    await build({
      mode: 'production',
      build: { outDir: PROD_BUILD_DIR },
      define: {
        'import.meta.env.VITE_DEMO_MODE': JSON.stringify('false'),
        'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify('AIzaSyProdTestApiKey1234567890abcdef'),
        'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify('oldish-prod-security-check'),
        'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify('1:1234567890:web:abcdef123456'),
      },
    });

    prodServer = await preview({
      build: { outDir: PROD_BUILD_DIR },
      preview: { port: 4192, strictPort: false },
    });
    const prodUrl = prodServer.resolvedUrls.local[0].replace(/\/$/, '');
    console.log(`Production preview server running at: ${prodUrl}`);

    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
      ],
    });

    const secPage = await browser.newPage();
    await secPage.setViewport({ width: 1400, height: 900 });

    console.log('Navigating to production site and injecting fake admin session into localStorage...');
    await secPage.goto(prodUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    await secPage.evaluate(() => {
      localStorage.setItem('oldish_admin_auth_session', JSON.stringify({
        user: {
          id: 'usr-attacker-injected',
          email: 'attacker@evil.com',
          role: 'owner',
          created_at: new Date().toISOString(),
        },
        timestamp: Date.now(),
      }));
    });

    console.log('Attempting to access /admin with injected localStorage session in production...');
    await secPage.goto(`${prodUrl}/admin`, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));

    const secCheck = await secPage.evaluate(() => {
      const hasLoginWrapper = Boolean(document.querySelector('.admin-login-wrapper'));
      const hasPasswordField = Boolean(document.querySelector('input[type="password"]'));
      const text = document.body.innerText || '';
      const hasLoginTitle = text.includes('تسجيل الدخول') || text.includes('Oldish Admin');
      const hasAdminPanelTabs = Boolean(
        document.querySelector('.admin-sidebar') ||
        text.includes('لوحة التحكم') && text.includes('الطلبات والاستفسارات') && text.includes('تسجيل الخروج')
      );
      return {
        isLoginDisplayed: (hasLoginWrapper || hasPasswordField) && hasLoginTitle,
        hasAdminPanelTabs,
      };
    });

    if (secCheck.isLoginDisplayed && !secCheck.hasAdminPanelTabs) {
      console.log('✅ SECURITY ASSERTION PASSED: Production build correctly rejected injected localStorage session and displayed Login page!');
    } else {
      console.error('❌ SECURITY ASSERTION FAILED: Injected session was accepted or login screen not shown in production build!', secCheck);
      allPassed = false;
    }

    await secPage.close();
    await prodServer.close();
    prodServer = null;

    // =========================================================================
    // STEP 2: Dedicated Test/Demo Build (Reservation Submission -> Admin Inbox)
    // Dedicated build with VITE_DEMO_MODE=true and no Firebase credentials.
    // =========================================================================
    console.log('\n--- [2/2] Building and verifying dedicated test/demo build ---');
    console.log('Building bundle with VITE_DEMO_MODE=true and no Firebase keys...');
    await build({
      mode: 'test',
      build: { outDir: DEMO_BUILD_DIR },
      define: {
        'import.meta.env.VITE_DEMO_MODE': JSON.stringify('true'),
        'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(''),
        'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(''),
        'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(''),
      },
    });

    demoServer = await preview({
      build: { outDir: DEMO_BUILD_DIR },
      preview: { port: 4193, strictPort: false },
    });
    const demoUrl = demoServer.resolvedUrls.local[0].replace(/\/$/, '');
    console.log(`Test/Demo preview server running at: ${demoUrl}`);

    const testPage = await browser.newPage();
    await testPage.setViewport({ width: 1400, height: 900 });

    // Intercept /api/submit-inquiry
    await testPage.setRequestInterception(true);
    testPage.on('request', (req) => {
      if (req.url().includes('/api/submit-inquiry') && req.method() === 'POST') {
        const postData = req.postData();
        let parsed = {};
        try { parsed = JSON.parse(postData); } catch {}
        console.log('  [Serverless Intercept] Received /api/submit-inquiry:', parsed.name, parsed.phone);
        req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            id: `inq-puppeteer-${Date.now()}`,
          }),
        });
      } else {
        req.continue();
      }
    });

    console.log(`Navigating visitor to ${demoUrl}...`);
    await testPage.goto(demoUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    // Scroll to #reservations
    await testPage.evaluate(() => {
      const el = document.getElementById('reservations');
      if (el) el.scrollIntoView();
    });
    await new Promise((r) => setTimeout(r, 600));

    console.log('Filling out reservation form as visitor...');
    await testPage.waitForSelector('#res-name', { timeout: 10000 });
    await testPage.type('#res-name', 'يوسف الشماع');
    await testPage.type('#res-phone', '01060119488');

    // Fill date if empty
    await testPage.evaluate(() => {
      const dateInput = document.getElementById('res-date');
      if (dateInput && !dateInput.value) {
        dateInput.value = '2026-11-15';
        dateInput.dispatchEvent(new Event('input', { bubbles: true }));
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    console.log('Waiting 3.2s to satisfy anti-bot fill time guard...');
    await new Promise((r) => setTimeout(r, 3200));

    console.log('Submitting reservation form...');
    await testPage.evaluate(() => {
      const submitBtn = document.querySelector('#reservations button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });

    await new Promise((r) => setTimeout(r, 1200));

    // Check success message
    const isSuccessShown = await testPage.evaluate(() => {
      const resSec = document.getElementById('reservations');
      if (!resSec) return false;
      const successBox = resSec.querySelector('.reservation-success-box');
      return Boolean(
        successBox ||
        resSec.innerText.includes('تم استلام طلبكم بنجاح') ||
        resSec.innerText.includes('Inquiry Received')
      );
    });

    if (isSuccessShown) {
      console.log('✅ PASSED: Reservation submitted and success message displayed to visitor!');
    } else {
      console.error('❌ FAILED: Success message not displayed after reservation submission.');
      allPassed = false;
    }

    // Now test Admin Inbox displays this inquiry in Demo mode
    console.log('\nSetting up Admin session and navigating to /admin on test build...');
    await testPage.evaluate(() => {
      localStorage.setItem('oldish_admin_auth_session', JSON.stringify({
        user: {
          id: 'usr-admin-test',
          email: 'admin@oldish.eg',
          role: 'owner',
          created_at: new Date().toISOString(),
        },
        timestamp: Date.now(),
      }));
    });

    await testPage.goto(`${demoUrl}/admin`, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1200));

    // Click on Inquiries Tab
    console.log('Navigating to Inquiries Inbox in Admin Panel...');
    await testPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const inqTabBtn = buttons.find(
        (b) => b.innerText && (b.innerText.includes('الطلبات والاستفسارات') || b.innerText.includes('Inquiries'))
      );
      if (inqTabBtn) inqTabBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));

    // Verify inquiry is present in admin table
    const inquiryCheck = await testPage.evaluate(() => {
      const text = document.body.innerText;
      const hasName = text.includes('يوسف الشماع');
      const hasPhone = text.includes('01060119488');
      return { hasName, hasPhone };
    });

    if (inquiryCheck.hasName && inquiryCheck.hasPhone) {
      console.log('✅ PASSED: Submitted reservation (يوسف الشماع - 01060119488) is listed in Admin Inquiries Inbox table!');
    } else {
      console.error('❌ FAILED: Reservation not found in Admin Inbox table:', inquiryCheck);
      allPassed = false;
    }

    await testPage.close();
  } finally {
    if (browser) await browser.close();
    if (prodServer) await prodServer.close();
    if (demoServer) await demoServer.close();

    // Clean up temporary build directories
    try {
      fs.rmSync(path.resolve(process.cwd(), PROD_BUILD_DIR), { recursive: true, force: true });
      fs.rmSync(path.resolve(process.cwd(), DEMO_BUILD_DIR), { recursive: true, force: true });
    } catch {}

    console.log('--- E2E suite completed ---');
  }

  if (allPassed) {
    console.log('\n🎉 ALL E2E AND SECURITY TESTS PASSED! 🎉\n');
    process.exit(0);
  } else {
    console.error('\n❌ E2E SUITE FAILED! ❌\n');
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Fatal Puppeteer test error:', err);
  process.exit(1);
});
