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
    return 'empat puluh tiga juta rupiah';
  });
}

async function renderShinanoaInvoice() {
  registerHelpers();

  const templatePath = path.join(process.cwd(), 'src', 'templates', 'invoice.html');
  const templateSource = fs.readFileSync(templatePath, 'utf8');
  const template = handlebars.compile(templateSource);

  const data = {
    docType: 'INVOICE',
    docNumber: '036/STS/INV/XI/2026',
    date: '18 November 2026',
    clientName: 'PT. SHINANOA Indonesia',
    clientAddress: 'JL. Kenari Raya Blok D No. 06, Delta Commercial Park 2\nKawasan Industri Delta Silicon 6, Lippo Cikarang\nJayamukti, Kab. Bekasi, Jawa Barat 17530',
    poNumber: '2026/SNI/XI/2292',
    terbilang: 'empat puluh tiga juta rupiah',
    totalAmount: 43000000,
    includeBriAccount: false,
    items: [
      {
        itemNo: '1',
        description: 'Control Box Burner Eclips Small Part Area',
        specification: '- Ref. Penawaran: STS/SPH/SSG/036/10/2026 (for SCMIN)',
        qty: '1.00 Set',
        unitPrice: 43000000,
        subTotal: 43000000,
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
  const outPng = path.join(artifactDir, 'preview_invoice_pt_shinanoa_indonesia.png');
  const outPdf = path.join(artifactDir, 'invoice_pt_shinanoa_indonesia.pdf');

  await page.screenshot({ path: outPng, fullPage: true });
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', right: '12mm', bottom: '10mm', left: '12mm' }
  });
  fs.writeFileSync(outPdf, pdfBuffer);

  await browser.close();
  console.log('Successfully generated Shinanoa Invoice PDF:', outPdf);
  console.log('Successfully generated Shinanoa Invoice PNG:', outPng);
}

renderShinanoaInvoice().catch(console.error);
