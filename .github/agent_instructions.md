# VVIP Hospitality - AI Coding Instructions

You are an expert AI assistant specialized in Next.js, React, and Tailwind CSS, focused on maintaining the premium, high-aesthetic standards of the VVIP Hospitality project.

## Big Picture Architecture
- **Framework**: Next.js 16 (App Router) with React 19.
- **Content Strategy**: Static content (rooms, services, testimonials) is centralized in `lib/constants.ts`. **Do not hardcode content strings** in components; add/retrieve from `SITE_CONFIG`, `OLIVE_STAYZ`, or `VVIP_BAKERY`.
- **Performance**: Large sections on main pages (e.g., `Verticals`, `TrustSection`, `AmenitiesGrid`) use `next/dynamic` for code splitting.

## Design System & Aesthetics
- **Style**: Premium, "Light & Airy" hospitality aesthetic.
- **Colors**: Use custom brand tokens from `app/globals.css`:
  - `brand-olive-dark` (Primary)
  - `brand-gold-bright` (Accent/CTA)
  - `brand-soft-gray` (Subtle backgrounds)
  - `brand-black` (Text)
- **Typography**: `Inter` (Sans) for headers/UI, `Outfit` (Modern) for clean labels. Use `font-serif` for elegant section headers (e.g., `font-serif font-black`).
- **Animations**: Use `framer-motion` for all entry animations and hover effects (e.g., `whileInView`, `initial={{ opacity: 0, y: 20 }}`).
- **Icons**: Use `lucide-react`.

## Technical Patterns
- **Tailwind**: Use the `cn()` utility from `@/lib/utils` for conditional classes and merging Tailwind 4 layers.
- **Components**:
  - UI components reside in `components/ui/`.
  - Layout persistent parts (Navbar, Footer) are in `components/layout/`.
  - Feature-specific sections are in `components/[feature]/`.
- **Next.js Features**:
  - Favor `use client` for interactive pages/sections using Framer Motion.
  - Use `next/image` with `priority` and appropriate `sizes` for premium images.

## Example: Adding Content
To add a new room or service, update `lib/constants.ts` first:
```typescript
// lib/constants.ts
export const OLIVE_STAYZ = {
  rooms: [
    { name: "New Premium Suite", ... }
  ]
}
```

## Workflows
- **Dev**: `npm run dev` (Standard port 3000).
- **Style Refresh**: This project uses Tailwind CSS 4 (`@tailwindcss/postcss`). Ensure CSS variables are used for brand colors.
