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
    return 'lima juta rupiah';
  });
}

async function renderGunturInvoice() {
  registerHelpers();

  const templatePath = path.join(process.cwd(), 'src', 'templates', 'invoice.html');
  const templateSource = fs.readFileSync(templatePath, 'utf8');
  const template = handlebars.compile(templateSource);

  const data = {
    docType: 'INVOICE',
    docNumber: 'STS/SPH/030/11/26.',
    date: '14 November 2026',
    clientName: 'PT. GUNTUR BERKAT UTAMA',
    clientAddress: '',
    poNumber: '',
    terbilang: 'lima juta rupiah',
    totalAmount: 5000000,
    includeBriAccount: false,
    items: [
      {
        itemNo: '1',
        description: 'Balancing On Site Impeller Blower',
        specification: 'Type KT - Φ 900 mm',
        qty: '1.00 Pcs',
        unitPrice: 5000000,
        subTotal: 5000000,
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
  const outPng = path.join(artifactDir, 'preview_invoice_guntur_centered.png');
  const outPdf = path.join(artifactDir, 'invoice_pt_guntur_berkat_utama.pdf');

  await page.screenshot({ path: outPng, fullPage: true });
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', right: '12mm', bottom: '10mm', left: '12mm' }
  });
  fs.writeFileSync(outPdf, pdfBuffer);

  await browser.close();
  console.log('Successfully generated Guntur Invoice PDF:', outPdf);
  console.log('Successfully generated Guntur Invoice PNG:', outPng);
}

renderGunturInvoice().catch(console.error);
