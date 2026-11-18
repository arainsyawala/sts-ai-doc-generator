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
    // If it has number and unit, format with 2 decimals if number
    const match = qty.match(/^([\d.,]+)\s*(.*)$/);
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
    return new handlebars.SafeString(text.replace(/\r?\n/g, '<br/>'));
  });
}

const templateSource = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - {{docNumber}}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 10pt;
      line-height: 1.25;
      color: #000;
      margin: 0;
      padding: 0;
    }
    .page-box {
      border: 1.5px solid #000;
      padding: 16px 20px 20px 20px;
      min-height: 1040px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .top-section {
      width: 100%;
    }
    .company-title {
      color: #1f4e79;
      font-size: 13.5pt;
      font-weight: bold;
      letter-spacing: 0.3px;
      margin-bottom: 3px;
    }
    .company-address {
      font-size: 9.5pt;
      margin-bottom: 2px;
    }
    .company-contact {
      font-size: 9.5pt;
      line-height: 1.25;
    }
    .invoice-title-block {
      text-align: center;
      margin: 10px 0 14px 0;
    }
    .invoice-title {
      font-size: 13pt;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .invoice-number {
      font-size: 10.5pt;
      margin-top: 2px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 14px;
    }
    .client-info {
      width: 60%;
      font-size: 9.5pt;
      line-height: 1.35;
    }
    .client-name {
      font-weight: bold;
      font-size: 10.5pt;
      margin: 2px 0 4px 0;
    }
    .po-date-table {
      border-collapse: collapse;
      width: 230px;
      border: 1px solid #000;
    }
    .po-date-table td {
      border: 1px solid #000;
      padding: 3px 8px;
      font-size: 9.5pt;
    }
    .po-label {
      width: 65px;
    }
    .po-val {
      min-width: 140px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #000;
      font-size: 9.5pt;
    }
    .items-table thead th {
      border: 1px solid #000;
      padding: 4px 6px;
      text-align: center;
      font-weight: bold;
      font-size: 9.5pt;
      background-color: transparent;
    }
    .items-table thead tr:first-child th {
      border-bottom: 1px solid #000;
    }
    .items-table td {
      border-left: 1px solid #000;
      border-right: 1px solid #000;
      border-top: none;
      border-bottom: none;
      padding: 3px 6px;
      vertical-align: top;
    }
    .col-no { width: 5%; text-align: center; }
    .col-desc { width: 50%; }
    .col-qty { width: 14%; text-align: center; }
    .col-price { width: 15.5%; text-align: right; }
    .col-amount { width: 15.5%; text-align: right; }
    
    .desc-item-title {
      font-weight: normal;
    }
    .desc-bullet {
      padding-left: 8px;
    }
    .desc-sub-title {
      margin-top: 3px;
    }
    .fill-space {
      height: 120px;
    }
    .subtotal-row td {
      border-top: 1px solid #000 !important;
      padding: 4px 6px;
    }
    .border-all-cell {
      border: 1px solid #000 !important;
    }
    .total-row td {
      border-top: 1.5px solid #000 !important;
      border-bottom: 1.5px solid #000 !important;
      padding: 4px 6px;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .text-bold { font-weight: bold; }
    
    .bottom-section {
      width: 100%;
      margin-top: 12px;
    }
    .terbilang-block {
      font-size: 9.5pt;
      margin-bottom: 24px;
    }
    .terbilang-title {
      text-decoration: underline;
      display: inline-block;
      margin-right: 6px;
    }
    .terbilang-text {
      font-weight: bold;
      font-style: italic;
    }
    .footer-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .bank-block {
      width: 55%;
      font-size: 9pt;
      line-height: 1.35;
    }
    .sig-block {
      width: 40%;
      text-align: center;
      font-size: 9.5pt;
    }
    .sig-name {
      text-decoration: underline;
      font-weight: normal;
    }
  </style>
</head>
<body>

<div class="page-box">
  <div class="top-section">
    <!-- Header -->
    <div class="company-title">CV. SURYA TERANG SEJAHTERA</div>
    <div class="company-address">Jln.Kedaung Gang Tengah,RT. 001/rw.06 No.76 Cimuning,Mustika Jaya-Kota Bekasi.</div>
    <div class="company-contact">
      Hp.: 0812-8080-6155 /<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0857-1859-7278
    </div>

    <!-- Title -->
    <div class="invoice-title-block">
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-number">NO. :{{docNumber}}</div>
    </div>

    <!-- Meta Info -->
    <div class="meta-row">
      <div class="client-info">
        <div>Kepada</div>
        <div class="client-name"><u>{{clientName}}</u></div>
        {{#if clientAddress}}
          <div>{{{nl2br clientAddress}}}</div>
        {{else}}
          <div>Jl. Orchard Avenue, Cluster Garden Hous Blok BG1 No.87<br/>Grand Wisata, Tambun, Bekasi – 17510</div>
        {{/if}}
      </div>
      <div class="po-box">
        <table class="po-date-table">
          <tr>
            <td class="po-label">PO.No.</td>
            <td class="po-val">{{poNumber}}</td>
          </tr>
          <tr>
            <td class="po-label">Date</td>
            <td class="po-val">{{date}}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Main Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th rowspan="2" class="col-no">NO.</th>
          <th rowspan="2" class="col-desc">DESCRIPTION</th>
          <th rowspan="2" class="col-qty">QUANTITY</th>
          <th class="col-price">UNIT PRICE</th>
          <th class="col-amount">AMOUNT</th>
        </tr>
        <tr>
          <th class="col-price" style="font-weight: normal; font-size: 9pt;">Rp</th>
          <th class="col-amount" style="font-weight: normal; font-size: 9pt;">Rp</th>
        </tr>
      </thead>
      <tbody>
        {{#each items}}
        <tr>
          <td class="col-no">{{#if this.itemNo}}{{this.itemNo}}.{{else}}{{inc @index}}.{{/if}}</td>
          <td class="col-desc">
            <div class="desc-item-title">{{this.description}}</div>
            {{#if this.specification}}
              <div class="desc-bullet">{{this.specification}}</div>
            {{/if}}
            {{#if this.subComponents}}
              {{#each this.subComponents}}
                <div class="desc-sub-title">{{this.name}}</div>
                {{#if this.specs}}
                  {{#each this.specs}}
                    <div class="desc-bullet">- {{this.label}} : {{this.value}}</div>
                  {{/each}}
                {{/if}}
              {{/each}}
            {{/if}}
          </td>
          <td class="col-qty">
            <div>{{formatQty this.qty}}</div>
            {{#if this.subComponents}}
              {{#each this.subComponents}}
                {{#if this.qty}}
                  <div style="margin-top: {{#if @first}}22px{{else}}12px{{/if}};">{{formatQty this.qty}}</div>
                {{/if}}
              {{/each}}
            {{/if}}
          </td>
          <td class="col-price">{{#if this.unitPrice}}{{formatRupiah this.unitPrice}}{{/if}}</td>
          <td class="col-amount">{{#if this.subTotal}}{{formatRupiah this.subTotal}}{{/if}}</td>
        </tr>
        {{/each}}

        <!-- Empty Fill Space to keep vertical grid height realistic -->
        <tr class="fill-space">
          <td class="col-no"></td>
          <td class="col-desc"></td>
          <td class="col-qty"></td>
          <td class="col-price"></td>
          <td class="col-amount"></td>
        </tr>

        <!-- Sub Total Row -->
        <tr class="subtotal-row">
          <td colspan="4" class="text-center" style="padding-right: 15px;">Sub Total</td>
          <td class="col-amount border-all-cell">{{formatRupiah totalAmount}}</td>
        </tr>
        <tr>
          <td colspan="4"></td>
          <td class="col-amount border-all-cell text-center">-</td>
        </tr>
        <!-- Total Pembayaran -->
        <tr class="total-row">
          <td colspan="4" class="text-right text-bold" style="padding-right: 15px;">Total Pembayaran</td>
          <td class="col-amount border-all-cell text-bold">{{formatRupiah totalAmount}}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="bottom-section">
    <!-- Terbilang -->
    <div class="terbilang-block">
      <span class="terbilang-title">Terbilang :</span>
      <span class="terbilang-text"># {{terbilang}} #</span>
    </div>

    <!-- Footer Bank & Signature -->
    <div class="footer-row">
      <div class="bank-block">
        <div>* Pembayaran agar ditransfer ke :</div>
        <div>a/n. CV. Surya Terang Sejahtera</div>
        <div>Bank Permata</div>
        <div>Rekening No. 1225803028</div>
        {{#if includeBriAccount}}
          <div style="margin-top: 8px;">
            <i>atau</i><br/>
            a/n. Agus Jumadi<br/>
            Bank BRI<br/>
            Rekening No. 3263-01-024013-53-3
          </div>
        {{/if}}
      </div>
      <div class="sig-block">
        <div>Bekasi, {{date}}</div>
        <div>Hormat kami</div>
        <div style="height: 60px;"></div>
        <div class="sig-name">Agus Jumadi</div>
      </div>
    </div>
  </div>
</div>

</body>
</html>`;

async function testRender() {
  registerHelpers();
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
  const outPng = path.join(artifactDir, 'preview_new_invoice_test.png');
  const outPdf = path.join(artifactDir, 'invoice_new_format_test.pdf');

  await page.screenshot({ path: outPng, fullPage: true });
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', right: '12mm', bottom: '10mm', left: '12mm' }
  });
  fs.writeFileSync(outPdf, pdfBuffer);

  await browser.close();
  console.log('Generated test PNG:', outPng);
  console.log('Generated test PDF:', outPdf);
}

testRender().catch(console.error);
