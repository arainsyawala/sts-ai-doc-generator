import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { groq } from '@ai-sdk/groq';
import { ExtractedDocumentSchema } from '@/lib/schema';

export async function POST(req: Request) {
  try {
    let text = '';
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      text = body.text?.trim() || '';
    } else {
      const formData = await req.formData();
      const textParam = formData.get('text') as string | null;
      if (textParam) {
        text = textParam.trim();
      }
    }

    if (!text) {
      return NextResponse.json({
        error: 'No document text provided. Please provide text extracted from OCR.',
      }, { status: 400 });
    }

    const systemPrompt = `You are an elite Indonesian Industrial Engineering Estimator & AI Document Specialist for CV. Surya Terang Sejahtera.
Extract structured document data strictly matching the requested schema.
You MUST accurately support BOTH:
1. Formal printed quotations/invoices/spec-sheets (e.g., Dust Collector systems with multi-assemblies, Ibu Giacinta projects).
2. Informal handwritten workshop notes and boss drafts ("coret-coretan memo atasan/pimpinan", e.g., Bp. Joko KT fan notes).

CRITICAL RULES FOR EXTRACTION:

1. CONTACT PERSON, CLIENT & HEADER DETAILS:
   - 'clientAttn': Contact person name. Check for "Attn : ...", "Ditujukan kepada : ...", "Kepada Yth : ...", "Ibu [Name]" (e.g. "Ibu Giacinta"), or "Bp. [Name]" (e.g. "Bp. Joko").
   - 'clientName': Client company or institution name (e.g. "PT ...").
   - 'titleQuotation': Project or quotation title (e.g. "Pembuatan Baru Dust Collector", "Buat baru CENTRIFUGAL FAN TYPE KT", etc.). Set docType = "PENAWARAN" for quotation sheets.
   - 'docNumber': Official document number if present.
   - 'leadTime': Delivery schedule or procurement duration (e.g. "1 Bulan").
   - 'paymentTerms': Payment terms (e.g. "40% DP\n60% setelah selesai").
   - 'note': Notes on delivery location ("DELIVERY : Jabodetabek"), installation exclusions ("Harga tidak termasuk instalasi"), etc.

2. MULTI-ASSEMBLY INDUSTRIAL EQUIPMENT (E.g. DUST COLLECTOR SYSTEMS):
   When extracting documents with complex multi-assembly equipment (such as "Dust Collector Unit 1" or "Dust Collector Unit 2"):
   - Put the main equipment title (e.g. "Dust Collector Unit 1" or "Dust Colletor Unit 2") in 'description', with numerical price in 'unitPrice' and 'subTotal' (e.g. 320.000.000 -> 320000000).
   - Break down EVERY technical sub-assembly into 'subComponents':
     * 'name': Header of the assembly (e.g. "CENTRIFUGAL FAN", "DUST COLLECTOR UNIT", "ROTARY VALVE", "CONTROL PANEL VSD", "Pemasangan Pipa Kompressor untuk Sistem pulse jet").
     * 'qty': Sub-assembly quantity if specified (e.g. "1 Set", "1 Unit", "10 Mtr", or "").
     * 'specs': Array of individual { label, value } pairs for EVERY parameter row:
       - 'label': The spec property name before the colon (e.g. "Type", "Capacity", "Static Pressure", "Rotation", "BKW", "Electro Motor", "Material", "Accessories", "Outlet Fan Dimensi", "Filter bag dimension", "Filter area/ bag", "No. of bag", "Total filter area (m2)", "Air to cloth ratio (m/min)", "Filter bag material", "Dust Collector Inlet Size", "Compressed air Requirement", "No. of pulsing valve", "Expected efficiency", "Material of construction", "Maker", "Inverter", "PLC", "Dimension", "Output Gear", "Output Rotation", "Ukuran", etc.).
       - 'value': The exact specification value after the colon. Clean up inner double quotes (use single quotes '...' or words, never escaped double quotes) to keep JSON valid.
   - NEVER summarize or condense multiple spec lines into one. Every single dashed or colon-separated line MUST become its own entry in 'specs'.

3. STANDALONE EQUIPMENT & WORKSHOP MEMO ITEMS (E.g. CENTRIFUGAL FAN TYPE KT):
   When items are standalone machines or draft memo rows (e.g. "Centrifugal Fan Type KT 4 1/2" and "Centrifugal Fan Type KT 4"):
   - Create an item for each row with numerical price (e.g. 124.000.000 -> 124000000). Sum total prices into 'totalAmount'.
   - Populate 'subComponents' with that equipment model (e.g. "Centrifugal Fan Type KT 4 1/2") and break down all parameters (Type, Capacity, Static Pressure, Power, Rotation, Model, Dimension, Material Casing, Material Impeller, Material Shaft, Pully Fan, Pully Motor, Bearing) into 'specs'.

4. OCR DECODING & HANDWRITING TOLERANCE:
   - "Dust Colletor" / "Dustcomector" / "lous coucron war" -> "Dust Collector" / "DUST COLLECTOR UNIT"
   - "CEUTRIFUGAL" / "CentritugaiFan" / "leona ean" -> "CENTRIFUGAL FAN"
   - "swticPresswe" / "Cloke preature" / "SttcPresue" -> "Static Pressure"
   - "Copacrry" / "Poco mm" / "o45wémin" -> "Capacity"
   - "egw Juikw" -> "BKW"
   - "eco otc" -> "Electro Motor"
   - "Jroracr va." -> "ROTARY VALVE"
   - "contro pave vio" -> "CONTROL PANEL VSD"
   - "fre Fo Bee" -> "Maker : Fuji Electric"
   - "ses 200 Bi" / "sus 304" -> "SUS 304"
   - "Lent" / "tent" -> "1 Unit"
   - Replace any inner double quotes with single quotes ('...') so JSON formatting is 100% valid.
   - Strikethroughs: If words are crossed out on handwritten memos, use the clean replacement text written beside it.
   - Never return an empty 'items' array if technical equipment is present in the text!`;

    const prompt = `Please extract structured document data from the following OCR text:\n\n${text}`;

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
      error: 'Failed to process document text', 
      details: error?.message || String(error) 
    }, { status: 500 });
  }
}
