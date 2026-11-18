const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const puppeteer = require('puppeteer-core');

function getChromeExecutablePath() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

function angkaKeTerbilang(nilai) {
  const bilangan = [
    '', 'satu', 'dua', 'tiga', 'empat', 'lima',
    'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'
  ];
  nilai = Math.floor(Math.abs(nilai));
  if (nilai < 12) return bilangan[nilai];
  if (nilai < 20) return angkaKeTerbilang(nilai - 10) + ' belas';
  if (nilai < 100) return angkaKeTerbilang(Math.floor(nilai / 10)) + ' puluh' + (nilai % 10 !== 0 ? ' ' + bilangan[nilai % 10] : '');
  if (nilai < 200) return 'seratus' + (nilai - 100 !== 0 ? ' ' + angkaKeTerbilang(nilai - 100) : '');
  if (nilai < 1000) return angkaKeTerbilang(Math.floor(nilai / 100)) + ' ratus' + (nilai % 100 !== 0 ? ' ' + angkaKeTerbilang(nilai % 100) : '');
  if (nilai < 2000) return 'seribu' + (nilai - 1000 !== 0 ? ' ' + angkaKeTerbilang(nilai - 1000) : '');
  if (nilai < 1000000) return angkaKeTerbilang(Math.floor(nilai / 1000)) + ' ribu' + (nilai % 1000 !== 0 ? ' ' + angkaKeTerbilang(nilai % 1000) : '');
  if (nilai < 1000000000) return angkaKeTerbilang(Math.floor(nilai / 1000000)) + ' juta' + (nilai % 1000000 !== 0 ? ' ' + angkaKeTerbilang(nilai % 1000000) : '');
  if (nilai < 1000000000000) return angkaKeTerbilang(Math.floor(nilai / 1000000000)) + ' milyar' + (nilai % 1000000000 !== 0 ? ' ' + angkaKeTerbilang(nilai % 1000000000) : '');
  return angkaKeTerbilang(Math.floor(nilai / 1000000000000)) + ' triliun';
}

function toTitleCaseWords(str) {
  if (!str) return '';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function generateIndonesianDateSpellout(dateStr) {
  const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const indonesianMonths = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthNumbers = ['Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas', 'Dua Belas'];
  
  let d = 1, m = 1, y = 2026;
  const match = String(dateStr).match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (match) {
    d = parseInt(match[1], 10);
    const mIdx = indonesianMonths.findIndex(im => im.toLowerCase() === match[2].toLowerCase());
    m = mIdx !== -1 ? mIdx + 1 : 1;
    y = parseInt(match[3], 10);
  } else {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      d = parsed.getDate();
      m = parsed.getMonth() + 1;
      y = parsed.getFullYear();
    }
  }

  const dt = new Date(y, m - 1, d);
  const dayName = indonesianDays[dt.getDay()] || 'Senin';
  const dayText = toTitleCaseWords(angkaKeTerbilang(d));
  const monthText = monthNumbers[m - 1] || 'Satu';
  const yearText = toTitleCaseWords(angkaKeTerbilang(y));

  return { dayName, dayText, monthText, yearText };
}

function registerHelpers() {
  handlebars.registerHelper('formatRupiah', function (value) {
    if (value === undefined || value === null || value === '' || value === 0) return '0';
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
    if (isNaN(num)) return String(value);
    return new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(num);
  });

  handlebars.registerHelper('toTitleCase', function (value) {
    return toTitleCaseWords(String(value));
  });

  handlebars.registerHelper('terbilangRupiahTitleCase', function (value) {
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
    if (!num || isNaN(num)) return 'Nol Rupiah';
    return toTitleCaseWords(angkaKeTerbilang(num) + ' rupiah');
  });

  handlebars.registerHelper('nl2br', function (text) {
    if (!text) return '';
    return new handlebars.SafeString(String(text).replace(/\r?\n/g, '<br/>'));
  });
}

const templateSource = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>{{docTitle}} - {{docNumber}}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 20mm 18mm 20mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: "Times New Roman", Times, Georgia, serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #000;
      margin: 0;
      padding: 0;
    }
    .header-block {
      text-align: center;
      margin-bottom: 8px;
    }
    .company-name {
      font-size: 15pt;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .company-address {
      font-size: 10.5pt;
      margin-top: 2px;
    }
    .company-contact {
      font-size: 10.5pt;
      margin-top: 6px;
      line-height: 1.35;
    }
    .header-divider {
      border: none;
      border-top: 2.5px solid #000;
      margin: 10px 0 16px 0;
    }
    .title-block {
      text-align: center;
      margin-bottom: 20px;
    }
    .doc-title {
      font-size: 11.5pt;
      font-weight: bold;
      text-decoration: underline;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .doc-number {
      font-size: 11pt;
      margin-top: 3px;
    }
    .intro-paragraph {
      text-align: justify;
      margin-bottom: 14px;
    }
    .party-title {
      font-weight: bold;
      margin-top: 10px;
      margin-bottom: 4px;
    }
    .party-list {
      margin: 0 0 4px 0;
      padding-left: 20px;
      list-style-type: disc;
    }
    .party-list li {
      margin-bottom: 3px;
    }
    .party-clause {
      text-align: justify;
      margin-bottom: 12px;
    }
    .detail-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    .detail-table td {
      vertical-align: top;
      padding: 2.5px 0;
      font-size: 11pt;
    }
    .detail-label {
      width: 150px;
    }
    .detail-colon {
      width: 15px;
      text-align: center;
    }
    .content-paragraph {
      text-align: justify;
      margin-bottom: 12px;
      line-height: 1.45;
    }
    .results-list {
      margin: 0 0 14px 0;
      padding-left: 20px;
    }
    .results-list li {
      text-align: justify;
      margin-bottom: 6px;
    }
    .closing-paragraph {
      text-align: justify;
      margin-top: 16px;
      margin-bottom: 24px;
    }
    .signature-section {
      width: 100%;
      margin-top: 10px;
      page-break-inside: avoid;
    }
    .date-row {
      text-align: right;
      margin-bottom: 8px;
      padding-right: 30px;
    }
    .sig-columns {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .sig-col-left {
      width: 48%;
      text-align: center;
    }
    .sig-col-right {
      width: 48%;
      text-align: center;
      position: relative;
    }
    .sig-space {
      height: 65px;
    }
    .sig-party-name {
      font-weight: bold;
      margin-top: 4px;
    }
    .stamp-container {
      position: relative;
      display: inline-block;
    }
    .stamp-img {
      position: absolute;
      top: -35px;
      left: 50%;
      transform: translateX(-50%);
      width: 125px;
      height: auto;
      opacity: 0.92;
      pointer-events: none;
    }
  </style>
</head>
<body>

  <!-- Letterhead / Kop Surat -->
  <div class="header-block">
    <div class="company-name">CV. SURYA TERANG SEJAHTERA</div>
    <div class="company-address">Jln. Kedaung Gang Tengah, RT 01 RW 06 No. 76<br/>Cimuning, Mustika Jaya – Kota Bekasi.</div>
    <div class="company-contact">
      Telpon : <strong>081280806155 / 085718597278</strong><br/>
      Email: <i>suryaterangsejahtera@gmail.com</i>
    </div>
  </div>
  <hr class="header-divider"/>

{{#if isBaDp}}
  <!-- ================= BERITA ACARA PEMBAYARAN DP ================= -->
  <div class="title-block">
    <div class="doc-title">BERITA ACARA PEMBAYARAN DP(DOWN PAYMENT)</div>
    <div class="doc-number">No. : {{docNumber}}</div>
  </div>

  <div class="intro-paragraph">
    Pada hari ini <strong>{{dateSpellout.dayName}}</strong> tanggal <strong>{{dateSpellout.dayText}}</strong> bulan <strong>{{dateSpellout.monthText}}</strong> tahun <strong>{{dateSpellout.yearText}}</strong>.<br/>
    Yang bertanda tangan dibawah ini menerangkan bahwa :
  </div>

  <div class="party-title">I. Pihak Pertama</div>
  <ul class="party-list">
    <li>Nama Lengkap : <strong>{{clientAttn}}</strong></li>
    <li>Nama Perusahaan: <strong>{{clientName}}</strong></li>
    <li>Alamat : {{clientAddress}}</li>
  </ul>
  <div class="party-clause">
    Dalam hal ini bertindak untuk dan atas nama {{clientName}}, yang selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong> (Pihak Pembayar).
  </div>

  <div class="party-title">II. Pihak Kedua</div>
  <ul class="party-list">
    <li>Nama Lengkap : <strong>Agus Jumadi</strong></li>
    <li>Nama Perusahaan: <strong>CV. Surya Terang Sejahtera</strong></li>
    <li>Alamat : Jln. Kedaung Gang Tengah, RT 01 RW 06 No 76 Cimuning Mustika Jaya – Kota Bekasi</li>
  </ul>
  <div class="party-clause">
    Dalam hal ini bertindak untuk dan atas nama CV Surya Terang Sejahtera, yang selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong> (Pihak Penerima).
  </div>

  <div class="content-paragraph">
    Dengan ini menyatakan bahwa <strong>PIHAK PERTAMA</strong> telah melakukan pembayaran Uang Muka (<i>Down Payment</i>) kepada <strong>PIHAK KEDUA</strong> sebagai pelaksanaan dari Perjanjian/Kontrak/PO Nomor <strong>{{poNumber}}</strong>{{#if baPoDate}} tertanggal <strong>{{baPoDate}}</strong>{{/if}} mengenai Project: <strong>{{titleQuotation}}</strong>.
  </div>

  <div class="content-paragraph">
    Adapun pembayaran Uang Muka yang telah dilakukan adalah sebesar <strong>{{#if baDpPercent}}{{baDpPercent}}{{else}}40% (empat puluh persen){{/if}}</strong> dari total nilai kontrak, yaitu senilai <strong>Rp {{formatRupiah downPayment}},- ({{#if terbilang}}{{terbilang}}{{else}}{{terbilangRupiahTitleCase downPayment}}{{/if}})</strong>.
  </div>

  <div class="closing-paragraph">
    Demikian Berita Acara ini dibuat dan ditandatangani kedua belah Pihak dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.
  </div>

  <!-- Signatures for DP -->
  <div class="signature-section">
    <div class="date-row">Bekasi, {{date}}</div>
    <div class="sig-columns">
      <div class="sig-col-left">
        <div>Yang Menerima</div>
        <div class="sig-space"></div>
        <div class="sig-party-name">{{clientName}}</div>
      </div>
      <div class="sig-col-right">
        <div>Hormat Kami</div>
        <div class="sig-space" style="position: relative;">
          {{#if stampBase64}}
            <img src="{{stampBase64}}" class="stamp-img" />
          {{/if}}
        </div>
        <div class="sig-party-name" style="text-decoration: underline;">Agus Jumadi</div>
      </div>
    </div>
  </div>

{{else}}
  <!-- ================= BERITA ACARA PENYELESAIAN PEKERJAAN ================= -->
  <div class="title-block">
    <div class="doc-title">BERITA ACARA PENYELESAIAN PEKERJAAN</div>
    <div class="doc-number">No. : {{docNumber}}</div>
  </div>

  <div class="intro-paragraph">
    Pada hari ini <strong>{{dateSpellout.dayName}}</strong> tanggal <strong>{{dateSpellout.dayText}}</strong> bulan <strong>{{dateSpellout.monthText}}</strong> tahun <strong>{{dateSpellout.yearText}}</strong>.<br/>
    Yang bertanda tangan dibawah ini menerangkan bahwa :
  </div>

  <table class="detail-table">
    <tr>
      <td class="detail-label">Pekerjaan</td>
      <td class="detail-colon">:</td>
      <td><strong>{{titleQuotation}}</strong></td>
    </tr>
    <tr>
      <td class="detail-label">No PO</td>
      <td class="detail-colon">:</td>
      <td>{{poNumber}}</td>
    </tr>
    <tr>
      <td class="detail-label">Nilai Pekerjaan</td>
      <td class="detail-colon">:</td>
      <td>Rp. {{formatRupiah totalAmount}}</td>
    </tr>
    <tr>
      <td class="detail-label">Pelaksana</td>
      <td class="detail-colon">:</td>
      <td><strong>CV. SURYA TERANG SEJAHTERA</strong></td>
    </tr>
  </table>

  <div style="margin: 10px 0 6px 0; font-weight: normal;">Untuk diserahkan kepada :</div>

  <table class="detail-table">
    <tr>
      <td class="detail-label">Penerima</td>
      <td class="detail-colon">:</td>
      <td><strong>{{clientName}}</strong></td>
    </tr>
    {{#if clientAttn}}
    <tr>
      <td class="detail-label">CC</td>
      <td class="detail-colon">:</td>
      <td>{{clientAttn}}</td>
    </tr>
    {{/if}}
    {{#if clientPhone}}
    <tr>
      <td class="detail-label">Phone</td>
      <td class="detail-colon">:</td>
      <td>{{clientPhone}}</td>
    </tr>
    {{/if}}
    <tr>
      <td class="detail-label">Alamat</td>
      <td class="detail-colon">:</td>
      <td>{{{nl2br clientAddress}}}</td>
    </tr>
  </table>

  <div style="margin: 12px 0 4px 0;">Dengan hasil :</div>
  <ol class="results-list">
    <li>Telah menyelesaikan pekerjaan <i>{{titleQuotation}}</i> dengan progress 100% selesai.</li>
    <li>Berpendapat bahwa Penyelesaian pekerjaan <i>{{titleQuotation}}</i> telah selesai dilakukan pada tanggal <strong>{{#if baCompletionDate}}{{baCompletionDate}}{{else}}{{date}}{{/if}}</strong></li>
    <li>Berpendapat bahwa seluruh pekerjaan sebagaimana yang dimaksud dalam Surat Pesanan yang tersebut, beserta seluruh perubahan-perubahan telah diselesaikan penyerahan atas pekerjaan.</li>
  </ol>

  <div class="closing-paragraph">
    Demikian Berita Acara ini dibuat dalam rangkap 2 (dua) ditandatangani oleh kedua belah pihak untuk dipergunakan sebagai mestinya.
  </div>

  <!-- Signatures for Completion -->
  <div class="signature-section">
    <div class="date-row">Bekasi, {{date}}</div>
    <div class="sig-columns">
      <div class="sig-col-left">
        <div>Yang Menerima</div>
        <div class="sig-space"></div>
        <div class="sig-party-name">{{clientName}}</div>
      </div>
      <div class="sig-col-right">
        <div>Hormat Kami</div>
        <div class="sig-space" style="position: relative;">
          {{#if stampBase64}}
            <img src="{{stampBase64}}" class="stamp-img" />
          {{/if}}
        </div>
        <div class="sig-party-name" style="text-decoration: underline;">Agus Jumadi</div>
      </div>
    </div>
  </div>

{{/if}}

</body>
</html>`;

async function testRenderBoth() {
  registerHelpers();
  const template = handlebars.compile(templateSource);

  // Load STS stamp base64
  const stampPath = path.join(process.cwd(), 'public', 'sts-stamp.png');
  let stampBase64 = '';
  if (fs.existsSync(stampPath)) {
    const buf = fs.readFileSync(stampPath);
    stampBase64 = `data:image/png;base64,${buf.toString('base64')}`;
  }

  const browser = await puppeteer.launch({
    executablePath: getChromeExecutablePath(),
    args: ['--no-sandbox'],
    headless: true,
  });

  const artifactDir = 'C:\\Users\\Ragil\\.gemini\\antigravity\\brain\\937be5a6-30b0-45f6-ac14-f42e80164fa1';

  // 1. Render Berita Acara Pembayaran DP (PT MMID)
  const dataDp = {
    docType: 'BERITA_ACARA',
    docTitle: 'Berita Acara Pembayaran DP',
    isBaDp: true,
    docNumber: 'BA-DP-1-013-005-MMID-2026',
    date: '13 Mei 2026',
    dateSpellout: generateIndonesianDateSpellout('13 Mei 2026'),
    clientName: 'PT Megalopolis Manunggal Industrial Development',
    clientAttn: 'Zubaidi Akhmad',
    clientAddress: 'Kawasan Industri MM2100, Cikarang Barat, Bekasi 17520',
    poNumber: '200/PUR/V/2026',
    baPoDate: '8 Mei',
    titleQuotation: 'Screw Conveyor',
    baDpPercent: '40% (empat puluh persen)',
    downPayment: 260000000,
    terbilang: 'Dua Ratus Enam Puluh Juta Rupiah',
    totalAmount: 650000000,
    stampBase64: stampBase64,
  };

  const htmlDp = template(dataDp);
  const pageDp = await browser.newPage();
  await pageDp.setViewport({ width: 850, height: 1100, deviceScaleFactor: 2 });
  await pageDp.setContent(htmlDp, { waitUntil: 'domcontentloaded' });
  
  const pngDp = path.join(artifactDir, 'preview_berita_acara_dp_mmid.png');
  const pdfDp = path.join(artifactDir, 'berita_acara_dp_pt_mmid.pdf');
  await pageDp.screenshot({ path: pngDp, fullPage: true });
  const bufPdfDp = await pageDp.pdf({ format: 'A4', printBackground: true, margin: { top: '15mm', right: '18mm', bottom: '15mm', left: '18mm' } });
  fs.writeFileSync(pdfDp, bufPdfDp);
  console.log('Saved BA DP PNG:', pngDp);
  console.log('Saved BA DP PDF:', pdfDp);
  await pageDp.close();

  // 2. Render Berita Acara Penyelesaian Pekerjaan (PT Profiklin Cemerlang)
  const dataPenyelesaian = {
    docType: 'BERITA_ACARA',
    docTitle: 'Berita Acara Penyelesaian Pekerjaan',
    isBaDp: false,
    docNumber: 'BA-1-001-012-PC-2025',
    date: '1 Desember 2025',
    dateSpellout: generateIndonesianDateSpellout('1 Desember 2025'),
    titleQuotation: 'Ducting Inlet & Dumper',
    poNumber: '073/PO/PC/11112025',
    totalAmount: 136500000,
    clientName: 'PT. Profiklin Cemerlang',
    clientAttn: 'Bpk. Riyadh',
    clientPhone: '021 – 758 759 88',
    clientAddress: 'Taman Tekno Industrial Park BSD Blok J1 No.7\nSerpong - 15314',
    baCompletionDate: '27 November 2025',
    stampBase64: stampBase64,
  };

  const htmlPenyelesaian = template(dataPenyelesaian);
  const pagePenyelesaian = await browser.newPage();
  await pagePenyelesaian.setViewport({ width: 850, height: 1100, deviceScaleFactor: 2 });
  await pagePenyelesaian.setContent(htmlPenyelesaian, { waitUntil: 'domcontentloaded' });
  
  const pngPenyelesaian = path.join(artifactDir, 'preview_berita_acara_penyelesaian_profiklin.png');
  const pdfPenyelesaian = path.join(artifactDir, 'berita_acara_penyelesaian_pt_profiklin.pdf');
  await pagePenyelesaian.screenshot({ path: pngPenyelesaian, fullPage: true });
  const bufPdfPenyelesaian = await pagePenyelesaian.pdf({ format: 'A4', printBackground: true, margin: { top: '15mm', right: '18mm', bottom: '15mm', left: '18mm' } });
  fs.writeFileSync(pdfPenyelesaian, bufPdfPenyelesaian);
  console.log('Saved BA Penyelesaian PNG:', pngPenyelesaian);
  console.log('Saved BA Penyelesaian PDF:', pdfPenyelesaian);
  await pagePenyelesaian.close();

  await browser.close();
  console.log('Finished rendering both Berita Acara samples!');
}

testRenderBoth().catch(console.error);
