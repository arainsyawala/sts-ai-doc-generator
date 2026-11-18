import { NextResponse } from 'next/server';
import { generateObject, generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { ExtractedDocumentSchema } from '@/lib/schema';
import sharp from 'sharp';

export async function POST(req: Request) {
  try {
    let text = '';
    let imageBuffer: Buffer | null = null;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      text = body.text?.trim() || '';
      if (body.image) {
        const base64Data = body.image.replace(/^data:image\/\w+;base64,/, '');
        imageBuffer = Buffer.from(base64Data, 'base64');
      }
    } else {
      const formData = await req.formData();
      const textParam = formData.get('text') as string | null;
      if (textParam) {
        text = textParam.trim();
      }
      const fileParam = formData.get('file') as File | null;
      if (fileParam && fileParam.size > 0) {
        const bytes = await fileParam.arrayBuffer();
        imageBuffer = Buffer.from(bytes);
      }
    }

    // Step 1: If an image is provided, use Groq Multimodal Vision (Qwen) to visually read handwriting & tables
    if (imageBuffer && imageBuffer.length > 0) {
      try {
        console.log('Extract: Processing image with sharp auto-orient and Groq Vision AI (Qwen)...');
        
        // Auto-orient based on EXIF
        try {
          imageBuffer = await sharp(imageBuffer).rotate().toBuffer();
        } catch (orientErr) {
          console.warn('Sharp auto-orient skipped:', orientErr);
        }

        const visionPrompt = `You are a precision OCR expert for Indonesian industrial engineering documents, handwritten workshop job sheets, client Purchase Orders, and quotations.
Transcribe all text, handwritten notes, tables, numbers, prices, specifications, and headers verbatim.
Important guidelines:
- Capture headers: Company name (e.g. PT SHINANOA Indonesia, PT. GUNTUR BERKAT UTAMA, PT. ARTA INDOASIA), Contact person (Bp. DIDU, Bp. ARIP, Ito Takayuki), and "Judul : ..." or Document Type.
- For Purchase Orders (PO):
  * Capture Document Title (e.g. "Purchase Order").
  * PO No (e.g. "2026/SNI/XI/2292").
  * Date (e.g. "18 Nov 2026").
  * To / Vendor: "SURYA TERANG SEJAHTERA, CV", Attn: "Mr. Agus Jumadi".
  * Buyer / Client Company Header: "PT SHINANOA Indonesia", Address: "JL. Kenari Raya Blok D No. 06 Delta Commercial Park 2 Kawasan Industri Delta Silicon 6 Lippo Cikarang Jayamukti Kab. Bekasi Jawa Barat 17530", Telp/Fax.
  * Payment terms / Term (e.g. "Net 30").
- Pay strict attention to table column boundaries: | No / Item | DESCRIPTION | SPECIFICATION | QTY ORDER / QTY | UNIT PRICE | AMOUNT |
- For rows with specifications (e.g. "Control Box Burner Eclips Small Part Area", SPEC: "STS/SPH/SSG/036/10/2026", QTY: "1 Set", PRICE: "IDR 43.000.000", AMOUNT: "43.000.000").
- Rows without prices: preserve them (e.g. "CLEANING KIPAS", "BALANCING").
- Sub Total, Discount, PPN, and TOTAL.
Output the transcription as clear text and markdown table.`;

        const callVision = async (buf: Buffer) => {
          return await generateText({
            model: groq('qwen/qwen3.8-27b'),
            maxOutputTokens: 800,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: visionPrompt },
                  { type: 'image', image: buf },
                ],
              },
            ],
          });
        };

        let visionResult = await callVision(imageBuffer);
        let transcribed = visionResult.text?.trim() || '';

        // If transcribed text is too short or doesn't find expected keywords, try rotating 270 deg (counter-clockwise 90 deg)
        // because handwritten notes are very commonly photographed sideways in portrait phone orientation.
        const looksIncomplete = transcribed.length < 35 || (!transcribed.toLowerCase().includes('pt') && !transcribed.toLowerCase().includes('judul') && !transcribed.toLowerCase().includes('bp'));
        
        if (looksIncomplete) {
          console.log('Extract: Initial orientation result seems sparse, attempting 270-degree rotation...');
          try {
            const rot270Buffer = await sharp(imageBuffer).rotate(270).toBuffer();
            const rotResult = await callVision(rot270Buffer);
            const rotText = rotResult.text?.trim() || '';
            if (rotText.length > transcribed.length) {
              console.log('Extract: 270-degree rotation yielded superior transcription!');
              transcribed = rotText;
              imageBuffer = rot270Buffer;
            }
          } catch (rotErr) {
            console.warn('Rotation 270 check error:', rotErr);
          }
        }

        if (transcribed.length > 10) {
          console.log('Extract: Vision AI transcription success:\n', transcribed);
          text = transcribed;
        }
      } catch (visionErr: any) {
        console.error('Vision AI transcription failed:', visionErr);
        if (!text) {
          return NextResponse.json({
            error: 'Gagal membaca gambar dengan Vision AI',
            details: visionErr?.message || String(visionErr),
          }, { status: 400 });
        }
      }
    }

    if (!text) {
      return NextResponse.json({
        error: 'No readable document text or image provided.',
      }, { status: 400 });
    }

    const systemPrompt = `You are an elite Indonesian Industrial Engineering Estimator & AI Document Specialist for CV. Surya Terang Sejahtera.
Extract structured document data strictly matching the requested schema.
You MUST accurately support:
1. Handwritten workshop memos, job sheets, and quotation drafts ("coret-coretan atasan", e.g. PT. Arta Indoasia repair jobs, Ibu Giacinta, Bp. Joko).
2. WhatsApp / Chat screenshots & informal chat requests (e.g., "Ada yg mau nyewa tempat di bengkel... tolong buatin penawarannya", "Harga 10jt dalam 1bulan", "Pt tigori mitra asasta", "BP. AAN TIGORI").
3. Formal printed quotations, spec-sheets, and invoices (e.g. Dust Collector multi-assemblies).
4. Official Client Purchase Orders (PO) issued to CV. SURYA TERANG SEJAHTERA (e.g. PT SHINANOA Indonesia, PT MMID, PT Profiklin) to generate an INVOICE directly.

CRITICAL RULES FOR EXTRACTION:

1. CONTACT PERSON, CLIENT & HEADER DETAILS:
   - FOR CLIENT PURCHASE ORDERS (PO) ADDRESSED TO "SURYA TERANG SEJAHTERA, CV":
     * 'docType': Set to "INVOICE" so the user can immediately generate an invoice for the client based on this PO!
     * 'clientName': The client/buyer company who issued the PO (e.g. "PT. SHINANOA Indonesia" from the logo/header, NOT CV. Surya Terang Sejahtera!).
     * 'clientAddress': The full address of the client company (e.g. "JL. Kenari Raya Blok D No. 06, Delta Commercial Park 2, Kawasan Industri Delta Silicon 6, Lippo Cikarang, Jayamukti, Kab. Bekasi, Jawa Barat 17530").
     * 'poNumber': The PO Number (e.g. "2026/SNI/XI/2292").
     * 'date': The PO date (e.g. "18 November 2026").
     * 'docNumber': If there is a reference quotation number in SPECIFICATION (e.g. "STS/SPH/SSG/036/10/2026"), format the invoice number appropriately (e.g. "036/STS/INV/XI/2026").
     * 'titleQuotation': The primary description/job name (e.g. "Control Box Burner Eclips Small Part Area").
     * 'paymentTerms': Payment term from PO (e.g. "Net 30").
   - FOR OTHER DOCUMENTS (QUOTATIONS, HANDWRITTEN MEMOS, CHATS):
     * 'clientName': Client company or institution name (e.g. "PT. ARTA INDOASIA" -> "PT. Arta Indoasia", "PT Tigori Mitra Asasta"). Normalize casing cleanly.
     * 'clientAttn': Contact person name. Check for "Attn : ...", "Ditujukan kepada : ...", "Kepada Yth : ...", "Bp. [Name]" (e.g. "Bp. ARIP" -> "Bp. Arip", "BP. AAN TIGORI" -> "Bp. Aan"), or "Ibu [Name]" (e.g. "IBU : GIA CINTA" -> "Ibu Giacinta").
     * 'titleQuotation': Project or quotation title. Look for "Judul : ...", "Subject : ...", or project heading (e.g. "Judul : REPAIR. IMPELLER SIROCO DIAMETER 630" -> "Repair Impeller Siroco Diameter 630", "Penyewaan Tempat Workshop", "Buat baru DUST COLLECTOR UNIT DUCTING & HOOD"). Set docType = "PENAWARAN".
     * 'docNumber': Official document number if present, else "".
     * 'date': Formal Indonesian date if written in memo. If absent or only a camera watermark timestamp (e.g. orange corner digits like 2026/11/05 14:57), use today's date formatted in formal Indonesian (e.g. "05 November 2026"). NEVER output camera timestamps like "2026/11/05 14:57"!
   - 'clientCc': CC / Tembusan. ONLY extract if explicitly written in the document (e.g. "CC : ..."). If not present, ALWAYS set as empty string "" or "-". NEVER invent or hallucinate names!
   - 'leadTime': Delivery schedule or procurement duration (e.g. "1-2 Minggu", "1 Bulan").
   - 'paymentTerms': Payment terms (e.g. "40% DP\\n60% setelah selesai", "100% Pembayaran Setelah Selesai", "100% Pembayaran di Muka").
   - 'note': Notes on delivery location or scope. (IMPORTANT: For workshop rental, ONLY state "Penyewaan area kerja / workshop" - NEVER write "utilitas"!).
   - 'includeBriAccount': Boolean flag. Set to true only if BRI / Bank BRI is requested, otherwise false.
   - 'includeLeadTime': Boolean flag. Set to true if delivery schedule/procurement duration is mentioned in document/notes, otherwise false.
   - 'includeNote': Boolean flag. Set to true if special notes or terms are mentioned in document/notes, otherwise false.

2. ITEMS & EQUIPMENT EXTRACTION:
   - Separate 'description' and 'specification' accurately based on table columns:
     * 'description': Text in the DESCRIPTION column (e.g. "IMPELER / KIPAS" -> "Impeller / Kipas").
     * 'specification': Text in the SPECIFICATION column (e.g. "TYPE SIROCO ∅ 630"). Do NOT concatenate specification into description!
     * 'qty': Quantity for the item (e.g. "1 Unit", "1 Pcs", or "1 Set").
     * 'unitPrice': Unit price in Rupiah as a number (e.g. 5750000). If empty/blank, leave as 0.
     * 'subTotal': Subtotal in Rupiah as a number (e.g. 5750000). If empty/blank, leave as 0.

   - Sub-assemblies, spare parts, and arrow sub-rows (e.g. "-> BLADE / SIRIP", "-> AS / STUT"):
     Group them under 'subComponents' of that main item:
     * Each part with an arrow (-> or ↳) is a subComponent with its 'name' and 'qty':
       Example:
       SubComponent 1:
         'name': "Blade / Sirip"
         'qty': "23 pcs"
         'specs': [
           { 'label': "Dimensi / Ukuran", 'value': "320 x 65 x 2 mm" },
           { 'label': "Material", 'value': "SUS 304 / 2 mm" }
         ]
       SubComponent 2:
         'name': "As / Stut"
         'qty': "3 pcs"
         'specs': [
           { 'label': "Dimensi / Ukuran", 'value': "Ø 16 x P. 520 mm" },
           { 'label': "Material", 'value': "SUS" }
         ]
     * CRITICAL: "MATERIAL" written underneath an arrow item is the material specification of that item, NEVER a separate subcomponent!
     * "P. 520" means "Panjang 520 mm" (Length 520 mm), "∅ 16" means diameter 16 mm.

   - Items without prices or secondary job scopes (e.g. No. 2 "Cleaning Kipas", No. 3 "Balancing"):
     MUST be extracted as distinct items in 'items' with unitPrice = 0 and subTotal = 0!
     * Item 2: itemNo = "2", description = "Cleaning Kipas", qty = "1 pcs", unitPrice = 0, subTotal = 0
     * Item 3: itemNo = "3", description = "Balancing", qty = "1 Lot", unitPrice = 0, subTotal = 0

   - For equipment with technical parameter tables (e.g. Dust Collector, Centrifugal Fan, Hood, Ducting):
     Extract EVERY parameter row as { label, value }: Type/Model, Capacity, Static Pressure, Electro Motor, Rotation, Dimension, Material Casing, etc.

3. PRICING & TOTAL AMOUNT:
   - Sum all item prices accurately into 'totalAmount' (e.g. 5.750.000).
   - 'terbilang': Indonesian words for the total (e.g. "Lima Juta Tujuh Ratus Lima Puluh Ribu Rupiah").

4. OCR & COLLOQUIAL DECODING:
   - "Judul : ..." -> Subject / Title (do not misread as "Jadwal").
   - "KP 520" / "XP 520" / "KP.520" -> "x P. 520 mm" (Panjang 520 mm).
   - "IMPELER" / "IMP&LER" -> "Impeller / Kipas"
   - "Dust Colletor" -> "Dust Collector"
   - "CEUTRIFUGAL" -> "Centrifugal Fan"
   - Disregard crossed-out draft words if a replacement is written.
   - Replace any inner double quotes with single quotes ('...') so JSON remains strictly valid.
   - Never return an empty 'items' array if items, services, or prices are mentioned!`;

    const prompt = `Please extract structured document data from the following document content:\n\n${text}`;

    let object;
    try {
      const result = await generateObject({
        model: groq('openai/gpt-oss-120b'),
        schema: ExtractedDocumentSchema,
        system: systemPrompt,
        prompt,
      });
      object = result.object;
    } catch (err: any) {
      console.warn('Groq 120b extraction failed, trying qwen3.8-27b:', err?.message);
      try {
        const qwenResult = await generateObject({
          model: groq('qwen/qwen3.8-27b'),
          schema: ExtractedDocumentSchema,
          system: systemPrompt,
          prompt,
        });
        object = qwenResult.object;
      } catch (qwenErr: any) {
        console.warn('Groq qwen fallback failed, trying 20b model:', qwenErr?.message);
        const fallbackResult = await generateObject({
          model: groq('openai/gpt-oss-20b'),
          schema: ExtractedDocumentSchema,
          system: systemPrompt,
          prompt,
        });
        object = fallbackResult.object;
      }
    }

    return NextResponse.json(object);
  } catch (error: any) {
    console.error('Extraction error:', error);
    return NextResponse.json({ 
      error: 'Failed to process document', 
      details: error?.message || String(error) 
    }, { status: 500 });
  }
}
