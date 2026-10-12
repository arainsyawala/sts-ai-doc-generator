# Project Name: AI Document Generator
# Core Features: Image-to-JSON Data Extraction & PDF Generation from HTML Templates
# Supported Documents: Invoice, Purchase Order (PO), Berita Acara, Penawaran (Quotation).
# Tech Stack: Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn UI, Supabase, Vercel AI SDK, Zod, Puppeteer, Handlebars.

You are an autonomous AI software engineer. Execute these phases sequentially. DO NOT skip any steps. Run terminal commands for setups/installs before writing code. Pause and ask for my confirmation after completing each Phase.

## Phase 1: Project Initialization & UI Setup
1. Initialize a Next.js project with App Router, TypeScript, and Tailwind CSS.
2. Install Core Dependencies: `npm i @supabase/supabase-js ai @ai-sdk/openai zod react-hook-form @hookform/resolvers @hookform/resolvers/zod puppeteer-core handlebars`
3. Initialize Shadcn UI (`npx shadcn-ui@latest init` with default style, slate color, and CSS variables).
4. Add Shadcn components: `npx shadcn-ui@latest add button form input select table card label`.
5. Create `.env.local` placeholder for `OPENAI_API_KEY` (or ANTHROPIC_API_KEY) and Supabase credentials.

## Phase 2: Database Schemas & Types
1. Create `schema.sql` at the root for Supabase. Tables needed: 
   - `clients`: id, name, address, tax_id
   - `templates`: id, doc_type, name, html_content
   - `documents`: id, client_id, doc_type, doc_number, total_amount, metadata_json (JSONB for items), created_at
2. Create `src/lib/schema/index.ts` and define Zod schemas for the database.
3. Define the AI Extraction Schema: `ExtractedDocumentSchema` using Zod.
   - `docType`: z.enum(['INVOICE', 'PO', 'BERITA_ACARA', 'PENAWARAN'])
   - `docNumber`: z.string()
   - `date`: z.string()
   - `clientName`: z.string()
   - `totalAmount`: z.number()
   - `items`: z.array(z.object({ description: z.string(), qty: z.number(), unitPrice: z.number(), subTotal: z.number() }))

## Phase 3: AI Vision Extraction API (Image to JSON)
1. Create `src/app/api/extract/route.ts` (POST).
2. The endpoint must accept `multipart/form-data` containing an image file.
3. Convert the image to base64 or a buffer to pass to the Vercel AI SDK.
4. Use `generateObject` with `ExtractedDocumentSchema`.
5. System Prompt for AI: "You are an expert data extractor for Indonesian business documents. Analyze the uploaded image and extract the data into the requested JSON schema. Identify if the document is an INVOICE, PO (Purchase Order), BERITA_ACARA, or PENAWARAN (Quotation). Ensure prices and quantities are strictly numeric. If a field is not found, leave it blank or 0."

## Phase 4: Frontend UI (The Dashboard)
1. Build `src/app/dashboard/page.tsx`. Use a Client Component (`"use client"`).
2. Layout: Split screen or two main cards.
3. Card 1 (Upload): Include a drag-and-drop input or file upload button for the image. Add a loading spinner state while waiting for the `/api/extract` response.
4. Card 2 (Edit & Generate): 
   - Once AI returns the JSON, populate a `react-hook-form` connected to the Zod schema.
   - Allow the user to manually edit `docNumber`, `clientName`, `totalAmount`, and the `items` array.
   - Add a dropdown (Select) to choose the Document Type (Invoice, PO, Berita Acara, Penawaran).
   - Add a submit button "Generate PDF Document" that posts the validated form data to the PDF API.

## Phase 5: Template Engine & PDF Generation API
1. Create a dummy HTML template folder: `src/templates`. Create 4 basic HTML files: `invoice.html`, `po.html`, `berita-acara.html`, `penawaran.html`. Include Handlebars placeholders like `{{docNumber}}`, `{{clientName}}`, and `{{#each items}}...{{/each}}`.
2. Create `src/app/api/generate-pdf/route.ts` (POST).
3. The endpoint receives the JSON data from Phase 4.
4. Logic: Read the appropriate HTML file from `src/templates` based on the `docType`.
5. Compile the HTML string using Handlebars (`Handlebars.compile(templateStr)(jsonData)`).
6. Use `puppeteer-core` (or `puppeteer`) to launch a headless browser. Use `page.setContent(compiledHtml)` and `page.pdf({ format: 'A4', printBackground: true })`.
7. Return the PDF buffer with header `Content-Type: application/pdf` so the browser prompts a download.