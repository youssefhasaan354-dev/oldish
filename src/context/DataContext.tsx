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
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  submitInquiry: (data: Omit<Inquiry, 'id' | 'status' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  markInquiryHandled: (id: string) => void;
  archiveInquiry: (id: string) => void;
}

const STORAGE_KEY_PUBLISHED = 'oldish_published_data_v1';
const STORAGE_KEY_DRAFT = 'oldish_draft_data_v1';
const STORAGE_KEY_INQUIRIES = 'oldish_inquiries_v1';
const STORAGE_KEY_VERSIONS = 'oldish_versions_v1';
const STORAGE_KEY_LOGS = 'oldish_logs_v1';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isSupabaseActive = isSupabaseConfigured();
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedDraft, setHasUnsavedDraft] = useState(false);
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

  // Load Initial Data (Stale-while-revalidate pattern)
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Try local storage cache first for instant render
        const cachedPublished = localStorage.getItem(STORAGE_KEY_PUBLISHED);
        const cachedDraft = localStorage.getItem(STORAGE_KEY_DRAFT);
        const cachedInquiries = localStorage.getItem(STORAGE_KEY_INQUIRIES);
        const cachedVersions = localStorage.getItem(STORAGE_KEY_VERSIONS);
        const cachedLogs = localStorage.getItem(STORAGE_KEY_LOGS);

        if (cachedInquiries) {
          try { setInquiries(JSON.parse(cachedInquiries)); } catch (e) {}
        }
        if (cachedVersions) {
          try { setVersions(JSON.parse(cachedVersions)); } catch (e) {}
        }
        if (cachedLogs) {
          try { setActivityLogs(JSON.parse(cachedLogs)); } catch (e) {}
        }

        const dataToApply = cachedDraft ? JSON.parse(cachedDraft) : (cachedPublished ? JSON.parse(cachedPublished) : null);
        if (cachedDraft) setHasUnsavedDraft(true);

        if (dataToApply) {
          if (dataToApply.siteSettings) setSiteSettings(dataToApply.siteSettings);
          if (dataToApply.sections) setSections(dataToApply.sections);
          if (dataToApply.mediaList) setMediaList(dataToApply.mediaList);
          if (dataToApply.imageSlots) setImageSlots(dataToApply.imageSlots);
          if (dataToApply.menuCategories) setMenuCategories(dataToApply.menuCategories);
          if (dataToApply.menuItems) setMenuItems(dataToApply.menuItems);
          if (dataToApply.branches) setBranches(dataToApply.branches);
          if (dataToApply.ratingBadges) setRatingBadges(dataToApply.ratingBadges);
        }

        // 2. If Supabase is active, fetch published data in background and update
        if (isSupabaseActive && !cachedDraft) {
          try {
            const { data: settingsData } = await supabase.from('site_settings').select('*').eq('key', 'general').single();
            if (settingsData?.value) {
              setSiteSettings(settingsData.value);
            }
            const { data: secData } = await supabase.from('sections').select('*').order('sort_order', { ascending: true });
            if (secData && secData.length > 0) {
              setSections(secData);
            }
            const { data: catData } = await supabase.from('menu_categories').select('*').order('sort_order', { ascending: true });
            if (catData && catData.length > 0) {
              setMenuCategories(catData);
            }
            const { data: itemData } = await supabase.from('menu_items').select('*').order('sort_order', { ascending: true });
            if (itemData && itemData.length > 0) {
              setMenuItems(itemData);
            }
            const { data: branchData } = await supabase.from('branches').select('*');
            if (branchData && branchData.length > 0) {
              setBranches(branchData);
            }
            const { data: badgeData } = await supabase.from('rating_badges').select('*').order('sort_order', { ascending: true });
            if (badgeData && badgeData.length > 0) {
              setRatingBadges(badgeData);
            }
          } catch (netErr) {
            console.warn('Supabase fetch failed, continuing with fallback seed data:', netErr);
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

  // Image Slot Resolution helper
  const getImageForSlot = useCallback((slotKey: string, fallbackUrl?: string) => {
    const slot = imageSlots[slotKey];
    let mediaItem: MediaItem | undefined;

    if (slot?.media_id) {
      mediaItem = mediaList.find(m => m.id === slot.media_id);
    }

    const url = slot?.media_url || mediaItem?.public_url || fallbackUrl || '/images/oldish_courtyard_hero.jpg';
    const altEn = mediaItem?.alt_en || slot?.label_en || 'Oldish Restaurant & Café';
    const altAr = mediaItem?.alt_ar || slot?.label_ar || 'أولديش مطعم ومقهى';
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

  // Image Slots
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
    logAction('Update Slot', slotKey);
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
    // Check usage in slots or menu
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
      // 1. Create a version snapshot
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
        const updated = [newVersion, ...prev.slice(0, 19)]; // keep last 20
        localStorage.setItem(STORAGE_KEY_VERSIONS, JSON.stringify(updated));
        return updated;
      });

      // 2. Persist published to local storage
      localStorage.setItem(STORAGE_KEY_PUBLISHED, JSON.stringify(publishedSnapshot));
      localStorage.removeItem(STORAGE_KEY_DRAFT);
      setHasUnsavedDraft(false);

      // 3. If Supabase configured, push to DB
      if (isSupabaseActive) {
        try {
          await supabase.from('site_settings').upsert({
            key: 'general',
            value: siteSettings,
            status: 'published'
          });
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
      setMenuCategories(SEED_MENU_CATEGORIES);
      setMenuItems(SEED_MENU_ITEMS);
      setBranches(SEED_BRANCHES);
      setRatingBadges(SEED_RATING_BADGES);
    }
    setHasUnsavedDraft(false);
    logAction('Discard Draft', 'Draft Changes Reverted');
  };

  // Submit Inquiry (Public)
  const submitInquiry = async (
    data: Omit<Inquiry, 'id' | 'status' | 'created_at'>
  ): Promise<{ success: boolean; error?: string }> => {
    // 1. Anti-spam Honeypot Check
    if (data.honeypot && data.honeypot.trim() !== '') {
      // Silently reject spam bots
      return { success: true };
    }

    const newInquiry: Inquiry = {
      ...data,
      id: `inq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'new',
      created_at: new Date().toISOString()
    };

    // 2. Persist locally
    setInquiries(prev => {
      const updated = [newInquiry, ...prev];
      localStorage.setItem(STORAGE_KEY_INQUIRIES, JSON.stringify(updated));
      return updated;
    });

    // 3. Try to push to Supabase if available
    if (isSupabaseActive) {
      try {
        await supabase.from('inquiries').insert([newInquiry]);
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
      getImageForSlot,
      updateSettings,
      updateSection,
      reorderSections,
      updateImageSlot,
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
      submitInquiry,
      markInquiryHandled,
      archiveInquiry,
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
