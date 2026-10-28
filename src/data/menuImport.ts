import type { MenuCategory, MenuItem } from '../types';
import { VERIFIED_MENU_CATEGORIES, VERIFIED_MENU_ITEMS, VERIFIED_SOURCE_URL } from './verifiedMenuData';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ImportStats {
  importedCategories: number;
  updatedCategories: number;
  importedItems: number;
  updatedItems: number;
  skippedItems: number;
  errors: string[];
}

/**
 * Validates a single menu item according to restaurant requirements
 */
export function validateMenuItem(item: Partial<MenuItem>): ValidationResult {
  const errors: string[] = [];

  if (!item.name_en?.trim()) {
    errors.push('English name is required');
  }
  if (!item.name_ar?.trim()) {
    errors.push('Arabic name is required');
  }
  if (!item.category_id?.trim()) {
    errors.push('Category ID is required');
  }

  // Price validation
  if (item.price_min != null && item.price_max != null) {
    if (item.price_min > item.price_max) {
      errors.push(`Price min (${item.price_min}) cannot exceed price max (${item.price_max})`);
    }
  }

  if (item.price_num != null && isNaN(Number(item.price_num))) {
    errors.push('Numeric price must be a valid number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates a menu category
 */
export function validateMenuCategory(cat: Partial<MenuCategory>): ValidationResult {
  const errors: string[] = [];
  if (!cat.id?.trim()) errors.push('Category ID is required');
  if (!cat.name_en?.trim()) errors.push('English category name is required');
  if (!cat.name_ar?.trim()) errors.push('Arabic category name is required');
  return { valid: errors.length === 0, errors };
}

/**
 * Deterministic, idempotent import and migration of verified Oldish menu data.
 * Merges verified records into existing state without duplicating items or categories.
 */
export function importVerifiedMenu(
  existingCategories: MenuCategory[] = [],
  existingItems: MenuItem[] = []
): {
  categories: MenuCategory[];
  items: MenuItem[];
  stats: ImportStats;
} {
  const stats: ImportStats = {
    importedCategories: 0,
    updatedCategories: 0,
    importedItems: 0,
    updatedItems: 0,
    skippedItems: 0,
    errors: []
  };

  // 1. Merge Categories idempotently
  const categoryMap = new Map<string, MenuCategory>();
  for (const cat of existingCategories) {
    categoryMap.set(cat.id, { ...cat });
  }

  for (const verifiedCat of VERIFIED_MENU_CATEGORIES) {
    const val = validateMenuCategory(verifiedCat);
    if (!val.valid) {
      stats.errors.push(`Invalid category ${verifiedCat.id}: ${val.errors.join(', ')}`);
      continue;
    }

    if (categoryMap.has(verifiedCat.id)) {
      const current = categoryMap.get(verifiedCat.id)!;
      categoryMap.set(verifiedCat.id, {
        ...current,
        name_en: verifiedCat.name_en,
        name_ar: verifiedCat.name_ar,
        slug: verifiedCat.slug || current.slug,
        sort_order: verifiedCat.sort_order,
        visible: verifiedCat.visible
      });
      stats.updatedCategories++;
    } else {
      categoryMap.set(verifiedCat.id, { ...verifiedCat });
      stats.importedCategories++;
    }
  }

  const mergedCategories = Array.from(categoryMap.values()).sort(
    (a, b) => a.sort_order - b.sort_order
  );

  // 2. Merge Items idempotently by ID and Slug
  const itemMap = new Map<string, MenuItem>();
  const slugToIdMap = new Map<string, string>();

  for (const item of existingItems) {
    itemMap.set(item.id, { ...item });
    if (item.slug) {
      slugToIdMap.set(item.slug, item.id);
    }
  }

  for (const verifiedItem of VERIFIED_MENU_ITEMS) {
    const val = validateMenuItem(verifiedItem);
    if (!val.valid) {
      stats.errors.push(`Invalid item ${verifiedItem.id}: ${val.errors.join(', ')}`);
      stats.skippedItems++;
      continue;
    }

    // Determine target ID by existing ID or matched slug
    const targetId = verifiedItem.slug && slugToIdMap.has(verifiedItem.slug)
      ? slugToIdMap.get(verifiedItem.slug)!
      : verifiedItem.id;

    if (itemMap.has(targetId)) {
      const existing = itemMap.get(targetId)!;
      // Preserve custom user-added image if present and verifiedItem has none
      const resolvedImageUrl = existing.image_url || verifiedItem.image_url;

      itemMap.set(targetId, {
        ...existing,
        ...verifiedItem,
        id: targetId,
        image_url: resolvedImageUrl,
        source_url: verifiedItem.source_url || VERIFIED_SOURCE_URL,
        verification_status: 'verified',
        is_published: true,
        updated_at: new Date().toISOString()
      });
      stats.updatedItems++;
    } else {
      itemMap.set(targetId, {
        ...verifiedItem,
        id: targetId,
        source_url: verifiedItem.source_url || VERIFIED_SOURCE_URL,
        verification_status: 'verified',
        is_published: true,
        created_at: verifiedItem.created_at || new Date().toISOString()
      });
      if (verifiedItem.slug) {
        slugToIdMap.set(verifiedItem.slug, targetId);
      }
      stats.importedItems++;
    }
  }

  const mergedItems = Array.from(itemMap.values()).sort((a, b) => a.sort_order - b.sort_order);

  return {
    categories: mergedCategories,
    items: mergedItems,
    stats
  };
}

/**
 * Exports current menu structure and items to a standardized JSON schema
 */
export function exportMenuToJSON(categories: MenuCategory[], items: MenuItem[]): string {
  const exportPayload = {
    schema_version: '1.0',
    exported_at: new Date().toISOString(),
    restaurant: 'Oldish Restaurant & Café (أولديش)',
    source_url: VERIFIED_SOURCE_URL,
    total_categories: categories.length,
    total_items: items.length,
    categories,
    items
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Validated import from external JSON
 */
export function importMenuFromJSON(
  jsonText: string,
  existingCategories: MenuCategory[] = [],
  existingItems: MenuItem[] = []
): {
  success: boolean;
  categories?: MenuCategory[];
  items?: MenuItem[];
  error?: string;
  stats?: ImportStats;
} {
  try {
    const parsed = JSON.parse(jsonText);
    const rawCategories: MenuCategory[] = Array.isArray(parsed.categories) ? parsed.categories : [];
    const rawItems: MenuItem[] = Array.isArray(parsed.items) ? parsed.items : [];

    if (rawCategories.length === 0 && rawItems.length === 0) {
      return { success: false, error: 'JSON does not contain categories or items array.' };
    }

    const mergedCatList = existingCategories.length > 0 ? existingCategories : rawCategories;
    const mergedItemList = existingItems.length > 0 ? existingItems : rawItems;

    const res = importVerifiedMenu(mergedCatList, mergedItemList);

    return {
      success: true,
      categories: res.categories,
      items: res.items,
      stats: res.stats
    };
  } catch (err: any) {
    return {
      success: false,
      error: `JSON parsing error: ${err.message || String(err)}`
    };
  }
}
