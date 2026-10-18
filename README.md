# Oldish Restaurant & Café — Official Website

> **A Timeless Cairo Gathering Place — Vintage Character, Comforting Food, and Memorable Moments.**  
> *Production-Ready Digital Presence for Oldish Restaurant & Café, Downtown Cairo, Egypt.*

---

## 🏛️ Executive Summary

This repository contains the complete, production-quality website engineered for **Oldish Restaurant & Café**. Built to agency commercial standards, it combines the editorial discipline, responsive component architecture, and refined microinteractions of the hospitality technical design guidelines with Oldish’s authentic vintage Cairo identity.

The website is fully implemented, responsive across all viewports, bilingual (English & Arabic with complete RTL layout support), and ready for production deployment.

---

## 🎨 Art Direction & Visual Identity

### Design Philosophy
- **The Concept**: *"A timeless Cairo gathering place — vintage character, comforting food, and memorable moments."*
- **Atmosphere**: Weathered red-brick walls, lush cascading ivy, antique wooden furniture, warm Edison lighting, sand-brewed Turkish coffee, and unhurried courtyard dining.
- **Palette**:
  - **Antique Gold (`#886E42`)**: Selective accents, navigation indicators, button highlights, and icons.
  - **Charcoal (`#222222` / `#161616`)**: Editorial text, footer grounding, and high-contrast atmospheric sections.
  - **Soft Neutral Background (`#FAF8F5` / `#F2EFE9`)**: Cairo limestone-inspired warm tones.
  - **Warm Espresso (`#3F2923`)** & **Muted Olive (`#53634B`)**: Natural earth accents.
  - **Terracotta Brick (`#9E4738`)**: Echoing the famous Downtown courtyard brickwork.

### Typography
- **English**: `Poppins` (geometric readability) paired with `Playfair Display` (vintage editorial serif headings).
- **Arabic**: `Cairo` & `IBM Plex Sans Arabic` with natural RTL ligatures, balanced line-heights, and proportional shaping.

---

## 🚀 Key Features & Implementation Architecture

### 1. Bilingual System (English & Arabic RTL)
- Instant client-side language toggle without page reloads.
- Dynamically sets `dir="rtl"` and `lang="ar"` on the document root.
- Logical CSS properties (`margin-inline`, `padding-inline`, `inset-inline`) ensuring pixel-perfect layout symmetry in both directions.
- Comprehensive translation dictionary for all navigation items, descriptions, labels, errors, and disclaimers.

### 2. High-Impact Hero Showcase
- Cinematic slideshow highlighting the courtyard, evening lights, and Egyptian morning breakfast.
- Accessible playback controls, pause on hover, slide indicators, and keyboard navigation.
- High-visibility calls-to-action: *Explore the Menu*, *Find Your Table*, and *Get Directions*.

### 3. Interactive Culinary Menu
- Category tabs: *Breakfast & Morning Plates*, *Authentic Tagines & Mains*, *Soups & Fresh Salads*, *Pastas & Specialties*, *Traditional Café & Drinks*, *Sweet Delicacies*.
- Real-time instant search by dish name or ingredient.
- Dietary filter pills: *Vegetarian*, *Vegan*, *Gluten-Free*, *Oldish Classic*.
- Transparent commercial disclosure: Dishes clearly reflect confirmed signature items with draft price notices pending client seasonal validation.

### 4. Interactive Gallery with Full-Screen Lightbox
- Categorized photo exploration: Courtyard, Interior Salon, Food, Drinks.
- Full-screen modal lightbox with keyboard shortcuts (`Esc` to close, `←` / `→` arrow keys to navigate), image counters, and bilingual captions.

### 5. Genuine Reviews & Social Proof
- Verified customer feedback attributed to Google Maps (4.3★ average), Spotted by Locals, and TripAdvisor.
- Highlights unhurried dining, cozy workspace ambiance, and authentic Egyptian clay tagines.

### 6. Table Reservation Flow
- Clear operational policy: Informs guests that submissions are forwarded to the dining host manager for telephone/SMS confirmation within 2 hours.
- Validates name, phone number (+20), date, time, party size, and seating preference (Outdoor Courtyard vs. Indoor Salon).
- Direct submission to host team with instant confirmation feedback.

### 7. Locations & Contact
- **Downtown Cairo (Primary Branch)**: 20 Mohammed Mahmoud Street (behind Greek Campus, Abdeen). Features interactive Google Maps embed, directions guide, and click-to-call.
- **Zamalek Branch**: Clearly labeled with a directory status notice for client verification.
- Working inquiry form with input validation and submission feedback.

### 8. Mobile Bottom Quick-Actions Bar
- Floating bottom bar on mobile screens providing one-tap access to **Call Restaurant**, **Reserve Table**, and **Google Maps Navigation**.

---

## 🛠️ Technology Stack

- **Framework**: React 19 with TypeScript
- **Bundler & Dev Server**: Vite 8
- **Iconography**: `lucide-react`
- **Styling**: Tailored CSS Architecture using Design Tokens (`src/index.css` & `src/App.css`)
- **SEO & Structured Data**: Open Graph, Twitter Cards, Schema.org `Restaurant` JSON-LD, `robots.txt`, and XML `sitemap.xml`.

---

## 📋 Getting Started

### Prerequisites
- Node.js (v18 or newer recommended, verified on v24.21.0)
- npm (v9 or newer, verified on v11.19.0)

### Installation
```bash
# Clone or navigate to the project directory
cd "d:\web\Oldish Restaurant & Café"

# Install dependencies
npm install
```

### Running Locally
```bash
# Start Vite development server
npm run dev
```
Open [http://localhost:5174/](http://localhost:5174/) (or the port shown in terminal) in your browser.

### Building for Production
```bash
# Compile TypeScript and create production bundle
npm run build
```
The optimized static build will be generated in `dist/`, ready for deployment on Vercel, Netlify, Cloudflare Pages, or traditional web servers.

---

## 🔍 Owner Verification Checklist & Next Steps

Before publishing as the official live public domain, the restaurant owner should review:
1. **Seasonal Menu Pricing**: Confirm prices for signature dishes.
2. **Zamalek Branch Operating Status**: Confirm whether the Zamalek location (14 Taha Hussein St) should be activated as a full operating branch or kept as Downtown-only.
3. **Reservation Notification Destination**: Connect the reservation form endpoint to the restaurant's operational WhatsApp Business API or reservations email inbox.
4. **Custom Domain**: Connect DNS to chosen official domain.
