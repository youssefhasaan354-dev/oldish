const fs = require('fs');
const path = require('path');
const https = require('https');

const fontsDir = path.join(__dirname, '..', 'public', 'fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const fontList = [
  {
    name: 'cairo-arabic.woff2',
    url: 'https://fonts.gstatic.com/s/cairo/v31/SLXVc1nY6HkvangtZmpQdkhzfH5lkSscQyyS4J0.woff2'
  },
  {
    name: 'cairo-latin.woff2',
    url: 'https://fonts.gstatic.com/s/cairo/v31/SLXVc1nY6HkvangtZmpQdkhzfH5lkSscRiyS.woff2'
  },
  {
    name: 'playfair-display-700-latin.woff2',
    url: 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeiunDXbtM.woff2'
  },
  {
    name: 'poppins-400-latin.woff2',
    url: 'https://fonts.gstatic.com/s/poppins/v24/pxiEyp8kv8JHgFVrJJfecg.woff2'
  },
  {
    name: 'poppins-600-latin.woff2',
    url: 'https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6Z1xlFQ.woff2'
  }
];

function downloadOne(item) {
  return new Promise((resolve, reject) => {
    const dest = path.join(fontsDir, item.name);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`Already exists: ${item.name} (${fs.statSync(dest).size} bytes)`);
      return resolve();
    }
    const file = fs.createWriteStream(dest);
    https.get(item.url, { family: 4, timeout: 15000 }, res => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`Status ${res.statusCode} for ${item.url}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log(`Saved: ${item.name} (${fs.statSync(dest).size} bytes)`);
          resolve();
        });
      });
    }).on('error', err => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function main() {
  for (const item of fontList) {
    let retries = 3;
    while (retries > 0) {
      try {
        await downloadOne(item);
        break;
      } catch (e) {
        retries--;
        console.error(`Error downloading ${item.name}: ${e.message}, retrying (${retries} left)...`);
        await new Promise(r => setTimeout(r, 1000));
        if (retries === 0) throw e;
      }
    }
  }
  console.log('All fonts downloaded successfully!');
}

main().catch(err => {
  console.error('Download failed:', err);
  process.exit(1);
});
