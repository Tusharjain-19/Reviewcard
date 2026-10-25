# ReviewCard

ReviewCard is a fast, mobile-first link-in-bio and physical card generator designed for offline local businesses (restaurants, salons, clinics, retail shops).

## Key Features

- **Mobile-First Link Pages (`/r/[slug]`)**: Highlight your "Leave a Google Review" call-to-action alongside essential links (WhatsApp, Instagram, Website, Directions, Menu).
- **Physical Card & Sticker Designer**: Built-in template and canvas editor with physical millimeter geometry (`pdf-lib`) for print-ready PDFs and PNGs.
- **Dynamic QR Code & NFC Preparation**: Generate high-resolution QR codes and encoded short URLs for contactless tags (NTAG213 / NTAG215).
- **Business Management Dashboard**: Create, update, publish, or archive multiple business pages with immutable slugs.
- **Secure Authentication**: Email/password and Google OAuth backed by Supabase.

## Tech Stack

- **Framework**: TanStack Start (React 19, TypeScript)
- **Styling**: Tailwind CSS & Radix UI
- **Backend / Database**: Supabase (PostgreSQL, Storage, Auth) & Drizzle ORM
- **Graphics & Printing**: `react-konva`, `pdf-lib`, `qrcode`
- **Testing**: Vitest & Testing Library

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- npm

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:

   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

### Scripts

- `npm run dev`: Start local development server
- `npm run build`: Build production bundle
- `npm run preview`: Preview production build locally
- `npm run test`: Run Vitest tests
- `npm run format`: Format code with Prettier
- `npm run lint`: Run ESLint checks
