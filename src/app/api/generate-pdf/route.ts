import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import puppeteer from 'puppeteer-core';
import { ExtractedDocumentSchema } from '@/lib/schema';

// Helper to locate Chrome / Edge executable for puppeteer-core locally on Windows
function getChromeExecutablePath() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const p of paths) {
    // @ts-ignore
    if (fs.existsSync(/*turbopackIgnore: true*/ p)) return p;
  }
  return undefined;
}

// Indonesian Terbilang helper
function angkaKeTerbilang(nilai: number): string {
  const bilangan = [
    '', 'satu', 'dua', 'tiga', 'empat', 'lima',
    'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'
  ];

  nilai = Math.floor(Math.abs(nilai));
  if (nilai < 12) {
    return bilangan[nilai];
  } else if (nilai < 20) {
    return angkaKeTerbilang(nilai - 10) + ' belas';
  } else if (nilai < 100) {
    return angkaKeTerbilang(Math.floor(nilai / 10)) + ' puluh' + (nilai % 10 !== 0 ? ' ' + bilangan[nilai % 10] : '');
  } else if (nilai < 200) {
    return 'seratus' + (nilai - 100 !== 0 ? ' ' + angkaKeTerbilang(nilai - 100) : '');
  } else if (nilai < 1000) {
    return angkaKeTerbilang(Math.floor(nilai / 100)) + ' ratus' + (nilai % 100 !== 0 ? ' ' + angkaKeTerbilang(nilai % 100) : '');
  } else if (nilai < 2000) {
    return 'seribu' + (nilai - 1000 !== 0 ? ' ' + angkaKeTerbilang(nilai - 1000) : '');
  } else if (nilai < 1000000) {
    return angkaKeTerbilang(Math.floor(nilai / 1000)) + ' ribu' + (nilai % 1000 !== 0 ? ' ' + angkaKeTerbilang(nilai % 1000) : '');
  } else if (nilai < 1000000000) {
    return angkaKeTerbilang(Math.floor(nilai / 1000000)) + ' juta' + (nilai % 1000000 !== 0 ? ' ' + angkaKeTerbilang(nilai % 1000000) : '');
  } else if (nilai < 1000000000000) {
    return angkaKeTerbilang(Math.floor(nilai / 1000000000)) + ' milyar' + (nilai % 1000000000 !== 0 ? ' ' + angkaKeTerbilang(nilai % 1000000000) : '');
  } else {
    return angkaKeTerbilang(Math.floor(nilai / 1000000000000)) + ' triliun' + (nilai % 1000000000000 !== 0 ? ' ' + angkaKeTerbilang(nilai % 1000000000000) : '');
  }
}

// Register Handlebars helpers once
let helpersRegistered = false;
function registerHelpers() {
  if (helpersRegistered) return;

  handlebars.registerHelper('formatRupiah', function (value) {
    if (value === undefined || value === null || value === '') return '0';
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
    if (isNaN(num)) return String(value);
    return new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(num);
  });

  handlebars.registerHelper('terbilangHelper', function (value) {
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
    if (!num || isNaN(num)) return 'nol rupiah';
    return (angkaKeTerbilang(num) + ' rupiah').trim();
  });

  handlebars.registerHelper('inc', function (value) {
    return (parseInt(value, 10) || 0) + 1;
  });

  helpersRegistered = true;
}

// Auto-parse multiline specifications into subComponents and row-by-row specs if not already structured
function autoParseSpecification(rawText: string) {
  if (!rawText || !rawText.includes(':')) return null;
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const subComponents: Array<{ name: string; qty: string; specs: Array<{ label: string; value: string }> }> = [];
  let currentComp = { name: '', qty: '', specs: [] as Array<{ label: string; value: string }> };

  for (const line of lines) {
    if (line.includes(':')) {
      const idx = line.indexOf(':');
      let label = line.slice(0, idx).trim().replace(/^[-*•\d+.]\s*/, '');
      let value = line.slice(idx + 1).trim();
      if (!currentComp.name && subComponents.length === 0) {
        currentComp = { name: '', qty: '', specs: [] };
        subComponents.push(currentComp);
      }
      currentComp.specs.push({ label, value });
    } else {
      // Sub-assembly header line like "CENTRIFUGAL FAN"
      const name = line.replace(/^[-*•]\s*/, '').trim();
      currentComp = { name, qty: '', specs: [] };
      subComponents.push(currentComp);
    }
  }

  const valid = subComponents.filter((c) => c.name || c.specs.length > 0);
  return valid.length > 0 ? valid : null;
}

export async function POST(req: Request) {
  try {
    registerHelpers();

    const body = await req.json();
    
    // Provide safe defaults for optional document fields and items
    const sanitizedBody = {
      titleQuotation: '',
      clientAttn: '',
      clientPhone: '',
      clientEmail: '',
      clientCc: '',
      note: '',
      leadTime: '',
      paymentTerms: '',
      nonPpn: true,
      poNumber: '',
      terbilang: '',
      downPayment: 0,
      remainingPayment: 0,
      ...body,
      items: Array.isArray(body?.items)
        ? body.items.map((item: any, idx: number) => ({
            itemNo: String(item.itemNo ?? idx + 1),
            description: String(item.description ?? ''),
            specification: String(item.specification ?? ''),
            subComponents: Array.isArray(item.subComponents) ? item.subComponents : [],
            qty: String(item.qty ?? ''),
            unitPrice: Number(item.unitPrice ?? 0),
            subTotal: Number(item.subTotal ?? 0),
          }))
        : [],
    };

    // Validate input data against enhanced schema
    const parsedData = ExtractedDocumentSchema.safeParse(sanitizedBody);
    if (!parsedData.success) {
      return NextResponse.json({ error: 'Invalid data format', details: parsedData.error }, { status: 400 });
    }
    
    const data: any = { ...parsedData.data };

    // Auto-parse multiline specifications into row-by-row specs if subComponents is empty
    if (data.docType === 'PENAWARAN' && Array.isArray(data.items)) {
      data.items = data.items.map((item: any) => {
        if ((!item.subComponents || item.subComponents.length === 0) && item.specification && item.specification.includes(':')) {
          const parsed = autoParseSpecification(item.specification);
          if (parsed) {
            return {
              ...item,
              subComponents: parsed,
              specification: '',
            };
          }
        }
        return item;
      });
    }

    // Embed STS stamp as base64 data URI if available
    const stampPath = path.join(process.cwd(), 'public', 'sts-stamp.png');
    if (fs.existsSync(stampPath)) {
      const stampBuffer = fs.readFileSync(stampPath);
      data.stampBase64 = `data:image/png;base64,${stampBuffer.toString('base64')}`;
    }

    // Map docType to template file
    const templatesMap: Record<string, string> = {
      INVOICE: 'invoice.html',
      PO: 'po.html',
      BERITA_ACARA: 'berita-acara.html',
      PENAWARAN: 'penawaran.html',
    };

    const templateFileName = templatesMap[data.docType];
    if (!templateFileName) {
      return NextResponse.json({ error: 'Unsupported document type' }, { status: 400 });
    }

    const templatePath = path.join(process.cwd(), 'src', 'templates', templateFileName);
    const templateHtml = fs.readFileSync(templatePath, 'utf8');

    // Compile template using Handlebars
    const template = handlebars.compile(templateHtml);
    const htmlContent = template(data);

    // Launch puppeteer
    const executablePath = getChromeExecutablePath();
    const browser = await puppeteer.launch({
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
    
    // Generate PDF with standard A4 margins matching Word
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
    });

    await browser.close();

    // Return PDF to client
    const safeDocNumber = (data.docNumber || 'doc').replace(/[\/\\:*?"<>|]/g, '_');
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${data.docType}_${safeDocNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate PDF',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}
