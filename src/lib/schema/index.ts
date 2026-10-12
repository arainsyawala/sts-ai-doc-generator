import { z } from 'zod';

// Specification item (key-value pair, e.g. "Type": "NS-55A-70")
export const SpecItemSchema = z.object({
  label: z.string(),
  value: z.string(),
});
export type SpecItem = z.infer<typeof SpecItemSchema>;

// Sub component (e.g. "Centrifugal Fan", "Dust Collector")
export const SubComponentSchema = z.object({
  name: z.string(),
  qty: z.string(),
  specs: z.array(SpecItemSchema),
});
export type SubComponent = z.infer<typeof SubComponentSchema>;

// Document Item Schema (fully defined for Groq strict JSON schema compliance)
export const DocumentItemSchema = z.object({
  itemNo: z.string(),
  description: z.string(),
  specification: z.string(),
  subComponents: z.array(SubComponentSchema),
  qty: z.string(),
  unitPrice: z.number(),
  subTotal: z.number(),
});
export type DocumentItem = z.infer<typeof DocumentItemSchema>;

// AI Extraction & Document Schema
export const ExtractedDocumentSchema = z.object({
  docType: z.enum(['INVOICE', 'PO', 'BERITA_ACARA', 'PENAWARAN']),
  docNumber: z.string(),
  date: z.string(),
  clientName: z.string(),
  totalAmount: z.number(),
  items: z.array(DocumentItemSchema),

  // Quotation (Penawaran) specific fields
  titleQuotation: z.string(),
  clientAttn: z.string(),
  clientPhone: z.string(),
  clientEmail: z.string(),
  clientCc: z.string(),
  note: z.string(),
  leadTime: z.string(),
  paymentTerms: z.string(),
  nonPpn: z.boolean(),

  // Invoice & General metadata fields
  poNumber: z.string(),
  terbilang: z.string(),
  downPayment: z.number(),
  remainingPayment: z.number(),
});

export type ExtractedDocument = z.infer<typeof ExtractedDocumentSchema>;

// Database Schemas (for client-side validation / general types)
export const ClientSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: z.string().optional().nullable(),
  tax_id: z.string().optional().nullable(),
  created_at: z.string(),
});

export type Client = z.infer<typeof ClientSchema>;

export const TemplateSchema = z.object({
  id: z.string().uuid(),
  doc_type: z.string(),
  name: z.string(),
  html_content: z.string(),
  created_at: z.string(),
});

export type Template = z.infer<typeof TemplateSchema>;

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid().optional().nullable(),
  doc_type: z.string(),
  doc_number: z.string(),
  total_amount: z.number(),
  metadata_json: z.any(),
  created_at: z.string(),
});

export type Document = z.infer<typeof DocumentSchema>;
