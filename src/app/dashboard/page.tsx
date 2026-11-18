"use client";

import { Suspense, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, FileText, ListPlus, Loader2, Plus, ReceiptText, Sparkles, Trash2, UploadCloud, Wand2, X } from "lucide-react";

import { ExtractedDocumentSchema, ExtractedDocument } from "@/lib/schema";
import { recognize } from "tesseract.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function DashboardContent() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState("Extracting data...");
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({ 0: true });

  const form = useForm<ExtractedDocument>({
    resolver: zodResolver(ExtractedDocumentSchema),
    defaultValues: {
      docType: "PENAWARAN",
      docNumber: "STS/SPH/SSG/09/10/26",
      date: "09 Oktober 2026",
      clientName: "PT. Maju Bersama",
      clientAddress: "",
      titleQuotation: "Pembuatan Baru Dust Collector",
      clientAttn: "Ibu Giacinta",
      clientPhone: "",
      clientEmail: "",
      clientCc: "",
      leadTime: "1 Bulan",
      paymentTerms: "40% DP\n60% setelah selesai pekerjaan",
      note: "",
      nonPpn: true,
      includeBriAccount: false,
      includeLeadTime: true,
      includeNote: false,
      poNumber: "",
      terbilang: "",
      downPayment: 0,
      remainingPayment: 0,
      baType: "PENYELESAIAN",
      baCompletionDate: "",
      baDpPercent: "40% (empat puluh persen)",
      baPoDate: "",
      baDateSpellout: "",
      totalAmount: 320000000,
      items: [
        {
          itemNo: "1",
          description: "Dust Collector Unit 1",
          specification: "",
          qty: "",
          unitPrice: 320000000,
          subTotal: 320000000,
          subComponents: [
            {
              name: "Centrifugal Fan",
              qty: "1 Set",
              specs: [
                { label: "Type", value: "NS-55A-70" },
                { label: "Capacity", value: "245m³/min" },
                { label: "Static Pressure", value: "255 mmAq" },
                { label: "Rotation", value: "1860 RPM" },
                { label: "BKW", value: "14,1 Kw" },
                { label: "Electro Motor", value: "15 Kw/380v/4 Pole/50 Hz/3PH" },
                { label: "Material", value: "Mild Steel" },
                { label: "Accessories", value: "Pully Taper Lock System Merk Martin, V-Belt Merk Optibelt, Bearing SKF, Support Chimney" },
                { label: "Outlet Fan Dimensi", value: "Ø 550mm" },
              ],
            },
            {
              name: "Dust Collector",
              qty: "",
              specs: [
                { label: "Type", value: "Pulse Jet" },
                { label: "Model", value: "PJ – 80" },
                { label: "Inlet Temperatur", value: "30 C" },
                { label: "Inlet Dust", value: "Dry & Fine Powder" },
                { label: "Filter Bag Dimention", value: "Ø180 x 2800 mm" },
                { label: "Filter Area/Bag", value: "1,406 M2" },
                { label: "No. of Bag", value: "80pcs" },
                { label: "Total Filter Area (m2)", value: "112,48 m2" },
                { label: "Air to cloth ratio (m/min)", value: "2,68 m2" },
                { label: "Filter Bag Material", value: "Polyster Anti Static needlefalt 500gr/m2" },
              ],
            },
          ],
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const docType = form.watch("docType");

  const [renderKey, setRenderKey] = useState(0);

  const toggleExpand = (index: number) => {
    setExpandedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const updateItems = (updater: (items: any[]) => void) => {
    const currentItems = structuredClone(form.getValues("items") || []);
    updater(currentItems);
    form.setValue("items", currentItems, { shouldDirty: true, shouldTouch: true });
    setRenderKey((k) => k + 1);
  };

  const addSubComponent = (itemIndex: number) => {
    updateItems((items) => {
      const item = items[itemIndex];
      if (!item) return;
      item.subComponents = item.subComponents || [];
      item.subComponents.push({
        name: "Sub-Komponen Baru",
        qty: "1 Set",
        specs: [{ label: "Type", value: "" }],
      });
    });
  };

  const removeSubComponent = (itemIndex: number, subIndex: number) => {
    updateItems((items) => {
      const subComps = items[itemIndex]?.subComponents;
      if (subComps) {
        subComps.splice(subIndex, 1);
      }
    });
  };

  const moveSubComponent = (itemIndex: number, subIndex: number, direction: "up" | "down") => {
    updateItems((items) => {
      const subComps = items[itemIndex]?.subComponents;
      if (!subComps) return;
      const targetIndex = direction === "up" ? subIndex - 1 : subIndex + 1;
      if (targetIndex < 0 || targetIndex >= subComps.length) return;
      const [moved] = subComps.splice(subIndex, 1);
      subComps.splice(targetIndex, 0, moved);
    });
  };

  const addSpecItem = (itemIndex: number, subIndex: number) => {
    updateItems((items) => {
      const sub = items[itemIndex]?.subComponents?.[subIndex];
      if (!sub) return;
      sub.specs = sub.specs || [];
      sub.specs.push({ label: "", value: "" });
    });
  };

  const removeSpecItem = (itemIndex: number, subIndex: number, specIndex: number) => {
    updateItems((items) => {
      const specs = items[itemIndex]?.subComponents?.[subIndex]?.specs;
      if (specs) {
        specs.splice(specIndex, 1);
      }
    });
  };

  const moveSpecItem = (itemIndex: number, subIndex: number, specIndex: number, direction: "up" | "down") => {
    updateItems((items) => {
      const specs = items[itemIndex]?.subComponents?.[subIndex]?.specs;
      if (!specs) return;
      const targetIndex = direction === "up" ? specIndex - 1 : specIndex + 1;
      if (targetIndex < 0 || targetIndex >= specs.length) return;
      const [moved] = specs.splice(specIndex, 1);
      specs.splice(targetIndex, 0, moved);
    });
  };

  const moveItem = (itemIndex: number, direction: "up" | "down") => {
    updateItems((items) => {
      const targetIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return;
      const [moved] = items.splice(itemIndex, 1);
      items.splice(targetIndex, 0, moved);
      items.forEach((it, idx) => {
        it.itemNo = String(idx + 1);
      });
    });
  };

  const parseTextToSpecs = (itemIndex: number) => {
    const text = form.getValues(`items.${itemIndex}.specification`);
    if (!text || !text.includes(":")) {
      alert("Masukkan teks dengan format 'Label : Nilai' per baris.");
      return;
    }
    const lines = text.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
    const subComponents: any[] = [];
    let currentComp = { name: "", qty: "", specs: [] as any[] };

    for (const line of lines) {
      if (line.includes(":")) {
        const idx = line.indexOf(":");
        const label = line.slice(0, idx).trim().replace(/^[-*•\d+.]\s*/, "");
        const value = line.slice(idx + 1).trim();
        if (!currentComp.name && subComponents.length === 0) {
          currentComp = { name: "Spesifikasi Teknis", qty: "", specs: [] };
          subComponents.push(currentComp);
        }
        currentComp.specs.push({ label, value });
      } else {
        const name = line.replace(/^[-*•]\s*/, "").trim();
        currentComp = { name, qty: "", specs: [] };
        subComponents.push(currentComp);
      }
    }

    if (subComponents.length > 0) {
      updateItems((items) => {
        items[itemIndex].subComponents = subComponents;
        items[itemIndex].specification = "";
      });
    }
  };

  const loadSampleDustCollector = () => {
    form.reset({
      docType: "PENAWARAN",
      docNumber: "STS/SPH/SSG/09/10/26",
      date: "09 Oktober 2026",
      clientName: "PT. Maju Bersama",
      clientAddress: "",
      titleQuotation: "Pembuatan Baru Dust Collector",
      clientAttn: "Ibu Giacinta",
      clientPhone: "-",
      clientEmail: "-",
      clientCc: "-",
      leadTime: "1 Bulan",
      paymentTerms: "40% DP\n60% setelah selesai pekerjaan",
      note: "Harga belum termasuk instalasi luar kota jika ada.",
      nonPpn: true,
      includeBriAccount: false,
      includeLeadTime: true,
      includeNote: true,
      poNumber: "",
      terbilang: "",
      downPayment: 0,
      remainingPayment: 0,
      baType: "PENYELESAIAN",
      baCompletionDate: "",
      baDpPercent: "",
      baPoDate: "",
      baDateSpellout: "",
      totalAmount: 600000000,
      items: [
        {
          itemNo: "1",
          description: "Dust Collector Unit 1",
          specification: "",
          qty: "",
          unitPrice: 320000000,
          subTotal: 320000000,
          subComponents: [
            {
              name: "Centrifugal Fan",
              qty: "1 Set",
              specs: [
                { label: "Type", value: "NS-55A-70" },
                { label: "Capacity", value: "245m³/min" },
                { label: "Static Pressure", value: "255 mmAq" },
                { label: "Rotation", value: "1860 RPM" },
                { label: "BKW", value: "14,1 Kw" },
                { label: "Electro Motor", value: "15 Kw/380v/4 Pole/50 Hz/3PH" },
                { label: "Material", value: "Mild Steel" },
                { label: "Accessories", value: "Pully Taper Lock System Merk Martin, V-Belt Merk Optibelt, Bearing SKF, Support Chimney" },
                { label: "Outlet Fan Dimensi", value: "Ø 550mm" },
              ],
            },
            {
              name: "Dust Collector",
              qty: "",
              specs: [
                { label: "Type", value: "Pulse Jet" },
                { label: "Model", value: "PJ – 80" },
                { label: "Inlet Temperatur", value: "30 C" },
                { label: "Inlet Dust", value: "Dry & Fine Powder" },
                { label: "Filter Bag Dimention", value: "Ø180 x 2800 mm" },
                { label: "Filter Area/Bag", value: "1,406 M2" },
                { label: "No. of Bag", value: "80pcs" },
                { label: "Total Filter Area (m2)", value: "112,48 m2" },
                { label: "Air to cloth ratio (m/min)", value: "2,68 m2" },
                { label: "Filter Bag Material", value: "Polyster Anti Static needlefalt 500gr/m2" },
              ],
            },
          ],
        },
        {
          itemNo: "2",
          description: "Dust Colletor Unit 2",
          specification: "",
          qty: "1 Set",
          unitPrice: 280000000,
          subTotal: 280000000,
          subComponents: [
            {
              name: "CENTRIFUGAL FAN",
              qty: "1 Unit",
              specs: [
                { label: "Type", value: "NS-55A-66" },
                { label: "Capacity", value: "153 m³ / min" },
                { label: "Static Pressure", value: "260 mmAq" },
                { label: "Rotation", value: "2190 Rpm" },
                { label: "BKW", value: "13,2 Kw" },
                { label: "Electro Motor", value: "15 Kw 380V 4Pole 50 Hz 3PH" },
                { label: "Material", value: "Mild Steel" },
                { label: "Accessories", value: "Pully Taper Lock System Merk 'Martin', V-Belt Merk Optibelt, Bearing Merk SKF, Support Chimney" },
                { label: "Outlet Fan Dimensi", value: "Ø 500 mm" },
              ],
            },
            {
              name: "DUST COLLECTOR UNIT",
              qty: "One (1) Unit",
              specs: [
                { label: "Type", value: "Pulse Jet" },
                { label: "Model", value: "PJ - 60" },
                { label: "Inlet Temperatur", value: "30 ℃" },
                { label: "Inlet Dust", value: "Dry & Fine Powder" },
                { label: "Filter bag dimension", value: "Ø 180 X 2800 MM" },
                { label: "Filter area/ bag", value: "1,406 M2" },
                { label: "No. of bag", value: "60 Pcs" },
                { label: "Total filter area (m2)", value: "84,4 m²" },
                { label: "Air to cloth ratio (m/min)", value: "2,68 M2" },
                { label: "Filter bag material", value: "Polyster Anti Static needlefalt 500 gr/m²" },
                { label: "Dust Collector Inlet Size", value: "Ø 600 mm" },
                { label: "Compressed air Requirement", value: "7 Bar" },
                { label: "No. of pulsing valve", value: "6 Pcs (1,5\")" },
                { label: "No. of Timer Control", value: "1Pc" },
                { label: "Type Of Timer Control", value: "Sequential Pulsing Timer Control" },
                { label: "Electric Timer Input Voltage", value: "24 VAC / 50Hz" },
                { label: "Expected efficiency", value: "99,99% on 0,5 micron" },
                { label: "Approximate overall dimension", value: "1250 x 1650 x 5800 mm Ht" },
                { label: "Material of construction", value: "Mild Steel 3mm Thk" },
                { label: "Finishing Colour", value: "kansai Paint" },
                { label: "Approximate Weight", value: "3800 Kg" },
                { label: "Accessories", value: "Differensial Pressure 'Magnahelic' Pressure Gauge : Seleniod" },
              ],
            },
            {
              name: "ROTARY VALVE",
              qty: "",
              specs: [
                { label: "Dimension", value: "Ø 280 x 300 mm" },
                { label: "Material", value: "SGP" },
                { label: "Output Gear", value: "0,75 Kw (motor Vario)" },
                { label: "Output Rotation", value: "45 Rpm" },
              ],
            },
            {
              name: "CONTROL PANEL VSD",
              qty: "",
              specs: [
                { label: "Maker", value: "Fuji Electric" },
                { label: "Inverter", value: "15 Kw 'LG / Setara'" },
                { label: "Ampere Meter", value: "1" },
                { label: "MCCB", value: "50 A 'Fuji Electric / Setara'" },
                { label: "PLC", value: "Fuji Electric" },
                { label: "Contactor", value: "Fuji Electric" },
              ],
            },
            {
              name: "Pemasangan Pipa Kompressor untuk Sistem pulse jet",
              qty: "",
              specs: [
                { label: "Ukuran", value: "10 Mtr (Lengkap Dengan Aksesoris)" },
              ],
            },
          ],
        },
      ],
    });
    setExpandedItems({ 0: true, 1: true });
    setRenderKey((k) => k + 1);
  };

  const loadSampleHandwrittenNote = () => {
    form.reset({
      docType: "PENAWARAN",
      docNumber: "STS/SPH/SSG/09/10/26",
      date: "09 Oktober 2026",
      clientName: "PT. Maju Bersama",
      clientAddress: "",
      titleQuotation: "Buat Baru CENTRIFUGAL FAN TYPE KT",
      clientAttn: "Bp. Joko",
      clientPhone: "-",
      clientEmail: "-",
      clientCc: "-",
      leadTime: "1 Bulan",
      paymentTerms: "40% DP\n60% setelah selesai pekerjaan",
      note: "Harga per unit (tidak termasuk instalasi). Pengiriman: Jabodetabek.",
      nonPpn: true,
      includeBriAccount: false,
      includeLeadTime: true,
      includeNote: true,
      poNumber: "",
      terbilang: "",
      downPayment: 0,
      remainingPayment: 0,
      baType: "PENYELESAIAN",
      baCompletionDate: "",
      baDpPercent: "",
      baPoDate: "",
      baDateSpellout: "",
      totalAmount: 251000000,
      items: [
        {
          itemNo: "1",
          description: "Centrifugal Fan",
          specification: "",
          qty: "1 Unit",
          unitPrice: 124000000,
          subTotal: 124000000,
          subComponents: [
            {
              name: "Centrifugal Fan Type KT 4 1/2",
              qty: "1 Unit",
              specs: [
                { label: "Type", value: "KT 4 1/2" },
                { label: "Capacity", value: "8000 CMH / 133 M³/min" },
                { label: "Static Pressure", value: "500 Pa / 50 mmAq" },
                { label: "Power", value: "3 Kw / 4 Pole / 380 V / TECO" },
                { label: "Rotation", value: "950 RPM" },
                { label: "Model", value: "Belt drive" },
                { label: "Dimension", value: "P. 1200 x L. 1100 x H. 1080" },
                { label: "Material Casing", value: "SUS 304" },
                { label: "Material Impeller", value: "SUS 304" },
                { label: "Material Shaft", value: "SUS 304" },
                { label: "Pully Fan", value: "Martin Ø 360 / 14 Inch" },
                { label: "Pully Motor", value: "Martin Ø 230 / 9 Inch" },
                { label: "Bearing", value: "UKP" },
              ],
            },
          ],
        },
        {
          itemNo: "2",
          description: "Centrifugal Fan",
          specification: "",
          qty: "1 Unit",
          unitPrice: 127000000,
          subTotal: 127000000,
          subComponents: [
            {
              name: "Centrifugal Fan Type KT 4",
              qty: "1 Unit",
              specs: [
                { label: "Type", value: "KT 4" },
                { label: "Capacity", value: "10.000 CMH / 166 M³/min" },
                { label: "Static Pressure", value: "2500 Pa / 250 mmAq" },
                { label: "Power", value: "11 Kw / 2 Pole / 3 Phase / 380 V / TECO" },
                { label: "Rotation", value: "2160 RPM" },
                { label: "Model", value: "Belt drive" },
                { label: "Dimension", value: "P. 1065 x L. 1000 x H. 970" },
                { label: "Material Casing", value: "SUS 304" },
                { label: "Material Impeller", value: "SUS 304" },
                { label: "Material Shaft", value: "SUS 304" },
                { label: "Pully Fan", value: "Martin Ø 200 / 8 Inch" },
                { label: "Pully Motor", value: "Martin Ø 153 / 6 Inch" },
                { label: "Bearing", value: "SN SKF" },
              ],
            },
          ],
        },
      ],
    });
    setExpandedItems({ 0: true, 1: true });
    setRenderKey((k) => k + 1);
  };

  const loadSampleGiacintaHandwrittenNote = () => {
    form.reset({
      docType: "PENAWARAN",
      docNumber: "STS/SPH/SSG/19/10/26",
      date: "19 Oktober 2026",
      clientName: "PT. Maju Bersama",
      clientAddress: "",
      titleQuotation: "Buat Baru Dust Collector Unit Ducting & Hood",
      clientAttn: "Ibu Giacinta",
      clientPhone: "-",
      clientEmail: "-",
      clientCc: "-",
      leadTime: "1 Bulan",
      paymentTerms: "40% DP\n60% setelah selesai pekerjaan",
      note: "- Waktu Pengadaan barang 1 Bulan\n- Waktu Instal Menyesuaikan dilapangan",
      nonPpn: true,
      includeBriAccount: false,
      includeLeadTime: true,
      includeNote: true,
      poNumber: "",
      terbilang: "",
      downPayment: 0,
      remainingPayment: 0,
      baType: "PENYELESAIAN",
      baCompletionDate: "",
      baDpPercent: "",
      baPoDate: "",
      baDateSpellout: "",
      totalAmount: 326700000,
      items: [
        {
          itemNo: "1",
          description: "DUST COLLECTOR",
          specification: "",
          qty: "1 Unit",
          unitPrice: 290900000,
          subTotal: 290900000,
          subComponents: [
            {
              name: "Dust Collector Unit",
              qty: "1 Unit",
              specs: [
                { label: "Type / Model", value: "SACHER" },
                { label: "Material Casing", value: "Mild steel 2 mm" },
                { label: "Dimension DC", value: "1700 x 900 x 3000" },
                { label: "Foot Support / Catwalk", value: "UNP 150" },
                { label: "Base Plate", value: "6 mm" },
                { label: "Brecing Foot", value: "Siku 50 x 50" },
              ],
            },
          ],
        },
        {
          itemNo: "2",
          description: "Centrifugal Fan",
          specification: "TYPE KT 4",
          qty: "1 Pcs",
          unitPrice: 0,
          subTotal: 0,
          subComponents: [
            {
              name: "Centrifugal Fan Type KT 4",
              qty: "1 Pcs",
              specs: [
                { label: "Capacity", value: "123 m³/min" },
                { label: "Static Pressure", value: "125 mm Aq" },
                { label: "Power", value: "5.5 Kw / 4 Pole / 3 Phase / TECO" },
                { label: "Rotation", value: "1560 RPM" },
              ],
            },
          ],
        },
        {
          itemNo: "3",
          description: "Hood",
          specification: "",
          qty: "3 Pcs",
          unitPrice: 0,
          subTotal: 0,
          subComponents: [
            {
              name: "Hood",
              qty: "3 Pcs",
              specs: [
                { label: "Dimension", value: "1000 x 500 x H 500" },
                { label: "Material", value: "SUS 304 / 1.2 mm" },
              ],
            },
          ],
        },
        {
          itemNo: "4",
          description: "Ducting",
          specification: "",
          qty: "1 Lot",
          unitPrice: 0,
          subTotal: 0,
          subComponents: [
            {
              name: "Ducting System",
              qty: "1 Lot",
              specs: [
                { label: "Components", value: "Moncong, Cabang, Elbow" },
                { label: "Material", value: "BJLS 0.8" },
              ],
            },
          ],
        },
        {
          itemNo: "5",
          description: "Jasa Instal",
          specification: "",
          qty: "1 Lot",
          unitPrice: 31000000,
          subTotal: 31000000,
          subComponents: [],
        },
        {
          itemNo: "6",
          description: "Transportasi",
          specification: "",
          qty: "1 Lot",
          unitPrice: 4800000,
          subTotal: 4800000,
          subComponents: [],
        },
      ],
    });
    setExpandedItems({ 0: true, 1: true, 2: true, 3: true, 4: true, 5: true });
    setRenderKey((k) => k + 1);
  };

  const loadSampleWorkshopTigori = () => {
    form.reset({
      docType: "PENAWARAN",
      docNumber: "028/STS/QUO/X/2026",
      date: "30 Oktober 2026",
      clientName: "PT. Tigori Mitra Asasta",
      clientAddress: "",
      titleQuotation: "Penyewaan Tempat Workshop",
      clientAttn: "Bp. Aan Tigori",
      clientPhone: "-",
      clientEmail: "-",
      clientCc: "-",
      leadTime: "1 Bulan",
      paymentTerms: "100% Pembayaran di Muka",
      note: "Penyewaan area kerja / workshop.",
      nonPpn: true,
      includeBriAccount: true,
      poNumber: "",
      terbilang: "",
      downPayment: 0,
      remainingPayment: 0,
      baType: "PENYELESAIAN",
      baCompletionDate: "",
      baDpPercent: "",
      baPoDate: "",
      baDateSpellout: "",
      totalAmount: 10000000,
      items: [
        {
          itemNo: "1",
          description: "Penyewaan Tempat Workshop",
          specification: "",
          qty: "1 Bulan",
          unitPrice: 10000000,
          subTotal: 10000000,
          subComponents: [
            {
              name: "Lingkup Fasilitas Workshop",
              qty: "1 Bulan",
              specs: [
                { label: "Peruntukan / Fasilitas", value: "Area Kerja / Workshop" },
                { label: "Durasi Sewa", value: "1 (Satu) Bulan" },
                { label: "Kondisi", value: "Siap Pakai" },
              ],
            },
          ],
        },
      ],
    });
    setExpandedItems({ 0: true });
    setRenderKey((k) => k + 1);
  };

  const convertToInvoice = () => {
    const currentNum = form.getValues("docNumber") || "";
    const invNum = currentNum.replace(/^STS\/SPH\//i, "STS/INV/").replace(/^STS\/Q\//i, "STS/INV/") || "STS/INV/2026/001";
    form.setValue("docType", "INVOICE");
    form.setValue("docNumber", invNum);
    if (!form.getValues("poNumber")) {
      form.setValue("poNumber", "-");
    }
    setRenderKey((k) => k + 1);
  };

  const loadSampleInvoiceArtaIndoasia = () => {
    form.reset({
      docType: "INVOICE",
      docNumber: "STS/SPH/010/011/26.",
      date: "10 November 2026",
      clientName: "PT. ARTA INDOASIA",
      clientAddress: "Jl. Orchard Avenue, Cluster Garden Hous Blok BG1 No.87\nGrand Wisata, Tambun, Bekasi – 17510",
      clientAttn: "Bp. Arip",
      clientPhone: "-",
      clientEmail: "-",
      clientCc: "-",
      poNumber: "",
      terbilang: "enam juta tujuh ratus lima puluh ribu rupiah",
      titleQuotation: "Repair Impeller Siroco Diameter 630",
      leadTime: "-",
      paymentTerms: "100% Pembayaran",
      note: "",
      nonPpn: true,
      includeBriAccount: false,
      includeLeadTime: false,
      includeNote: false,
      downPayment: 0,
      remainingPayment: 0,
      baType: "PENYELESAIAN",
      baCompletionDate: "",
      baDpPercent: "",
      baPoDate: "",
      baDateSpellout: "",
      totalAmount: 6750000,
      items: [
        {
          itemNo: "1",
          description: "Impeler / Kipas",
          specification: "- Type: Siroco Ø630",
          qty: "1.00 Lot",
          unitPrice: 6750000,
          subTotal: 6750000,
          subComponents: [
            {
              name: "Blade / Sirip",
              qty: "",
              specs: [
                { label: "Dimensi / Ukuran", value: "320 x 65 x 2 mm" },
                { label: "Material", value: "SUS 304 / 2 mm" },
              ],
            },
            {
              name: "AS Slut",
              qty: "3.00 Pcs",
              specs: [
                { label: "Dimensi / Ukuran", value: "Ø 16 x P. 520 mm" },
                { label: "Material", value: "SUS" },
              ],
            },
          ],
        },
        {
          itemNo: "2",
          description: "Cleaning Kipas",
          specification: "",
          qty: "1.00 Pcs",
          unitPrice: 0,
          subTotal: 0,
          subComponents: [],
        },
        {
          itemNo: "3",
          description: "Balancing",
          specification: "",
          qty: "",
          unitPrice: 0,
          subTotal: 0,
          subComponents: [],
        },
      ],
    });
    setExpandedItems({ 0: true, 1: true, 2: true });
    setRenderKey((k) => k + 1);
  };

  const loadSampleInvoiceShinanoa = () => {
    form.reset({
      docType: "INVOICE",
      docNumber: "036/STS/INV/XI/2026",
      date: "18 November 2026",
      clientName: "PT. SHINANOA Indonesia",
      clientAddress: "JL. Kenari Raya Blok D No. 06, Delta Commercial Park 2\nKawasan Industri Delta Silicon 6, Lippo Cikarang\nJayamukti, Kab. Bekasi, Jawa Barat 17530",
      clientAttn: "Ito Takayuki (President Director)",
      clientPhone: "021-29093830",
      clientEmail: "-",
      clientCc: "-",
      poNumber: "2026/SNI/XI/2292",
      terbilang: "Empat Puluh Tiga Juta Rupiah",
      titleQuotation: "Control Box Burner Eclips Small Part Area",
      leadTime: "19 Nov 2026",
      paymentTerms: "Net 30",
      note: "Ref. SPH: STS/SPH/SSG/036/10/2026 | PO No: 2026/SNI/XI/2292",
      nonPpn: true,
      includeBriAccount: false,
      includeLeadTime: false,
      includeNote: false,
      downPayment: 0,
      remainingPayment: 0,
      baType: "PENYELESAIAN",
      baCompletionDate: "",
      baDpPercent: "",
      baPoDate: "",
      baDateSpellout: "",
      totalAmount: 43000000,
      items: [
        {
          itemNo: "1",
          description: "Control Box Burner Eclips Small Part Area",
          specification: "- Ref. Penawaran: STS/SPH/SSG/036/10/2026 (for SCMIN)",
          qty: "1.00 Set",
          unitPrice: 43000000,
          subTotal: 43000000,
          subComponents: [],
        },
      ],
    });
    setExpandedItems({ 0: true });
    setRenderKey((k) => k + 1);
  };

  const loadSampleArtaIndoasia = () => {
    form.reset({
      docType: "PENAWARAN",
      docNumber: "029/STS/QUO/XI/2026",
      date: "05 November 2026",
      clientName: "PT. Arta Indoasia",
      clientAddress: "",
      titleQuotation: "Repair Impeller Siroco Diameter 630",
      clientAttn: "Bp. Arip",
      clientPhone: "-",
      clientEmail: "-",
      clientCc: "-",
      leadTime: "1-2 Minggu",
      paymentTerms: "100% Pembayaran Setelah Selesai",
      note: "Pekerjaan repair impeller, cleaning kipas, dan balancing.",
      nonPpn: true,
      includeBriAccount: false,
      includeLeadTime: true,
      includeNote: true,
      poNumber: "",
      terbilang: "Lima Juta Tujuh Ratus Lima Puluh Ribu Rupiah",
      downPayment: 0,
      remainingPayment: 0,
      baType: "PENYELESAIAN",
      baCompletionDate: "",
      baDpPercent: "",
      baPoDate: "",
      baDateSpellout: "",
      totalAmount: 5750000,
      items: [
        {
          itemNo: "1",
          description: "Impeller / Kipas",
          specification: "TYPE SIROCO ∅ 630",
          qty: "1 Unit",
          unitPrice: 5750000,
          subTotal: 5750000,
          subComponents: [
            {
              name: "Blade / Sirip",
              qty: "23 pcs",
              specs: [
                { label: "Dimensi / Ukuran", value: "320 x 65 x 2 mm" },
                { label: "Material", value: "SUS 304 / 2 mm" },
              ],
            },
            {
              name: "As / Stut",
              qty: "3 pcs",
              specs: [
                { label: "Dimensi / Ukuran", value: "Ø 16 x P. 520 mm" },
                { label: "Material", value: "SUS" },
              ],
            },
          ],
        },
        {
          itemNo: "2",
          description: "Cleaning Kipas",
          specification: "-",
          qty: "1 pcs",
          unitPrice: 0,
          subTotal: 0,
          subComponents: [],
        },
        {
          itemNo: "3",
          description: "Balancing",
          specification: "-",
          qty: "1 Lot",
          unitPrice: 0,
          subTotal: 0,
          subComponents: [],
        },
      ],
    });
    setExpandedItems({ 0: true, 1: true, 2: true });
    setRenderKey((k) => k + 1);
  };

  const loadSampleGunturBerkatUtama = () => {
    form.reset({
      docType: "PENAWARAN",
      docNumber: "030/STS/QUO/XI/2026",
      date: "14 November 2026",
      clientName: "PT. Guntur Berkat Utama",
      clientAddress: "",
      titleQuotation: "Balancing On Site Blower",
      clientAttn: "Bp. Didu",
      clientPhone: "-",
      clientEmail: "-",
      clientCc: "-",
      leadTime: "",
      paymentTerms: "100% Pembayaran Setelah Selesai Pekerjaan",
      note: "Pekerjaan dynamic balancing dilakukan langsung di lokasi (On Site).",
      nonPpn: true,
      includeBriAccount: false,
      includeLeadTime: false,
      includeNote: true,
      poNumber: "",
      terbilang: "Lima Juta Rupiah",
      downPayment: 0,
      remainingPayment: 0,
      baType: "PENYELESAIAN",
      baCompletionDate: "",
      baDpPercent: "",
      baPoDate: "",
      baDateSpellout: "",
      totalAmount: 5000000,
      items: [
        {
          itemNo: "1",
          description: "Impeller Type KT",
          specification: "Φ 900",
          qty: "1 Pcs",
          unitPrice: 5000000,
          subTotal: 5000000,
          subComponents: [
            {
              name: "Lingkup Pekerjaan Balancing On Site",
              qty: "1 Lot",
              specs: [
                { label: "Jenis Blower", value: "Impeller Type KT" },
                { label: "Dimensi Impeller", value: "Diameter Φ 900 mm" },
                { label: "Lokasi Pengerjaan", value: "On Site (Di Lokasi Pabrik / Workshop Klien)" },
              ],
            },
          ],
        },
      ],
    });
    setExpandedItems({ 0: true });
    setRenderKey((k) => k + 1);
  };

  const loadSampleBaPenyelesaianProfiklin = () => {
    form.reset({
      docType: "BERITA_ACARA",
      docNumber: "BA-1-001-012-PC-2025",
      date: "1 Desember 2025",
      clientName: "PT. Profiklin Cemerlang",
      clientAddress: "Taman Tekno Industrial Park BSD Blok J1 No.7\nSerpong - 15314",
      clientAttn: "Bpk. Riyadh",
      clientPhone: "021 – 758 759 88",
      clientEmail: "-",
      clientCc: "-",
      leadTime: "-",
      paymentTerms: "-",
      note: "",
      nonPpn: true,
      includeBriAccount: false,
      includeLeadTime: false,
      includeNote: false,
      poNumber: "073/PO/PC/11112025",
      terbilang: "",
      downPayment: 0,
      remainingPayment: 0,
      totalAmount: 136500000,
      titleQuotation: "Ducting Inlet & Dumper",
      baType: "PENYELESAIAN",
      baCompletionDate: "27 November 2025",
      baDpPercent: "",
      baPoDate: "",
      baDateSpellout: "",
      items: [
        {
          itemNo: "1",
          description: "Ducting Inlet & Dumper",
          specification: "Pekerjaan Ducting Inlet & Dumper progress 100% selesai",
          qty: "1 Lot",
          unitPrice: 136500000,
          subTotal: 136500000,
          subComponents: [],
        },
      ],
    });
    setExpandedItems({ 0: true });
    setRenderKey((k) => k + 1);
  };

  const loadSampleBaDpMmid = () => {
    form.reset({
      docType: "BERITA_ACARA",
      docNumber: "BA-DP-1-013-005-MMID-2026",
      date: "13 Mei 2026",
      clientName: "PT Megalopolis Manunggal Industrial Development",
      clientAddress: "Kawasan Industri MM2100, Cikarang Barat, Bekasi 17520",
      clientAttn: "Zubaidi Akhmad",
      clientPhone: "-",
      clientEmail: "-",
      clientCc: "-",
      leadTime: "-",
      paymentTerms: "40% DP",
      note: "",
      nonPpn: true,
      includeBriAccount: false,
      includeLeadTime: false,
      includeNote: false,
      poNumber: "200/PUR/V/2026",
      terbilang: "Dua Ratus Enam Puluh Juta Rupiah",
      downPayment: 260000000,
      remainingPayment: 390000000,
      totalAmount: 650000000,
      titleQuotation: "Screw Conveyor",
      baType: "DP",
      baCompletionDate: "",
      baDpPercent: "40% (empat puluh persen)",
      baPoDate: "8 Mei",
      baDateSpellout: "",
      items: [
        {
          itemNo: "1",
          description: "Project Screw Conveyor",
          specification: "Pembayaran Uang Muka (Down Payment) 40%",
          qty: "1 Lot",
          unitPrice: 650000000,
          subTotal: 650000000,
          subComponents: [],
        },
      ],
    });
    setExpandedItems({ 0: true });
    setRenderKey((k) => k + 1);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setExtractStatus("Mengirim dokumen ke Groq Vision AI...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setExtractStatus("Menganalisis tulisan tangan & tabel dengan Vision AI...");

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || "Gagal mengekstrak data");
      }

      form.reset({
        clientAddress: '',
        baType: 'PENYELESAIAN',
        baCompletionDate: '',
        baDpPercent: '',
        baPoDate: '',
        baDateSpellout: '',
        ...data
      });
      const expanded: Record<number, boolean> = {};
      (data.items || []).forEach((_: any, idx: number) => {
        expanded[idx] = true;
      });
      setExpandedItems(expanded);
      setRenderKey((k) => k + 1);
    } catch (error: any) {
      console.error(error);
      alert("Error ekstraksi dokumen: " + (error.message || "Silakan coba lagi."));
    } finally {
      setIsExtracting(false);
      setExtractStatus("Mengekstrak data...");
    }
  };

  const onSubmit = async (data: ExtractedDocument) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.details || errJson.error || "Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeNum = (data.docNumber || "document").replace(/[\/\\:*?"<>|]/g, "_");
      a.download = `${data.docType}_${safeNum}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error(error);
      alert("Error generating PDF: " + (error.message || "Please try again."));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">STS Document & Quotation Generator</h1>
          <p className="text-sm text-gray-500 mt-1">
            Format resmi Microsoft Word (CV. Surya Terang Sejahtera) dengan spesifikasi teknis lengkap & stempel resmi.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={loadSampleGiacintaHandwrittenNote}
            className="flex items-center gap-2 border-purple-200 bg-purple-50/60 hover:bg-purple-100/60 text-purple-800 text-xs sm:text-sm font-medium"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            Load Coretan Tangan (Ibu Giacinta)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={loadSampleHandwrittenNote}
            className="flex items-center gap-2 border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 text-emerald-800 text-xs sm:text-sm font-medium"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Load Coretan Tangan (Bp. Joko)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={loadSampleInvoiceArtaIndoasia}
            className="flex items-center gap-2 border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-900 text-xs sm:text-sm font-semibold shadow-xs"
          >
            <ReceiptText className="w-4 h-4 text-emerald-600" />
            Load Invoice (PT. Arta Indoasia)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={loadSampleInvoiceShinanoa}
            className="flex items-center gap-2 border-emerald-400 bg-emerald-100/70 hover:bg-emerald-200/70 text-emerald-950 text-xs sm:text-sm font-semibold shadow-xs"
          >
            <ReceiptText className="w-4 h-4 text-emerald-700" />
            Load Invoice dari PO (PT. Shinanoa)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={loadSampleArtaIndoasia}
            className="flex items-center gap-2 border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-900 text-xs sm:text-sm font-medium"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Load Repair Impeller (PT. Arta Indoasia)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={loadSampleGunturBerkatUtama}
            className="flex items-center gap-2 border-sky-300 bg-sky-50/80 hover:bg-sky-100/80 text-sky-900 text-xs sm:text-sm font-semibold shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-sky-600" />
            Load Balancing On Site (PT. Guntur Berkat Utama)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={loadSampleWorkshopTigori}
            className="flex items-center gap-2 border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 text-amber-900 text-xs sm:text-sm font-medium"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            Load Sewa Workshop (PT. Tigori)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={loadSampleDustCollector}
            className="flex items-center gap-2 border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 text-xs sm:text-sm font-medium"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            Load Dust Collector Sample
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={loadSampleBaPenyelesaianProfiklin}
            className="flex items-center gap-2 border-teal-300 bg-teal-50/80 hover:bg-teal-100/80 text-teal-900 text-xs sm:text-sm font-semibold shadow-xs"
          >
            <FileText className="w-4 h-4 text-teal-600" />
            Load BA Penyelesaian (PT. Profiklin)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={loadSampleBaDpMmid}
            className="flex items-center gap-2 border-rose-300 bg-rose-50/80 hover:bg-rose-100/80 text-rose-900 text-xs sm:text-sm font-semibold shadow-xs"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            Load BA Pembayaran DP (PT. MMID)
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Card */}
        <div className="lg:col-span-4">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Upload Scan / Dokumen</CardTitle>
              <CardDescription>Upload gambar dokumen Word/Scan untuk ekstraksi otomatis dengan OCR & Groq AI</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="file-upload"
                  onChange={handleFileUpload}
                  disabled={isExtracting}
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                      <span className="text-sm font-medium text-blue-600 animate-pulse">{extractStatus}</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
                      <span className="text-sm font-medium text-gray-700">Klik untuk upload foto / scan</span>
                      <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</span>
                    </>
                  )}
                </label>
              </div>

              <div className="mt-6 border-t pt-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Template Format Aktif:
                </div>
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">
                    {docType === "PENAWARAN" ? "Penawaran Harga (format-quotation.docx)" : "Invoice Resmi STS (Surya Terang Sejahtera)"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit & Generate Card */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detail Data Dokumen</CardTitle>
              <CardDescription>Periksa dan sesuaikan detail sebelum mengunduh PDF format Word resmi.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* General Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-semibold">Tipe Dokumen</Label>
                      {docType === "PENAWARAN" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={convertToInvoice}
                          className="h-6 px-2 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center gap-1 rounded"
                          title="Ubah dokumen penawaran ini langsung menjadi Invoice resmi"
                        >
                          <ReceiptText className="w-3 h-3 text-blue-600" /> Jadikan Invoice
                        </Button>
                      )}
                    </div>
                    <Select
                      value={form.watch("docType")}
                      onValueChange={(val: any) => form.setValue("docType", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Tipe Dokumen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENAWARAN">Penawaran Harga (Quotation)</SelectItem>
                        <SelectItem value="INVOICE">Invoice</SelectItem>
                        <SelectItem value="PO">Purchase Order (PO)</SelectItem>
                        <SelectItem value="BERITA_ACARA">Berita Acara</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">No. Dokumen</Label>
                    <Input {...form.register("docNumber")} placeholder="STS/SPH/SSG/09/10/26" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Tanggal</Label>
                    <Input {...form.register("date")} placeholder="09 Oktober 2026" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Nama Klien / Perusahaan (To)</Label>
                    <Input {...form.register("clientName")} placeholder="PT. Maju Bersama" />
                  </div>
                </div>

                {/* Quotation Specific Section */}
                {docType === "PENAWARAN" && (
                  <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-lg space-y-4">
                    <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      Detail Khusus Penawaran Harga
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Judul / Subjek Penawaran (untuk "...")</Label>
                      <Input
                        {...form.register("titleQuotation")}
                        placeholder='Contoh: Pembuatan Baru Dust Collector'
                        className="bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Attn (Penerima)</Label>
                        <Input {...form.register("clientAttn")} placeholder="Ibu Giacinta" className="bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">CC (Tembusan)</Label>
                        <Input {...form.register("clientCc")} placeholder="Kosongkan jika tidak ada" className="bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Phone (Klien)</Label>
                        <Input {...form.register("clientPhone")} placeholder="-" className="bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Email (Klien)</Label>
                        <Input {...form.register("clientEmail")} placeholder="-" className="bg-white" />
                      </div>
                    </div>

                    {/* Waktu Pengadaan & Catatan (Checklist Controls) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2 bg-white/80 p-3 rounded-md border border-blue-100/80 shadow-2xs">
                        <div className="flex items-center justify-between border-b pb-1.5">
                          <label htmlFor="includeLeadTime" className="text-xs font-semibold text-gray-800 flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              id="includeLeadTime"
                              {...form.register("includeLeadTime")}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>Waktu Pengadaan</span>
                          </label>
                          <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${form.watch("includeLeadTime") ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                            {form.watch("includeLeadTime") ? "Dimunculkan" : "Disembunyikan"}
                          </span>
                        </div>
                        <Input
                          {...form.register("leadTime")}
                          placeholder="Contoh: 1 Bulan / 1-2 Minggu"
                          className="bg-white text-xs disabled:opacity-40"
                          disabled={!form.watch("includeLeadTime")}
                        />
                      </div>

                      <div className="space-y-2 bg-white/80 p-3 rounded-md border border-blue-100/80 shadow-2xs">
                        <div className="flex items-center justify-between border-b pb-1.5">
                          <label htmlFor="includeNote" className="text-xs font-semibold text-gray-800 flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              id="includeNote"
                              {...form.register("includeNote")}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>Catatan</span>
                          </label>
                          <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${form.watch("includeNote") ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                            {form.watch("includeNote") ? "Dimunculkan" : "Disembunyikan"}
                          </span>
                        </div>
                        <Input
                          {...form.register("note")}
                          placeholder="Catatan tambahan (contoh: Harga belum termasuk PPN...)"
                          className="bg-white text-xs disabled:opacity-40"
                          disabled={!form.watch("includeNote")}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Syarat Pembayaran</Label>
                      <Input
                        {...form.register("paymentTerms")}
                        placeholder="40% DP, 60% setelah selesai pekerjaan"
                        className="bg-white"
                      />
                    </div>

                    {/* Rekening Pembayaran Opsional (BRI) */}
                    <div className="pt-3 border-t border-blue-200/60">
                      <div className="flex items-start space-x-2.5 bg-white p-3 rounded-md border border-blue-100">
                        <input
                          type="checkbox"
                          id="includeBriAccount"
                          {...form.register("includeBriAccount")}
                          className="w-4 h-4 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="includeBriAccount" className="text-xs text-gray-700 cursor-pointer select-none space-y-0.5">
                          <span className="font-semibold text-gray-900 block">
                            Tambahkan Rekening Bank BRI di Bawah Bank Permata
                          </span>
                          <span className="text-gray-500 block">
                            Menampilkan rekening tambahan pada bagian bawah surat penawaran:
                            <br />
                            <strong className="text-gray-800">Agus Jumadi — BRI Rekening No. 3263-01-024013-53-3</strong>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Invoice Specific Section */}
                {docType === "INVOICE" && (
                  <div className="p-4 bg-gray-50 border rounded-lg space-y-3">
                    <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Detail Khusus Invoice
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">PO Number</Label>
                        <Input {...form.register("poNumber")} placeholder="PO/2026/001" className="bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Terbilang (Opsional - otomatis jika kosong)</Label>
                        <Input {...form.register("terbilang")} placeholder="enam juta tujuh ratus lima puluh ribu rupiah" className="bg-white" />
                      </div>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <Label className="text-xs font-semibold">Alamat Klien (Ditampilkan di Invoice)</Label>
                      <Input
                        {...form.register("clientAddress")}
                        placeholder="Jl. Orchard Avenue, Cluster Garden Hous Blok BG1 No.87, Grand Wisata, Tambun, Bekasi – 17510"
                        className="bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Down Payment / DP (Rp) - Opsional jika pembayaran bertahap</Label>
                        <Input
                          type="number"
                          {...form.register("downPayment", { valueAsNumber: true })}
                          placeholder="0 jika pelunasan full"
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Sisa Pembayaran (Rp) - Opsional</Label>
                        <Input
                          type="number"
                          {...form.register("remainingPayment", { valueAsNumber: true })}
                          placeholder="0 jika tidak ada sisa"
                          className="bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Berita Acara Specific Section */}
                {docType === "BERITA_ACARA" && (
                  <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-lg space-y-3">
                    <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center justify-between">
                      <span>Detail Khusus Berita Acara</span>
                      <span className="text-[11px] font-normal text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded">
                        Kop Resmi CV. STS + Stempel Otomatis
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Jenis Berita Acara</Label>
                      <Select
                        value={form.watch("baType") || "PENYELESAIAN"}
                        onValueChange={(val: any) => form.setValue("baType", val)}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Pilih Jenis Berita Acara" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENYELESAIAN">1. Berita Acara Penyelesaian Pekerjaan (Progress 100%)</SelectItem>
                          <SelectItem value="DP">2. Berita Acara Pembayaran DP (Down Payment)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Nama Pekerjaan / Project</Label>
                        <Input
                          {...form.register("titleQuotation")}
                          placeholder="Ducting Inlet & Dumper / Screw Conveyor"
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">No. PO / Kontrak</Label>
                        <Input
                          {...form.register("poNumber")}
                          placeholder="073/PO/PC/11112025"
                          className="bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Alamat Lengkap Perusahaan Klien</Label>
                      <Input
                        {...form.register("clientAddress")}
                        placeholder="Kawasan Industri MM2100, Cikarang Barat / Taman Tekno BSD"
                        className="bg-white"
                      />
                    </div>

                    {form.watch("baType") === "DP" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-indigo-100">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Persentase DP</Label>
                          <Input
                            {...form.register("baDpPercent")}
                            placeholder="40% (empat puluh persen)"
                            className="bg-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Tanggal PO / Kontrak</Label>
                          <Input
                            {...form.register("baPoDate")}
                            placeholder="8 Mei"
                            className="bg-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Nilai DP (Rp)</Label>
                          <Input
                            type="number"
                            {...form.register("downPayment", { valueAsNumber: true })}
                            placeholder="260000000"
                            className="bg-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-indigo-100">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Tanggal Selesai Pekerjaan</Label>
                          <Input
                            {...form.register("baCompletionDate")}
                            placeholder="27 November 2025 (Opsional - otomatis tanggal dokumen)"
                            className="bg-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">PIC / CC Klien</Label>
                          <Input
                            {...form.register("clientAttn")}
                            placeholder="Bpk. Riyadh"
                            className="bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Line Items & Specifications Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-bold">Daftar Item & Spesifikasi Teknis</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({
                          itemNo: String(fields.length + 1),
                          description: "",
                          specification: "",
                          qty: "1 Set",
                          unitPrice: 0,
                          subTotal: 0,
                          subComponents: [],
                        })
                      }
                    >
                      <Plus className="w-4 h-4 mr-1" /> Tambah Item
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {fields.map((field, index) => {
                      const isExpanded = !!expandedItems[index];
                      const subComps = form.watch(`items.${index}.subComponents`) || [];

                      return (
                        <div key={field.id} className="border rounded-lg p-3 bg-white space-y-3">
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-1">
                              <Label className="text-xs text-gray-500">No</Label>
                              <Input
                                {...form.register(`items.${index}.itemNo`)}
                                className="h-8 text-center text-xs"
                              />
                            </div>
                            <div className="col-span-4">
                              <Label className="text-xs text-gray-500">Description</Label>
                              <Input
                                {...form.register(`items.${index}.description`)}
                                placeholder="Dust Collector Unit 1"
                                className="h-8 text-xs font-medium"
                              />
                            </div>
                            <div className="col-span-1">
                              <Label className="text-xs text-gray-500">Q'ty</Label>
                              <Input
                                {...form.register(`items.${index}.qty`)}
                                placeholder="1 Set"
                                className="h-8 text-xs text-center"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs text-gray-500">Price/Unit (Rp)</Label>
                              <Input
                                type="number"
                                placeholder="0 (Kosongkan)"
                                {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                                className="h-8 text-xs text-right font-medium"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs text-gray-500">Total Price (Rp)</Label>
                              <Input
                                type="number"
                                {...form.register(`items.${index}.subTotal`, { valueAsNumber: true })}
                                className="h-8 text-xs text-right font-bold"
                              />
                            </div>
                            <div className="col-span-2 flex justify-end items-center gap-1 pt-4">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={index === 0}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 disabled:opacity-20"
                                onClick={() => moveItem(index, "up")}
                                title="Geser item ke atas"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={index === fields.length - 1}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 disabled:opacity-20"
                                onClick={() => moveItem(index, "down")}
                                title="Geser item ke bawah"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                                onClick={() => toggleExpand(index)}
                                title={isExpanded ? "Tutup rincian" : "Buka rincian"}
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                onClick={() => remove(index)}
                                title="Hapus item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Expandable Specification Details */}
                          {isExpanded && (
                            <div className="border-t pt-3 mt-2 bg-gray-50/80 p-3 rounded-md space-y-4">
                              {/* Quick text input and auto-parser */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <Label className="text-xs font-semibold text-gray-700">
                                    Spesifikasi Teks / Input Cepat (Format "Label : Nilai")
                                  </Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs flex items-center gap-1 text-blue-600 border-blue-200 bg-blue-50/60 hover:bg-blue-100/60"
                                    onClick={() => parseTextToSpecs(index)}
                                  >
                                    <Wand2 className="w-3.5 h-3.5" /> Konversi ke Baris Tabel
                                  </Button>
                                </div>
                                <Input
                                  {...form.register(`items.${index}.specification`)}
                                  placeholder="Contoh: Type : NS-55A-70 atau paste teks spesifikasi di sini..."
                                  className="h-8 text-xs bg-white"
                                />
                              </div>

                              {/* Interactive Subcomponents & Specs breakdown */}
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                    Rincian Spesifikasi Per Baris ({subComps.length} Bagian):
                                  </Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs flex items-center gap-1 border-gray-300 bg-white hover:bg-gray-50"
                                    onClick={() => addSubComponent(index)}
                                  >
                                    <ListPlus className="w-3.5 h-3.5 text-blue-600" /> + Tambah Bagian (Sub-Komponen)
                                  </Button>
                                </div>

                                {subComps.map((sub, sIdx) => (
                                  <div key={`sub-${renderKey}-${sIdx}`} className="bg-white border rounded-md p-3 space-y-2.5 shadow-xs">
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                      <div className="flex-1">
                                        <Label className="text-[11px] text-gray-500 font-semibold">Nama Bagian / Assembly</Label>
                                        <Input
                                          key={`sub-name-${renderKey}-${sIdx}`}
                                          {...form.register(`items.${index}.subComponents.${sIdx}.name`)}
                                          placeholder="Contoh: Centrifugal Fan / Dust Collector"
                                          className="h-7 text-xs font-bold bg-gray-50/50"
                                        />
                                      </div>
                                      <div className="w-24">
                                        <Label className="text-[11px] text-gray-500 font-semibold">Q'ty Bagian</Label>
                                        <Input
                                          key={`sub-qty-${renderKey}-${sIdx}`}
                                          {...form.register(`items.${index}.subComponents.${sIdx}.qty`)}
                                          placeholder="1 Set"
                                          className="h-7 text-xs text-center bg-gray-50/50"
                                        />
                                      </div>
                                      <div className="flex items-center gap-0.5 pt-4">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          disabled={sIdx === 0}
                                          className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 disabled:opacity-20"
                                          onClick={() => moveSubComponent(index, sIdx, "up")}
                                          title="Geser bagian ke atas"
                                        >
                                          <ArrowUp className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          disabled={sIdx === subComps.length - 1}
                                          className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 disabled:opacity-20"
                                          onClick={() => moveSubComponent(index, sIdx, "down")}
                                          title="Geser bagian ke bawah"
                                        >
                                          <ArrowDown className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                          onClick={() => removeSubComponent(index, sIdx)}
                                          title="Hapus bagian ini"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Spec rows table */}
                                    <div className="space-y-1.5">
                                      <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-gray-500 px-1">
                                        <div className="col-span-4">Parameter (Description)</div>
                                        <div className="col-span-6">Nilai (Specification)</div>
                                        <div className="col-span-2 text-center">Urutan & Aksi</div>
                                      </div>

                                      {sub.specs?.map((_, pIdx) => (
                                        <div key={`spec-${renderKey}-${sIdx}-${pIdx}`} className="grid grid-cols-12 gap-2 items-center">
                                          <div className="col-span-4">
                                            <Input
                                              key={`spec-l-${renderKey}-${sIdx}-${pIdx}`}
                                              {...form.register(`items.${index}.subComponents.${sIdx}.specs.${pIdx}.label`)}
                                              placeholder="e.g. Type / Capacity"
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-6">
                                            <Input
                                              key={`spec-v-${renderKey}-${sIdx}-${pIdx}`}
                                              {...form.register(`items.${index}.subComponents.${sIdx}.specs.${pIdx}.value`)}
                                              placeholder="e.g. NS-55A-70 / 245m³/min"
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-2 flex items-center justify-center gap-0.5">
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              disabled={pIdx === 0}
                                              className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600 disabled:opacity-20"
                                              onClick={() => moveSpecItem(index, sIdx, pIdx, "up")}
                                              title="Geser baris ke atas"
                                            >
                                              <ArrowUp className="w-3 h-3" />
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              disabled={pIdx === (sub.specs?.length || 0) - 1}
                                              className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600 disabled:opacity-20"
                                              onClick={() => moveSpecItem(index, sIdx, pIdx, "down")}
                                              title="Geser baris ke bawah"
                                            >
                                              <ArrowDown className="w-3 h-3" />
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                                              onClick={() => removeSpecItem(index, sIdx, pIdx)}
                                              title="Hapus baris parameter"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}

                                      <div className="pt-1.5">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-7 text-xs text-blue-600 hover:text-blue-700 bg-blue-50/60 hover:bg-blue-100/60 border-blue-200 flex items-center gap-1 font-medium shadow-2xs"
                                          onClick={() => addSpecItem(index, sIdx)}
                                        >
                                          <Plus className="w-3.5 h-3.5" /> Tambah Baris Parameter
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {subComps.length === 0 && (
                                  <div className="text-xs text-gray-500 italic bg-white p-3 rounded border text-center">
                                    Belum ada rincian baris parameter. Klik "Tambah Bagian" atau ketik teks di atas lalu klik "Konversi ke Baris Tabel".
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {fields.length === 0 && (
                      <div className="text-center py-6 border border-dashed rounded-lg text-sm text-gray-400">
                        Belum ada item ditambahkan.
                      </div>
                    )}
                  </div>
                </div>

                {/* Total Calculation */}
                <div className="border-t pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-500">
                    Grand Total akan diformat otomatis ke rupiah (contoh: <strong>Rp 251.000.000</strong>)
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Label className="text-sm font-bold whitespace-nowrap">Grand Total (Rp):</Label>
                    <Input
                      type="number"
                      {...form.register("totalAmount", { valueAsNumber: true })}
                      className="w-48 text-right font-bold text-base"
                    />
                  </div>
                </div>

                {/* Submit / Generate Button */}
                <Button type="submit" className="w-full text-base py-5 font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md" disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Menghasilkan PDF Format Word...
                    </>
                  ) : (
                    "Download PDF Resmi (Word Layout + Stempel STS)"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-12 text-center text-gray-500">Memuat STS Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
