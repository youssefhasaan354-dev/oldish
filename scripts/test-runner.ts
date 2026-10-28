import { VERIFIED_MENU_CATEGORIES, VERIFIED_MENU_ITEMS, VERIFIED_SOURCE_URL } from '../src/data/verifiedMenuData';
import { SEED_SITE_SETTINGS, SEED_BRANCHES, SEED_MENU_CATEGORIES, SEED_MENU_ITEMS } from '../src/data/seedData';
import { searchMatches, normalizeArabic } from '../src/lib/searchUtils';
import { formatPrice, getItemPriceNumber } from '../src/lib/priceUtils';
import { importVerifiedMenu, exportMenuToJSON, validateMenuItem } from '../src/data/menuImport';

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

console.log('\n====================================================');
console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED!`);
console.log('====================================================');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

