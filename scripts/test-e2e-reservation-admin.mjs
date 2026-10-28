import puppeteer from 'puppeteer-core';
import { preview } from 'vite';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runTest() {
  console.log('🧪 Starting End-to-End Puppeteer Reservation -> Admin Verification...\n');

  console.log('--- Starting Vite Preview Server ---');
  const server = await preview({
    preview: {
      port: 4188,
      strictPort: false,
    },
  });

  const rawUrl = server.resolvedUrls.local[0] || 'http://localhost:4188';
  const previewUrl = rawUrl.replace(/\/$/, '');
  console.log(`Preview server running at: ${previewUrl}`);

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
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    await page.setRequestInterception(true);
    page.on('request', (req) => {
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
            id: `inq-puppeteer-${Date.now()}`
          })
        });
      } else {
        req.continue();
      }
    });

    console.log(`Navigating to ${previewUrl}...`);
    await page.goto(previewUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    // Scroll to #reservations
    await page.evaluate(() => {
      const el = document.getElementById('reservations');
      if (el) el.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 600));

    console.log('Filling out reservation form...');
    await page.waitForSelector('#res-name', { timeout: 10000 });
    await page.type('#res-name', 'يوسف الشماع');
    await page.type('#res-phone', '01060119488');
    
    // Fill date if empty
    await page.evaluate(() => {
      const dateInput = document.getElementById('res-date');
      if (dateInput && !dateInput.value) {
        dateInput.value = '2026-11-15';
        dateInput.dispatchEvent(new Event('input', { bubbles: true }));
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Wait 3.2 seconds for minimum fill time guard
    console.log('Waiting 3.2s to satisfy anti-bot fill time guard...');
    await new Promise(r => setTimeout(r, 3200));

    console.log('Submitting reservation form...');
    await page.evaluate(() => {
      const submitBtn = document.querySelector('#reservations button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });

    await new Promise(r => setTimeout(r, 1200));

    // Check success message
    const isSuccessShown = await page.evaluate(() => {
      const resSec = document.getElementById('reservations');
      if (!resSec) return false;
      const successBox = resSec.querySelector('.reservation-success-box');
      return Boolean(successBox || resSec.innerText.includes('تم استلام طلبكم بنجاح') || resSec.innerText.includes('Inquiry Received'));
    });

    if (isSuccessShown) {
      console.log('✅ PASSED: Reservation submitted and success message displayed to visitor!');
    } else {
      console.error('❌ FAILED: Success message not displayed after reservation submission.');
      allPassed = false;
    }

    // Now test Admin Inbox displays this inquiry
    console.log('\nSetting up Admin session and navigating to /admin...');
    
    // Simulate active admin session in localStorage
    await page.evaluate(() => {
      localStorage.setItem('oldish_admin_auth_session', JSON.stringify({
        user: {
          id: 'usr-admin-test',
          email: 'admin@oldish.eg',
          role: 'owner',
          created_at: new Date().toISOString()
        },
        timestamp: Date.now()
      }));
    });

    await page.goto(`${previewUrl}/admin`, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1200));

    // Click on Inquiries Tab
    console.log('Navigating to Inquiries Inbox in Admin Panel...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const inqTabBtn = buttons.find(b => b.innerText && (b.innerText.includes('الطلبات والاستفسارات') || b.innerText.includes('Inquiries')));
      if (inqTabBtn) inqTabBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Verify inquiry is present in admin table
    const inquiryCheck = await page.evaluate(() => {
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

  } finally {
    await browser.close();
    await server.close();
    console.log('--- Puppeteer test completed ---');
  }

  if (allPassed) {
    console.log('\n🎉 E2E RESERVATION -> ADMIN TEST PASSED! 🎉\n');
    process.exit(0);
  } else {
    console.error('\n❌ E2E TEST FAILED! ❌\n');
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Fatal Puppeteer test error:', err);
  process.exit(1);
});
