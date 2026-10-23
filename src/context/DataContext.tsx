import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  ActivityLog
} from '../types';
import { 
  SEED_SITE_SETTINGS, 
  SEED_SECTIONS, 
  SEED_MENU_CATEGORIES, 
  SEED_MENU_ITEMS, 
  SEED_BRANCHES, 
  SEED_RATING_BADGES, 
  SEED_IMAGE_SLOTS, 
  SEED_MEDIA 
} from '../data/seedData';
import { 
  isFirebaseConfigured, 
  loadPublishedSite, 
  savePublishedSite, 
  loadDraftSite, 
  saveDraftSite, 
  clearDraftSite, 
  loadVersionsFromFirestore, 
  saveVersionToFirestore, 
  submitInquiryToFirestore, 
  loadInquiriesFromFirestore, 
  updateInquiryInFirestore,
  type PublishedSiteSnapshot 
} from '../lib/firebase';
import { 
  uploadToCloudinary, 
  deleteFromCloudinary, 
  getCloudinaryUrl 
} from '../lib/cloudinary';
import { useAuth } from './AuthContext';
import { saveBlob, clearAllBlobs } from '../lib/idbStorage';
import { processImageUpload, validateImageFile } from '../lib/imageProcessor';

interface DataContextType {
  siteSettings: SiteSettings;
  sections: SectionConfig[];
  mediaList: MediaItem[];
  imageSlots: Record<string, ImageSlot>;
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  branches: BranchInfo[];
  ratingBadges: RatingBadge[];
  inquiries: Inquiry[];
  versions: ContentVersion[];
  activityLogs: ActivityLog[];
  isLoading: boolean;
  hasUnsavedDraft: boolean;
  isFirebaseActive: boolean;
  isPreviewMode: boolean;
  sessionUndoMap: Record<string, string>;
  getImageForSlot: (slotKey: string, fallbackUrl?: string) => { 
    url: string; 
    altEn: string; 
    altAr: string; 
    isAi: boolean; 
    style: React.CSSProperties;
    slot?: ImageSlot;
  };
  updateSettings: (partial: Partial<SiteSettings>) => void;
  updateSection: (key: string, partial: Partial<SectionConfig>) => void;
  reorderSections: (newSections: SectionConfig[]) => void;
  updateImageSlot: (slotKey: string, partial: Partial<ImageSlot>) => void;
  replaceSlotImage: (
    slotKey: string, 
    file: File, 
    options?: {
      altEn?: string;
      altAr?: string;
      captionEn?: string;
      captionAr?: string;
      onProgress?: (percent: number, status: string) => void;
    }
  ) => Promise<{ success: boolean; error?: string; cropWarning?: string }>;
  undoSlotReplacement: (slotKey: string) => boolean;
  resetSlotToDefault: (slotKey: string) => void;
  addSlotAtPosition: (
    section: string,
    relativeToKey: string,
    position: 'before' | 'after',
    file: File,
    slotMeta?: Partial<ImageSlot>,
    onProgress?: (percent: number, status: string) => void
  ) => Promise<{ success: boolean; newSlotKey?: string; error?: string; cropWarning?: string }>;
  deleteSlot: (slotKey: string) => boolean;
  reorderSlots: (section: string, newOrderKeys: string[]) => void;
  addMedia: (media: MediaItem) => void;
  updateMedia: (id: string, partial: Partial<MediaItem>) => void;
  deleteMedia: (id: string) => { success: boolean; usageCount: number };
  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (id: string, partial: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  reorderMenuItems: (newItems: MenuItem[]) => void;
  addMenuCategory: (cat: MenuCategory) => void;
  updateMenuCategory: (id: string, partial: Partial<MenuCategory>) => void;
  deleteMenuCategory: (id: string) => void;
  updateBranch: (id: string, partial: Partial<BranchInfo>) => void;
  addBranch: (branch: BranchInfo) => void;
  deleteBranch: (id: string) => void;
  updateRatingBadge: (id: string, partial: Partial<RatingBadge>) => void;
  publishChanges: (label?: string) => Promise<boolean>;
  restoreVersion: (versionId: string) => boolean;
  discardDraft: () => void;
  resetAllDemoData: () => Promise<void>;
  submitInquiry: (data: Omit<Inquiry, 'id' | 'status' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  markInquiryHandled: (id: string) => void;
  archiveInquiry: (id: string) => void;
  trackClick: (type: 'calls' | 'directions' | 'menu_views' | 'whatsapp_clicks' | 'reservation_requests') => void;
}

const DATA_SCHEMA_VERSION = 5;
const STORAGE_KEY_SCHEMA_VERSION = 'oldish_data_schema_version';
const STORAGE_KEY_PUBLISHED = 'oldish_published_data_v5';
const STORAGE_KEY_DRAFT = 'oldish_draft_data_v5';
const STORAGE_KEY_INQUIRIES = 'oldish_inquiries_v5';
const STORAGE_KEY_VERSIONS = 'oldish_versions_v5';
const STORAGE_KEY_LOGS = 'oldish_logs_v5';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isFirebaseActive = isFirebaseConfigured();
  const { isAuthenticated, getIdToken, user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedDraft, setHasUnsavedDraft] = useState(false);
  const [sessionUndoMap, setSessionUndoMap] = useState<Record<string, string>>({});
  const [isPreviewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('preview') === 'draft';
    }
    return false;
  });

  // Primary State
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(SEED_SITE_SETTINGS);
  const [sections, setSections] = useState<SectionConfig[]>(SEED_SECTIONS);
  const [mediaList, setMediaList] = useState<MediaItem[]>(SEED_MEDIA);
  const [imageSlots, setImageSlots] = useState<Record<string, ImageSlot>>(() => {
    const map: Record<string, ImageSlot> = {};
    SEED_IMAGE_SLOTS.forEach(slot => { map[slot.slot_key] = slot; });
    return map;
  });
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(SEED_MENU_CATEGORIES);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(SEED_MENU_ITEMS);
  const [branches, setBranches] = useState<BranchInfo[]>(SEED_BRANCHES);
  const [ratingBadges, setRatingBadges] = useState<RatingBadge[]>(SEED_RATING_BADGES);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Apply a data snapshot to state
  const applySnapshotToState = useCallback((snap: Partial<PublishedSiteSnapshot>) => {
    if (snap.siteSettings) {
      setSiteSettings({
        ...SEED_SITE_SETTINGS,
        ...snap.siteSettings,
        analytics_clicks: {
          calls: snap.siteSettings.analytics_clicks?.calls ?? SEED_SITE_SETTINGS.analytics_clicks?.calls ?? 0,
          directions: snap.siteSettings.analytics_clicks?.directions ?? SEED_SITE_SETTINGS.analytics_clicks?.directions ?? 0,
          menu_views: snap.siteSettings.analytics_clicks?.menu_views ?? SEED_SITE_SETTINGS.analytics_clicks?.menu_views ?? 0,
          whatsapp_clicks: snap.siteSettings.analytics_clicks?.whatsapp_clicks ?? SEED_SITE_SETTINGS.analytics_clicks?.whatsapp_clicks ?? 0,
          reservation_requests: snap.siteSettings.analytics_clicks?.reservation_requests ?? SEED_SITE_SETTINGS.analytics_clicks?.reservation_requests ?? 0
        }
      });
    }
    if (snap.sections && snap.sections.length > 0) setSections(snap.sections);
    if (snap.mediaList && snap.mediaList.length > 0) setMediaList(snap.mediaList);
    
    // Slot merge: keep registry defaults for missing keys, overlay customized properties
    const mergedSlots: Record<string, ImageSlot> = {};
    SEED_IMAGE_SLOTS.forEach(seedSlot => {
      mergedSlots[seedSlot.slot_key] = { ...seedSlot };
    });

    if (snap.imageSlots) {
      const slotsObj = Array.isArray(snap.imageSlots)
        ? (snap.imageSlots as ImageSlot[]).reduce((acc, cur) => { acc[cur.slot_key] = cur; return acc; }, {} as Record<string, ImageSlot>)
        : (snap.imageSlots as Record<string, ImageSlot>);

      Object.entries(slotsObj).forEach(([key, userSlot]) => {
        if (mergedSlots[key]) {
          mergedSlots[key] = {
            ...mergedSlots[key],
            ...userSlot,
            section: mergedSlots[key].section,
            where_appears_en: mergedSlots[key].where_appears_en,
            where_appears_ar: mergedSlots[key].where_appears_ar,
            recommended_size: mergedSlots[key].recommended_size,
            recommended_aspect_ratio: mergedSlots[key].recommended_aspect_ratio,
            default_url: mergedSlots[key].default_url,
            can_delete: mergedSlots[key].can_delete
          };
        } else {
          mergedSlots[key] = userSlot;
        }
      });
    }
    setImageSlots(mergedSlots);

    if (snap.menuCategories && snap.menuCategories.length > 0) setMenuCategories(snap.menuCategories);
    if (snap.menuItems && snap.menuItems.length > 0) setMenuItems(snap.menuItems);
    if (snap.branches && snap.branches.length > 0) setBranches(snap.branches);
    if (snap.ratingBadges && snap.ratingBadges.length > 0) setRatingBadges(snap.ratingBadges);
  }, []);

  // Helper to persist current draft state locally and to Firestore if authenticated
  const saveDraftTimerRef = useRef<any>(null);
  const saveDraftLocally = (updatedState: {
    siteSettings?: SiteSettings;
    sections?: SectionConfig[];
    mediaList?: MediaItem[];
    imageSlots?: Record<string, ImageSlot>;
    menuCategories?: MenuCategory[];
    menuItems?: MenuItem[];
    branches?: BranchInfo[];
    ratingBadges?: RatingBadge[];
  }) => {
    setHasUnsavedDraft(true);
    const fullDraft = {
      siteSettings: updatedState.siteSettings || siteSettings,
      sections: updatedState.sections || sections,
      mediaList: updatedState.mediaList || mediaList,
      imageSlots: updatedState.imageSlots || imageSlots,
      menuCategories: updatedState.menuCategories || menuCategories,
      menuItems: updatedState.menuItems || menuItems,
      branches: updatedState.branches || branches,
      ratingBadges: updatedState.ratingBadges || ratingBadges,
    };
    try {
      localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(fullDraft));
      localStorage.setItem(STORAGE_KEY_SCHEMA_VERSION, String(DATA_SCHEMA_VERSION));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    // If authenticated in live Firebase, sync draft to Firestore (debounced)
    if (isFirebaseActive && isAuthenticated) {
      if (saveDraftTimerRef.current) clearTimeout(saveDraftTimerRef.current);
      saveDraftTimerRef.current = setTimeout(async () => {
        try {
          await saveDraftSite(fullDraft);
        } catch (err) {
          console.warn('Cloud draft sync warning:', err);
        }
      }, 1000);
    }
  };

  // Log activity
  const logAction = (action: string, entity: string, details?: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      user_email: user?.email || 'admin@oldish-chi.vercel.app',
      action,
      entity,
      details,
      created_at: new Date().toISOString()
    };
    setActivityLogs(prev => {
      const updated = [newLog, ...prev.slice(0, 99)];
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updated));
      return updated;
    });
  };

  // ==========================================
  // INITIAL DATA LOADING
  // ==========================================
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        // 1. Fast local cache check for instant paint
        const cachedPublished = localStorage.getItem(STORAGE_KEY_PUBLISHED);
        const cachedDraft = localStorage.getItem(STORAGE_KEY_DRAFT);
        const cachedInquiries = localStorage.getItem(STORAGE_KEY_INQUIRIES);
        const cachedVersions = localStorage.getItem(STORAGE_KEY_VERSIONS);
        const cachedLogs = localStorage.getItem(STORAGE_KEY_LOGS);

        if (cachedInquiries) {
          try { setInquiries(JSON.parse(cachedInquiries)); } catch {}
        }
        if (cachedVersions) {
          try { setVersions(JSON.parse(cachedVersions)); } catch {}
        }
        if (cachedLogs) {
          try { setActivityLogs(JSON.parse(cachedLogs)); } catch {}
        }

        // Apply local published cache immediately for fast render
        if (cachedPublished) {
          try {
            applySnapshotToState(JSON.parse(cachedPublished));
          } catch (e) {
            console.warn('Error applying cached published:', e);
          }
        }

        // 2. Fetch live data from Firestore
        if (isFirebaseActive) {
          try {
            // A. Anonymous visitors always load published/site from Firestore
            const publishedSnap = await loadPublishedSite();
            if (publishedSnap && isMounted) {
              applySnapshotToState(publishedSnap);
              localStorage.setItem(STORAGE_KEY_PUBLISHED, JSON.stringify(publishedSnap));
            }

            // B. If authenticated admin, check for active draft & inquiries & versions
            if (isAuthenticated) {
              const [draftSnap, firestoreInquiries, firestoreVersions] = await Promise.all([
                loadDraftSite().catch(() => null),
                loadInquiriesFromFirestore().catch(() => []),
                loadVersionsFromFirestore().catch(() => [])
              ]);

              if (draftSnap && isMounted) {
                applySnapshotToState(draftSnap);
                setHasUnsavedDraft(true);
                localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(draftSnap));
              } else if (cachedDraft && isMounted) {
                applySnapshotToState(JSON.parse(cachedDraft));
                setHasUnsavedDraft(true);
              }

              if (firestoreInquiries.length > 0 && isMounted) {
                setInquiries(firestoreInquiries);
                localStorage.setItem(STORAGE_KEY_INQUIRIES, JSON.stringify(firestoreInquiries));
              }

              if (firestoreVersions.length > 0 && isMounted) {
                setVersions(firestoreVersions);
                localStorage.setItem(STORAGE_KEY_VERSIONS, JSON.stringify(firestoreVersions));
              }
            }
          } catch (netErr) {
            console.warn('Firestore live fetch note (falling back to cache/seed):', netErr);
            if (cachedDraft && isAuthenticated) {
              applySnapshotToState(JSON.parse(cachedDraft));
              setHasUnsavedDraft(true);
            }
          }
        } else {
          // Local Demo Mode: restore draft if present
          if (cachedDraft) {
            applySnapshotToState(JSON.parse(cachedDraft));
            setHasUnsavedDraft(true);
          }
        }
      } catch (err) {
        console.error('Error in loadData:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isFirebaseActive, isAuthenticated, applySnapshotToState]);

  // Image Slot Resolution helper
  const getImageForSlot = useCallback((slotKey: string, fallbackUrl?: string) => {
    const slot = imageSlots[slotKey];
    let mediaItem: MediaItem | undefined;

    if (slot?.media_id) {
      mediaItem = mediaList.find(m => m.id === slot.media_id);
    }

    const url = slot?.media_url || mediaItem?.public_url || slot?.default_url || fallbackUrl || '/images/oldish_courtyard_hero.webp';
    const altEn = slot?.alt_en || mediaItem?.alt_en || slot?.label_en || 'Oldish Restaurant & Café';
    const altAr = slot?.alt_ar || mediaItem?.alt_ar || slot?.label_ar || 'أولديش مطعم ومقهى';
    const isAi = mediaItem ? mediaItem.is_ai : false;

    const style: React.CSSProperties = {
      objectPosition: `${slot?.object_position_x ?? 50}% ${slot?.object_position_y ?? 50}%`,
      objectFit: slot?.object_fit || 'cover',
      transform: slot?.zoom && slot.zoom > 1 ? `scale(${slot.zoom})` : undefined,
    };

    return { url, altEn, altAr, isAi, style, slot };
  }, [imageSlots, mediaList]);

  // Basic Setters
  const updateSettings = (partial: Partial<SiteSettings>) => {
    setSiteSettings(prev => {
      const updated = { ...prev, ...partial };
      saveDraftLocally({ siteSettings: updated });
      return updated;
    });
    logAction('Update Settings', 'General');
  };

  const updateSection = (key: string, partial: Partial<SectionConfig>) => {
    setSections(prev => {
      const updated = prev.map(s => s.key === key ? { ...s, ...partial } : s);
      saveDraftLocally({ sections: updated });
      return updated;
    });
    logAction('Update Section', key);
  };

  const reorderSections = (newSections: SectionConfig[]) => {
    const reindexed = newSections.map((sec, idx) => ({ ...sec, sort_order: idx }));
    setSections(reindexed);
    saveDraftLocally({ sections: reindexed });
    logAction('Reorder Sections', 'All');
  };

  const updateImageSlot = (slotKey: string, partial: Partial<ImageSlot>) => {
    setImageSlots(prev => {
      const existing = prev[slotKey] || {
        slot_key: slotKey,
        label_en: slotKey,
        label_ar: slotKey,
        section: 'custom',
        object_position_x: 50,
        object_position_y: 50,
        object_fit: 'cover' as const,
        zoom: 1,
        overlay_opacity: 0,
        sort_order: 0,
        visible: true
      };
      const updated = { ...prev, [slotKey]: { ...existing, ...partial } };
      saveDraftLocally({ imageSlots: updated });
      return updated;
    });
    logAction('Update Slot Settings', slotKey);
  };

  // REPLACE IN PLACE: Uploads image to Cloudinary (or IDB in demo mode)
  // and KEEPS all slot settings (focal point, zoom, fit, opacity, order, visibility, alts)
  const replaceSlotImage = async (
    slotKey: string,
    file: File,
    options?: {
      altEn?: string;
      altAr?: string;
      captionEn?: string;
      captionAr?: string;
      onProgress?: (percent: number, status: string) => void;
    }
  ): Promise<{ success: boolean; error?: string; cropWarning?: string }> => {
    const currentSlot = imageSlots[slotKey];
    if (!currentSlot) {
      return { success: false, error: 'موقع الصورة غير موجود في السجل المركزي.' };
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    try {
      const isLogo = slotKey.startsWith('branding.logo') || slotKey === 'branding.qr_logo' || slotKey === 'branding.favicon';
      const isSocialImage = slotKey === 'branding.social_share';
      
      let recommendedRatio: number | undefined;
      if (currentSlot.recommended_aspect_ratio) {
        if (currentSlot.recommended_aspect_ratio.includes('16:9') || currentSlot.recommended_aspect_ratio.includes('16/9')) recommendedRatio = 16 / 9;
        else if (currentSlot.recommended_aspect_ratio.includes('4:3') || currentSlot.recommended_aspect_ratio.includes('4/3')) recommendedRatio = 4 / 3;
        else if (currentSlot.recommended_aspect_ratio.includes('1:1') || currentSlot.recommended_aspect_ratio.includes('1/1')) recommendedRatio = 1;
        else if (currentSlot.recommended_aspect_ratio.includes('1.91:1')) recommendedRatio = 1.91;
      }

      const processed = await processImageUpload(file, {
        isLogo,
        isSocialImage,
        maxDimension: isLogo ? 800 : 2000,
        recommendedRatio,
        recommendedRatioLabel: currentSlot.recommended_aspect_ratio,
        onProgress: options?.onProgress
      });

      let newUrl = '';
      let newThumbUrl = '';
      let storagePath = '';
      const newMediaId = `media-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      if (isFirebaseActive) {
        const token = await getIdToken();
        if (!token) throw new Error('يرجى تسجيل الدخول أولاً كمسؤول لرفع الصور السحابية.');
        
        const uploadResult = await uploadToCloudinary(processed.blob, token, {
          onProgress: options?.onProgress
        });

        newUrl = uploadResult.secure_url;
        newThumbUrl = getCloudinaryUrl(newUrl, 400);
        storagePath = uploadResult.public_id;
      } else {
        // Demo mode: persist in IndexedDB
        newUrl = await saveBlob(`slot-${slotKey}-${Date.now()}`, processed.blob);
        newThumbUrl = await saveBlob(`thumb-slot-${slotKey}-${Date.now()}`, processed.thumbnailBlob);
        storagePath = newUrl;
      }

      // Record undo session
      setSessionUndoMap(prev => ({
        ...prev,
        [slotKey]: currentSlot.media_url || currentSlot.default_url || ''
      }));

      // Add to mediaList
      const newMediaItem: MediaItem = {
        id: newMediaId,
        storage_path: storagePath,
        public_url: newUrl,
        width: processed.width,
        height: processed.height,
        bytes: processed.blob.size,
        alt_en: options?.altEn || currentSlot.alt_en || 'Oldish Restaurant & Café',
        alt_ar: options?.altAr || currentSlot.alt_ar || 'أولديش مطعم ومقهى',
        caption_en: options?.captionEn || currentSlot.caption_en,
        caption_ar: options?.captionAr || currentSlot.caption_ar,
        tags: [currentSlot.section],
        is_ai: false,
        created_at: new Date().toISOString()
      };
      setMediaList(prev => [newMediaItem, ...prev]);

      // Update slot while KEEPING all placement settings
      const updatedSlot: ImageSlot = {
        ...currentSlot,
        media_id: newMediaId,
        media_url: newUrl,
        thumbnail_url: newThumbUrl,
        object_position_x: currentSlot.object_position_x,
        object_position_y: currentSlot.object_position_y,
        zoom: currentSlot.zoom,
        object_fit: currentSlot.object_fit,
        overlay_opacity: currentSlot.overlay_opacity,
        aspect_ratio: currentSlot.aspect_ratio,
        sort_order: currentSlot.sort_order,
        visible: currentSlot.visible,
        alt_en: options?.altEn !== undefined ? options.altEn : currentSlot.alt_en,
        alt_ar: options?.altAr !== undefined ? options.altAr : currentSlot.alt_ar,
        caption_en: options?.captionEn !== undefined ? options.captionEn : currentSlot.caption_en,
        caption_ar: options?.captionAr !== undefined ? options.captionAr : currentSlot.caption_ar
      };

      const updatedSlots = { ...imageSlots, [slotKey]: updatedSlot };
      setImageSlots(updatedSlots);

      // If updating logo slot, keep siteSettings.logo_url synchronized
      let updatedSettings = siteSettings;
      if (slotKey === 'branding.logo') {
        updatedSettings = { ...siteSettings, logo_url: newUrl };
        setSiteSettings(updatedSettings);
      }

      saveDraftLocally({ 
        imageSlots: updatedSlots, 
        mediaList: [newMediaItem, ...mediaList],
        siteSettings: updatedSettings
      });

      logAction('Replace Slot Image', slotKey, `New URL: ${newUrl.substring(0, 40)}...`);
      return { 
        success: true, 
        cropWarning: processed.cropWarning 
      };
    } catch (err: any) {
      console.error('Failed to replace slot image:', err);
      return { 
        success: false, 
        error: err?.message || 'حدث خطأ أثناء معالجة ورفع الصورة.' 
      };
    }
  };

  // Undo single replacement in current session
  const undoSlotReplacement = (slotKey: string): boolean => {
    const prevUrl = sessionUndoMap[slotKey];
    if (!prevUrl) return false;

    const currentSlot = imageSlots[slotKey];
    if (!currentSlot) return false;

    const revertedSlot: ImageSlot = {
      ...currentSlot,
      media_url: prevUrl === currentSlot.default_url ? undefined : prevUrl,
      media_id: undefined
    };

    const updatedSlots = { ...imageSlots, [slotKey]: revertedSlot };
    setImageSlots(updatedSlots);
    saveDraftLocally({ imageSlots: updatedSlots });

    setSessionUndoMap(prev => {
      const copy = { ...prev };
      delete copy[slotKey];
      return copy;
    });

    logAction('Undo Slot Replacement', slotKey);
    return true;
  };

  // Reset slot to default original image
  const resetSlotToDefault = (slotKey: string) => {
    const currentSlot = imageSlots[slotKey];
    if (!currentSlot) return;

    const resetSlot: ImageSlot = {
      ...currentSlot,
      media_url: undefined,
      media_id: undefined,
      thumbnail_url: undefined,
      object_position_x: 50,
      object_position_y: 50,
      zoom: 1,
      object_fit: 'cover',
      overlay_opacity: 0
    };

    const updatedSlots = { ...imageSlots, [slotKey]: resetSlot };
    setImageSlots(updatedSlots);
    saveDraftLocally({ imageSlots: updatedSlots });
    logAction('Reset Slot to Default', slotKey);
  };

  // Add slot in a specific section relative to another slot
  const addSlotAtPosition = async (
    section: string,
    relativeToKey: string,
    position: 'before' | 'after',
    file: File,
    slotMeta?: Partial<ImageSlot>,
    onProgress?: (percent: number, status: string) => void
  ): Promise<{ success: boolean; newSlotKey?: string; error?: string; cropWarning?: string }> => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    try {
      const processed = await processImageUpload(file, {
        isLogo: false,
        maxDimension: 2000,
        onProgress
      });

      let newUrl = '';
      let newThumbUrl = '';
      let storagePath = '';
      const newMediaId = `media-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      if (isFirebaseActive) {
        const token = await getIdToken();
        if (!token) throw new Error('يرجى تسجيل الدخول أولاً كمسؤول.');
        
        const uploadResult = await uploadToCloudinary(processed.blob, token, { onProgress });
        newUrl = uploadResult.secure_url;
        newThumbUrl = getCloudinaryUrl(newUrl, 400);
        storagePath = uploadResult.public_id;
      } else {
        newUrl = await saveBlob(`slot-${section}-${Date.now()}`, processed.blob);
        newThumbUrl = await saveBlob(`thumb-slot-${section}-${Date.now()}`, processed.thumbnailBlob);
        storagePath = newUrl;
      }

      const newMediaItem: MediaItem = {
        id: newMediaId,
        storage_path: storagePath,
        public_url: newUrl,
        width: processed.width,
        height: processed.height,
        bytes: processed.blob.size,
        alt_en: slotMeta?.alt_en || slotMeta?.label_en || 'Oldish visual atmosphere',
        alt_ar: slotMeta?.alt_ar || slotMeta?.label_ar || 'أجواء أولديش',
        tags: [section],
        is_ai: false,
        created_at: new Date().toISOString()
      };
      setMediaList(prev => [newMediaItem, ...prev]);

      const sectionSlots = Object.values(imageSlots)
        .filter(s => s.section === section)
        .sort((a, b) => a.sort_order - b.sort_order);

      const targetIndex = sectionSlots.findIndex(s => s.slot_key === relativeToKey);
      const insertIndex = targetIndex === -1 
        ? sectionSlots.length 
        : (position === 'before' ? targetIndex : targetIndex + 1);

      const newSlotKey = `${section}.custom.${Date.now()}`;
      const newSlot: ImageSlot = {
        slot_key: newSlotKey,
        label_en: slotMeta?.label_en || `New ${section} item`,
        label_ar: slotMeta?.label_ar || `صورة جديدة في ${section}`,
        section,
        where_appears_en: `${section} photo grid`,
        where_appears_ar: `شبكة صور قسم ${section}`,
        recommended_size: '1200 × 900 px',
        recommended_aspect_ratio: '4:3',
        default_url: '',
        media_id: newMediaId,
        media_url: newUrl,
        thumbnail_url: newThumbUrl,
        object_position_x: 50,
        object_position_y: 50,
        object_fit: 'cover',
        zoom: 1,
        overlay_opacity: 0,
        sort_order: insertIndex,
        visible: true,
        can_delete: true,
        alt_en: slotMeta?.alt_en || 'Oldish photo',
        alt_ar: slotMeta?.alt_ar || 'صورة أولديش',
        ...slotMeta
      };

      const updatedSlots = { ...imageSlots, [newSlotKey]: newSlot };
      setImageSlots(updatedSlots);
      saveDraftLocally({ 
        imageSlots: updatedSlots, 
        mediaList: [newMediaItem, ...mediaList] 
      });

      logAction('Add Slot at Position', newSlotKey, `Section: ${section}`);
      return {
        success: true,
        newSlotKey,
        cropWarning: processed.cropWarning
      };
    } catch (err: any) {
      console.error('Failed to add slot at position:', err);
      return {
        success: false,
        error: err?.message || 'حدث خطأ أثناء إضافة الصورة.'
      };
    }
  };

  const deleteSlot = (slotKey: string): boolean => {
    const slot = imageSlots[slotKey];
    if (!slot || slot.can_delete === false) return false;

    const section = slot.section;
    const updatedSlots = { ...imageSlots };
    delete updatedSlots[slotKey];

    const remaining = Object.values(updatedSlots)
      .filter(s => s.section === section)
      .sort((a, b) => a.sort_order - b.sort_order);

    remaining.forEach((s, idx) => {
      s.sort_order = idx;
      updatedSlots[s.slot_key] = s;
    });

    setImageSlots(updatedSlots);
    saveDraftLocally({ imageSlots: updatedSlots });
    logAction('Delete Slot', slotKey);
    return true;
  };

  const reorderSlots = (section: string, newOrderKeys: string[]) => {
    setImageSlots(prev => {
      const updated = { ...prev };
      newOrderKeys.forEach((key, index) => {
        if (updated[key]) {
          updated[key] = { ...updated[key], sort_order: index };
        }
      });
      saveDraftLocally({ imageSlots: updated });
      return updated;
    });
    logAction('Reorder Slots', section);
  };

  const resetAllDemoData = async () => {
    try {
      await clearAllBlobs();
    } catch (e) {
      console.warn('IDB clear warning:', e);
    }

    try {
      localStorage.removeItem(STORAGE_KEY_DRAFT);
      localStorage.removeItem(STORAGE_KEY_PUBLISHED);
      localStorage.removeItem(STORAGE_KEY_INQUIRIES);
      localStorage.removeItem(STORAGE_KEY_VERSIONS);
      localStorage.removeItem(STORAGE_KEY_LOGS);
      localStorage.setItem(STORAGE_KEY_SCHEMA_VERSION, String(DATA_SCHEMA_VERSION));
    } catch (e) {
      console.warn('LocalStorage clear warning:', e);
    }

    setSiteSettings(SEED_SITE_SETTINGS);
    setSections(SEED_SECTIONS);
    setMediaList(SEED_MEDIA);
    const map: Record<string, ImageSlot> = {};
    SEED_IMAGE_SLOTS.forEach(slot => { map[slot.slot_key] = slot; });
    setImageSlots(map);
    setMenuCategories(SEED_MENU_CATEGORIES);
    setMenuItems(SEED_MENU_ITEMS);
    setBranches(SEED_BRANCHES);
    setRatingBadges(SEED_RATING_BADGES);
    setInquiries([]);
    setVersions([]);
    setActivityLogs([]);
    setHasUnsavedDraft(false);
    setSessionUndoMap({});
    logAction('Reset All Demo Data', 'Owner initiated factory reset');
  };

  const trackClick = (type: 'calls' | 'directions' | 'menu_views' | 'whatsapp_clicks' | 'reservation_requests') => {
    setSiteSettings(prev => {
      const current = prev.analytics_clicks || {
        calls: 0,
        directions: 0,
        menu_views: 0,
        whatsapp_clicks: 0,
        reservation_requests: 0
      };
      const updated = {
        ...prev,
        analytics_clicks: {
          ...current,
          [type]: (current[type] || 0) + 1
        }
      };
      saveDraftLocally({ siteSettings: updated });
      return updated;
    });
  };

  const addMedia = (media: MediaItem) => {
    setMediaList(prev => {
      const updated = [media, ...prev];
      saveDraftLocally({ mediaList: updated });
      return updated;
    });
    logAction('Upload Media', media.alt_en);
  };

  const updateMedia = (id: string, partial: Partial<MediaItem>) => {
    setMediaList(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, ...partial } : m);
      saveDraftLocally({ mediaList: updated });
      return updated;
    });
    logAction('Update Media', id);
  };

  const deleteMedia = (id: string): { success: boolean; usageCount: number } => {
    let usageCount = 0;
    Object.values(imageSlots).forEach(slot => {
      if (slot.media_id === id) usageCount++;
    });
    menuItems.forEach(item => {
      if (item.media_id === id) usageCount++;
    });

    if (usageCount > 0) {
      return { success: false, usageCount };
    }

    const itemToDelete = mediaList.find(m => m.id === id);
    if (isFirebaseActive && itemToDelete?.storage_path && !itemToDelete.storage_path.startsWith('/images/')) {
      getIdToken().then(token => {
        if (token) deleteFromCloudinary(itemToDelete.storage_path, token);
      });
    }

    setMediaList(prev => {
      const updated = prev.filter(m => m.id !== id);
      saveDraftLocally({ mediaList: updated });
      return updated;
    });
    logAction('Delete Media', id);
    return { success: true, usageCount: 0 };
  };

  // Menu items & Categories
  const addMenuItem = (item: MenuItem) => {
    setMenuItems(prev => {
      const updated = [...prev, item];
      saveDraftLocally({ menuItems: updated });
      return updated;
    });
    logAction('Add Menu Item', item.name_en);
  };

  const updateMenuItem = (id: string, partial: Partial<MenuItem>) => {
    setMenuItems(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, ...partial } : item);
      saveDraftLocally({ menuItems: updated });
      return updated;
    });
    logAction('Update Menu Item', id);
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems(prev => {
      const updated = prev.filter(item => item.id !== id);
      saveDraftLocally({ menuItems: updated });
      return updated;
    });
    logAction('Delete Menu Item', id);
  };

  const reorderMenuItems = (newItems: MenuItem[]) => {
    const reindexed = newItems.map((item, idx) => ({ ...item, sort_order: idx }));
    setMenuItems(reindexed);
    saveDraftLocally({ menuItems: reindexed });
    logAction('Reorder Menu Items', 'All');
  };

  const addMenuCategory = (cat: MenuCategory) => {
    setMenuCategories(prev => {
      const updated = [...prev, cat];
      saveDraftLocally({ menuCategories: updated });
      return updated;
    });
    logAction('Add Category', cat.name_en);
  };

  const updateMenuCategory = (id: string, partial: Partial<MenuCategory>) => {
    setMenuCategories(prev => {
      const updated = prev.map(cat => cat.id === id ? { ...cat, ...partial } : cat);
      saveDraftLocally({ menuCategories: updated });
      return updated;
    });
    logAction('Update Category', id);
  };

  const deleteMenuCategory = (id: string) => {
    setMenuCategories(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveDraftLocally({ menuCategories: updated });
      return updated;
    });
    logAction('Delete Category', id);
  };

  // Branches
  const updateBranch = (id: string, partial: Partial<BranchInfo>) => {
    setBranches(prev => {
      const updated = prev.map(b => b.id === id ? { ...b, ...partial } : b);
      saveDraftLocally({ branches: updated });
      return updated;
    });
    logAction('Update Branch', id);
  };

  const addBranch = (branch: BranchInfo) => {
    setBranches(prev => {
      const updated = [...prev, branch];
      saveDraftLocally({ branches: updated });
      return updated;
    });
    logAction('Add Branch', branch.name_en);
  };

  const deleteBranch = (id: string) => {
    setBranches(prev => {
      const updated = prev.filter(b => b.id !== id);
      saveDraftLocally({ branches: updated });
      return updated;
    });
    logAction('Delete Branch', id);
  };

  // Rating Badges
  const updateRatingBadge = (id: string, partial: Partial<RatingBadge>) => {
    setRatingBadges(prev => {
      const updated = prev.map(b => b.id === id ? { ...b, ...partial } : b);
      saveDraftLocally({ ratingBadges: updated });
      return updated;
    });
    logAction('Update Rating Badge', id);
  };

  // ==========================================
  // PUBLISH CHANGES (LIVE TO ALL VISITORS)
  // ==========================================
  const publishChanges = async (label?: string): Promise<boolean> => {
    try {
      const publishedSnapshot: PublishedSiteSnapshot = {
        siteSettings,
        sections,
        menuCategories,
        menuItems,
        branches,
        ratingBadges,
        imageSlots,
        mediaList,
        updated_at: new Date().toISOString(),
        updated_by: user?.email || 'admin@oldish.eg',
        schema_version: DATA_SCHEMA_VERSION
      };

      const newVersion: ContentVersion = {
        id: `v-${Date.now()}`,
        created_at: new Date().toISOString(),
        created_by: user?.email || 'admin@oldish.eg',
        label: label || 'Published new version',
        snapshot: {
          site_settings: siteSettings,
          sections,
          menu_categories: menuCategories,
          menu_items: menuItems,
          branches,
          rating_badges: ratingBadges,
          image_slots: Object.values(imageSlots)
        }
      };

      // 1. If Firebase active, commit to Firestore published/site and create version doc
      if (isFirebaseActive) {
        await savePublishedSite(publishedSnapshot);
        await saveVersionToFirestore(newVersion);
        await clearDraftSite();
      }

      // 2. Update local storage caches
      setVersions(prev => {
        const updated = [newVersion, ...prev.slice(0, 19)];
        localStorage.setItem(STORAGE_KEY_VERSIONS, JSON.stringify(updated));
        return updated;
      });

      localStorage.setItem(STORAGE_KEY_PUBLISHED, JSON.stringify(publishedSnapshot));
      localStorage.removeItem(STORAGE_KEY_DRAFT);
      setHasUnsavedDraft(false);
      setSessionUndoMap({});

      logAction('Publish Changes', 'Website', label || 'Published new version');
      return true;
    } catch (e: any) {
      console.error('Publish error in Firestore:', e);
      alert(`فشل نشر التعديلات في السحابة: ${e?.message || 'خطأ غير متوقع'}`);
      return false;
    }
  };

  // Restore Version
  const restoreVersion = (versionId: string): boolean => {
    const version = versions.find(v => v.id === versionId);
    if (!version) return false;

    const snap = version.snapshot;
    setSiteSettings(snap.site_settings);
    setSections(snap.sections);
    setMenuCategories(snap.menu_categories);
    setMenuItems(snap.menu_items);
    setBranches(snap.branches);
    setRatingBadges(snap.rating_badges);

    const slotMap: Record<string, ImageSlot> = {};
    snap.image_slots.forEach(s => { slotMap[s.slot_key] = s; });
    setImageSlots(slotMap);

    saveDraftLocally({
      siteSettings: snap.site_settings,
      sections: snap.sections,
      menuCategories: snap.menu_categories,
      menuItems: snap.menu_items,
      branches: snap.branches,
      ratingBadges: snap.rating_badges,
      imageSlots: slotMap
    });

    logAction('Restore Version', version.label);
    return true;
  };

  // Discard draft
  const discardDraft = () => {
    localStorage.removeItem(STORAGE_KEY_DRAFT);
    if (isFirebaseActive && isAuthenticated) {
      clearDraftSite().catch(err => console.warn('Clear draft error:', err));
    }

    const cachedPublished = localStorage.getItem(STORAGE_KEY_PUBLISHED);
    if (cachedPublished) {
      const data = JSON.parse(cachedPublished);
      applySnapshotToState(data);
    } else {
      setSiteSettings(SEED_SITE_SETTINGS);
      setSections(SEED_SECTIONS);
      setMediaList(SEED_MEDIA);
      const map: Record<string, ImageSlot> = {};
      SEED_IMAGE_SLOTS.forEach(slot => { map[slot.slot_key] = slot; });
      setImageSlots(map);
      setMenuCategories(SEED_MENU_CATEGORIES);
      setMenuItems(SEED_MENU_ITEMS);
      setBranches(SEED_BRANCHES);
      setRatingBadges(SEED_RATING_BADGES);
    }
    setHasUnsavedDraft(false);
    setSessionUndoMap({});
    logAction('Discard Draft', 'Draft Changes Reverted');
  };

  // Submit Inquiry (Public)
  const submitInquiry = async (
    data: Omit<Inquiry, 'id' | 'status' | 'created_at'>
  ): Promise<{ success: boolean; error?: string }> => {
    if (data.honeypot && data.honeypot.trim() !== '') {
      return { success: true };
    }

    const newInquiry: Inquiry = {
      ...data,
      id: `inq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'new',
      created_at: new Date().toISOString()
    };

    setInquiries(prev => {
      const updated = [newInquiry, ...prev];
      localStorage.setItem(STORAGE_KEY_INQUIRIES, JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseActive) {
      try {
        await submitInquiryToFirestore(newInquiry);
      } catch (dbErr: any) {
        console.warn('Firestore inquiry insert warning:', dbErr);
      }
    }

    return { success: true };
  };

  const markInquiryHandled = (id: string) => {
    setInquiries(prev => {
      const updated = prev.map(inq => inq.id === id ? { ...inq, status: 'handled' as const } : inq);
      localStorage.setItem(STORAGE_KEY_INQUIRIES, JSON.stringify(updated));
      return updated;
    });
    if (isFirebaseActive && isAuthenticated) {
      updateInquiryInFirestore(id, { status: 'handled' }).catch(() => {});
    }
    logAction('Handled Inquiry', id);
  };

  const archiveInquiry = (id: string) => {
    setInquiries(prev => {
      const updated = prev.map(inq => inq.id === id ? { ...inq, status: 'archived' as const } : inq);
      localStorage.setItem(STORAGE_KEY_INQUIRIES, JSON.stringify(updated));
      return updated;
    });
    if (isFirebaseActive && isAuthenticated) {
      updateInquiryInFirestore(id, { status: 'archived' }).catch(() => {});
    }
    logAction('Archive Inquiry', id);
  };

  return (
    <DataContext.Provider value={{
      siteSettings,
      sections,
      mediaList,
      imageSlots,
      menuCategories,
      menuItems,
      branches,
      ratingBadges,
      inquiries,
      versions,
      activityLogs,
      isLoading,
      hasUnsavedDraft,
      isFirebaseActive,
      isPreviewMode,
      sessionUndoMap,
      getImageForSlot,
      updateSettings,
      updateSection,
      reorderSections,
      updateImageSlot,
      replaceSlotImage,
      undoSlotReplacement,
      resetSlotToDefault,
      addSlotAtPosition,
      deleteSlot,
      reorderSlots,
      addMedia,
      updateMedia,
      deleteMedia,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      reorderMenuItems,
      addMenuCategory,
      updateMenuCategory,
      deleteMenuCategory,
      updateBranch,
      addBranch,
      deleteBranch,
      updateRatingBadge,
      publishChanges,
      restoreVersion,
      discardDraft,
      resetAllDemoData,
      submitInquiry,
      markInquiryHandled,
      archiveInquiry,
      trackClick
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
