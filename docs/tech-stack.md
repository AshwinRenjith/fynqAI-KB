## 7. Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16 (App Router) | Full-stack React framework |
| React | 19 | UI component library |
| TypeScript | 5.x | Type safety throughout |
| TailwindCSS | 4.x | Utility-first styling |
| shadcn/ui | Latest | Pre-built accessible components |
| Framer Motion | Latest | Animations and transitions |
| Zustand | Latest | Client-side state management |
| React Query (TanStack) | Latest | Server state, caching, polling |
| Lucide React | Latest | Icon library |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Next.js API Routes | 16 | API endpoints |
| Supabase JS Client | Latest | Database, auth, storage, realtime |
| Mistral AI SDK | Latest | Embeddings (mistral-embed model) |
| Google Generative AI SDK | Latest | Gemini 2.5 Flash — entity extraction + chat answers |
| LlamaParse | API | PDF-to-Markdown conversion (primary parser) |
| mammoth | Latest | DOCX-to-HTML-to-Markdown |

### Infrastructure
| Technology | Purpose |
|---|---|
| Supabase | Database (PostgreSQL + pgvector), Auth, Storage, Realtime |
| Vercel | Frontend + API deployment |
| Supabase Storage | Raw files + parsed Markdown files |

### Database
| Technology | Purpose |
|---|---|
| PostgreSQL 15 | Primary relational database |
| pgvector | Vector similarity search extension |
| Full-text search (tsvector) | Keyword search on chunks |

---
