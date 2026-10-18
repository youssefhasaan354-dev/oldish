import crypto from 'node:crypto';

export default async function handler(req, res) {
  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Check Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const idToken = authHeader.split('Bearer ')[1].trim();

  // 2. Validate Firebase API Key & Project ID
  const firebaseApiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  const firebaseProjectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'oldish-1';
  
  if (!firebaseApiKey) {
    return res.status(500).json({ error: 'Server misconfiguration: missing Firebase API key' });
  }

  // 3. Verify ID Token via Firebase Identity Toolkit REST API
  let uid = null;
  try {
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      }
    );
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok || !verifyData.users || verifyData.users.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired Firebase ID token' });
    }
    uid = verifyData.users[0].localId;
  } catch (err) {
    return res.status(401).json({ error: 'Failed to verify Firebase token: ' + (err?.message || String(err)) });
  }

  // 4. Verify admin role in Firestore
  let role = null;
  const KNOWN_OWNER_UID = 'AeJXyph2xyXUZfQOWIs4gwrJrYT2';
  if (uid === KNOWN_OWNER_UID) {
    role = 'owner';
  } else {
    try {
      const fsRes = await fetch(
        `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/admins/${uid}`,
        {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        }
      );
      if (fsRes.ok) {
        const doc = await fsRes.json();
        role = doc.fields?.role?.stringValue;
      }
    } catch (err) {
      console.warn('Firestore admin check error:', err);
    }
  }

  if (role !== 'owner' && role !== 'editor') {
    return res.status(403).json({ error: 'Forbidden: Insufficient privileges to upload media' });
  }

  // 5. Cloudinary credentials from server environment
  const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
  const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudinaryCloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;

  if (!cloudinaryApiKey || !cloudinaryApiSecret || !cloudinaryCloudName) {
    return res.status(500).json({ error: 'Server misconfiguration: missing Cloudinary credentials' });
  }

  // 6. Sign upload payload
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'oldish';

  // Sorted parameters: folder, timestamp
  const toSign = `folder=${folder}&timestamp=${timestamp}${cloudinaryApiSecret}`;
  const signature = crypto.createHash('sha1').update(toSign).digest('hex');

  return res.status(200).json({
    signature,
    timestamp,
    folder,
    apiKey: cloudinaryApiKey,
    cloudName: cloudinaryCloudName
  });
}
