const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const puppeteer = require('puppeteer-core');

function getChromeExecutablePath() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

function registerHelpers() {
  handlebars.registerHelper('formatRupiah', function (value) {
    if (value === undefined || value === null || value === '' || value === 0) return '';
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
    if (isNaN(num) || num === 0) return '';
    return new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(num);
  });

  handlebars.registerHelper('formatQty', function (qty) {
    if (!qty) return '';
    const match = String(qty).match(/^([\d.,]+)\s*(.*)$/);
    if (match) {
      const num = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(num)) {
        return `${num.toFixed(2)}  ${match[2]}`.trim();
      }
    }
    return qty;
  });

  handlebars.registerHelper('nl2br', function (text) {
    if (!text) return '';
    return new handlebars.SafeString(String(text).replace(/\r?\n/g, '<br/>'));
  });

  handlebars.registerHelper('inc', function (value) {
    return (parseInt(value, 10) || 0) + 1;
  });

  handlebars.registerHelper('terbilangHelper', function (value) {
    return 'enam juta tujuh ratus lima puluh ribu rupiah';
  });
}

async function renderInvoice() {
  registerHelpers();

  const templatePath = path.join(process.cwd(), 'src', 'templates', 'invoice.html');
  const templateSource = fs.readFileSync(templatePath, 'utf8');
  const template = handlebars.compile(templateSource);

  const data = {
    docType: 'INVOICE',
    docNumber: 'STS/SPH/010/011/26.',
    date: '10 November 2026',
    clientName: 'PT. ARTA INDOASIA',
    clientAddress: 'Jl. Orchard Avenue, Cluster Garden Hous Blok BG1 No.87\nGrand Wisata, Tambun, Bekasi – 17510',
    poNumber: '',
    terbilang: 'enam juta tujuh ratus lima puluh ribu rupiah',
    totalAmount: 6750000,
    includeBriAccount: false,
    items: [
      {
        itemNo: '1',
        description: 'Impeler / Kipas',
        specification: '- Type: Siroco Ø630',
        qty: '1.00 Lot',
        unitPrice: 6750000,
        subTotal: 6750000,
        subComponents: [
          {
            name: 'Blade / Sirip',
            qty: '',
            specs: [
              { label: 'Dimensi / Ukuran', value: '320 x 65 x 2mm' },
              { label: 'Material', value: 'SUS 304 /2mm' }
            ]
          },
          {
            name: 'AS Slut',
            qty: '3.00 Pcs',
            specs: [
              { label: 'Dimensi / Ukuran', value: 'Ø16 x P.520' },
              { label: 'Material', value: 'SUS' }
            ]
          }
        ]
      },
      {
        itemNo: '2',
        description: 'Cleaning Kipas',
        specification: '',
        qty: '1.00 Pcs',
        unitPrice: 0,
        subTotal: 0,
        subComponents: []
      },
      {
        itemNo: '3',
        description: 'Balancing',
        specification: '',
        qty: '',
        unitPrice: 0,
        subTotal: 0,
        subComponents: []
      }
    ]
  };

  const html = template(data);

  const browser = await puppeteer.launch({
    executablePath: getChromeExecutablePath(),
    args: ['--no-sandbox'],
    headless: true,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 850, height: 1100, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'domcontentloaded' });

  const artifactDir = 'C:\\Users\\Ragil\\.gemini\\antigravity\\brain\\937be5a6-30b0-45f6-ac14-f42e80164fa1';
  const outPng = path.join(artifactDir, 'preview_invoice_pt_arta_indoasia_official.png');
  const outPdf = path.join(artifactDir, 'invoice_pt_arta_indoasia_official.pdf');

  await page.screenshot({ path: outPng, fullPage: true });
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', right: '12mm', bottom: '10mm', left: '12mm' }
  });
  fs.writeFileSync(outPdf, pdfBuffer);

  await browser.close();
  console.log('Successfully generated official invoice PDF:', outPdf);
  console.log('Successfully generated official invoice PNG:', outPng);
}

renderInvoice().catch(console.error);
