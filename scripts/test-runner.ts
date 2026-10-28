import { VERIFIED_MENU_CATEGORIES, VERIFIED_MENU_ITEMS } from '../src/data/verifiedMenuData';
import { SEED_SITE_SETTINGS, SEED_BRANCHES, SEED_SECTIONS } from '../src/data/seedData';
import { searchMatches } from '../src/lib/searchUtils';
import { formatPrice } from '../src/lib/priceUtils';
import { importVerifiedMenu, exportMenuToJSON } from '../src/data/menuImport';
import { validatePublishedSnapshot } from '../src/lib/snapshotValidator';

console.log('====================================================');
console.log('RUNNING COMPREHENSIVE OLDISH MENU INTEGRATION AUDIT');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details = '') {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName} - ${details}`);
  }
}

// Test 1: Category Count and Order
console.log('\n--- Test 1: Category Count & Ordering ---');
assert(VERIFIED_MENU_CATEGORIES.length === 23, 'Category count is exactly 23', `Found ${VERIFIED_MENU_CATEGORIES.length}`);

const expectedCategorySlugs = [
  'breakfast', 'soups', 'salads', 'appetizers', 'sandwiches',
  'pizza', 'pasta', 'main-dishes', 'savory-extras', 'desserts',
  'sweet-crepe', 'waffle', 'ice-cream', 'sweet-extras', 'hot-drinks',
  'frappe', 'milkshakes', 'smoothies', 'iced-coffee', 'ice-tea',
  'cocktails', 'fresh-juices', 'tawagen'
];

let orderCorrect = true;
for (let i = 0; i < expectedCategorySlugs.length; i++) {
  if (VERIFIED_MENU_CATEGORIES[i]?.id !== expectedCategorySlugs[i] || VERIFIED_MENU_CATEGORIES[i]?.sort_order !== i) {
    orderCorrect = false;
    break;
  }
}
assert(orderCorrect, 'All 23 categories are in the required sequence (order 0-22)');

// Test 2: Product Count and Uniqueness
console.log('\n--- Test 2: Product Count & Uniqueness ---');
assert(VERIFIED_MENU_ITEMS.length === 63, 'Verified item count is exactly 63', `Found ${VERIFIED_MENU_ITEMS.length}`);

const itemIds = new Set<string>();
const itemSlugs = new Set<string>();
let duplicates = 0;
for (const item of VERIFIED_MENU_ITEMS) {
  if (itemIds.has(item.id)) duplicates++;
  if (item.slug && itemSlugs.has(item.slug)) duplicates++;
  itemIds.add(item.id);
  if (item.slug) itemSlugs.add(item.slug);
}
assert(duplicates === 0, 'Every product has unique ID and unique slug, imported exactly once');

// Test 3: Verified Prices Matching Reference
console.log('\n--- Test 3: Product Prices Matching Brief ---');
const referencePrices: Record<string, number> = {
  'cheese-mix': 99,
  'white-cheese-tomatoes-mint-olive-oil': 45,
  'plain-eggs': 50,
  'eggs-with-toppings': 50,
  'scramble-eggs': 57,
  'foul': 39,
  'falafel-with-sesame': 38,
  'fries': 37,
  'oriental-breakfast-meal': 129,
  'english-breakfast': 220,
  'creamy-chicken-soup': 69,
  'creamy-mushroom-soup': 68,
  'orzo-soup': 31,
  'lentil-soup': 40,
  'vegetables-soup': 37,
  'corn-and-mushroom-soup': 76,
  'mushroom-and-broccoli-salad': 70,
  'corn-salad': 99,
  'fatoush-salad': 58,
  'el-raheb-salad': 54,
  'oldish-salad': 123,
  'rocca-salad': 61,
  'caesar-salad': 69,
  'chicken-caesar-salad': 106,
  'taco-salad': 110,
  'beetroot-yogurt-salad': 69,
  'mix-green-salad': 39,
  'greek-salad': 71,
  'coleslaw': 39,
  'tahini-salad': 39,
  'fried-mozzarella': 77,
  'crispy-chicken': 102,
  'buffalo-wings': 83,
  'fried-calamari': 94,
  'oldish-appetizers': 159,
  'vine-leaves': 79,
  'meat-sambousak': 73,
  'cheese-sambousak': 73,
  'potatoes-with-garlic-and-vinegar': 49,
  'boom-frit': 37,
  'sauteed-vegetables': 38,
  'club-sandwich': 130,
  'chicken-crispy-sandwich': 133,
  'burger-with-cheese-sandwich': 165,
  'shish-tawook-wrap-sandwich': 127,
  'quesadilla-chicken-sandwich': 131,
  'smoked-turkey-sandwich': 156,
  'margherita-pizza': 121,
  'vegetables-pizza': 142,
  'chicken-pizza': 153,
  'chicken-bbq-pizza': 158,
  'quattro-formaggi-pizza': 159,
  'penne-chicken-alfredo-pasta': 152,
  'negresco-pasta': 162,
  'penne-arrabiata-pasta': 95,
  'spaghetti-bolognese-pasta': 130,
  'penne-chicken-pesto-pasta': 155,
  'carbonara-pasta': 147,
  'chicken-pane-pasta': 135,
  'oven-potatoes-dish': 69,
  'plain-mossakaa-tagen': 83,
  'fereek-with-vegetables-and-corn-dish': 80
};

let allPricesMatch = true;
for (const [slug, expectedPrice] of Object.entries(referencePrices)) {
  const item = VERIFIED_MENU_ITEMS.find(i => i.slug === slug);
  if (!item || item.price_num !== expectedPrice) {
    console.error(`Price mismatch for ${slug}: expected ${expectedPrice}, got ${item?.price_num}`);
    allPricesMatch = false;
  }
}
assert(allPricesMatch, 'All 62 fixed-price items match verified integer EGP reference values');

// Test 4: Croissant Price Range
console.log('\n--- Test 4: Croissant Price Range ---');
const croissant = VERIFIED_MENU_ITEMS.find(i => i.slug === 'croissant');
assert(
  croissant != null && croissant.price_min === 64 && croissant.price_max === 74,
  'Croissant price range 64-74 EGP is correctly modeled with price_min=64 and price_max=74'
);
assert(
  formatPrice(croissant!, false) === '64 – 74 EGP' && formatPrice(croissant!, true) === '64 – 74 ج.م',
  'Croissant price formats correctly in EN ("64 – 74 EGP") and AR ("64 – 74 ج.م")'
);

// Test 5: Description Verification & No Fabrication
console.log('\n--- Test 5: Description Verification & Non-Fabrication ---');
const cheeseMix = VERIFIED_MENU_ITEMS.find(i => i.slug === 'cheese-mix');
assert(
  cheeseMix?.description_en === 'Feta, roomy, cheddar and blue cheese, served with bread',
  'Cheese Mix preserves exact source description including "roomy"'
);

const scrambleEggs = VERIFIED_MENU_ITEMS.find(i => i.slug === 'scramble-eggs');
assert(
  scrambleEggs?.description_en === '',
  'Scramble Eggs has empty description (not fabricated)'
);

// Test 6: Search in English and Arabic
console.log('\n--- Test 6: Search & Arabic Normalization ---');
assert(searchMatches('falafel', 'Falafel with Sesame', 'فلافل بالسمسم'), 'English search matches "falafel"');
assert(searchMatches('FALAFEL', 'Falafel with Sesame', 'فلافل بالسمسم'), 'Case-insensitive English search matches "FALAFEL"');
assert(searchMatches('فلافل', 'Falafel with Sesame', 'فلافل بالسمسم'), 'Arabic search matches "فلافل"');
assert(searchMatches('جبنه', 'Cheese Mix', 'جبنة فيتا'), 'Teh marbuta normalization matches "جبنه" to "جبنة"');
assert(searchMatches('افطار', 'Oriental Breakfast Meal', 'وجبة إفطار شرقي'), 'Alef normalization matches "افطار" to "إفطار"');

// Test 7: Branch Information
console.log('\n--- Test 7: Restaurant & Branch Verification ---');
const downtown = SEED_BRANCHES.find(b => b.id === 'downtown-main');
const zamalek = SEED_BRANCHES.find(b => b.id === 'zamalek-secondary');
assert(downtown != null && downtown.status === 'confirmed', 'Downtown branch is confirmed');
assert(downtown != null && downtown.phone?.includes('01060119488'), 'Downtown phone matches 01060119488');
assert(zamalek != null && zamalek.status === 'confirmed', 'Zamalek branch is confirmed');
assert(zamalek != null && zamalek.address_en.includes('Taha Hussein'), 'Zamalek address matches 14 Taha Hussein Street');
assert(zamalek != null && zamalek.phone === '01000665331', 'Zamalek phone matches 01000665331');

// Test 8: Site Settings Show Prices
console.log('\n--- Test 8: Site Settings ---');
assert(SEED_SITE_SETTINGS.show_prices === true, 'show_prices is enabled in SEED_SITE_SETTINGS');
assert(SEED_SITE_SETTINGS.brand_name_en === 'Oldish' && SEED_SITE_SETTINGS.brand_name_ar === 'أولديش', 'Brand names are Oldish / أولديش');

// Test 9: Data Migration & Idempotency
console.log('\n--- Test 9: Migration Idempotency ---');
const firstImport = importVerifiedMenu([], []);
assert(firstImport.items.length === 63, 'Initial import produces 63 items');
const secondImport = importVerifiedMenu(firstImport.categories, firstImport.items);
assert(secondImport.items.length === 63, 'Second import is strictly idempotent (no duplicates: 63 items)');
assert(secondImport.stats.importedItems === 0 && secondImport.stats.updatedItems === 63, 'Second import updates existing items without creating duplicates');

// Test 10: JSON Export/Import
console.log('\n--- Test 10: JSON Export / Import Schema ---');
const jsonExport = exportMenuToJSON(VERIFIED_MENU_CATEGORIES, VERIFIED_MENU_ITEMS);
const parsed = JSON.parse(jsonExport);
assert(parsed.total_categories === 23 && parsed.total_items === 63, 'JSON export contains valid schema with 23 categories and 63 items');

// Test 11: Snapshot Integrity & Firestore Validation
console.log('\n--- Test 11: Firestore Snapshot Validation & Forward Compatibility ---');

// 11.1: Legacy Firestore snapshot (schema_version 5, legacy sample items, demo section)
const legacyFirestoreSnapshot = {
  schema_version: 5,
  menuCategories: Array(9).fill({ id: 'cat', name_en: 'Cat', name_ar: 'تصنيف' }),
  menuItems: Array(20).fill({ id: 'item', category_id: 'cat', name_en: 'Sample Item', name_ar: 'صنف تجريبي', is_sample: true }),
  sections: [
    { key: 'reservations', nav_label_en: 'Reserve (Demo)', nav_label_ar: 'طلب حجز (تجريبي)', sort_order: 6, visible: true }
  ],
  siteSettings: { brand_name_en: 'Oldish', demo_banner_enabled: true }
};
const v11_1 = validatePublishedSnapshot(legacyFirestoreSnapshot);
assert(!v11_1.isValid, 'Legacy schema_version 5 snapshot is strictly rejected', v11_1.reason);

// 11.2: Snapshot with legacy demo section titles
const demoSectionSnapshot = {
  schema_version: 7,
  menuCategories: VERIFIED_MENU_CATEGORIES,
  menuItems: VERIFIED_MENU_ITEMS,
  sections: [
    { key: 'reservations', nav_label_en: 'Reserve (Demo)', nav_label_ar: 'طلب حجز (تجريبي)', sort_order: 6, visible: true }
  ]
};
const v11_2 = validatePublishedSnapshot(demoSectionSnapshot);
assert(!v11_2.isValid && (v11_2.reason?.includes('contains demo label') ?? false), 'Snapshot with "Reserve (Demo)" is rejected rather than disguised', v11_2.reason);

// 11.3: Snapshot with legacy sample items (is_sample: true)
const sampleItemSnapshot = {
  schema_version: 7,
  menuCategories: VERIFIED_MENU_CATEGORIES,
  menuItems: [
    { id: 'item-grill-sample', category_id: 'breakfast', name_en: 'Mixed Grill (Sample item)', name_ar: 'مشويات (صنف تجريبي)', is_sample: true },
    ...VERIFIED_MENU_ITEMS
  ]
};
const v11_3 = validatePublishedSnapshot(sampleItemSnapshot);
assert(!v11_3.isValid && (v11_3.reason?.includes('is_sample') ?? false), 'Snapshot with sample/demo item is rejected', v11_3.reason);

// 11.4: Snapshot with demo_banner_enabled: true
const demoBannerSnapshot = {
  schema_version: 7,
  menuCategories: VERIFIED_MENU_CATEGORIES,
  menuItems: VERIFIED_MENU_ITEMS,
  siteSettings: { ...SEED_SITE_SETTINGS, demo_banner_enabled: true }
};
const v11_4 = validatePublishedSnapshot(demoBannerSnapshot);
assert(!v11_4.isValid && (v11_4.reason?.includes('demo_banner_enabled') ?? false), 'Snapshot with demo_banner_enabled: true is rejected', v11_4.reason);

// 11.5: Snapshot with empty/malformed categories or items
const emptyMenuSnapshot = {
  schema_version: 7,
  menuCategories: [],
  menuItems: []
};
const v11_5 = validatePublishedSnapshot(emptyMenuSnapshot);
assert(!v11_5.isValid && (v11_5.reason?.includes('no menu categories') ?? false), 'Empty categories snapshot is rejected', v11_5.reason);

// 11.6: Forward compatibility - Legitimate owner changes (e.g. menu customized to 15 categories, 35 dishes)
const customOwnerSnapshot = {
  schema_version: 7,
  menuCategories: VERIFIED_MENU_CATEGORIES.slice(0, 15),
  menuItems: VERIFIED_MENU_ITEMS.slice(0, 35),
  sections: SEED_SECTIONS,
  siteSettings: SEED_SITE_SETTINGS
};
const v11_6 = validatePublishedSnapshot(customOwnerSnapshot);
assert(v11_6.isValid, 'Future legitimate owner edits (customized category/dish counts) are accepted', v11_6.reason);

// 11.7: Valid full canonical snapshot (schema_version 7, 23 categories, 63 dishes)
const fullCanonicalSnapshot = {
  schema_version: 7,
  menuCategories: VERIFIED_MENU_CATEGORIES,
  menuItems: VERIFIED_MENU_ITEMS,
  sections: SEED_SECTIONS,
  siteSettings: SEED_SITE_SETTINGS
};
const v11_7 = validatePublishedSnapshot(fullCanonicalSnapshot);
assert(v11_7.isValid, 'Full verified canonical snapshot is accepted', v11_7.reason);

// 11.8: Null and undefined (network / Firestore failure)
assert(!validatePublishedSnapshot(null).isValid, 'Null snapshot (network failure) is rejected safely');
assert(!validatePublishedSnapshot(undefined).isValid, 'Undefined snapshot is rejected safely');

// 11.9: Duplicate category IDs
const duplicateCategorySnapshot = {
  schema_version: 7,
  menuCategories: [
    { id: 'cat-breakfast', name_en: 'Breakfast', name_ar: 'إفطار' },
    { id: 'cat-breakfast', name_en: 'Breakfast Duplicate', name_ar: 'إفطار مكرر' }
  ],
  menuItems: [
    { id: 'item-1', category_id: 'cat-breakfast', name_en: 'Omelette', name_ar: 'أومليت' }
  ],
  sections: SEED_SECTIONS,
  siteSettings: SEED_SITE_SETTINGS
};
const v11_9 = validatePublishedSnapshot(duplicateCategorySnapshot);
assert(!v11_9.isValid && (v11_9.reason?.includes('duplicate category ID') ?? false), 'Snapshot with duplicate category ID is strictly rejected', v11_9.reason);

// 11.10: Duplicate menu item IDs
const duplicateItemSnapshot = {
  schema_version: 7,
  menuCategories: [
    { id: 'cat-breakfast', name_en: 'Breakfast', name_ar: 'إفطار' }
  ],
  menuItems: [
    { id: 'item-duplicate', category_id: 'cat-breakfast', name_en: 'Item 1', name_ar: 'صنف 1' },
    { id: 'item-duplicate', category_id: 'cat-breakfast', name_en: 'Item 2', name_ar: 'صنف 2' }
  ],
  sections: SEED_SECTIONS,
  siteSettings: SEED_SITE_SETTINGS
};
const v11_10 = validatePublishedSnapshot(duplicateItemSnapshot);
assert(!v11_10.isValid && (v11_10.reason?.includes('duplicate menu item ID') ?? false), 'Snapshot with duplicate menu item ID is strictly rejected', v11_10.reason);

// 11.11: Referential integrity violation (item references non-existent category_id)
const orphanedItemSnapshot = {
  schema_version: 7,
  menuCategories: [
    { id: 'cat-breakfast', name_en: 'Breakfast', name_ar: 'إفطار' }
  ],
  menuItems: [
    { id: 'item-valid', category_id: 'cat-breakfast', name_en: 'Valid Item', name_ar: 'صنف سليم' },
    { id: 'item-orphan', category_id: 'cat-non-existent-ghost', name_en: 'Orphan Item', name_ar: 'صنف بدون تصنيف' }
  ],
  sections: SEED_SECTIONS,
  siteSettings: SEED_SITE_SETTINGS
};
const v11_11 = validatePublishedSnapshot(orphanedItemSnapshot);
assert(!v11_11.isValid && (v11_11.reason?.includes('references non-existent category_id') ?? false), 'Snapshot with orphaned item (invalid category_id) is strictly rejected', v11_11.reason);

// 11.12: Duplicate section keys
const duplicateSectionSnapshot = {
  schema_version: 7,
  menuCategories: VERIFIED_MENU_CATEGORIES,
  menuItems: VERIFIED_MENU_ITEMS,
  sections: [
    { key: 'hero', nav_label_en: 'Hero', nav_label_ar: 'الرئيسية', sort_order: 0, visible: true },
    { key: 'hero', nav_label_en: 'Hero 2', nav_label_ar: 'الرئيسية 2', sort_order: 1, visible: true }
  ],
  siteSettings: SEED_SITE_SETTINGS
};
const v11_12 = validatePublishedSnapshot(duplicateSectionSnapshot);
assert(!v11_12.isValid && (v11_12.reason?.includes('duplicate section key') ?? false), 'Snapshot with duplicate section key is strictly rejected', v11_12.reason);

// 11.13: Legitimate small owner menu (e.g. 2 categories, 4 dishes) accepted without rigid count thresholds
const smallOwnerMenuSnapshot = {
  schema_version: 7,
  menuCategories: [
    { id: 'morning-coffee', name_en: 'Morning Coffee', name_ar: 'قهوة الصباح' },
    { id: 'pastries', name_en: 'Fresh Pastries', name_ar: 'مخبوزات طازجة' }
  ],
  menuItems: [
    { id: 'espresso', category_id: 'morning-coffee', name_en: 'Espresso', name_ar: 'إسبريسو' },
    { id: 'latte', category_id: 'morning-coffee', name_en: 'Caffè Latte', name_ar: 'لاتيه' },
    { id: 'croissant-butter', category_id: 'pastries', name_en: 'Butter Croissant', name_ar: 'كرواسون زبدة' },
    { id: 'pain-choc', category_id: 'pastries', name_en: 'Pain au Chocolat', name_ar: 'بان أو شوكولا' }
  ],
  sections: SEED_SECTIONS,
  siteSettings: SEED_SITE_SETTINGS
};
const v11_13 = validatePublishedSnapshot(smallOwnerMenuSnapshot);
assert(v11_13.isValid, 'Small legitimate owner menu is accepted without rigid minimum count barriers', v11_13.reason);

console.log('\n====================================================');
console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED!`);
console.log('====================================================');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

