import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let dbInstance = null;

/**
 * Used exclusively for local automated unit tests to mock Firestore.
 * @param {any} mock
 */
export function setAdminFirestoreForTesting(mock) {
  dbInstance = mock;
}

/**
 * Returns an initialized Firestore instance using the service account credentials
 * from process.env.FIREBASE_SERVICE_ACCOUNT_JSON.
 * Uses the modular firebase-admin entry points, which work in Vercel's ESM runtime.
 * @returns {import('firebase-admin/firestore').Firestore}
 */
export function getAdminFirestore() {
  if (dbInstance) {
    return dbInstance;
  }

  if (getApps().length === 0) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not configured');
    }

    let credentials;
    try {
      credentials = typeof raw === 'object' ? raw : JSON.parse(raw);
    } catch (err) {
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON: ' + err.message);
    }

    // Some tools store the key with literal "\n" sequences; normalise to real newlines.
    if (typeof credentials.private_key === 'string') {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    initializeApp({
      credential: cert(credentials)
    });
  }

  dbInstance = getFirestore();
  return dbInstance;
}