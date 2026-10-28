import type { PublishedSiteSnapshot } from './firebase';

export interface SnapshotValidationResult {
  isValid: boolean;
  reason?: string;
  schemaVersion?: number;
  categoryCount?: number;
  itemCount?: number;
}

export const MIN_CANONICAL_SCHEMA_VERSION = 7;

/**
 * Checks whether a snapshot carries markers of the legacy October 2026 demo environment.
 * If ANY demo markers exist (in navigation sections, menu items, or site settings),
 * the snapshot is identified as an unfinished demo preview and must be rejected.
 */
export function hasLegacyDemoMarkers(snap: Partial<PublishedSiteSnapshot>): { hasDemo: boolean; reason?: string } {
  // 1. Check section labels for demo/beta/trial words
  if (Array.isArray(snap.sections)) {
    for (const sec of snap.sections) {
      if (sec.nav_label_en && /\b(demo|beta|trial|preview)\b/i.test(sec.nav_label_en)) {
        return { hasDemo: true, reason: `Section '${sec.key}' contains demo label: "${sec.nav_label_en}"` };
      }
      if (sec.nav_label_ar && /(تجريب|بيتا|معاينة)/i.test(sec.nav_label_ar)) {
        return { hasDemo: true, reason: `Section '${sec.key}' contains demo label: "${sec.nav_label_ar}"` };
      }
    }
  }

  // 2. Check menu items for legacy sample markers
  if (Array.isArray(snap.menuItems)) {
    for (const item of snap.menuItems) {
      if (item.is_sample === true) {
        return { hasDemo: true, reason: `Menu item '${item.id}' has is_sample: true` };
      }
      if (item.name_ar && /(صنف تجريبي|عينة تجريبية)/i.test(item.name_ar)) {
        return { hasDemo: true, reason: `Menu item '${item.id}' has demo name in Arabic: "${item.name_ar}"` };
      }
      if (item.name_en && /\b(sample item|demo item|test item)\b/i.test(item.name_en)) {
        return { hasDemo: true, reason: `Menu item '${item.id}' has demo name in English: "${item.name_en}"` };
      }
    }
  }

  // 3. Check site settings for legacy demo banner
  if (snap.siteSettings) {
    if (snap.siteSettings.demo_banner_enabled === true) {
      return { hasDemo: true, reason: 'SiteSettings has demo_banner_enabled: true' };
    }
    if (snap.siteSettings.demo_banner_text_ar && /(تجريب|بيتا|معاينة)/i.test(snap.siteSettings.demo_banner_text_ar)) {
      return { hasDemo: true, reason: 'SiteSettings contains legacy demo banner Arabic text' };
    }
    if (snap.siteSettings.demo_banner_text_en && /\b(demo|beta|trial|preview)\b/i.test(snap.siteSettings.demo_banner_text_en)) {
      return { hasDemo: true, reason: 'SiteSettings contains legacy demo banner English text' };
    }
  }

  return { hasDemo: false };
}

/**
 * Validates whether a published site snapshot from Firestore or localStorage
 * is valid, complete, and safe to replace canonical verified data.
 *
 * Rules:
 * 1. Must be a non-null object.
 * 2. schema_version must be >= 7 (rejects legacy schema_version 5 and 6).
 * 3. Reject any legacy demo markers across sections, items, and siteSettings.
 * 4. Structural validity: menuCategories must be a non-empty array with unique IDs and valid names.
 * 5. Structural validity: menuItems must be a non-empty array with unique IDs, valid names, and referential integrity (every item.category_id must exist in menuCategories).
 * 6. Structural validity: sections must have valid, unique keys.
 * 7. Does NOT hardcode a rigid count threshold (e.g. >= 23 categories or >= 50 dishes), allowing future legitimate restaurant owner menu updates from /admin.
 */
export function validatePublishedSnapshot(snap: unknown): SnapshotValidationResult {
  if (!snap || typeof snap !== 'object') {
    return { isValid: false, reason: 'Snapshot is null or not an object' };
  }

  const s = snap as Partial<PublishedSiteSnapshot> & { schema_version?: number };

  // 1. Schema version check
  const schemaVer = typeof s.schema_version === 'number'
    ? s.schema_version
    : (s.schema_version ? parseInt(String(s.schema_version), 10) : undefined);

  if (schemaVer === undefined || isNaN(schemaVer) || schemaVer < MIN_CANONICAL_SCHEMA_VERSION) {
    return {
      isValid: false,
      schemaVersion: schemaVer,
      reason: `Schema version ${schemaVer ?? 'missing'} is below minimum required (${MIN_CANONICAL_SCHEMA_VERSION})`
    };
  }

  // 2. Reject snapshots carrying legacy demo markers
  const demoCheck = hasLegacyDemoMarkers(s);
  if (demoCheck.hasDemo) {
    return {
      isValid: false,
      schemaVersion: schemaVer,
      reason: `Legacy demo content detected: ${demoCheck.reason}`
    };
  }

  // 3. Structural validity & uniqueness: menuCategories
  if (!Array.isArray(s.menuCategories) || s.menuCategories.length === 0) {
    return {
      isValid: false,
      schemaVersion: schemaVer,
      reason: 'Snapshot has no menu categories'
    };
  }

  const categoryIds = new Set<string>();
  for (const cat of s.menuCategories) {
    if (!cat || !cat.id || typeof cat.id !== 'string' || (!cat.name_en && !cat.name_ar)) {
      return {
        isValid: false,
        schemaVersion: schemaVer,
        reason: 'Snapshot contains malformed category (missing id or name)'
      };
    }
    if (categoryIds.has(cat.id)) {
      return {
        isValid: false,
        schemaVersion: schemaVer,
        reason: `Snapshot contains duplicate category ID: "${cat.id}"`
      };
    }
    categoryIds.add(cat.id);
  }

  // 4. Structural validity, uniqueness & referential integrity: menuItems
  if (!Array.isArray(s.menuItems) || s.menuItems.length === 0) {
    return {
      isValid: false,
      schemaVersion: schemaVer,
      reason: 'Snapshot has no menu items'
    };
  }

  const itemIds = new Set<string>();
  for (const item of s.menuItems) {
    if (!item || !item.id || typeof item.id !== 'string' || !item.category_id || (!item.name_en && !item.name_ar)) {
      return {
        isValid: false,
        schemaVersion: schemaVer,
        reason: 'Snapshot contains malformed menu item (missing id, category_id, or name)'
      };
    }
    if (itemIds.has(item.id)) {
      return {
        isValid: false,
        schemaVersion: schemaVer,
        reason: `Snapshot contains duplicate menu item ID: "${item.id}"`
      };
    }
    if (!categoryIds.has(item.category_id)) {
      return {
        isValid: false,
        schemaVersion: schemaVer,
        reason: `Menu item "${item.id}" references non-existent category_id: "${item.category_id}"`
      };
    }
    itemIds.add(item.id);
  }

  // 5. Structural validity & uniqueness: sections (if provided)
  if (Array.isArray(s.sections) && s.sections.length > 0) {
    const sectionKeys = new Set<string>();
    for (const sec of s.sections) {
      if (!sec || !sec.key || typeof sec.key !== 'string') {
        return {
          isValid: false,
          schemaVersion: schemaVer,
          reason: 'Snapshot contains malformed section (missing key)'
        };
      }
      if (sectionKeys.has(sec.key)) {
        return {
          isValid: false,
          schemaVersion: schemaVer,
          reason: `Snapshot contains duplicate section key: "${sec.key}"`
        };
      }
      sectionKeys.add(sec.key);
    }
  }

  return {
    isValid: true,
    schemaVersion: schemaVer,
    categoryCount: s.menuCategories.length,
    itemCount: s.menuItems.length
  };
}
