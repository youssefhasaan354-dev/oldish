import http from 'http';
import handler from '../api/submit-inquiry.js';
import { setAdminFirestoreForTesting } from '../api/_lib/firebaseAdmin.js';

// Setup local HTTP server wrapping the Vercel serverless function
function createTestServer() {
  return http.createServer(async (req, res) => {
    // Collect body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks).toString();
    try {
      req.body = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      req.body = rawBody;
    }

    // Wrap res.status and res.json for Vercel compatibility
    res.status = function (code) {
      res.statusCode = code;
      return res;
    };
    res.json = function (obj) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(obj));
      return res;
    };

    return handler(req, res);
  });
}

async function request(port, { method = 'POST', path = '/', body, headers = {} }) {
  return new Promise((resolve, reject) => {
    const payload = typeof body === 'object' ? JSON.stringify(body) : body;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': payload ? Buffer.byteLength(payload) : 0,
          ...headers,
        },
      },
      (res) => {
        let resBody = '';
        res.on('data', (c) => (resBody += c));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(resBody);
          } catch {}
          resolve({ status: res.statusCode, headers: res.headers, body: json || resBody });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting /api/submit-inquiry Automated Verification Suite...\n');

  // Mock Firestore for local testing
  const mockDocs = new Map();
  const mockFirestore = {
    collection: () => ({
      doc: () => {
        const id = `test-inq-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        return {
          id,
          set: async (data) => {
            mockDocs.set(id, data);
            return { id };
          },
        };
      },
    }),
  };

  setAdminFirestoreForTesting(mockFirestore);

  const server = createTestServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;

  let allPassed = true;

  try {
    // ----------------------------------------------------
    // TEST 1: Valid reservation request writes to Firestore
    // ----------------------------------------------------
    console.log('▶ Test 1: Valid reservation request writes correctly');
    const validRes = await request(port, {
      body: {
        type: 'reservation_request',
        name: 'أحمد محمود',
        phone: '01012345678',
        email: 'ahmed@example.com',
        date: '2026-11-05',
        time: '19:30',
        guests: '4',
        branch: 'Downtown Cairo',
        message: 'طاولة بجوار الحديقة',
      },
      headers: { 'x-forwarded-for': '192.168.1.101' },
    });

    if (validRes.status === 200 && validRes.body.success && validRes.body.id) {
      const savedDoc = mockDocs.get(validRes.body.id);
      if (savedDoc && savedDoc.status === 'new' && savedDoc.name === 'أحمد محمود') {
        console.log(`  ✅ PASSED: Document created with ID: ${validRes.body.id}`);
      } else {
        console.error('  ❌ FAILED: Document data mismatch in mock store', savedDoc);
        allPassed = false;
      }
    } else {
      console.error('  ❌ FAILED: Expected 200 { success: true }, got:', validRes);
      allPassed = false;
    }

    // ----------------------------------------------------
    // TEST 2: Turnstile token missing when TURNSTILE_SECRET_KEY is configured
    // ----------------------------------------------------
    console.log('\n▶ Test 2: Turnstile token missing rejected with 403');
    process.env.TURNSTILE_SECRET_KEY = 'mock_secret_key_123';
    const noTokenRes = await request(port, {
      body: {
        type: 'reservation_request',
        name: 'كريم هاني',
        phone: '01099998888',
      },
      headers: { 'x-forwarded-for': '192.168.1.102' },
    });
    delete process.env.TURNSTILE_SECRET_KEY;

    if (noTokenRes.status === 403 && noTokenRes.body.success === false) {
      console.log('  ✅ PASSED: Rejected with 403 when Turnstile token is missing');
    } else {
      console.error('  ❌ FAILED: Expected 403, got:', noTokenRes.status, noTokenRes.body);
      allPassed = false;
    }

    // ----------------------------------------------------
    // TEST 3: Missing or invalid fields rejected with 400
    // ----------------------------------------------------
    console.log('\n▶ Test 3: Missing or invalid fields rejected with 400');
    
    // 3a: Name too short (< 2 chars)
    const shortNameRes = await request(port, {
      body: { type: 'reservation_request', name: 'أ', phone: '01012345678' },
      headers: { 'x-forwarded-for': '192.168.1.103' },
    });
    const p1 = shortNameRes.status === 400;

    // 3b: Invalid phone
    const badPhoneRes = await request(port, {
      body: { type: 'reservation_request', name: 'سامي مراد', phone: 'abc' },
      headers: { 'x-forwarded-for': '192.168.1.104' },
    });
    const p2 = badPhoneRes.status === 400;

    // 3c: Invalid email format
    const badEmailRes = await request(port, {
      body: { type: 'reservation_request', name: 'سامي مراد', phone: '01012345678', email: 'not-an-email' },
      headers: { 'x-forwarded-for': '192.168.1.105' },
    });
    const p3 = badEmailRes.status === 400;

    // 3d: Guests > 20
    const tooManyGuestsRes = await request(port, {
      body: { type: 'reservation_request', name: 'سامي مراد', phone: '01012345678', guests: '50' },
      headers: { 'x-forwarded-for': '192.168.1.106' },
    });
    const p4 = tooManyGuestsRes.status === 400;

    // 3e: Guests not an integer (e.g. float 2.5)
    const floatGuestsRes = await request(port, {
      body: { type: 'reservation_request', name: 'سامي مراد', phone: '01012345678', guests: 2.5 },
      headers: { 'x-forwarded-for': '192.168.1.107' },
    });
    const p5 = floatGuestsRes.status === 400;

    // 3f: Invalid calendar date (e.g. 2026-13-45)
    const impossibleDateRes = await request(port, {
      body: { type: 'reservation_request', name: 'سامي مراد', phone: '01012345678', date: '2026-13-45' },
      headers: { 'x-forwarded-for': '192.168.1.108' },
    });
    const p6 = impossibleDateRes.status === 400;

    // 3g: Past date (e.g. 2020-01-01)
    const pastDateRes = await request(port, {
      body: { type: 'reservation_request', name: 'سامي مراد', phone: '01012345678', date: '2020-01-01' },
      headers: { 'x-forwarded-for': '192.168.1.109' },
    });
    const p7 = pastDateRes.status === 400;

    // 3h: Invalid type
    const badTypeRes = await request(port, {
      body: { type: 'hacked_type', name: 'سامي مراد', phone: '01012345678' },
      headers: { 'x-forwarded-for': '192.168.1.110' },
    });
    const p8 = badTypeRes.status === 400;

    if (p1 && p2 && p3 && p4 && p5 && p6 && p7 && p8) {
      console.log('  ✅ PASSED: All invalid field inputs (short name, bad phone, email, guests > 20, float guests, impossible date, past date, invalid type) rejected with 400');
    } else {
      console.error('  ❌ FAILED: Invalid field rejection check failed:', { p1, p2, p3, p4, p5, p6, p7, p8 });
      allPassed = false;
    }

    // ----------------------------------------------------
    // TEST 4: Extra unexpected fields rejected with 400
    // ----------------------------------------------------
    console.log('\n▶ Test 4: Extra unexpected fields rejected with 400');
    const extraFieldsRes = await request(port, {
      body: {
        type: 'reservation_request',
        name: 'طارق علي',
        phone: '01011223344',
        isAdmin: true,
        injected_sql: 'DROP TABLE',
      },
      headers: { 'x-forwarded-for': '192.168.1.120' },
    });

    if (extraFieldsRes.status === 400 && extraFieldsRes.body.error?.includes('Unexpected field')) {
      console.log(`  ✅ PASSED: Extra fields rejected: ${extraFieldsRes.body.error}`);
    } else {
      console.error('  ❌ FAILED: Expected 400 on extra fields, got:', extraFieldsRes);
      allPassed = false;
    }

    // ----------------------------------------------------
    // TEST 5: Filled honeypot returns silent success (200) without writing
    // ----------------------------------------------------
    console.log('\n▶ Test 5: Filled honeypot returns silent 200 without writing to DB');
    const initialDocCount = mockDocs.size;
    const honeypotRes = await request(port, {
      body: {
        type: 'reservation_request',
        name: 'Spam Bot',
        phone: '01099998888',
        honeypot: 'I am a bot filled trap',
      },
      headers: { 'x-forwarded-for': '192.168.1.121' },
    });

    if (honeypotRes.status === 200 && honeypotRes.body.success && honeypotRes.body.ignored) {
      if (mockDocs.size === initialDocCount) {
        console.log('  ✅ PASSED: Honeypot silently succeeded without writing to Firestore');
      } else {
        console.error('  ❌ FAILED: Document was written to Firestore despite honeypot!');
        allPassed = false;
      }
    } else {
      console.error('  ❌ FAILED: Expected 200 { success: true, ignored: true }, got:', honeypotRes);
      allPassed = false;
    }

    // ----------------------------------------------------
    // TEST 6: Rate limit: > 5 requests in 5 minutes rejected with 429
    // ----------------------------------------------------
    console.log('\n▶ Test 6: Rate limiting rejects 6th request with 429');
    const rateLimitIp = '10.0.0.99';
    let hitCount = 0;
    let got429 = false;

    for (let i = 1; i <= 6; i++) {
      const rlRes = await request(port, {
        body: {
          type: 'reservation_request',
          name: `عميل تجريبي ${i}`,
          phone: `0101234567${i}`,
        },
        headers: { 'x-forwarded-for': rateLimitIp },
      });

      if (rlRes.status === 200) {
        hitCount++;
      } else if (rlRes.status === 429) {
        got429 = true;
        console.log(`  Request #${i} correctly blocked with 429: ${rlRes.body.error}`);
      }
    }

    if (hitCount === 5 && got429) {
      console.log('  ✅ PASSED: Rate limit correctly allowed 5 requests and rejected the 6th with 429');
    } else {
      console.error(`  ❌ FAILED: Rate limit check failed. hitCount: ${hitCount}, got429: ${got429}`);
      allPassed = false;
    }

  } finally {
    setAdminFirestoreForTesting(null);
    server.close();
  }

  if (allPassed) {
    console.log('\n🎉 ALL 6 /api/submit-inquiry TESTS PASSED! 🎉\n');
    process.exit(0);
  } else {
    console.error('\n❌ SOME TESTS FAILED! ❌\n');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
