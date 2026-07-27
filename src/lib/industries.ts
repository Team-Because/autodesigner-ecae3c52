/**
 * Industry taxonomy shared by BrandForm, brand-autofill, and any future UI
 * that needs to render or validate industry-specific asset tags.
 *
 * NOTE: `supabase/functions/brand-autofill/index.ts` keeps a hand-mirrored
 * copy of `INDUSTRY_CATEGORIES` because Deno edge functions can't import
 * from `src/`. If you change values here, update the edge function too.
 */

export const BASE_CATEGORIES: string[] = [
  "Logo",
  "Hero Image",
  "Product",
  "Lifestyle",
  "Icon",
  "Pattern/Texture",
  "Banner",
  "Infographic",
  "Style Reference",
  "Other",
];

export const INDUSTRY_CATEGORIES: Record<string, string[]> = {
  "Real Estate": [
    "Logo", "Elevation", "Interior", "Exterior",
    "Amenity", "Lifestyle", "RERA QR",
    "Pattern/Texture", "Render",
  ],
  "Education": [
    "Logo", "Campus", "Classroom", "Student Life",
    "Faculty", "Lab", "Library", "Playground",
    "Graduation", "Sports",
  ],
  "Healthcare": [
    "Logo", "Facility", "Medical Equipment", "Patient Care",
    "Doctor/Staff", "Wellness", "Lab", "Pharmacy",
    "Hospital Exterior", "Therapy",
  ],
  "Retail": [
    "Logo", "Store/Venue", "Product", "Packaging",
    "Catalogue", "Display/Shelf", "E-commerce Shot",
    "Window Display", "Lifestyle", "Banner",
  ],
  "Fashion": [
    "Logo", "Lookbook", "On-Model", "Flat Lay",
    "Swatch", "Fabric Close-up", "Collection",
    "Runway", "Accessories", "Lifestyle",
  ],
  "Technology": [
    "Logo", "Screenshot", "UI Mockup", "Device Render",
    "Dashboard", "Feature Highlight", "Mobile View",
    "Desktop View", "Icon", "Banner",
  ],
  "Food & Beverage": [
    "Logo", "Dish/Menu Item", "Packaging", "Restaurant/Venue",
    "Ingredient", "Plating", "Drink", "Kitchen",
    "Chef/Staff", "Menu Card",
  ],
  "Automotive": [
    "Logo", "Exterior Shot", "Interior Shot", "Detail/Close-up",
    "On Road", "Showroom", "Dashboard View",
    "Colour Options", "Lifestyle", "Banner",
  ],
  "Hospitality": [
    "Logo", "Room/Suite", "Amenity", "Dining",
    "Spa/Wellness", "Pool", "Lobby", "Aerial View",
    "Guest Experience", "Lifestyle",
  ],
  "Finance": [
    "Logo", "Data Visualization", "Office/Branch",
    "Card/Product", "Mobile Banking", "Investment Chart",
    "Team Photo", "Lifestyle", "Banner", "Report",
  ],
};

export const INDUSTRIES = Object.keys(INDUSTRY_CATEGORIES);

export function getAssetCategories(industry: string | null): string[] {
  if (!industry || !INDUSTRY_CATEGORIES[industry]) return BASE_CATEGORIES;
  return [...INDUSTRY_CATEGORIES[industry], "Other"];
}
