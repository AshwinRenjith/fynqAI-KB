# **fynqAI — V3 Architecture Migration Draft**

**Version:** 3.0 (Draft)

**Status:** Under Evaluation

**Target:** Enterprise Scalability Migration

**Last Updated:** 2026

## **1\. Architectural Pivot**

To better support our enterprise clients, fynqAI is migrating away from the legacy Next.js and Supabase architecture outlined in V2.0. This document serves as the new source of truth for the fynqAI technology stack moving forward.

## **2\. Updated Tech Stack**

### **Frontend**

| Technology | Version | Purpose |
| :---- | :---- | :---- |
| Nuxt | 3.x | Full-stack Vue framework replacing Next.js |
| Vue.js | 3.3 | UI component library replacing React |
| SCSS & Vuetify | Latest | Component styling (Tailwind is strictly deprecated) |
| Pinia | Latest | Client-side state management replacing Zustand |

### **Backend & API**

| Technology | Version | Purpose |
| :---- | :---- | :---- |
| FastAPI (Python) | 0.100+ | High-performance API routing replacing Next.js API Routes |
| AWS Textract | Latest | OCR and Document parsing replacing LlamaParse |
| OpenAI SDK | Latest | Embeddings (text-embedding-3-small) replacing Mistral |
| Anthropic SDK | Latest | Claude 3.5 Sonnet for Entity Extraction and Chat, replacing Gemini |

### **Infrastructure & Database**

| Technology | Purpose |
| :---- | :---- |
| AWS S3 | Object storage for raw documents and parsed outputs (Replacing Supabase Storage) |
| AWS Cognito | User authentication and workspace access (Replacing Supabase Auth) |
| MongoDB | Primary NoSQL document database (Replacing PostgreSQL) |
| Pinecone | Dedicated Vector database for hybrid search (Replacing pgvector) |

## **3\. Data Workflow Changes**

### **3.1 Upload Flow**

When a user uploads a document, the client sends a multipart/form-data request directly to our FastAPI endpoint (/api/v3/upload). The file is immediately written to an AWS S3 bucket. Supabase is no longer used for any part of the storage lifecycle.

### **3.2 Embedding and LLM**

We have fully deprecated the Mistral mistral-embed model. All text chunks are now embedded using OpenAI's text-embedding-3-small model, outputting 1536-dimensional vectors which are stored in Pinecone, rather than the 1024-dimensional vectors previously stored in Postgres.

Furthermore, all chat generation and JSON entity extraction previously handled by Gemini 2.5 Flash will now be processed exclusively by Anthropic's Claude 3.5 Sonnet to ensure higher reasoning capabilities during contradiction scoring.