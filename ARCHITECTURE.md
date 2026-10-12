# Architecture

## 1. Executive Summary & Tech Stack
The **AI Document Generator** is a full-stack web application built on Next.js.
- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Shadcn UI.
- **State & Forms:** React Hook Form, Zod.
- **Backend (API):** Next.js Route Handlers.
- **Database:** Supabase (PostgreSQL).
- **AI Integration:** Vercel AI SDK (with OpenAI/Anthropic).
- **PDF Generation:** Handlebars (templating) and Puppeteer-core (headless browser PDF generation).

## 2. End-to-End Architecture
- **Client Layer:** A React dashboard where users upload images and review data.
- **API Layer:** 
  - `POST /api/extract`: Receives an image, calls the Vercel AI SDK, and returns structured JSON.
  - `POST /api/generate-pdf`: Receives JSON data, merges it with Handlebars templates, runs Puppeteer, and returns a PDF buffer.
- **Data Layer:** Supabase tables to store historical records of clients, templates, and documents.

## 3. Module Boundaries
- `src/app/dashboard`: Frontend UI.
- `src/app/api/extract`: AI Vision integration.
- `src/app/api/generate-pdf`: Templating and PDF generation.
- `src/lib/schema`: Zod schemas for validation and AI structure.
- `src/templates`: HTML templates for different document types.

## 4. Known Technical Risks
- **Puppeteer on Vercel:** Deploying Puppeteer on serverless environments (like Vercel) often requires specific configurations (e.g., `@sparticuz/chromium`). This will need to be addressed during deployment, but `puppeteer-core` or `puppeteer` is a good start for local development.
- **AI Extraction Accuracy:** Vision models may occasionally hallucinate or miss fields. The human-in-the-loop (editable form) mitigates this risk.
