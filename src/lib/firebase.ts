import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import type { 
  SiteSettings, 
  SectionConfig, 
  MenuCategory, 
  MenuItem, 
  BranchInfo, 
  RatingBadge, 
  ImageSlot, 
  MediaItem,
  Inquiry,
  ContentVersion,
  AdminUser,
  UserRole
} from '../types';

export interface PublishedSiteSnapshot {
  siteSettings: SiteSettings;
  sections: SectionConfig[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  branches: BranchInfo[];
  ratingBadges: RatingBadge[];
  imageSlots: Record<string, ImageSlot>;
  mediaList: MediaItem[];
  updated_at: string;
  updated_by?: string;
  schema_version?: number;
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId &&
    firebaseConfig.apiKey.length > 10 &&
    firebaseConfig.projectId.length >= 2
  );
};

let _app: FirebaseApp | null = null;
export const getFirebaseApp = (): FirebaseApp | null => {
  if (!isFirebaseConfigured()) return null;
  if (getApps().length > 0) return getApp();
  _app = initializeApp(firebaseConfig);
  return _app;
};

// Firestore is loaded on-demand
let _db: any = null;
let _dbPromise: Promise<any> | null = null;
export const getDb = async (): Promise<any | null> => {
  if (!isFirebaseConfigured()) return null;
  if (_db) return _db;
  if (!_dbPromise) {
    _dbPromise = import('firebase/firestore').then(({ getFirestore }) => {
      const app = getFirebaseApp();
      if (!app) return null;
      _db = getFirestore(app);
      return _db;
    });
  }
  return _dbPromise;
};

// Auth is loaded ONLY on admin pages or login, never by anonymous public visitors
let _auth: any = null;
let _authPromise: Promise<any> | null = null;
export const getAuthInstance = async (): Promise<any | null> => {
  if (!isFirebaseConfigured()) return null;
  if (_auth) return _auth;
  if (!_authPromise) {
    _authPromise = import('firebase/auth').then(({ getAuth }) => {
      const app = getFirebaseApp();
      if (!app) return null;
      _auth = getAuth(app);
      return _auth;
    });
  }
  return _authPromise;
};

export const getIdToken = async (): Promise<string | null> => {
  const auth = await getAuthInstance();
  if (!auth || !auth.currentUser) return null;
  return auth.currentUser.getIdToken();
};

export const sanitizeForFirestore = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj, (_key, value) => {
    return value === undefined ? null : value;
  }));
};

// ==========================================
// FIRESTORE PUBLISHED & DRAFT DATA
// ==========================================

export const loadPublishedSite = async (): Promise<PublishedSiteSnapshot | null> => {
  const db = await getDb();
  if (!db) return null;
  const { doc, getDoc } = await import('firebase/firestore');
  const docRef = doc(db, 'published', 'site');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as PublishedSiteSnapshot;
  }
  return null;
};

export const savePublishedSite = async (snapshot: PublishedSiteSnapshot): Promise<void> => {
  const db = await getDb();
  if (!db) throw new Error('Firebase Firestore not initialized');
  const { doc, setDoc } = await import('firebase/firestore');
  const docRef = doc(db, 'published', 'site');
  const cleanData = sanitizeForFirestore(snapshot);
  await setDoc(docRef, cleanData, { merge: false });
};

export const loadDraftSite = async (): Promise<PublishedSiteSnapshot | null> => {
  const db = await getDb();
  if (!db) return null;
  const { doc, getDoc } = await import('firebase/firestore');
  const docRef = doc(db, 'drafts', 'site');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as PublishedSiteSnapshot;
  }
  return null;
};

export const saveDraftSite = async (draft: Partial<PublishedSiteSnapshot>): Promise<void> => {
  const db = await getDb();
  if (!db) return;
  const { doc, setDoc } = await import('firebase/firestore');
  const docRef = doc(db, 'drafts', 'site');
  const cleanData = sanitizeForFirestore({
    ...draft,
    updated_at: new Date().toISOString()
  });
  await setDoc(docRef, cleanData, { merge: true });
};

export const clearDraftSite = async (): Promise<void> => {
  const db = await getDb();
  if (!db) return;
  const { doc, deleteDoc } = await import('firebase/firestore');
  const docRef = doc(db, 'drafts', 'site');
  await deleteDoc(docRef);
};

// ==========================================
// VERSIONS (Keep last 20)
// ==========================================

export const loadVersionsFromFirestore = async (): Promise<ContentVersion[]> => {
  const db = await getDb();
  if (!db) return [];
  const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');
  const q = query(collection(db, 'versions'), orderBy('created_at', 'desc'), limit(20));
  const snap = await getDocs(q);
  const result: ContentVersion[] = [];
  snap.forEach(d => {
    result.push(d.data() as ContentVersion);
  });
  return result;
};

export const saveVersionToFirestore = async (version: ContentVersion): Promise<void> => {
  const db = await getDb();
  if (!db) return;
  const { doc, setDoc } = await import('firebase/firestore');
  const docRef = doc(db, 'versions', version.id);
  await setDoc(docRef, sanitizeForFirestore(version));
};

// ==========================================
// INQUIRIES (Public CREATE, Admin READ/UPDATE)
// ==========================================

export const submitInquiryToFirestore = async (inquiry: Inquiry): Promise<void> => {
  const db = await getDb();
  if (!db) throw new Error('Firestore not initialized');
  const { doc, setDoc } = await import('firebase/firestore');
  const docRef = doc(db, 'inquiries', inquiry.id);
  await setDoc(docRef, sanitizeForFirestore(inquiry));
};

export const loadInquiriesFromFirestore = async (): Promise<Inquiry[]> => {
  const db = await getDb();
  if (!db) return [];
  const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');
  const q = query(collection(db, 'inquiries'), orderBy('created_at', 'desc'), limit(100));
  const snap = await getDocs(q);
  const result: Inquiry[] = [];
  snap.forEach(d => {
    result.push(d.data() as Inquiry);
  });
  return result;
};

export const updateInquiryInFirestore = async (id: string, partial: Partial<Inquiry>): Promise<void> => {
  const db = await getDb();
  if (!db) return;
  const { doc, updateDoc } = await import('firebase/firestore');
  const docRef = doc(db, 'inquiries', id);
  await updateDoc(docRef, sanitizeForFirestore(partial));
};

// ==========================================
// ADMIN ROLES & USERS
// ==========================================

const INITIAL_OWNER_UID = 'AeJXyph2xyXUZfQOWIs4gwrJrYT2';

export const getUserRole = async (uid: string): Promise<UserRole> => {
  if (uid === INITIAL_OWNER_UID) return 'owner';
  const db = await getDb();
  if (!db) return 'viewer';
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const adminDoc = await getDoc(doc(db, 'admins', uid));
    if (adminDoc.exists()) {
      const data = adminDoc.data();
      return (data?.role as UserRole) || 'viewer';
    }
  } catch (err) {
    console.warn('Error fetching admin role:', err);
  }
  return 'viewer';
};

export const loadAdminsFromFirestore = async (): Promise<AdminUser[]> => {
  const db = await getDb();
  if (!db) return [];
  const { collection, getDocs } = await import('firebase/firestore');
  const snap = await getDocs(collection(db, 'admins'));
  const list: AdminUser[] = [];
  snap.forEach(d => {
    const data = d.data();
    list.push({
      id: d.id,
      email: data.email || '',
      role: (data.role as UserRole) || 'viewer',
      created_at: data.created_at || new Date().toISOString(),
      last_sign_in_at: data.last_sign_in_at
    });
  });
  return list;
};

export const saveAdminToFirestore = async (admin: AdminUser): Promise<void> => {
  const db = await getDb();
  if (!db) throw new Error('Firestore not initialized');
  const { doc, setDoc } = await import('firebase/firestore');
  const docRef = doc(db, 'admins', admin.id);
  await setDoc(docRef, sanitizeForFirestore({
    email: admin.email,
    role: admin.role,
    created_at: admin.created_at,
    last_sign_in_at: admin.last_sign_in_at || null
  }), { merge: true });
};

export const deleteAdminFromFirestore = async (uid: string): Promise<void> => {
  const db = await getDb();
  if (!db) throw new Error('Firestore not initialized');
  const { doc, deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'admins', uid));
};
