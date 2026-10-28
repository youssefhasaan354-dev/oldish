import admin from 'firebase-admin';

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
 * @returns {admin.firestore.Firestore}
 */
export function getAdminFirestore() {
  if (dbInstance) {
    return dbInstance;
  }

  if (admin.apps.length === 0) {
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

    admin.initializeApp({
      credential: admin.credential.cert(credentials)
    });
  }

  dbInstance = admin.firestore();
  return dbInstance;
}
