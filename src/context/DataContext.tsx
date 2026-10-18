import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
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
  isSupabaseActive: boolean;
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

// Legacy keys for automatic migration
const LEGACY_STORAGE_KEY_PUBLISHED = 'oldish_published_data_v1';
const LEGACY_STORAGE_KEY_DRAFT = 'oldish_draft_data_v1';
const LEGACY_STORAGE_KEY_INQUIRIES = 'oldish_inquiries_v1';
const LEGACY_STORAGE_KEY_VERSIONS = 'oldish_versions_v1';
const LEGACY_STORAGE_KEY_LOGS = 'oldish_logs_v1';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isSupabaseActive = isSupabaseConfigured();
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

  // Helper to persist current draft state to localStorage
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
  };

  // Log activity
  const logAction = (action: string, entity: string, details?: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      user_email: 'admin@oldish-chi.vercel.app',
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

  // Load Initial Data with Auto-migration & Seed merging
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedVersion = parseInt(localStorage.getItem(STORAGE_KEY_SCHEMA_VERSION) || '0', 10);
        
        // 1. Try modern storage keys first, then fallback to legacy keys for migration
        let cachedPublished = localStorage.getItem(STORAGE_KEY_PUBLISHED);
        let cachedDraft = localStorage.getItem(STORAGE_KEY_DRAFT);
        let cachedInquiries = localStorage.getItem(STORAGE_KEY_INQUIRIES);
        let cachedVersions = localStorage.getItem(STORAGE_KEY_VERSIONS);
        let cachedLogs = localStorage.getItem(STORAGE_KEY_LOGS);

        if (!cachedPublished && !cachedDraft) {
          cachedPublished = localStorage.getItem(LEGACY_STORAGE_KEY_PUBLISHED);
          cachedDraft = localStorage.getItem(LEGACY_STORAGE_KEY_DRAFT);
          cachedInquiries = cachedInquiries || localStorage.getItem(LEGACY_STORAGE_KEY_INQUIRIES);
          cachedVersions = cachedVersions || localStorage.getItem(LEGACY_STORAGE_KEY_VERSIONS);
          cachedLogs = cachedLogs || localStorage.getItem(LEGACY_STORAGE_KEY_LOGS);
        }

        if (cachedInquiries) {
          try { setInquiries(JSON.parse(cachedInquiries)); } catch (e) { console.warn(e); }
        }
        if (cachedVersions) {
          try { setVersions(JSON.parse(cachedVersions)); } catch (e) { console.warn(e); }
        }
        if (cachedLogs) {
          try { setActivityLogs(JSON.parse(cachedLogs)); } catch (e) { console.warn(e); }
        }

        const dataToApply = cachedDraft ? JSON.parse(cachedDraft) : (cachedPublished ? JSON.parse(cachedPublished) : null);
        if (cachedDraft) setHasUnsavedDraft(true);

        if (dataToApply) {
          // Merge site settings with seed to ensure newly added properties (logos, announcement, analytics) exist
          const mergedSettings: SiteSettings = {
            ...SEED_SITE_SETTINGS,
            ...(dataToApply.siteSettings || {}),
            analytics_clicks: {
              ...SEED_SITE_SETTINGS.analytics_clicks,
              ...((dataToApply.siteSettings && dataToApply.siteSettings.analytics_clicks) || {})
            }
          };
          setSiteSettings(mergedSettings);

          if (dataToApply.sections) setSections(dataToApply.sections);
          if (dataToApply.mediaList) setMediaList(dataToApply.mediaList);
          
          // INTELLIGENT SLOT MERGE:
          // Start with all central registry slots from SEED_IMAGE_SLOTS.
          // Overlay user edits, but preserve required metadata (section, where_appears, recommended_size, default_url).
          const mergedSlots: Record<string, ImageSlot> = {};
          SEED_IMAGE_SLOTS.forEach(seedSlot => {
            mergedSlots[seedSlot.slot_key] = { ...seedSlot };
          });

          if (dataToApply.imageSlots) {
            Object.entries(dataToApply.imageSlots as Record<string, ImageSlot>).forEach(([key, userSlot]) => {
              if (mergedSlots[key]) {
                mergedSlots[key] = {
                  ...mergedSlots[key],
                  ...userSlot,
                  // Preserve central registry metadata
                  section: mergedSlots[key].section,
                  where_appears_en: mergedSlots[key].where_appears_en,
                  where_appears_ar: mergedSlots[key].where_appears_ar,
                  recommended_size: mergedSlots[key].recommended_size,
                  recommended_aspect_ratio: mergedSlots[key].recommended_aspect_ratio,
                  default_url: mergedSlots[key].default_url,
                  can_delete: mergedSlots[key].can_delete
                };
              } else {
                // Dynamically added custom slot
                mergedSlots[key] = userSlot;
              }
            });
          }
          setImageSlots(mergedSlots);

          if (dataToApply.menuCategories) setMenuCategories(dataToApply.menuCategories);
          if (dataToApply.menuItems) setMenuItems(dataToApply.menuItems);
          if (dataToApply.branches) setBranches(dataToApply.branches);
          if (dataToApply.ratingBadges) setRatingBadges(dataToApply.ratingBadges);

          // If version was upgraded or migrated, persist modern keys
          if (storedVersion < DATA_SCHEMA_VERSION) {
            localStorage.setItem(STORAGE_KEY_SCHEMA_VERSION, String(DATA_SCHEMA_VERSION));
            if (cachedDraft) {
              localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify({
                siteSettings: mergedSettings,
                sections: dataToApply.sections || SEED_SECTIONS,
                mediaList: dataToApply.mediaList || SEED_MEDIA,
                imageSlots: mergedSlots,
                menuCategories: dataToApply.menuCategories || SEED_MENU_CATEGORIES,
                menuItems: dataToApply.menuItems || SEED_MENU_ITEMS,
                branches: dataToApply.branches || SEED_BRANCHES,
                ratingBadges: dataToApply.ratingBadges || SEED_RATING_BADGES
              }));
            }
          }
        } else {
          // No stored data: initialize schema version
          localStorage.setItem(STORAGE_KEY_SCHEMA_VERSION, String(DATA_SCHEMA_VERSION));
        }

        // 2. Supabase background sync if active
        if (isSupabaseActive && !cachedDraft) {
          try {
            const client = await getSupabase();
            if (client) {
              const { data: settingsData } = await client.from('site_settings').select('*').eq('key', 'general').single();
              if (settingsData?.value) {
                setSiteSettings(prev => ({ ...prev, ...settingsData.value }));
              }
              const { data: secData } = await client.from('sections').select('*').order('sort_order', { ascending: true });
              if (secData && secData.length > 0) setSections(secData);
              const { data: catData } = await client.from('menu_categories').select('*').order('sort_order', { ascending: true });
              if (catData && catData.length > 0) setMenuCategories(catData);
              const { data: itemData } = await client.from('menu_items').select('*').order('sort_order', { ascending: true });
              if (itemData && itemData.length > 0) setMenuItems(itemData);
              const { data: branchData } = await client.from('branches').select('*');
              if (branchData && branchData.length > 0) setBranches(branchData);
              const { data: badgeData } = await client.from('rating_badges').select('*').order('sort_order', { ascending: true });
              if (badgeData && badgeData.length > 0) setRatingBadges(badgeData);
            }
          } catch (netErr) {
            console.warn('Supabase fetch failed, continuing with local data:', netErr);
          }
        }
      } catch (err) {
        console.error('Error loading initial site data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isSupabaseActive]);

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
    const isAi = mediaItem ? mediaItem.is_ai : (url.includes('images/oldish_') || url.includes('images/egyptian_'));

    const style: React.CSSProperties = {
      objectFit: slot?.object_fit || 'cover',
      objectPosition: `${slot?.object_position_x ?? 50}% ${slot?.object_position_y ?? 50}%`,
      transform: slot?.zoom && slot.zoom > 1 ? `scale(${slot.zoom})` : undefined,
    };

    return { url, altEn, altAr, isAi, style, slot };
  }, [imageSlots, mediaList]);

  // Updating Settings
  const updateSettings = (partial: Partial<SiteSettings>) => {
    setSiteSettings(prev => {
      const updated = { ...prev, ...partial };
      saveDraftLocally({ siteSettings: updated });
      return updated;
    });
    logAction('Update', 'Site Settings');
  };

  // Sections
  const updateSection = (key: string, partial: Partial<SectionConfig>) => {
    setSections(prev => {
      const updated = prev.map(sec => sec.key === key ? { ...sec, ...partial } : sec);
      saveDraftLocally({ sections: updated });
      return updated;
    });
    logAction('Update Section', key);
  };

  const reorderSections = (newSections: SectionConfig[]) => {
    setSections(newSections);
    saveDraftLocally({ sections: newSections });
    logAction('Reorder Sections', 'Sections');
  };

  // Image Slot direct metadata updates
  const updateImageSlot = (slotKey: string, partial: Partial<ImageSlot>) => {
    setImageSlots(prev => {
      const existing = prev[slotKey] || {
        slot_key: slotKey,
        label_en: slotKey,
        label_ar: slotKey,
        section: 'general',
        object_position_x: 50,
        object_position_y: 50,
        object_fit: 'cover',
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

  // REPLACE IN PLACE: Uploads image, converts to WebP/resizes, saves blob in IDB/Supabase,
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
      const newMediaId = `media-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      if (isSupabaseActive) {
        const client = await getSupabase();
        if (!client) throw new Error('Supabase client not initialized');
        const ext = processed.format === 'svg' ? 'svg' : (processed.format === 'png' ? 'png' : (processed.format === 'jpeg' ? 'jpg' : 'webp'));
        const filename = `slot-${slotKey.replace(/\./g, '-')}-${Date.now()}.${ext}`;
        const { error: uploadErr } = await client.storage
          .from('site-media')
          .upload(filename, processed.blob, { contentType: processed.blob.type, upsert: true });

        if (uploadErr) throw uploadErr;

        const { data: publicUrlData } = client.storage
          .from('site-media')
          .getPublicUrl(filename);
        newUrl = publicUrlData.publicUrl;
        newThumbUrl = newUrl;
      } else {
        // Demo mode: persist in IndexedDB
        newUrl = await saveBlob(`slot-${slotKey}-${Date.now()}`, processed.blob);
        newThumbUrl = await saveBlob(`thumb-slot-${slotKey}-${Date.now()}`, processed.thumbnailBlob);
      }

      // Record undo session
      setSessionUndoMap(prev => ({
        ...prev,
        [slotKey]: currentSlot.media_url || currentSlot.default_url || ''
      }));

      // Add to mediaList so it's accessible in the library
      const newMediaItem: MediaItem = {
        id: newMediaId,
        storage_path: newUrl,
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

      // Update slot while KEEPING all placement settings:
      const updatedSlot: ImageSlot = {
        ...currentSlot,
        media_id: newMediaId,
        media_url: newUrl,
        thumbnail_url: newThumbUrl,
        // Placement settings preserved:
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

      const newSlots = { ...imageSlots, [slotKey]: updatedSlot };
      setImageSlots(newSlots);

      // Sync Branding Logo settings if branding slot
      let newSettings = { ...siteSettings };
      if (slotKey === 'branding.logo') newSettings.logo_url = newUrl;
      else if (slotKey === 'branding.logo_dark') newSettings.logo_dark_url = newUrl;
      else if (slotKey === 'branding.favicon') newSettings.favicon_url = newUrl;
      else if (slotKey === 'branding.social_share') newSettings.social_image_url = newUrl;
      else if (slotKey === 'branding.qr_logo') newSettings.qr_logo_url = newUrl;

      if (slotKey.startsWith('branding.')) {
        setSiteSettings(newSettings);
      }

      saveDraftLocally({ 
        imageSlots: newSlots, 
        siteSettings: newSettings, 
        mediaList: [newMediaItem, ...mediaList] 
      });
      logAction('Replace Image in Place', slotKey, `New image: ${file.name}`);

      return {
        success: true,
        cropWarning: processed.cropWarning
      };
    } catch (err: any) {
      console.error('Failed to replace slot image:', err);
      return {
        success: false,
        error: err?.message || 'حدث خطأ أثناء معالجة وحفظ الصورة.'
      };
    }
  };

  // Undo replacement for this session
  const undoSlotReplacement = (slotKey: string): boolean => {
    const prevUrl = sessionUndoMap[slotKey];
    if (!prevUrl) return false;

    const currentSlot = imageSlots[slotKey];
    if (!currentSlot) return false;

    const updatedSlot: ImageSlot = {
      ...currentSlot,
      media_url: prevUrl
    };

    const newSlots = { ...imageSlots, [slotKey]: updatedSlot };
    setImageSlots(newSlots);

    let newSettings = { ...siteSettings };
    if (slotKey === 'branding.logo') newSettings.logo_url = prevUrl;
    else if (slotKey === 'branding.logo_dark') newSettings.logo_dark_url = prevUrl;
    else if (slotKey === 'branding.favicon') newSettings.favicon_url = prevUrl;
    else if (slotKey === 'branding.social_share') newSettings.social_image_url = prevUrl;
    else if (slotKey === 'branding.qr_logo') newSettings.qr_logo_url = prevUrl;

    if (slotKey.startsWith('branding.')) {
      setSiteSettings(newSettings);
    }

    setSessionUndoMap(prev => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });

    saveDraftLocally({ imageSlots: newSlots, siteSettings: newSettings });
    logAction('Undo Replace Image', slotKey);
    return true;
  };

  // Reset to default image
  const resetSlotToDefault = (slotKey: string) => {
    const slot = imageSlots[slotKey];
    if (!slot) return;

    const updatedSlot: ImageSlot = {
      ...slot,
      media_url: slot.default_url || ''
    };

    const newSlots = { ...imageSlots, [slotKey]: updatedSlot };
    setImageSlots(newSlots);

    let newSettings = { ...siteSettings };
    if (slotKey === 'branding.logo') newSettings.logo_url = '';
    else if (slotKey === 'branding.logo_dark') newSettings.logo_dark_url = '';
    else if (slotKey === 'branding.favicon') newSettings.favicon_url = '';
    else if (slotKey === 'branding.social_share') newSettings.social_image_url = slot.default_url || '';
    else if (slotKey === 'branding.qr_logo') newSettings.qr_logo_url = '';

    if (slotKey.startsWith('branding.')) {
      setSiteSettings(newSettings);
    }

    saveDraftLocally({ imageSlots: newSlots, siteSettings: newSettings });
    logAction('Reset Slot to Default', slotKey);
  };

  // ADD IN A SPECIFIC SPOT: adds an image directly before or after an item in multi-image areas
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
      const newMediaId = `media-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      if (isSupabaseActive) {
        const client = await getSupabase();
        if (!client) throw new Error('Supabase client not initialized');
        const filename = `slot-${section}-${Date.now()}.webp`;
        const { error: uploadErr } = await client.storage
          .from('site-media')
          .upload(filename, processed.blob, { contentType: processed.blob.type, upsert: true });
        if (uploadErr) throw uploadErr;

        const { data: publicUrlData } = client.storage.from('site-media').getPublicUrl(filename);
        newUrl = publicUrlData.publicUrl;
        newThumbUrl = newUrl;
      } else {
        newUrl = await saveBlob(`slot-${section}-${Date.now()}`, processed.blob);
        newThumbUrl = await saveBlob(`thumb-slot-${section}-${Date.now()}`, processed.thumbnailBlob);
      }

      // Add to mediaList
      const newMediaItem: MediaItem = {
        id: newMediaId,
        storage_path: newUrl,
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

      // Calculate ordering among slots of this section
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

      // Re-index slots for this section
      const reorderedSectionSlots = [...sectionSlots];
      reorderedSectionSlots.splice(insertIndex, 0, newSlot);
      reorderedSectionSlots.forEach((s, idx) => {
        s.sort_order = idx;
      });

      const updatedSlots = { ...imageSlots };
      reorderedSectionSlots.forEach(s => {
        updatedSlots[s.slot_key] = s;
      });

      setImageSlots(updatedSlots);
      saveDraftLocally({ imageSlots: updatedSlots, mediaList: [newMediaItem, ...mediaList] });
      logAction('Add Image to Specific Spot', newSlotKey, `Added ${position} ${relativeToKey}`);

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

  // Delete a slot
  const deleteSlot = (slotKey: string): boolean => {
    const slot = imageSlots[slotKey];
    if (!slot || slot.can_delete === false) return false;

    const section = slot.section;
    const updatedSlots = { ...imageSlots };
    delete updatedSlots[slotKey];

    // Re-index remaining section slots
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

  // Reorder slots inside a section
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

  // Reset all demo data to seed (owner only)
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
      localStorage.removeItem(LEGACY_STORAGE_KEY_DRAFT);
      localStorage.removeItem(LEGACY_STORAGE_KEY_PUBLISHED);
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

  // Local Click Analytics
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

  // Media
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

    setMediaList(prev => {
      const updated = prev.filter(m => m.id !== id);
      saveDraftLocally({ mediaList: updated });
      return updated;
    });
    logAction('Delete Media', id);
    return { success: true, usageCount: 0 };
  };

  // Menu Items
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
    setMenuItems(newItems);
    saveDraftLocally({ menuItems: newItems });
  };

  // Menu Categories
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
      const updated = prev.map(c => c.id === id ? { ...c, ...partial } : c);
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
      const updated = prev.map(rb => rb.id === id ? { ...rb, ...partial } : rb);
      saveDraftLocally({ ratingBadges: updated });
      return updated;
    });
    logAction('Update Rating Badge', id);
  };

  // Publish Changes
  const publishChanges = async (label?: string): Promise<boolean> => {
    const publishedSnapshot = {
      siteSettings,
      sections,
      mediaList,
      imageSlots,
      menuCategories,
      menuItems,
      branches,
      ratingBadges
    };

    try {
      const newVersion: ContentVersion = {
        id: `v-${Date.now()}`,
        created_at: new Date().toISOString(),
        created_by: 'Owner/Admin',
        label: label || `Published on ${new Date().toLocaleDateString('en-GB')}`,
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

      setVersions(prev => {
        const updated = [newVersion, ...prev.slice(0, 19)];
        localStorage.setItem(STORAGE_KEY_VERSIONS, JSON.stringify(updated));
        return updated;
      });

      localStorage.setItem(STORAGE_KEY_PUBLISHED, JSON.stringify(publishedSnapshot));
      localStorage.removeItem(STORAGE_KEY_DRAFT);
      setHasUnsavedDraft(false);
      setSessionUndoMap({});

      if (isSupabaseActive) {
        try {
          const client = await getSupabase();
          if (client) {
            await client.from('site_settings').upsert({
              key: 'general',
              value: siteSettings,
              status: 'published'
            });
          }
        } catch (dbErr) {
          console.warn('Supabase publish sync warning:', dbErr);
        }
      }

      logAction('Publish Changes', 'Website', label || 'Published new version');
      return true;
    } catch (e) {
      console.error('Publish error:', e);
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
    const cachedPublished = localStorage.getItem(STORAGE_KEY_PUBLISHED);
    if (cachedPublished) {
      const data = JSON.parse(cachedPublished);
      setSiteSettings(data.siteSettings);
      setSections(data.sections);
      setMediaList(data.mediaList);
      setImageSlots(data.imageSlots);
      setMenuCategories(data.menuCategories);
      setMenuItems(data.menuItems);
      setBranches(data.branches);
      setRatingBadges(data.ratingBadges);
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

    if (isSupabaseActive) {
      try {
        const client = await getSupabase();
        if (client) {
          await client.from('inquiries').insert([newInquiry]);
        }
      } catch (dbErr) {
        console.warn('Supabase inquiry insert note:', dbErr);
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
    logAction('Handled Inquiry', id);
  };

  const archiveInquiry = (id: string) => {
    setInquiries(prev => {
      const updated = prev.map(inq => inq.id === id ? { ...inq, status: 'archived' as const } : inq);
      localStorage.setItem(STORAGE_KEY_INQUIRIES, JSON.stringify(updated));
      return updated;
    });
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
      isSupabaseActive,
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
      trackClick,
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
