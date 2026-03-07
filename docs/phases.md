# fynqAI — Complete Development Phases
**For:** Antigravity AI IDE (Vibe Coding)  
**References:** PRD.md (v2.0) · design.md (v1.0)  
**Goal:** Production-ready demo in 5 days  
**Total Phases:** 10 | **Total Days:** 5

---

## How to Use This Document

Every phase is self-contained. Start at Phase 0 and do not skip forward. Each phase ends with a **Verification Gate** — every item must pass before moving to the next phase. Tasks marked `[PRD §X]` reference the PRD section. Tasks marked `[design §X]` reference design.md.

**Give Antigravity one phase at a time.** Paste the full phase block as your prompt context alongside PRD.md and design.md.

---

## Phase Map

```
Phase 0 │ Foundation & Project Setup          │ Day 1 AM   │ ~2 hours
Phase 1 │ Design System Implementation        │ Day 1 PM   │ ~3 hours
Phase 2 │ Authentication & Workspace          │ Day 2 AM   │ ~3 hours
Phase 3 │ Database Schema & Infrastructure    │ Day 2 AM   │ ~2 hours
Phase 4 │ Document Ingestion Pipeline         │ Day 2 PM   │ ~4 hours
Phase 5 │ AI Query Layer & Chat               │ Day 3 AM   │ ~4 hours
Phase 6 │ Contradiction Agent                 │ Day 3 PM   │ ~3 hours
Phase 7 │ Core UI Pages & Components          │ Day 4 AM   │ ~4 hours
Phase 8 │ Admin Contradiction Dashboard       │ Day 4 PM   │ ~3 hours
Phase 9 │ Motion, Polish & Demo Prep          │ Day 5      │ ~4 hours
```

---

## Phase 0 — Foundation & Project Setup
**Day 1 AM | ~2 hours**  
**Goal:** A running Next.js project connected to Supabase, with all dependencies installed and environment variables configured. Nothing should be built yet — just scaffolded.

---

### 0.1 Initialize Next.js Project

```bash
npx create-next-app@16.1.6 fynqai \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias="@/*"

cd fynqai
```

### 0.2 Install All Dependencies

Install everything upfront so no phase is blocked by missing packages:

```bash
# UI & Animation
npm install framer-motion @studio-freight/lenis

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# shadcn/ui (run this, then add components as needed per phase)
npx shadcn@latest init
# When prompted: Dark theme, CSS variables: yes, tailwind.config: yes

# AI SDKs
npm install @mistralai/mistralai
npm install @mistralai/mistralai

# Document parsing
npm install llama-parse
npm install mammoth

# Icons
npm install lucide-react

# State management
npm install zustand

# Data fetching
npm install @tanstack/react-query

# Utilities
npm install clsx tailwind-merge date-fns
```

### 0.3 Create Full File Structure

Create every directory and placeholder file upfront so Antigravity has a complete map `[PRD §15]`:

```bash
# App pages
mkdir -p app/auth/login
mkdir -p app/auth/signup
mkdir -p app/auth/callback
mkdir -p app/dashboard
mkdir -p app/chat
mkdir -p "app/chat/[sessionId]"
mkdir -p app/documents
mkdir -p "app/documents/[documentId]"
mkdir -p app/admin/contradictions
mkdir -p "app/admin/contradictions/[id]"

# API routes
mkdir -p app/api/ingest/upload
mkdir -p "app/api/ingest/status/[id]"
mkdir -p app/api/chat/stream
mkdir -p app/api/contradictions
mkdir -p "app/api/contradictions/[id]/resolve"
mkdir -p "app/api/documents/[id]"

# Components
mkdir -p components/chat
mkdir -p components/documents
mkdir -p components/contradictions
mkdir -p components/layout
mkdir -p components/ui

# Library
mkdir -p lib/supabase
mkdir -p lib/ai
mkdir -p lib/ingestion
mkdir -p lib/contradiction
mkdir -p lib/search
mkdir -p lib/motion

# State & Types
mkdir -p stores
mkdir -p types

# Supabase migrations
mkdir -p supabase/migrations

# Create placeholder .ts files to avoid import errors
touch lib/supabase/client.ts
touch lib/supabase/server.ts
touch lib/supabase/middleware.ts
touch lib/supabase/bootstrap.ts
touch lib/ai/embed.ts
touch lib/ai/extract.ts
touch lib/ai/chat.ts
touch lib/ai/prompts.ts
touch lib/ingestion/parse.ts
touch lib/ingestion/chunk.ts
touch lib/ingestion/pipeline.ts
touch lib/contradiction/agent.ts
touch lib/contradiction/score.ts
touch lib/contradiction/normalize.ts
touch lib/contradiction/notify.ts
touch lib/search/hybrid.ts
touch lib/motion/easings.ts
touch lib/motion/scroll-variants.ts
touch stores/workspace.store.ts
touch stores/chat.store.ts
touch types/database.types.ts
touch types/app.types.ts
```

### 0.4 Environment Variables

Create `.env.local` in project root `[PRD §16]`:

```bash
# .env.local

# Supabase — get from supabase.com → project → settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Mistral AI — get free key at: console.mistral.ai
MISTRAL_API_KEY=your-mistral-api-key

# Mistral AI (chat + extraction) — get key at: console.mistral.ai
MISTRAL_API_KEY=your-mistral-api-key

# LlamaParse — get free key at: cloud.llamaindex.ai
LLAMA_CLOUD_API_KEY=llx-your-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Also create `.env.local` in `.gitignore`:
```bash
echo ".env.local" >> .gitignore
```

### 0.5 Supabase Project Setup

In Supabase Dashboard (supabase.com):
1. Create new project named `fynqai`
2. Choose region closest to you
3. Copy the Project URL and anon key into `.env.local`
4. Go to **Authentication → Providers → Google** — enable Google OAuth
5. Add redirect URL: `http://localhost:3000/auth/callback`
6. Do NOT run SQL yet — that happens in Phase 3. Keep workspace bootstrap code present but not wired until Phase 3 is complete.

### 0.6 TypeScript App Types

Populate `types/app.types.ts` with all application interfaces used throughout the project:

```typescript
// types/app.types.ts

export type DocumentStatus =
  | 'processing' | 'chunking' | 'embedding'
  | 'extracting' | 'scanning' | 'ready' | 'error';

export type DocumentSource =
  | 'upload' | 'google_drive' | 'notion'
  | 'confluence' | 'sharepoint' | 'slack';

export type ContradictionType =
  | 'quantitative' | 'policy' | 'temporal' | 'definitional' | 'scope_drift';

export type ContradictionSeverity = 'critical' | 'warning' | 'info';

export type ContradictionStatus =
  | 'open' | 'resolved' | 'dismissed' | 'auto_resolved';

export type MemberRole = 'admin' | 'member';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Document {
  id: string;
  workspace_id: string;
  uploaded_by: string | null;
  name: string;
  original_filename: string;
  file_type: string;
  file_size_bytes: number | null;
  source: DocumentSource;
  source_url: string | null;
  raw_storage_path: string | null;
  markdown_storage_path: string | null;
  status: DocumentStatus;
  error_message: string | null;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}

export interface Chunk {
  id: string;
  document_id: string;
  workspace_id: string;
  text: string;
  chunk_index: number;
  section_header: string | null;
  token_count: number | null;
  entities: Entity[];
  created_at: string;
}

export interface Entity {
  type: 'QUANTITY' | 'DATE' | 'PRICE' | 'POLICY_RULE' | 'DEFINITION' | 'PERSON' | 'PRODUCT';
  value: string;
  normalized_value: Record<string, unknown>;
  subject: string;
  scope: string | null;
  confidence: number;
}

export interface Contradiction {
  id: string;
  workspace_id: string;
  chunk_a_id: string;
  chunk_b_id: string;
  document_a_id: string;
  document_b_id: string;
  entity_subject: string;
  value_a: string;
  value_b: string;
  contradiction_type: ContradictionType;
  confidence: number;
  severity: ContradictionSeverity;
  status: ContradictionStatus;
  auto_resolved: boolean;
  authoritative_chunk_id: string | null;
  resolution_note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface Citation {
  index: number;
  chunk_id: string;
  document_id: string;
  document_name: string;
  section_header: string | null;
  excerpt: string;
  storage_url: string | null;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[];
  had_contradiction: boolean;
  contradiction_ids: string[];
  created_at: string;
}

export interface ChatSession {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string | null;
  created_at: string;
}
```

---

### Phase 0 Verification Gate ✓

Before proceeding to Phase 1, confirm ALL of the following:

- [ ] `npm run dev` starts without errors on `localhost:3000`
- [ ] All directories in §0.3 exist
- [ ] `.env.local` has all 7 variables populated with real values
- [ ] Supabase project is created and accessible in dashboard
- [ ] Google OAuth is enabled in Supabase Auth settings
- [ ] All placeholder `.ts` files exist in `lib/`
- [ ] `types/app.types.ts` contains all interfaces above

---

## Phase 1 — Design System Implementation
**Day 1 PM | ~3 hours**  
**References:** design.md §1–§16  
**Goal:** The complete fynqAI visual identity is implemented as CSS variables, Tailwind config, fonts, and motion utilities. Every subsequent phase builds on top of this.

Tailwind note: this plan uses TailwindCSS 4 in a compatibility-style setup (`tailwind.config.ts` + `@tailwind base/components/utilities`) to keep implementation deterministic across contributors.

---

### 1.1 Global CSS — Full Design System

Replace the entire contents of `app/globals.css` with the following. This is the single source of truth for all design tokens `[design §2, §4, §15]`:

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ============================================================
   fynqAI DESIGN SYSTEM — CSS VARIABLES
   ============================================================ */
:root {
  /* BASE BLACKS */
  --color-void:       #080808;
  --color-obsidian:   #0F0F0F;
  --color-ink:        #141414;
  --color-carbon:     #1C1C1C;
  --color-graphite:   #242424;
  --color-steel:      #2E2E2E;

  /* GREYS */
  --color-iron:       #3D3D3D;
  --color-ash:        #5A5A5A;
  --color-fog:        #787878;
  --color-silver:     #9E9E9E;
  --color-mist:       #C2C2C2;
  --color-chalk:      #DEDEDE;

  /* WHITES */
  --color-bone:       #F0F0F0;
  --color-pure:       #FAFAFA;
  --color-white:      #FFFFFF;

  /* RED SYSTEM */
  --color-ember:      #7A0000;
  --color-crimson:    #B91C1C;
  --color-red:        #DC2626;
  --color-scarlet:    #EF4444;
  --color-blush:      #FCA5A5;

  /* SEMANTIC */
  --color-contradiction: #DC2626;
  --color-resolved:      #16A34A;
  --color-warning-color: #D97706;
  --color-info-color:    #3B82F6;

  /* TEXT GRADIENTS */
  --gradient-hero:    linear-gradient(135deg, #FFFFFF 0%, #9E9E9E 60%, #5A5A5A 100%);
  --gradient-heading: linear-gradient(180deg, #DEDEDE 0%, #787878 100%);
  --gradient-subtle:  linear-gradient(135deg, #C2C2C2 0%, #5A5A5A 100%);
  --gradient-red:     linear-gradient(135deg, #EF4444 0%, #B91C1C 100%);

  /* BACKGROUND GRADIENTS */
  --gradient-surface:   linear-gradient(180deg, #1C1C1C 0%, #141414 100%);
  --gradient-card:      linear-gradient(145deg, #242424 0%, #1C1C1C 100%);
  --gradient-glow-red:  radial-gradient(ellipse at 50% 0%, rgba(220,38,38,0.12) 0%, transparent 70%);
  --gradient-glow-subtle: radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 60%);

  /* TYPOGRAPHY */
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-ui:      'Sora', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', 'Courier New', monospace;

  /* TYPE SCALE */
  --text-display-xl: clamp(4rem, 8vw, 7rem);
  --text-display-lg: clamp(3rem, 5vw, 4.5rem);
  --text-display-md: clamp(2rem, 3.5vw, 3rem);
  --text-h1: 2rem;
  --text-h2: 1.5rem;
  --text-h3: 1.25rem;
  --text-h4: 1.125rem;
  --text-body-lg: 1rem;
  --text-body: 0.9375rem;
  --text-body-sm: 0.875rem;
  --text-caption: 0.8125rem;
  --text-xs: 0.75rem;

  /* LEADING */
  --leading-display: 1.05;
  --leading-heading: 1.2;
  --leading-body:    1.65;
  --leading-mono:    1.5;

  /* TRACKING */
  --tracking-display: -0.03em;
  --tracking-heading: -0.02em;
  --tracking-label:   0.06em;

  /* LAYOUT */
  --sidebar-width:    240px;
  --topnav-height:    60px;
  --content-max:      1280px;
  --chat-max:         760px;

  /* RADIUS */
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-2xl:  24px;
  --radius-full: 9999px;

  /* TRANSITIONS */
  --transition-fast:   150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow:   400ms ease;
}

/* ============================================================
   BASE RESET & BODY
   ============================================================ */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  background-color: var(--color-obsidian);
  color: var(--color-mist);
  font-family: var(--font-ui);
  font-size: var(--text-body);
  line-height: var(--leading-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

/* Noise texture overlay — prevents flat black [design §5] */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
  opacity: 0.4;
}

/* Anchor offset for fixed nav */
[id] { scroll-margin-top: calc(var(--topnav-height) + 24px); }

/* ============================================================
   CUSTOM SCROLLBAR [design §12]
   ============================================================ */
::-webkit-scrollbar        { width: 6px; height: 6px; }
::-webkit-scrollbar-track  { background: var(--color-obsidian); }
::-webkit-scrollbar-thumb  { background: var(--color-steel); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--color-iron); }

/* ============================================================
   UTILITY CLASSES
   ============================================================ */

/* Gradient text [design §3] */
.gradient-text-hero {
  background: var(--gradient-hero);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.gradient-text-heading {
  background: var(--gradient-heading);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.gradient-text-subtle {
  background: var(--gradient-subtle);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Cards [design §5] */
.card {
  background: var(--color-carbon);
  border: 1px solid var(--color-steel);
  border-radius: var(--radius-lg);
}
.card-elevated {
  background: var(--gradient-card);
  border: 1px solid #333333;
  box-shadow:
    0 1px 0 0 rgba(255,255,255,0.04) inset,
    0 4px 16px 0 rgba(0,0,0,0.4),
    0 1px 3px 0 rgba(0,0,0,0.6);
}
.card-contradiction {
  background: linear-gradient(145deg, #1F1010 0%, #1A0A0A 100%);
  border: 1px solid rgba(220,38,38,0.3);
  box-shadow:
    0 0 0 1px rgba(220,38,38,0.1),
    0 4px 20px 0 rgba(220,38,38,0.08);
}

/* Input [design §6] */
.input-base {
  background: var(--color-ink);
  border: 1px solid var(--color-steel);
  color: var(--color-chalk);
  font-family: var(--font-ui);
  font-size: var(--text-body);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  outline: none;
  transition: border-color var(--transition-normal), box-shadow var(--transition-normal);
  caret-color: var(--color-red);
  width: 100%;
}
.input-base:focus {
  border-color: rgba(220,38,38,0.5);
  box-shadow: 0 0 0 3px rgba(220,38,38,0.08);
}
.input-base::placeholder { color: var(--color-fog); }

/* Badges [design §6] */
.badge-critical {
  background: rgba(220,38,38,0.15);
  color: var(--color-scarlet);
  border: 1px solid rgba(220,38,38,0.3);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
}
.badge-warning-sev {
  background: rgba(217,119,6,0.12);
  color: #FCD34D;
  border: 1px solid rgba(217,119,6,0.25);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}
.badge-resolved {
  background: rgba(22,163,74,0.12);
  color: #4ADE80;
  border: 1px solid rgba(22,163,74,0.25);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

/* Streaming cursor [design §11] */
.streaming-cursor::after {
  content: '▋';
  color: var(--color-red);
  animation: blink 0.8s step-end infinite;
}

/* Skeleton shimmer [design §13] */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-carbon) 25%,
    var(--color-graphite) 50%,
    var(--color-carbon) 75%
  );
  background-size: 800px 100%;
  animation: shimmer 1.5s infinite linear;
  border-radius: var(--radius-md);
}

/* ============================================================
   KEYFRAMES [design §16]
   ============================================================ */
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
@keyframes pulse-red {
  0%, 100% { box-shadow: 0 0 0px rgba(220,38,38,0.4); }
  50%       { box-shadow: 0 0 16px rgba(220,38,38,0.7); }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
@keyframes slide-up {
  0%   { transform: translateY(8px); opacity: 0; }
  100% { transform: translateY(0);   opacity: 1; }
}
@keyframes progress-pulse {
  0%   { box-shadow: 0 0 0px rgba(220,38,38,0.6); }
  50%  { box-shadow: 0 0 12px rgba(220,38,38,0.8); }
  100% { box-shadow: 0 0 0px rgba(220,38,38,0.6); }
}
```

### 1.2 Tailwind Config

Replace `tailwind.config.ts` with the full extended config `[design §16]`:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fynq: {
          void: '#080808', obsidian: '#0F0F0F', ink: '#141414',
          carbon: '#1C1C1C', graphite: '#242424', steel: '#2E2E2E',
          iron: '#3D3D3D', ash: '#5A5A5A', fog: '#787878',
          silver: '#9E9E9E', mist: '#C2C2C2', chalk: '#DEDEDE',
          bone: '#F0F0F0', red: '#DC2626', crimson: '#B91C1C',
          scarlet: '#EF4444',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        ui: ['var(--font-ui)'],
        mono: ['var(--font-mono)'],
      },
      backgroundImage: {
        'gradient-hero':    'linear-gradient(135deg, #FFFFFF 0%, #9E9E9E 60%, #5A5A5A 100%)',
        'gradient-heading': 'linear-gradient(180deg, #DEDEDE 0%, #787878 100%)',
        'gradient-subtle':  'linear-gradient(135deg, #C2C2C2 0%, #5A5A5A 100%)',
        'gradient-red':     'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
        'gradient-card':    'linear-gradient(145deg, #242424 0%, #1C1C1C 100%)',
        'glow-red':         'radial-gradient(ellipse at 50% 0%, rgba(220,38,38,0.12) 0%, transparent 70%)',
        'grid-pattern':     'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
      backgroundSize: { 'grid': '48px 48px' },
      boxShadow: {
        'card':        '0 4px 16px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset',
        'card-hover':  '0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset',
        'red-glow':    '0 0 20px rgba(220,38,38,0.3)',
        'red-glow-lg': '0 0 40px rgba(220,38,38,0.2)',
        'focus-red':   '0 0 0 3px rgba(220,38,38,0.2)',
      },
      animation: {
        'shimmer':    'shimmer 1.5s infinite linear',
        'pulse-red':  'pulse-red 2s ease-in-out infinite',
        'blink':      'blink 0.8s step-end infinite',
        'slide-up':   'slide-up 0.4s ease forwards',
      },
      keyframes: {
        shimmer:     { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
        'pulse-red': { '0%, 100%': { boxShadow: '0 0 0px rgba(220,38,38,0.4)' }, '50%': { boxShadow: '0 0 16px rgba(220,38,38,0.7)' } },
        blink:       { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0' } },
        'slide-up':  { '0%': { transform: 'translateY(8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
};
export default config;
```

### 1.3 Font Loading in Root Layout

```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import { Cormorant_Garamond, Sora, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ui',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'fynqAI — AI Intelligence Layer',
  description: 'Your knowledge base, verified.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${sora.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

### 1.4 Motion Utilities

```typescript
// lib/motion/easings.ts
export const easings = {
  smooth:       [0.25, 0.46, 0.45, 0.94] as const,
  snap:         [0.175, 0.885, 0.32, 1.275] as const,
  enter:        [0.0, 0.0, 0.2, 1.0] as const,
  exit:         [0.4, 0.0, 1.0, 1.0] as const,
  spring:       { type: 'spring' as const, stiffness: 400, damping: 30 },
  gentleSpring: { type: 'spring' as const, stiffness: 200, damping: 25 },
};

export const durations = {
  instant: 0.08, fast: 0.15, normal: 0.25,
  moderate: 0.35, slow: 0.5, dramatic: 0.8,
};
```

```typescript
// lib/motion/scroll-variants.ts
import type { Variants } from 'framer-motion';

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.0, 0.0, 0.2, 1.0] } },
};
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.0, 0.0, 0.2, 1.0] } },
};
export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.175, 0.885, 0.32, 1.0] } },
};
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.0, 0.0, 0.2, 1.0] } },
};
export const revealLine: Variants = {
  hidden: { scaleX: 0, originX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};
```

### 1.5 Smooth Scroll Provider `[design §12]`

```tsx
// components/layout/SmoothScroll.tsx
'use client';
import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import { usePathname } from 'next/navigation';

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Only apply Lenis on public/landing pages — dashboard manages its own scroll
  const isPublicPage = pathname === '/' || pathname.startsWith('/about');

  useEffect(() => {
    if (!isPublicPage) return;
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, [pathname, isPublicPage]);

  return <>{children}</>;
}
```

### 1.6 Scroll Progress Bar `[design §8]`

```tsx
// components/layout/ScrollProgress.tsx
'use client';
import { motion, useScroll, useSpring } from 'framer-motion';

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      style={{ scaleX, transformOrigin: 'left' }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-fynq-red z-50 pointer-events-none"
    />
  );
}
```

### 1.7 Page Wrapper `[design §10]`

```tsx
// components/layout/PageWrapper.tsx
'use client';
import { motion } from 'framer-motion';

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.0, 0.0, 0.2, 1.0] } }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.15, ease: [0.4, 0.0, 1.0, 1.0] } }}
    >
      {children}
    </motion.div>
  );
}
```

### 1.8 Zustand Stores

```typescript
// stores/workspace.store.ts
import { create } from 'zustand';

interface WorkspaceStore {
  workspaceId: string | null;
  workspaceName: string | null;
  role: 'admin' | 'member' | null;
  openContradictionCount: number;
  setWorkspace: (id: string, name: string, role: 'admin' | 'member') => void;
  setContradictionCount: (count: number) => void;
  incrementContradictions: () => void;
  decrementContradictions: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspaceId: null,
  workspaceName: null,
  role: null,
  openContradictionCount: 0,
  setWorkspace: (id, name, role) => set({ workspaceId: id, workspaceName: name, role }),
  setContradictionCount: (count) => set({ openContradictionCount: count }),
  incrementContradictions: () => set((s) => ({ openContradictionCount: s.openContradictionCount + 1 })),
  decrementContradictions: () => set((s) => ({ openContradictionCount: Math.max(0, s.openContradictionCount - 1) })),
}));
```

```typescript
// stores/chat.store.ts
import { create } from 'zustand';
import type { ChatMessage, ChatSession, Citation } from '@/types/app.types';

interface ChatStore {
  sessions: ChatSession[];
  activeSessionId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  setSessions: (sessions: ChatSession[]) => void;
  setActiveSession: (id: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  appendStreamChunk: (chunk: string) => void;
  setStreaming: (value: boolean) => void;
  finalizeMessage: (fullContent: string, citations: Citation[]) => void;
  clearStream: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  setSessions: (sessions) => set({ sessions }),
  setActiveSession: (id) => set({ activeSessionId: id }),
  setMessages: (messages) => set({ messages }),
  appendStreamChunk: (chunk) => set((s) => ({ streamingContent: s.streamingContent + chunk })),
  setStreaming: (value) => set({ isStreaming: value }),
  finalizeMessage: (fullContent, citations) => set((s) => ({
    messages: [...s.messages, {
      id: crypto.randomUUID(), session_id: s.activeSessionId!,
      role: 'assistant', content: fullContent,
      citations, had_contradiction: false, contradiction_ids: [], created_at: new Date().toISOString(),
    }],
    streamingContent: '',
    isStreaming: false,
  })),
  clearStream: () => set({ streamingContent: '', isStreaming: false }),
}));
```

---

### Phase 1 Verification Gate ✓

- [ ] `npm run dev` runs with no TypeScript or CSS errors
- [ ] Background color is `#0F0F0F` (not white, not pure black)
- [ ] Open browser devtools → body has `--color-obsidian` background
- [ ] Cormorant Garamond, Sora, JetBrains Mono all load (check Network tab)
- [ ] `globals.css` has all keyframes defined
- [ ] `tailwind.config.ts` has `fynq.*` color namespace
- [ ] All motion files exist and export correctly
- [ ] Both Zustand stores compile without errors

---

## Phase 2 — Authentication & Workspace Bootstrap
**Day 2 AM | ~3 hours**  
**References:** PRD §6, §19, §21  
**Goal:** Complete auth flow and route protection. Keep workspace bootstrap code in place, but do not invoke it until Phase 3 database schema is applied.

---

### 2.1 Supabase Client Files

```typescript
// lib/supabase/client.ts — Browser client (for Client Components)
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// lib/supabase/server.ts — Server client (for Server Components & API routes)
import { createServerClient as createSSRClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerClient() {
  const cookieStore = cookies();
  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }); } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }); } catch {}
        },
      },
    }
  );
}
```

```typescript
// lib/supabase/middleware.ts — Middleware client
import { createServerClient as createSSRClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export function createServerClient(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });
  const supabase = createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );
  return { supabase, response };
}
```

### 2.2 Workspace Bootstrap (Code Only; Wire in Phase 3) `[PRD §19]`

```typescript
// lib/supabase/bootstrap.ts
import { createServerClient } from '@/lib/supabase/server';

export async function bootstrapNewUser(userId: string, email: string) {
  // NOTE: This function depends on `workspaces` and `workspace_members` tables.
  // It should be wired into auth callback only after Phase 3 SQL is applied.
  const supabase = createServerClient();
  const prefix = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
  const slug = `${prefix}-${Date.now()}`;
  const name = `${email.split('@')[0]}'s Workspace`;

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .insert({ name, slug })
    .select()
    .single();

  if (error || !workspace) throw new Error(`Failed to create workspace: ${error?.message}`);

  await supabase.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: userId,
    role: 'admin',
  });

  return workspace;
}
```

### 2.3 Auth Callback Route `[PRD §19]`

```typescript
// app/auth/callback/route.ts
import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = createServerClient();
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session) {
      // Workspace bootstrap is intentionally deferred until Phase 3.
      // In this phase, complete auth exchange + redirect only.

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
```

### 2.4 Middleware `[PRD §21]`

```typescript
// middleware.ts (root of project — NOT inside app/)
import { createServerClient } from '@/lib/supabase/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/', '/auth/login', '/auth/signup', '/auth/callback'];

export async function middleware(request: NextRequest) {
  const { supabase, response } = createServerClient(request);
  const { data: { session } } = await supabase.auth.getSession();
  const path = request.nextUrl.pathname;

  if (PUBLIC_ROUTES.some(route => path.startsWith(route))) return response;
  if (!session) return NextResponse.redirect(new URL('/auth/login', request.url));

  if (path.startsWith('/admin')) {
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('user_id', session.user.id)
      .single();
    if (membership?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
```

### 2.5 Auth Pages

Build these three pages with the fynqAI design system applied `[design §2, §3, §6]`:

**Login page** `app/auth/login/page.tsx`:
- Background: `--color-obsidian`
- Centered card: `card-elevated` class, max-width 400px
- Logo: "fynqAI" in Cormorant Garamond, the "f" in `--color-red`
- Heading: "Sign in" in Sora, `--color-chalk`
- Email input: `.input-base` class
- Password input: `.input-base` class
- Submit button: red background (`--color-red`), full width, "Sign In"
- "Or continue with Google" — ghost button with Google icon
- "Don't have an account? Sign up" link
- Error state: red border on inputs, red error text below

**Signup page** `app/auth/signup/page.tsx`:
- Same layout as login
- Fields: Email, Password, Confirm Password
- On submit: `supabase.auth.signUp()` → redirects to `/auth/callback`

**Both pages** must handle errors gracefully and show loading state on submit button.

---

### Phase 2 Verification Gate ✓

- [ ] `/auth/login` renders without errors, styled correctly
- [ ] `/auth/signup` renders without errors
- [ ] Middleware file is at project ROOT (not inside `app/`)
- [ ] Navigating to `/dashboard` without auth redirects to `/auth/login`
- [ ] Navigating to `/admin/contradictions` without admin role redirects to `/dashboard`
- [ ] `bootstrapNewUser` function compiles without errors (not wired yet)
- [ ] Auth callback route exists at `app/auth/callback/route.ts`

---

## Phase 3 — Database Schema & Infrastructure
**Day 2 AM | ~2 hours**  
**References:** PRD §8, §20  
**Goal:** Complete Supabase database — all tables, indexes, RLS policies, and storage buckets created and verified.

---

### 3.1 Run Complete SQL Schema

Go to **Supabase Dashboard → SQL Editor → New Query**. Paste and run the ENTIRE SQL block from **PRD §8** in one execution. It includes:

- Extensions (`vector`, `uuid-ossp`)
- All 8 tables: `workspaces`, `workspace_members`, `documents`, `chunks`, `contradictions`, `contradiction_notifications`, `chat_sessions`, `chat_messages`
- All ENUM types
- All indexes including `ivfflat` with `lists = 10`
- RLS helper functions: `user_in_workspace()`, `user_is_admin()`
- All RLS policies for all 8 tables

**If any statement fails:** Run each block separately to identify the issue. Common issues:
- `vector` extension not available → Upgrade Supabase plan or use Supabase Pro
- Enum already exists → Add `IF NOT EXISTS` or drop first

### 3.1a Wire Workspace Bootstrap After SQL `[PRD §19]`

Now that `workspaces` and `workspace_members` tables exist, wire `bootstrapNewUser` into auth callback.

Update `app/auth/callback/route.ts`:

```typescript
import { createServerClient } from '@/lib/supabase/server';
import { bootstrapNewUser } from '@/lib/supabase/bootstrap';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = createServerClient();
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session) {
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!membership) {
        await bootstrapNewUser(session.user.id, session.user.email!);
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
```

### 3.2 Storage Buckets `[PRD §20]`

Run in Supabase SQL Editor:

```sql
-- Raw documents bucket (private, 50MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'raw-documents', 'raw-documents', FALSE, 52428800,
  ARRAY['application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'text/markdown']
) ON CONFLICT (id) DO NOTHING;

-- Parsed markdown bucket (private, 10MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'parsed-documents', 'parsed-documents', FALSE, 10485760,
  ARRAY['text/markdown', 'text/plain']
) ON CONFLICT (id) DO NOTHING;
```

Then run the Storage RLS policies from **PRD §20** for both buckets.

### 3.3 Generate TypeScript Types from Supabase

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login and generate types
supabase login
supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
```

If CLI isn't available, use the Supabase Dashboard → Settings → API → "Generate and download types".

---

### Phase 3 Verification Gate ✓

- [ ] All 8 tables visible in Supabase Dashboard → Table Editor
- [ ] `chunks` table has `embedding` column of type `vector(1024)`
- [ ] `chunks` table has `text_search` column of type `tsvector`
- [ ] Both storage buckets appear in Supabase Dashboard → Storage
- [ ] Buckets are set to **private** (not public)
- [ ] RLS is enabled on all 8 tables (green lock icon in Table Editor)
- [ ] `types/database.types.ts` exists and has table type definitions
- [ ] `ivfflat` index exists on chunks.embedding

---

## Phase 4 — Document Ingestion Pipeline
**Day 2 PM | ~4 hours**  
**References:** PRD §6.1, §9.1, §10.1, §10.2, §22  
**Goal:** Complete end-to-end pipeline from file upload to searchable, embedded, entity-extracted chunks with real-time status updates.

---

### 4.1 Markdown Parser `[PRD §6.1 Step 2]`

```typescript
// lib/ingestion/parse.ts
import LlamaParseReader from 'llama-parse';
import mammoth from 'mammoth';

export async function parseToMarkdown(
  fileBuffer: Buffer,
  fileType: string,
  filename: string
): Promise<string> {
  if (fileType === 'pdf') {
    const parser = new LlamaParseReader({
      apiKey: process.env.LLAMA_CLOUD_API_KEY!,
      resultType: 'markdown',
    });
    const documents = await parser.loadDataAsContent(fileBuffer, filename);
    return documents.map((d: { text: string }) => d.text).join('\n\n');
  }

  if (fileType === 'docx') {
    const result = await mammoth.convertToHtml({ buffer: fileBuffer });
    // Convert basic HTML to Markdown (simple approach)
    return result.value
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  if (fileType === 'txt' || fileType === 'md') {
    return fileBuffer.toString('utf-8');
  }

  throw new Error(`Unsupported file type: ${fileType}`);
}
```

### 4.2 Chunker `[PRD §22]`

```typescript
// lib/ingestion/chunk.ts
export interface ChunkData {
  text: string;
  section_header: string | null;
  chunk_index: number;
  token_count: number;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const MIN_TOKENS = 150;
const MAX_TOKENS = 800;

export function chunkMarkdown(markdown: string): ChunkData[] {
  const sections = markdown.split(/(?=^#{1,3} )/m).filter(s => s.trim().length > 0);
  const rawChunks: Omit<ChunkData, 'chunk_index'>[] = [];

  for (const section of sections) {
    const headerMatch = section.match(/^(#{1,3} .+)/m);
    const sectionHeader = headerMatch?.[1]?.trim() ?? null;
    const tokens = estimateTokens(section);

    if (tokens < MIN_TOKENS && rawChunks.length > 0) {
      rawChunks[rawChunks.length - 1].text += '\n\n' + section;
      rawChunks[rawChunks.length - 1].token_count = estimateTokens(rawChunks[rawChunks.length - 1].text);
    } else if (tokens > MAX_TOKENS) {
      const paragraphs = section.split(/\n\n+/);
      let currentChunk = '';
      for (const para of paragraphs) {
        if (estimateTokens(currentChunk + para) > MAX_TOKENS && currentChunk) {
          rawChunks.push({ text: currentChunk.trim(), section_header: sectionHeader, token_count: estimateTokens(currentChunk) });
          currentChunk = para;
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + para;
        }
      }
      if (currentChunk.trim()) {
        rawChunks.push({ text: currentChunk.trim(), section_header: sectionHeader, token_count: estimateTokens(currentChunk) });
      }
    } else {
      rawChunks.push({ text: section.trim(), section_header: sectionHeader, token_count: tokens });
    }
  }

  return rawChunks.map((c, i) => ({ ...c, chunk_index: i }));
}
```

### 4.3 Embedding with Mistral `[PRD §10.2]`

```typescript
// lib/ai/embed.ts
import MistralClient from '@mistralai/mistralai';

const mistral = new MistralClient(process.env.MISTRAL_API_KEY!);

export async function embedChunks(texts: string[]): Promise<number[][]> {
  const BATCH_SIZE = 20;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const response = await mistral.embeddings({ model: 'mistral-embed', input: batch });
    allEmbeddings.push(...response.data.map((d: { embedding: number[] }) => d.embedding));
  }

  return allEmbeddings;
}

export async function embedQuery(query: string): Promise<number[]> {
  const response = await mistral.embeddings({ model: 'mistral-embed', input: [query] });
  return response.data[0].embedding;
}
```

### 4.4 Entity Extraction with Mistral `[PRD §10.1]`

```typescript
// lib/ai/extract.ts
import { Mistral } from '@mistralai/mistralai';
import type { Entity } from '@/types/app.types';

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

export const THINKING_BUDGETS = {
  entity_extraction:    0,
  contradiction_score:  1024,
  chat_answer:          2048,
  contradiction_verify: 8192,
};

export async function extractEntities(chunkText: string): Promise<Entity[]> {
  const response = await mistral.chat.complete({
    model: 'mistral-small-latest',
    temperature: 0,
    responseFormat: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'Extract structured entities and return JSON only.' },
      { role: 'user', content: prompt },
    ],
  });

  const prompt = `You are a structured entity extractor for a business document system.
Extract all typed entities from the chunk below.

Return a JSON object with this EXACT schema, no other text:
{
  "entities": [
    {
      "type": "QUANTITY | DATE | PRICE | POLICY_RULE | DEFINITION | PERSON | PRODUCT",
      "value": "<exact value as written>",
      "normalized_value": {},
      "subject": "<what this value applies to — be very specific>",
      "scope": "<limiting context if any, else null>",
      "confidence": 0.0
    }
  ]
}

Normalization rules:
- QUANTITY: {"amount": number, "unit": "kg|g|l|ml|m|km|units"}
- DATE: {"iso": "YYYY-MM-DD", "relative": "original text"}
- PRICE: {"amount": number, "currency": "USD|EUR|INR"}
- POLICY_RULE: {"rule": "text of the rule"}
- DEFINITION: {"term": "word", "definition": "meaning"}
- PERSON: {"name": "full name", "role": "their role if mentioned"}
- PRODUCT: {"name": "product name", "identifier": "code/SKU if present"}

Document chunk:
"""
${chunkText}
"""`;

  try {
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    return (parsed.entities ?? []).filter((e: Entity) => e.confidence >= 0.6);
  } catch {
    return []; // Return empty on parse failure — do not crash the pipeline
  }
}
```

### 4.5 Full Ingestion Pipeline `[PRD §6.1]`

```typescript
// lib/ingestion/pipeline.ts
import { createServerClient } from '@/lib/supabase/server';
import { parseToMarkdown } from './parse';
import { chunkMarkdown } from './chunk';
import { embedChunks } from '@/lib/ai/embed';
import { extractEntities } from '@/lib/ai/extract';
import { runContradictionScan } from '@/lib/contradiction/agent';

type StatusUpdater = (status: string, errorMessage?: string) => Promise<void>;

export async function runIngestionPipeline(
  documentId: string,
  workspaceId: string,
  fileBuffer: Buffer,
  fileType: string,
  filename: string
): Promise<void> {
  const supabase = createServerClient();

  const updateStatus: StatusUpdater = async (status, errorMessage) => {
    await supabase.from('documents').update({
      status,
      ...(errorMessage ? { error_message: errorMessage } : {}),
      updated_at: new Date().toISOString(),
    }).eq('id', documentId);
  };

  // Step 2: Parse to Markdown
  let markdown: string;
  try {
    await updateStatus('chunking');
    markdown = await parseToMarkdown(fileBuffer, fileType, filename);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Parsing failed';
    await updateStatus('error', `PDF parsing failed: ${msg}. Try a smaller or simpler file.`);
    return;
  }

  // Save markdown to Supabase Storage
  const mdPath = `parsed-documents/${workspaceId}/${documentId}.md`;
  await supabase.storage.from('parsed-documents').upload(mdPath, markdown, { contentType: 'text/markdown' });
  await supabase.from('documents').update({ markdown_storage_path: mdPath }).eq('id', documentId);

  // Step 3: Chunk
  const chunks = chunkMarkdown(markdown);
  await updateStatus('embedding');

  // Step 4: Embed all chunks
  let embeddings: number[][];
  try {
    embeddings = await embedChunks(chunks.map(c => c.text));
  } catch (err) {
    await updateStatus('error', 'Embedding service unavailable. Please retry in a moment.');
    return;
  }

  // Write chunks + embeddings to DB
  const chunkRows = chunks.map((chunk, i) => ({
    document_id: documentId,
    workspace_id: workspaceId,
    text: chunk.text,
    embedding: embeddings[i] as unknown as string, // pgvector type coercion
    chunk_index: chunk.chunk_index,
    section_header: chunk.section_header,
    token_count: chunk.token_count,
    entities: [],
  }));

  const { data: insertedChunks, error: chunkError } = await supabase
    .from('chunks').insert(chunkRows).select('id');

  if (chunkError || !insertedChunks) {
    await updateStatus('error', 'Failed to store document chunks. Please retry.');
    return;
  }

  // Update chunk count
  await supabase.from('documents').update({ chunk_count: chunks.length }).eq('id', documentId);
  await updateStatus('extracting');

  // Step 5: Entity extraction per chunk (sequential to respect rate limits)
  for (let i = 0; i < insertedChunks.length; i++) {
    try {
      const entities = await extractEntities(chunks[i].text);
      await supabase.from('chunks').update({ entities }).eq('id', insertedChunks[i].id);
    } catch {
      // Non-fatal — continue without entities for this chunk
    }
  }

  await updateStatus('scanning');

  // Step 6: Contradiction scan
  try {
    await runContradictionScan(documentId, workspaceId, insertedChunks.map(c => c.id));
  } catch {
    // Non-fatal — mark ready anyway, contradiction scan will retry
  }

  await updateStatus('ready');
}
```

### 4.6 Upload API Route `[PRD §14]`

```typescript
// app/api/ingest/upload/route.ts
export const maxDuration = 120; // Vercel Pro required for >60s

import { createServerClient } from '@/lib/supabase/server';
import { runIngestionPipeline } from '@/lib/ingestion/pipeline';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get workspace
  const { data: membership } = await supabase
    .from('workspace_members').select('workspace_id')
    .eq('user_id', session.user.id).single();
  if (!membership) return NextResponse.json({ error: 'No workspace' }, { status: 403 });

  const workspaceId = membership.workspace_id;
  const formData = await request.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  // Validate file type
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const allowed = ['pdf', 'docx', 'txt', 'md'];
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: `File type .${ext} not supported. Use: ${allowed.join(', ')}` }, { status: 400 });
  }

  // Validate file size (50MB)
  if (file.size > 52428800) {
    return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 });
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const documentId = crypto.randomUUID();
  const storagePath = `raw-documents/${workspaceId}/${documentId}.${ext}`;

  // Upload raw file to storage
  await supabase.storage.from('raw-documents').upload(storagePath, fileBuffer);

  // Create document record
  await supabase.from('documents').insert({
    id: documentId,
    workspace_id: workspaceId,
    uploaded_by: session.user.id,
    name: file.name.replace(/\.[^.]+$/, ''),
    original_filename: file.name,
    file_type: ext,
    file_size_bytes: file.size,
    source: 'upload',
    raw_storage_path: storagePath,
    status: 'processing',
  });

  // Run pipeline (streaming response keeps connection alive for Vercel)
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  runIngestionPipeline(documentId, workspaceId, fileBuffer, ext, file.name)
    .finally(() => writer.close());

  return new Response(stream.readable, {
    headers: { 'Content-Type': 'text/event-stream', 'X-Document-Id': documentId },
  });
}
```

### 4.7 Status Check API `[PRD §14]`

```typescript
// app/api/ingest/status/[id]/route.ts
import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: doc } = await supabase
    .from('documents').select('id, status, chunk_count, error_message')
    .eq('id', params.id).single();

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(doc);
}
```

---

### Phase 4 Verification Gate ✓

- [ ] Upload a test `.txt` file — document record appears in Supabase `documents` table
- [ ] Document status progresses: `processing` → `chunking` → `embedding` → `extracting` → `scanning` → `ready`
- [ ] Chunks appear in `chunks` table with non-null `embedding` column
- [ ] `chunk_count` on the document record matches number of rows in `chunks`
- [ ] At least some chunks have non-empty `entities` JSONB array
- [ ] Uploading unsupported file type returns 400 error
- [ ] Uploading a PDF runs through LlamaParse without crashing

---

## Phase 5 — AI Query Layer & Chat
**Day 3 AM | ~4 hours**  
**References:** PRD §6.2, §9.2, §11, §14  
**Goal:** Working chat interface with streaming AI responses, inline citations, and contradiction-aware answer modes.

---

### 5.1 Hybrid Search `[PRD §11.3]`

```typescript
// lib/search/hybrid.ts
import { createServerClient } from '@/lib/supabase/server';
import { embedQuery } from '@/lib/ai/embed';

export interface SearchResult {
  id: string;
  text: string;
  document_id: string;
  section_header: string | null;
  entities: unknown[];
  document_name: string;
  combined_score: number;
}

export async function hybridSearch(
  query: string,
  workspaceId: string,
  topK: number = 10
): Promise<SearchResult[]> {
  const supabase = createServerClient();
  const queryEmbedding = await embedQuery(query);

  // Dense vector search
  const { data: vectorResults } = await supabase.rpc('match_chunks', {
    query_embedding: queryEmbedding,
    workspace_filter: workspaceId,
    match_count: 30,
  });

  // Keyword search
  const { data: keywordResults } = await supabase
    .from('chunks')
    .select(`id, text, document_id, section_header, entities,
             documents!inner(name, workspace_id)`)
    .eq('documents.workspace_id', workspaceId)
    .textSearch('text_search', query, { type: 'websearch' })
    .limit(20);

  // Merge with RRF scoring (Reciprocal Rank Fusion)
  const scoreMap = new Map<string, { item: SearchResult; score: number }>();

  (vectorResults ?? []).forEach((item: SearchResult & { similarity: number }, rank: number) => {
    const rrf = 1 / (60 + rank);
    scoreMap.set(item.id, {
      item: { ...item, document_name: item.document_name ?? '' },
      score: rrf * 0.7,
    });
  });

  (keywordResults ?? []).forEach((item: SearchResult & { documents: { name: string } }, rank: number) => {
    const rrf = 1 / (60 + rank);
    const existing = scoreMap.get(item.id);
    if (existing) {
      existing.score += rrf * 0.3;
    } else {
      scoreMap.set(item.id, {
        item: { ...item, document_name: item.documents.name },
        score: rrf * 0.3,
      });
    }
  });

  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ item }) => item);
}
```

Add this Supabase RPC function in SQL Editor:

```sql
-- Supabase SQL Editor: create match_chunks function
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding VECTOR(1024),
  workspace_filter UUID,
  match_count INT DEFAULT 30
)
RETURNS TABLE (
  id UUID, text TEXT, document_id UUID,
  section_header TEXT, entities JSONB,
  document_name TEXT, similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id, c.text, c.document_id, c.section_header, c.entities,
    d.name AS document_name,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM chunks c
  JOIN documents d ON c.document_id = d.id
  WHERE c.workspace_id = workspace_filter
    AND d.status = 'ready'
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 5.2 Chat AI Layer `[PRD §11.1, §11.2]`

```typescript
// lib/ai/prompts.ts
export const NORMAL_SYSTEM_PROMPT = `You are an intelligent knowledge assistant for a business.
Answer questions using ONLY the source documents provided below.

CRITICAL RULES:
1. Every factual claim MUST be cited using [SOURCE N] inline markers
2. If the answer is not found in the sources, respond: "I couldn't find this in your knowledge base."
3. Never use prior training knowledge — only what is in the provided sources
4. Be concise and direct
5. Format citations as superscript: [SOURCE 1], [SOURCE 2], etc.`;

export function buildContradictionPrompt(valueA: string, docA: string, valueB: string, docB: string) {
  return `You are an intelligent knowledge assistant. A CONFLICT has been detected in the knowledge base.

CRITICAL: You must present BOTH conflicting answers. Do NOT pick a side.

Conflicting information detected:
- [${docA}] states: "${valueA}"
- [${docB}] states: "${valueB}"

Format your response as:
1. Acknowledge the conflict clearly
2. Present both answers with their source documents cited with [SOURCE N]
3. Tell the user this conflict has been flagged for admin review
4. Do NOT guess or recommend which is correct`;
}

export function buildContextBlock(chunks: Array<{ text: string; document_name: string; section_header: string | null }>) {
  return chunks.map((c, i) =>
    `[SOURCE ${i + 1}: ${c.document_name}${c.section_header ? ' — ' + c.section_header : ''}]\n${c.text}`
  ).join('\n---\n');
}
```

```typescript
// lib/ai/chat.ts
import { Mistral } from '@mistralai/mistralai';
import { THINKING_BUDGETS } from './extract';
import { NORMAL_SYSTEM_PROMPT, buildContradictionPrompt, buildContextBlock } from './prompts';
import type { SearchResult } from '@/lib/search/hybrid';
import type { Citation } from '@/types/app.types';

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

export interface ChatStreamResult {
  stream: AsyncIterable<string>;
  citations: Citation[];
}

export async function* streamChatAnswer(
  query: string,
  chunks: SearchResult[],
  hasContradiction: boolean,
  contradictionData?: { valueA: string; docA: string; valueB: string; docB: string }
): AsyncGenerator<string> {
  const stream = await mistral.chat.stream({
    model: 'mistral-small-latest',
    temperature: hasContradiction ? 0 : 0.2,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: fullPrompt },
    ],
  });

  const contextBlock = buildContextBlock(chunks);
  const systemPrompt = hasContradiction && contradictionData
    ? buildContradictionPrompt(contradictionData.valueA, contradictionData.docA, contradictionData.valueB, contradictionData.docB)
    : NORMAL_SYSTEM_PROMPT;

  const fullPrompt = `${systemPrompt}\n\nSOURCE DOCUMENTS:\n${contextBlock}\n\nUser question: ${query}`;

  const result = await model.generateContentStream(fullPrompt);
  for await (const chunk of result.stream) {
    yield chunk.text();
  }
}

export function parseCitations(responseText: string, chunks: SearchResult[]): Citation[] {
  const citationPattern = /\[SOURCE (\d+)\]/g;
  const usedIndices = new Set<number>();
  let match;

  while ((match = citationPattern.exec(responseText)) !== null) {
    const idx = parseInt(match[1]) - 1;
    if (idx >= 0 && idx < chunks.length) usedIndices.add(idx);
  }

  return Array.from(usedIndices).map(idx => ({
    index: idx + 1,
    chunk_id: chunks[idx].id,
    document_id: chunks[idx].document_id,
    document_name: chunks[idx].document_name,
    section_header: chunks[idx].section_header,
    excerpt: chunks[idx].text.slice(0, 150) + '...',
    storage_url: null,
  }));
}
```

### 5.3 Chat Streaming API `[PRD §14]`

```typescript
// app/api/chat/stream/route.ts
import { createServerClient } from '@/lib/supabase/server';
import { hybridSearch } from '@/lib/search/hybrid';
import { streamChatAnswer, parseCitations } from '@/lib/ai/chat';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { query, session_id, workspace_id } = await request.json();
  if (!query?.trim()) return NextResponse.json({ error: 'Query is required' }, { status: 400 });

  // Get workspace if not provided
  let workspaceId = workspace_id;
  if (!workspaceId) {
    const { data: membership } = await supabase
      .from('workspace_members').select('workspace_id')
      .eq('user_id', session.user.id).single();
    workspaceId = membership?.workspace_id;
  }

  // Hybrid retrieval
  const chunks = await hybridSearch(query, workspaceId);

  // Check for open contradictions in retrieved chunks
  const chunkIds = chunks.map(c => c.id);
  const { data: contradictions } = await supabase
    .from('contradictions')
    .select('*, chunk_a:chunks!chunk_a_id(text, document_id), chunk_b:chunks!chunk_b_id(text, document_id)')
    .or(`chunk_a_id.in.(${chunkIds.join(',')}),chunk_b_id.in.(${chunkIds.join(',')})`)
    .eq('status', 'open')
    .in('severity', ['critical', 'warning'])
    .limit(1);

  const hasContradiction = (contradictions?.length ?? 0) > 0;
  const contradiction = contradictions?.[0];

  // Save user message
  let chatSessionId = session_id;
  if (!chatSessionId) {
    const { data: newSession } = await supabase.from('chat_sessions').insert({
      workspace_id: workspaceId,
      user_id: session.user.id,
      title: query.slice(0, 60),
    }).select().single();
    chatSessionId = newSession?.id;
  }

  await supabase.from('chat_messages').insert({
    session_id: chatSessionId,
    workspace_id: workspaceId,
    role: 'user',
    content: query,
  });

  // Stream response
  const encoder = new TextEncoder();
  let fullContent = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const contradictionData = contradiction ? {
          valueA: contradiction.value_a,
          docA: contradiction.document_a_id,
          valueB: contradiction.value_b,
          docB: contradiction.document_b_id,
        } : undefined;

        const generator = streamChatAnswer(query, chunks, hasContradiction, contradictionData);

        for await (const chunk of generator) {
          fullContent += chunk;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`));
        }

        // Parse and send citations
        const citations = parseCitations(fullContent, chunks);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'citations', citations })}\n\n`));

        // Save assistant message
        await supabase.from('chat_messages').insert({
          session_id: chatSessionId,
          workspace_id: workspaceId,
          role: 'assistant',
          content: fullContent,
          citations,
          had_contradiction: hasContradiction,
          contradiction_ids: contradiction ? [contradiction.id] : [],
        });

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', session_id: chatSessionId })}\n\n`));
        controller.close();
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Generation failed' })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

### Phase 5 Verification Gate ✓

- [ ] `POST /api/chat/stream` returns a streaming SSE response
- [ ] Response contains `[SOURCE N]` markers in the text
- [ ] `done` event includes a `session_id`
- [ ] Chat messages are written to `chat_messages` table after each exchange
- [ ] `match_chunks` SQL function exists and is callable from Supabase dashboard
- [ ] When contradicted chunks are in results, `had_contradiction: true` is saved on the message
- [ ] Sending a question about a topic not in any document returns "I couldn't find this..."

---

## Phase 6 — Contradiction Agent
**Day 3 PM | ~3 hours**  
**References:** PRD §6.3, §10.2, §10.3  
**Goal:** The background agent that scans every new document for contradictions, scores confidence, writes flags, and notifies admins.

---

### 6.1 Unit Normalizer

```typescript
// lib/contradiction/normalize.ts
const UNIT_TO_BASE: Record<string, number> = {
  g: 0.001, kg: 1, t: 1000, lb: 0.453,
  ml: 0.001, l: 1, fl_oz: 0.02957,
  mm: 0.001, cm: 0.01, m: 1, km: 1000, ft: 0.3048, in: 0.0254,
  day: 1, days: 1, week: 7, weeks: 7, month: 30, months: 30, year: 365,
};

export function normalizeToBase(amount: number, unit: string): number | null {
  const factor = UNIT_TO_BASE[unit.toLowerCase()];
  return factor !== undefined ? amount * factor : null;
}

export function valuesConflict(entityA: Record<string, unknown>, entityB: Record<string, unknown>): boolean {
  const normA = entityA.normalized_value as Record<string, unknown>;
  const normB = entityB.normalized_value as Record<string, unknown>;
  if (!normA || !normB) return false;

  if (typeof normA.amount === 'number' && typeof normB.amount === 'number') {
    const baseA = normalizeToBase(normA.amount as number, (normA.unit ?? '') as string);
    const baseB = normalizeToBase(normB.amount as number, (normB.unit ?? '') as string);

    // Same units after normalization — compare values
    if (baseA !== null && baseB !== null) {
      return Math.abs(baseA - baseB) / Math.max(baseA, baseB) > 0.01; // >1% difference
    }
    // Different unit types — not comparable
    return false;
  }

  if (typeof normA.amount === 'number' && typeof normB.amount === 'number') {
    return normA.amount !== normB.amount || normA.currency !== normB.currency;
  }

  // Policy rules — use string comparison (not identical = potential conflict)
  if (normA.rule && normB.rule) {
    return normA.rule !== normB.rule;
  }

  return false;
}

export function scopesOverlap(scopeA: string | null, scopeB: string | null): boolean {
  if (!scopeA || !scopeB) return true; // No scope = global = overlaps with everything
  const a = scopeA.toLowerCase();
  const b = scopeB.toLowerCase();

  // Simple disjoint region check
  const regions = [['eu', 'europe'], ['us', 'usa', 'united states', 'america'], ['uk', 'britain']];
  for (const region of regions) {
    const aInRegion = region.some(r => a.includes(r));
    const bInRegion = region.some(r => b.includes(r));
    if (aInRegion !== bInRegion) return false; // Different regions = no overlap
  }

  return true; // Default: assume overlap
}
```

### 6.2 Confidence Scorer

```typescript
// lib/contradiction/score.ts
import type { Entity } from '@/types/app.types';

interface ScoringInput {
  entityA: Entity;
  entityB: Entity;
  docACreatedAt: string;
  docBCreatedAt: string;
  scopeOverlap: boolean;
  valuesDiffer: boolean;
}

export function scoreContradiction(input: ScoringInput): number {
  let score = 0;

  // 1. Subject similarity (0.35 weight) — simplified string similarity
  const subjA = input.entityA.subject.toLowerCase();
  const subjB = input.entityB.subject.toLowerCase();
  const wordsA = new Set(subjA.split(/\s+/));
  const wordsB = new Set(subjB.split(/\s+/));
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  const jaccardSim = union.size > 0 ? intersection.size / union.size : 0;
  score += jaccardSim * 0.35;

  // 2. Value divergence (0.30 weight)
  score += (input.valuesDiffer ? 1.0 : 0.0) * 0.30;

  // 3. Scope collision (0.20 weight)
  score += (input.scopeOverlap ? 1.0 : 0.0) * 0.20;

  // 4. Temporal recency (0.15 weight) — penalize if docs are far apart in time
  const msA = new Date(input.docACreatedAt).getTime();
  const msB = new Date(input.docBCreatedAt).getTime();
  const ageDiffDays = Math.abs(msA - msB) / (1000 * 60 * 60 * 24);
  const temporalPenalty = ageDiffDays > 180 ? 0.3 : 0;
  score += (1 - temporalPenalty) * 0.15;

  return Math.min(Math.max(score, 0), 1);
}
```

### 6.3 Notification Creator

```typescript
// lib/contradiction/notify.ts
import { createServerClient } from '@/lib/supabase/server';

export async function createContradictionNotification(
  contradictionId: string,
  workspaceId: string
): Promise<void> {
  const supabase = createServerClient();

  // Find workspace admin to notify
  const { data: admin } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('role', 'admin')
    .single();

  if (!admin) return;

  await supabase.from('contradiction_notifications').insert({
    workspace_id: workspaceId,
    contradiction_id: contradictionId,
    notify_user_id: admin.user_id,
  });
}
```

### 6.4 Main Contradiction Agent `[PRD §6.3]`

```typescript
// lib/contradiction/agent.ts
import { createServerClient } from '@/lib/supabase/server';
import { valuesConflict, scopesOverlap } from './normalize';
import { scoreContradiction } from './score';
import { createContradictionNotification } from './notify';
import type { Entity } from '@/types/app.types';

export async function runContradictionScan(
  documentId: string,
  workspaceId: string,
  chunkIds: string[]
): Promise<void> {
  const supabase = createServerClient();

  // Fetch the new chunks with their entities
  const { data: newChunks } = await supabase
    .from('chunks')
    .select('id, entities, document_id')
    .in('id', chunkIds)
    .not('entities', 'eq', '[]');

  if (!newChunks?.length) return;

  // Get document creation date for temporal scoring
  const { data: newDoc } = await supabase
    .from('documents')
    .select('created_at')
    .eq('id', documentId)
    .single();

  for (const newChunk of newChunks) {
    const newEntities = (newChunk.entities as Entity[]).filter(e => e.confidence >= 0.6);
    if (!newEntities.length) continue;

    // Vector search for similar chunks (excluding this document)
    // Use simplified subject keyword matching for MVP
    for (const entity of newEntities) {
      const { data: candidates } = await supabase
        .from('chunks')
        .select(`id, entities, document_id,
                 documents!inner(id, created_at, workspace_id)`)
        .eq('documents.workspace_id', workspaceId)
        .neq('document_id', documentId)
        .not('entities', 'eq', '[]')
        .limit(50);

      if (!candidates?.length) continue;

      for (const candidate of candidates) {
        const candEntities = (candidate.entities as Entity[]);
        const matchingEntities = candEntities.filter(
          ce => ce.subject.toLowerCase().includes(entity.subject.toLowerCase().split(' ')[0])
            && ce.type === entity.type
            && ce.confidence >= 0.6
        );

        for (const matchEntity of matchingEntities) {
          const overlap = scopesOverlap(entity.scope, matchEntity.scope);
          if (!overlap) continue; // Scope disjoint — skip

          const differs = valuesConflict(
            entity as unknown as Record<string, unknown>,
            matchEntity as unknown as Record<string, unknown>
          );
          if (!differs) continue; // Same value — skip

          const candDoc = candidate.documents as unknown as { created_at: string };
          const confidence = scoreContradiction({
            entityA: entity,
            entityB: matchEntity,
            docACreatedAt: newDoc?.created_at ?? new Date().toISOString(),
            docBCreatedAt: candDoc.created_at,
            scopeOverlap: overlap,
            valuesDiffer: differs,
          });

          if (confidence < 0.50) continue; // Below threshold — suppress

          const severity = confidence >= 0.70 ? 'critical' : 'warning';

          // Insert contradiction (UNIQUE constraint prevents duplicates)
          const { data: contradiction } = await supabase
            .from('contradictions')
            .insert({
              workspace_id: workspaceId,
              chunk_a_id: newChunk.id,
              chunk_b_id: candidate.id,
              document_a_id: documentId,
              document_b_id: candidate.document_id,
              entity_subject: entity.subject,
              value_a: entity.value,
              value_b: matchEntity.value,
              contradiction_type: entity.type === 'QUANTITY' ? 'quantitative' : 'policy',
              confidence,
              severity,
              status: 'open',
            })
            .select('id')
            .single()
            .catch(() => ({ data: null })); // Ignore unique constraint violations

          if (contradiction?.data?.id && severity === 'critical') {
            await createContradictionNotification(contradiction.data.id, workspaceId);
          }
        }
      }
    }
  }
}
```

---

### Phase 6 Verification Gate ✓

- [ ] Upload two documents with a clear quantitative contradiction (e.g. "10kg" vs "50kg" for the same subject)
- [ ] After both uploads complete, a row appears in the `contradictions` table
- [ ] Contradiction has `severity: 'critical'` and `status: 'open'`
- [ ] A row appears in `contradiction_notifications` pointing to the admin user
- [ ] Upload a third document that does NOT contradict — no new contradiction row

---

## Phase 7 — Core UI Pages & Components
**Day 4 AM | ~4 hours**  
**References:** PRD §12, §13 · design.md §1–§14  
**Goal:** All main app pages built and styled — dashboard, documents list, document detail, and full chat interface with citations.

---

### 7.1 App Shell — Sidebar & Top Nav

**Sidebar** `components/layout/Sidebar.tsx`:
- Background: `--color-ink` (#141414)
- Width: 240px, fixed left, full height
- Top: fynqAI logo — "fynq" in Sora 500, "AI" in Cormorant italic, the "f" glyph in `--color-red`
- Navigation items: Dashboard, Chat, Documents, (Admin: Contradictions)
- Active indicator: `layoutId="nav-indicator"` red 2px left border (Framer Motion shared layout)
- Bottom: User email + sign out button
- Contradiction count badge on the "Contradictions" nav item — pulses when count changes
- Entrance animation: slides from left on mount `[design §13]`

```tsx
// Sidebar active indicator pattern [design §11]
<motion.div layoutId="nav-indicator"
  className="absolute left-0 top-0 bottom-0 w-[2px] bg-fynq-red"
  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
/>
```

**TopNav** `components/layout/TopNav.tsx`:
- Background: `--color-ink`, height 60px, border-bottom `--color-steel`
- Left: page title (passed as prop)
- Right: NotificationBell component + user avatar
- `NotificationBell`: bell icon (Lucide), red badge with open contradiction count

**Dashboard Layout** `app/dashboard/layout.tsx`:
- Flex row: Sidebar (240px fixed) + main content area
- Main content: has `--topnav-height` top padding, `--color-obsidian` background
- Red ambient glow at top of main content `[design §5]`
- `PageWrapper` wraps page content for transitions
- Wrap layout with React Query `QueryClientProvider`

### 7.2 Dashboard Home Page `app/dashboard/page.tsx`

Content:
- Heading: "Good morning, [first name]" in Sora h1, `--color-chalk`
- Stats row: 3 cards showing — Total Documents, Total Chunks, Open Contradictions
- Stats cards: `card-elevated`, number in large Cormorant, label in Sora caption
- Open Contradictions stat: if > 0, number is `--color-red`
- Recent Documents: last 5 uploaded, shows name, status badge, date
- Quick upload zone: drag-and-drop area `[design §12.5]`
- Animate: `staggerContainer` + `staggerItem` on the stats cards and document list `[design §8]`

### 7.3 Documents Page `app/documents/page.tsx`

Content:
- Page title: "Documents"
- Upload button (red, primary) → triggers upload flow
- Upload zone: draggable area, dashed border `--color-steel`, on drag-over border becomes `--color-red`
- Documents table/list: columns — Name, Type, Status, Chunks, Uploaded, Actions
- Status badge: uses `.badge-critical` styling pattern, colors per status:
  - `processing/chunking/embedding/extracting/scanning` → animated spinner + text
  - `ready` → green badge
  - `error` → red badge + error tooltip
- Processing progress: shows current stage with animated progress bar (red, pulse animation) `[design §13]`
- Real-time updates: subscribe to Supabase Realtime on `documents` table filtered by workspace
- Delete action: trash icon, confirm dialog, calls `DELETE /api/documents/:id`
- Empty state: centered illustration placeholder + "Upload your first document" CTA

**Document status progress bar** per processing document:
```tsx
// Progress percentage per status
const statusProgress = {
  processing: 10, chunking: 25, embedding: 50,
  extracting: 70, scanning: 85, ready: 100, error: 0,
};
```

### 7.4 Chat Interface

**Chat Layout** `app/chat/page.tsx` and `app/chat/[sessionId]/page.tsx`:

Left panel (full height chat area):
- Message list: scrollable, auto-scrolls to bottom on new message
- Each user message: right-aligned, `--color-carbon` background, Sora text
- Each AI message: left-aligned, no background, left border `--color-steel`
- AI messages animate in: `fadeUp` variant as they stream in `[design §8]`
- Streaming message: shows blinking red cursor (`.streaming-cursor`) while streaming `[design §11]`
- Citation chips: inline `[1]` `[2]` markers, `citation-chip` class, on hover turns red `[design §11]`
- Contradiction warning: if `had_contradiction: true`, shows warning banner above the message `[design §12.3]`

Contradiction warning banner:
```tsx
// [design §14] warning banner entrance animation
<motion.div
  initial={{ opacity: 0, scaleY: 0, originY: 0 }}
  animate={{ opacity: 1, scaleY: 1 }}
  transition={{ duration: 0.35, ease: [0.0, 0.0, 0.2, 1.0] }}
  className="card-contradiction p-4 mb-4"
>
  <span className="badge-critical mr-2">⚠ Conflict Detected</span>
  <p>Contradictory information found. Both versions shown above.</p>
</motion.div>
```

Citation panel (slides in from right when citation clicked):
- Shows document name, section header, full chunk text
- "View Document" link
- Close button

Chat input:
- Fixed bottom, full width, `--color-ink` background, border-top `--color-steel`
- Textarea: `.input-base`, auto-resize, Enter to send, Shift+Enter for newline
- Send button: red icon button, disabled when streaming
- Below input: "fynqAI answers from your documents only" — small muted text

Session sidebar (left, 200px):
- "New Chat" button (ghost)
- List of recent sessions (title, date)
- Active session highlighted with subtle background

### 7.5 Shared Components

**DocumentCard** `components/documents/DocumentCard.tsx`:
- `card-elevated` class
- `whileHover={{ y: -2, boxShadow: '...' }}` [design §11]
- Status badge, document name, file type icon, date, chunk count

**UploadZone** `components/documents/UploadZone.tsx`:
- Handles `dragover`, `dragleave`, `drop` events
- State machine: IDLE → DRAGGING → UPLOADING → PARSING → ... → READY / ERROR
- Calls `POST /api/ingest/upload` with FormData
- Polls `GET /api/ingest/status/:id` every 2 seconds OR uses Supabase Realtime
- Shows per-file progress with animated red progress bar

**CitationChip** `components/chat/CitationChip.tsx`:
- Inline `[N]` badge
- `whileHover` red background transition
- On click: opens CitationPanel

---

### Phase 7 Verification Gate ✓

- [ ] `/dashboard` renders with stats and recent documents
- [ ] Documents page shows all uploaded documents with correct status badges
- [ ] Uploading a file from the documents page shows real-time progress bar
- [ ] `/chat` renders, typing a question and pressing Enter sends the request
- [ ] AI response streams token by token with blinking red cursor
- [ ] After streaming, citation chips appear inline in the text
- [ ] Clicking a citation chip shows the source panel
- [ ] Sidebar nav active indicator animates when switching pages
- [ ] App background is `#0F0F0F` with noise texture visible

---

## Phase 8 — Admin Contradiction Dashboard
**Day 4 PM | ~3 hours**  
**References:** PRD §9.3, §12.4 · design.md §14  
**Goal:** Full admin workflow — contradictions list, side-by-side resolver, resolution with animations.

---

### 8.1 Contradictions API `[PRD §14]`

```typescript
// app/api/contradictions/route.ts
import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? 'open';
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '20');
  const offset = (page - 1) * limit;

  const { data: membership } = await supabase
    .from('workspace_members').select('workspace_id')
    .eq('user_id', session.user.id).single();
  if (!membership) return NextResponse.json({ error: 'No workspace' }, { status: 403 });

  const { data: contradictions, count } = await supabase
    .from('contradictions')
    .select(`*, document_a:documents!document_a_id(name, created_at),
              document_b:documents!document_b_id(name, created_at)`, { count: 'exact' })
    .eq('workspace_id', membership.workspace_id)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { count: openCount } = await supabase
    .from('contradictions')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', membership.workspace_id)
    .eq('status', 'open');

  return NextResponse.json({ contradictions, total: count, open_count: openCount });
}
```

```typescript
// app/api/contradictions/[id]/route.ts
import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: contradiction } = await supabase
    .from('contradictions')
    .select(`*,
      chunk_a:chunks!chunk_a_id(id, text, section_header,
        document:documents!document_id(id, name, source, created_at)),
      chunk_b:chunks!chunk_b_id(id, text, section_header,
        document:documents!document_id(id, name, source, created_at)),
      resolved_by_user:resolved_by(email)`)
    .eq('id', params.id)
    .single();

  if (!contradiction) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ contradiction });
}
```

```typescript
// app/api/contradictions/[id]/resolve/route.ts
import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, resolution_note } = await request.json();
  const validActions = ['mark_a', 'mark_b', 'dismiss'];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  // Get contradiction to find the authoritative chunk
  const { data: contradiction } = await supabase
    .from('contradictions').select('chunk_a_id, chunk_b_id')
    .eq('id', params.id).single();

  const authChunkId = action === 'mark_a' ? contradiction?.chunk_a_id
    : action === 'mark_b' ? contradiction?.chunk_b_id : null;

  await supabase.from('contradictions').update({
    status: action === 'dismiss' ? 'dismissed' : 'resolved',
    authoritative_chunk_id: authChunkId,
    resolution_note,
    resolved_by: session.user.id,
    resolved_at: new Date().toISOString(),
  }).eq('id', params.id);

  // Mark notifications as seen
  await supabase.from('contradiction_notifications')
    .update({ seen: true, seen_at: new Date().toISOString() })
    .eq('contradiction_id', params.id);

  return NextResponse.json({ contradiction_id: params.id, status: action === 'dismiss' ? 'dismissed' : 'resolved' });
}
```

### 8.2 Contradictions Dashboard Page `app/admin/contradictions/page.tsx`

Layout:
- Page title: "Contradictions" with open count badge in red
- Filter tabs: "Open" / "Resolved" / "Dismissed"
- Contradiction cards list: stagger in with `staggerContainer` + `staggerItem`

Each ContradictionCard `components/contradictions/ContradictionCard.tsx`:
- `card-contradiction` class for open critical ones
- Severity badge: `.badge-critical` or `.badge-warning-sev`
- Entity subject: large, `--color-chalk`
- Two-column mini preview: Doc A name + value / Doc B name + value — in JetBrains Mono
- Confidence percentage: `--color-ash`
- "Resolve" button (red) → navigates to `/admin/contradictions/:id`
- Entrance animation: `[design §14]` entrance + glow effect
- Real-time: subscribe to Supabase Realtime on `contradictions` channel — new cards appear automatically with pulse animation

### 8.3 Contradiction Resolver `app/admin/contradictions/[id]/page.tsx`

Layout `[PRD §12.4]`:
- Back button: "← Contradictions"
- Header: entity_subject as title, severity badge, confidence score
- AI Suggestion box: subtle card showing which document is newer and why it might be authoritative
- Side-by-side grid (2 columns):
  - Left: Document A — name, date, full chunk text with conflicting value **bolded**
  - Right: Document B — same layout
  - Use JetBrains Mono for chunk text
  - Conflicting value highlighted: `--color-red` text on `rgba(220,38,38,0.1)` background
- Resolution note textarea: `.input-base`, optional
- Resolution buttons:
  - "Mark A as Correct" — secondary button
  - "Mark B as Correct" — primary red button
  - "Dismiss" — ghost button
- On resolution:
  1. Card transitions to green border + background `[design §14]`
  2. After 800ms delay, redirects back to contradictions list
  3. Resolved card exits with `exitAfterResolve` animation

---

### Phase 8 Verification Gate ✓

- [ ] `/admin/contradictions` shows all open contradictions
- [ ] Each card shows: subject, both document names, both conflicting values, severity badge
- [ ] Clicking "Resolve" on a card opens the resolver page
- [ ] Resolver shows full chunk text for both documents side by side
- [ ] Conflicting values are visually highlighted in red
- [ ] Clicking "Mark B as Correct" transitions card to green then redirects after 800ms
- [ ] After resolution, same chat question gives a clean single answer
- [ ] Non-admin users cannot access `/admin/*` routes

---

## Phase 9 — Motion, Polish & Demo Preparation
**Day 5 | ~4 hours**  
**References:** design.md §7–§14 · PRD §18  
**Goal:** All design.md animations implemented, demo documents created, full demo flow rehearsed.

---

### 9.1 Implement All Outstanding Animations `[design §8–§14]`

Work through the design.md Implementation Checklist (§17) item by item:

**ScrollProgress bar** — add `<ScrollProgress />` to `app/dashboard/layout.tsx`

**Sidebar entrance animation on page load:**
```tsx
// Wrap sidebar div with:
<motion.div
  initial={{ x: -240, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
>
```

**Document cards stagger on documents page** — wrap list with `staggerContainer`, each card with `staggerItem` + `viewport={{ once: true, margin: "-80px" }}`

**Contradiction card entrance + glow** `[design §14]`:
```tsx
<motion.div
  variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
  initial="hidden" animate="visible"
  transition={{ duration: 0.4, ease: [0.0, 0.0, 0.2, 1.0] }}
  onAnimationComplete={() => {
    // Trigger glow pulse once
    controls.start({ boxShadow: ['0 0 0px rgba(220,38,38,0)', '0 0 24px rgba(220,38,38,0.3)', '0 0 8px rgba(220,38,38,0.15)'] });
  }}
>
```

**Resolution green transition** `[design §14]`:
```tsx
// On resolution click:
await controls.start({
  borderColor: 'rgba(22,163,74,0.3)',
  backgroundColor: '#0A1A0F',
  transition: { duration: 0.5 }
});
await new Promise(r => setTimeout(r, 800));
router.push('/admin/contradictions');
```

**Contradiction badge pulse** on count change `[design §11]`:
```tsx
<motion.span
  key={count}  // re-animates when count changes
  initial={{ scale: 1.4, opacity: 0.6 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
>
```

**All buttons** — add `whileHover={{ scale: 1.02, y: -1 }}` and `whileTap={{ scale: 0.98 }}` to every `<motion.button>`

**Reduced motion guard** on all animations `[design §17]`:
```tsx
const shouldReduce = useReducedMotion();
// Add to every animation: if shouldReduce, use { opacity: 0 } / { opacity: 1 } only
```

### 9.2 Red Ambient Glow `[design §5]`

Add to `app/dashboard/layout.tsx` main content area:
```tsx
{/* Red ambient glow — top of content */}
<div
  className="fixed pointer-events-none z-0"
  style={{
    top: 0,
    left: 'var(--sidebar-width)',
    right: 0,
    height: '600px',
    background: 'radial-gradient(ellipse at 50% -10%, rgba(220,38,38,0.07) 0%, transparent 65%)',
  }}
  aria-hidden
/>
```

### 9.3 Final Polish Checklist `[design §17]`

Apply these before demo, checking each off:

**Typography:**
- [ ] Hero / dashboard welcome text uses Cormorant Garamond
- [ ] All UI labels use Sora
- [ ] Citations, entity values, contradiction value comparisons use JetBrains Mono

**Colors:**
- [ ] Body text is `--color-mist` (#C2C2C2) — NOT pure white
- [ ] Red only appears in the 7 approved contexts from design.md (logo, contradiction badges/cards, error states, CTA buttons, warning banner, notification count, critical interaction cues)
- [ ] No decorative purple/blue accents; keep blue limited to semantic info states only
- [ ] Card backgrounds use `--color-carbon` not flat black

**Custom scrollbar:** verify the 6px dark scrollbar is visible in Chrome

**Input red caret:** verify `caret-color: var(--color-red)` on all inputs

**Streaming cursor:** verify blinking red cursor appears while AI is streaming

### 9.4 Create Demo Documents `[PRD §18]`

Create these 4 files and upload them through the app UI to seed the demo contradictions:

**File 1: `supplier-agreement.pdf`**
Create a 2-page PDF with realistic content. Must contain this exact text in a "Delivery Terms" section:
> "All domestic orders have a minimum order weight of 10kg. Orders below this threshold will incur a surcharge of $15 per shipment."

**File 2: `operations-manual.docx`**
Create a Word document with an "Order Requirements" section containing:
> "Bulk domestic orders require a minimum order weight of 50kg per shipment. This applies to all standard delivery routes."

**File 3: `refund-policy.pdf`**
Create a PDF with a "Returns & Refunds" section containing:
> "Customers may request a full refund within 30 days of confirmed delivery. Requests must be submitted via the customer portal."

**File 4: `support-guidelines.docx`**
Create a Word document with a "Support Process" section containing:
> "Refund requests are accepted within 14 days of delivery only. After 14 days, store credit may be offered at management discretion."

Upload all 4 in this order: File 1 → File 2 → File 3 → File 4. Two contradictions should appear automatically.

### 9.5 The 5-Minute Demo Script `[PRD §18]`

Rehearse this flow until it takes exactly 5 minutes:

```
[0:00] Open the app, show the dashboard
Say: "This is fynqAI — your company's AI intelligence layer.
      Every answer cited. Every conflict caught."

[0:30] Show the Documents page with 4 pre-loaded documents
Say: "We've connected our supplier agreement, operations manual,
      refund policy, and support guidelines."

[1:00] Point to the sidebar: ⚠ 2 Contradictions badge (red)
Say: "The moment these documents were uploaded, fynqAI found
      something your team has probably never noticed."

[1:30] Go to Admin → Contradictions
Show the two contradiction cards — minimum order weight + refund window
Say: "Two direct conflicts. One says 10kg minimum. Another says 50kg.
      One says 30-day refunds. Another says 14 days."

[2:00] Go to Chat. Ask: "What is the minimum order weight?"
Watch the AI surface BOTH answers with the red warning banner
Say: "Instead of confidently answering wrong, fynqAI shows you
      the conflict and refuses to guess."

[3:00] Go back to Admin → click the order weight contradiction
Show the side-by-side resolver
Click "Mark B as Correct" (operations manual)
Add note: "Operations manual (2024) supersedes supplier agreement"
Watch the green resolution animation

[3:45] Go back to Chat. Ask the SAME question again
AI now gives a clean single answer with citation to operations manual
Say: "Resolved. The AI now knows the truth. And there's a full
      audit trail of who fixed it and why."

[4:30] Ask a second question: "What is our refund window?"
Shows the second contradiction — 30 days vs 14 days — still open
Say: "This conflict is still open. fynqAI won't give a confident
      wrong answer — it waits for you to decide."

[5:00] Summary:
"This is what sets fynqAI apart. It's not just retrieval.
 It's an AI that knows when it doesn't know —
 and makes sure the humans in the loop stay in control."
```

### 9.6 Pre-Demo Technical Checklist

Run through this the morning of the demo:

- [ ] `npm run build` completes with no errors
- [ ] All 4 demo documents are uploaded and show `ready` status
- [ ] At least 2 contradictions appear in `/admin/contradictions`
- [ ] Chat question "minimum order weight" triggers contradiction warning
- [ ] Chat question "refund window" triggers contradiction warning
- [ ] Resolving a contradiction changes subsequent chat answers
- [ ] No console errors in browser devtools
- [ ] All animations play smoothly (60fps, no jank)
- [ ] Page loads in < 3 seconds on a fast connection
- [ ] Supabase free tier limits not hit (check dashboard usage)

---

## Summary — Full Build Timeline

```
Day 1 AM  │ Phase 0: Project setup, deps, file structure, env vars
Day 1 PM  │ Phase 1: Design system, CSS variables, fonts, motion utilities
Day 2 AM  │ Phase 2: Auth (login/signup/OAuth/callback/middleware)
          │ Phase 3: Database SQL, storage buckets, RLS policies
Day 2 PM  │ Phase 4: Ingestion pipeline (parse → chunk → embed → extract)
Day 3 AM  │ Phase 5: Query layer, chat API, SSE streaming
Day 3 PM  │ Phase 6: Contradiction agent (score, normalize, notify)
Day 4 AM  │ Phase 7: UI pages (dashboard, documents, chat)
Day 4 PM  │ Phase 8: Admin contradiction dashboard + resolver
Day 5     │ Phase 9: All animations, demo documents, rehearsal
```

---

## Critical Rules for Antigravity

1. **Do not skip phases.** Each phase depends on the previous. Verify gates before advancing.
2. **Keep PRD.md and design.md open alongside this file** when prompting Antigravity.
3. **One phase per Antigravity session.** Start each session by pasting the full phase block.
4. **Database SQL first.** If anything in Phase 3 fails, nothing in Phases 4–9 will work.
5. **Test with real API keys.** All AI calls (Mistral, Gemini, LlamaParse) require valid keys to work. Free tiers are sufficient.
6. **Red rule is absolute.** If any component adds red as decoration, remove it immediately.
7. **No white backgrounds.** If any page renders white, the CSS variables are not loading.

---

*End of Development Phases — fynqAI v1.0*
