const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
  
  let totalBytes = 0;
  const requests = [];

  page.on('response', async res => {
    try {
      const buffer = await res.buffer();
      totalBytes += buffer.length;
      requests.push({
        url: res.url().split('/').pop().split('?')[0] || 'index.html',
        fullUrl: res.url(),
        status: res.status(),
        size: buffer.length
      });
    } catch(e) {}
  });

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });

  console.log('=== FIRST LOAD PAGE WEIGHT AUDIT: / (MOBILE) ===');
  console.log('Total Requests:', requests.length);
  requests.forEach(r => {
    console.log(`  [${r.status}] ${r.url.padEnd(42)} ${(r.size / 1024).toFixed(1)} KB`);
  });
  console.log('--------------------------------------------------');
  console.log(`TOTAL FIRST-LOAD PAGE WEIGHT: ${(totalBytes / 1024).toFixed(1)} KB (${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);

  await browser.close();
})();
