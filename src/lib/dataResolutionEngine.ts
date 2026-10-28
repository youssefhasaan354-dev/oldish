import type { 
  MenuCategory, 
  MenuItem, 
  SectionConfig, 
  SiteSettings, 
  ImageSlot, 
  BranchInfo, 
  RatingBadge, 
  MediaItem 
} from '../types';
import type { PublishedSiteSnapshot } from './firebase';
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
import { validatePublishedSnapshot, validateDraftSnapshot } from './snapshotValidator';

export interface DataResolutionOptions {
  cachedPublishedRaw?: string | null;
  cachedDraftRaw?: string | null;
  cloudPublishedSnap?: unknown | null;
  cloudDraftSnap?: unknown | null;
  isFirebaseActive: boolean;
  isAuthenticated: boolean;
  userRole?: string | null;
  isAdminRoute: boolean;
  hasPreviewParam: boolean;
}

export interface DataResolutionResult {
  siteSettings: SiteSettings;
  sections: SectionConfig[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  branches: BranchInfo[];
  ratingBadges: RatingBadge[];
  imageSlots: Record<string, ImageSlot>;
  mediaList: MediaItem[];
  hasUnsavedDraft: boolean;
  shouldPurgeDraftCache: boolean;
  shouldPurgePublishedCache: boolean;
  publishedCacheToStore: PublishedSiteSnapshot | null;
  draftCacheToStore: unknown | null;
  effectiveSource: 'cloud_draft' | 'cached_draft' | 'cloud_published' | 'cached_published' | 'canonical_seed';
  logMessages: string[];
}

/**
 * Builds standard default slots map from seed data.
 */
function buildDefaultSlots(): Record<string, ImageSlot> {
  const map: Record<string, ImageSlot> = {};
  SEED_IMAGE_SLOTS.forEach(slot => { map[slot.slot_key] = { ...slot }; });
  return map;
}

/**
 * Merges a snapshot into individual state objects.
 */
function extractStateFromSnapshot(snap: Partial<PublishedSiteSnapshot>) {
  const settings = snap.siteSettings ? { ...SEED_SITE_SETTINGS, ...snap.siteSettings } : SEED_SITE_SETTINGS;
  const sections = snap.sections && snap.sections.length > 0 ? snap.sections : SEED_SECTIONS;
  const categories = snap.menuCategories && snap.menuCategories.length > 0 ? snap.menuCategories : SEED_MENU_CATEGORIES;
  const items = snap.menuItems && snap.menuItems.length > 0 ? snap.menuItems : SEED_MENU_ITEMS;
  const branches = snap.branches && snap.branches.length > 0 ? snap.branches : SEED_BRANCHES;
  const ratingBadges = snap.ratingBadges && snap.ratingBadges.length > 0 ? snap.ratingBadges : SEED_RATING_BADGES;
  const mediaList = snap.mediaList && snap.mediaList.length > 0 ? snap.mediaList : SEED_MEDIA;

  const mergedSlots = buildDefaultSlots();
  if (snap.imageSlots) {
    const slotsObj = Array.isArray(snap.imageSlots)
      ? (snap.imageSlots as ImageSlot[]).reduce((acc, cur) => { acc[cur.slot_key] = cur; return acc; }, {} as Record<string, ImageSlot>)
      : (snap.imageSlots as Record<string, ImageSlot>);

    Object.entries(slotsObj).forEach(([key, userSlot]) => {
      if (mergedSlots[key]) {
        mergedSlots[key] = { ...mergedSlots[key], ...userSlot };
      } else {
        mergedSlots[key] = userSlot;
      }
    });
  }

  return {
    siteSettings: settings,
    sections,
    menuCategories: categories,
    menuItems: items,
    branches,
    ratingBadges,
    mediaList,
    imageSlots: mergedSlots
  };
}

/**
 * Pure, deterministic data engine that evaluates local cache, cloud snapshots, and authorization context
 * to produce the verified effective state.
 */
export function resolveEffectiveSiteData(options: DataResolutionOptions): DataResolutionResult {
  const logs: string[] = [];
  let shouldPurgeDraftCache = false;
  let shouldPurgePublishedCache = false;
  let publishedCacheToStore: PublishedSiteSnapshot | null = null;
  let draftCacheToStore: unknown | null = null;

  // 1. Evaluate Authorization & Roles
  // A user is only authorized for administration if authenticated AND bearing an administrative role ('owner' | 'editor' | 'viewer')
  const isAuthorizedAdmin = options.isAuthenticated && Boolean(
    options.userRole && ['owner', 'editor', 'viewer'].includes(options.userRole)
  );

  // Draft context is ONLY allowed in authenticated admin routes or an authenticated draft preview
  const isAuthorizedAdminContext = isAuthorizedAdmin && (options.isAdminRoute || options.hasPreviewParam);

  // 2. Local Published Cache Check
  let validPublishedSnapshotToUse: Partial<PublishedSiteSnapshot> | null = null;
  if (options.cachedPublishedRaw) {
    try {
      const parsed = JSON.parse(options.cachedPublishedRaw);
      const validation = validatePublishedSnapshot(parsed);
      if (validation.isValid) {
        validPublishedSnapshotToUse = parsed;
      } else {
        shouldPurgePublishedCache = true;
        logs.push(`Discarding invalid published cache (${validation.reason})`);
      }
    } catch {
      shouldPurgePublishedCache = true;
      logs.push('Discarding malformed JSON in published cache');
    }
  }

  // 3. Local Draft Cache Check (Sanitized using validateDraftSnapshot)
  let validCachedDraft: Partial<PublishedSiteSnapshot> | null = null;
  if (options.cachedDraftRaw) {
    try {
      const parsed = JSON.parse(options.cachedDraftRaw);
      const draftValidation = validateDraftSnapshot(parsed);
      if (draftValidation.isValid) {
        validCachedDraft = parsed;
      } else {
        shouldPurgeDraftCache = true;
        logs.push(`Discarding invalid draft cache (${draftValidation.reason})`);
      }
    } catch {
      shouldPurgeDraftCache = true;
      logs.push('Discarding malformed JSON in draft cache');
    }
  }

  // 4. Live Cloud Published Snapshot Check
  if (options.isFirebaseActive && options.cloudPublishedSnap) {
    const cloudPubVal = validatePublishedSnapshot(options.cloudPublishedSnap);
    if (cloudPubVal.isValid) {
      validPublishedSnapshotToUse = options.cloudPublishedSnap as PublishedSiteSnapshot;
      publishedCacheToStore = options.cloudPublishedSnap as PublishedSiteSnapshot;
    } else {
      logs.push(`Cloud published snapshot rejected (${cloudPubVal.reason}). Preserving canonical/cached data.`);
    }
  }

  // 5. Resolve State based on Authorization Context & Fallback Hierarchy
  let effectiveSource: DataResolutionResult['effectiveSource'] = 'canonical_seed';
  let hasUnsavedDraft = false;
  let chosenSnapshot: Partial<PublishedSiteSnapshot> | null = null;

  if (isAuthorizedAdminContext) {
    // Admin context: attempts cloud draft, then cached draft, then published fallback, then seed
    let cloudDraftApplied = false;
    if (options.cloudDraftSnap) {
      const draftVal = validateDraftSnapshot(options.cloudDraftSnap);
      if (draftVal.isValid) {
        chosenSnapshot = options.cloudDraftSnap as Partial<PublishedSiteSnapshot>;
        hasUnsavedDraft = true;
        draftCacheToStore = options.cloudDraftSnap;
        effectiveSource = 'cloud_draft';
        cloudDraftApplied = true;
      } else {
        logs.push(`Cloud draft rejected (${draftVal.reason}). Falling back to cached draft or published source.`);
      }
    }

    if (!cloudDraftApplied) {
      if (validCachedDraft) {
        chosenSnapshot = validCachedDraft;
        hasUnsavedDraft = true;
        effectiveSource = 'cached_draft';
      } else {
        hasUnsavedDraft = false;
        if (validPublishedSnapshotToUse) {
          chosenSnapshot = validPublishedSnapshotToUse;
          effectiveSource = (options.cloudPublishedSnap && validPublishedSnapshotToUse === options.cloudPublishedSnap)
            ? 'cloud_published'
            : 'cached_published';
        } else {
          chosenSnapshot = null; // will fall back to canonical seed
          effectiveSource = 'canonical_seed';
        }
      }
    }
  } else {
    // Public visitor context: STRICTLY NEVER APPLY DRAFTS (whether cloud or cached)
    hasUnsavedDraft = false;
    if (validPublishedSnapshotToUse) {
      chosenSnapshot = validPublishedSnapshotToUse;
      effectiveSource = (options.cloudPublishedSnap && validPublishedSnapshotToUse === options.cloudPublishedSnap)
        ? 'cloud_published'
        : 'cached_published';
    } else {
      chosenSnapshot = null;
      effectiveSource = 'canonical_seed';
    }
  }

  const extracted = chosenSnapshot ? extractStateFromSnapshot(chosenSnapshot) : extractStateFromSnapshot({});

  return {
    ...extracted,
    hasUnsavedDraft,
    shouldPurgeDraftCache,
    shouldPurgePublishedCache,
    publishedCacheToStore,
    draftCacheToStore,
    effectiveSource,
    logMessages: logs
  };
}
