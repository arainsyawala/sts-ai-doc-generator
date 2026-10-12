# Product Requirements Document (PRD)

## 1. Product Overview
**AI Document Generator** is a web application that automates data extraction from Indonesian business documents (Invoice, Purchase Order, Berita Acara, Penawaran) using AI vision and allows users to generate standardized PDFs from the extracted data.

## 2. Problem Statement
Manually entering data from physical or image-based business documents is time-consuming and error-prone. There is a need for an automated solution to extract this data and convert it into standardized PDF formats.

## 3. Goals
- Provide an easy-to-use dashboard for document image uploads.
- Automatically extract key document fields and line items using AI.
- Allow users to review and edit extracted data before finalizing.
- Generate high-quality A4 PDFs using HTML templates.

## 4. Users and Actors
- **End User / Admin:** Uploads documents, verifies extracted data, and generates PDFs.

## 5. User Journeys
1. User navigates to the dashboard.
2. User uploads an image of a business document.
3. System processes the image via AI and extracts data.
4. User reviews the extracted data in a form and makes any necessary corrections.
5. User clicks "Generate PDF Document".
6. System compiles an HTML template with the data and downloads a generated PDF.

## 6. Functional Requirements
- **FR-001:** The system shall allow users to upload images.
- **FR-002:** The system shall extract `docType`, `docNumber`, `date`, `clientName`, `totalAmount`, and `items` from the image.
- **FR-003:** The system shall present the extracted data in an editable form.
- **FR-004:** The system shall generate a PDF based on the selected document type and the form data.

## 7. Business Rules
- **BR-001:** Prices and quantities must be strictly numeric.
- **BR-002:** Unidentified fields should be left blank or set to 0.
- **BR-003:** Supported document types are limited to: INVOICE, PO, BERITA_ACARA, PENAWARAN.

## 8. Data / Domain Requirements
- **Clients:** `id`, `name`, `address`, `tax_id`
- **Templates:** `id`, `doc_type`, `name`, `html_content`
- **Documents:** `id`, `client_id`, `doc_type`, `doc_number`, `total_amount`, `metadata_json`, `created_at`

## 9. Integration Requirements
- **Vercel AI SDK:** Used for Vision AI extraction (Image to JSON).
- **Supabase:** Used for persistent storage of clients, templates, and documents.
- **Puppeteer-core:** Used to render HTML templates into PDFs.

## 10. Acceptance Criteria
- Uploading a valid image returns a populated form within a reasonable timeframe.
- The form allows manual correction of all fields.
- Submitting the form downloads a properly formatted PDF matching the chosen document type.
