/**
 * lib/utils/exportToExcel.js
 *
 * Zero-dependency Excel export using the native OOXML format (real .xlsx)
 * generated inline — no external library needed.
 *
 * For simple tabular data, wraps json → CSV and triggers download.
 * Also exposes exportToExcel() which creates a proper .xlsx file via XML.
 */

// ── CSV Export (always safe fallback) ────────────────────────────────────────
export function exportToCSV(data, filename = "export") {
    if (!data?.length) return;
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
        headers.map(h => {
            const val = row[h] ?? "";
            const str = String(val).replace(/"/g, '""');
            return str.includes(",") || str.includes("\n") || str.includes('"') ? `"${str}"` : str;
        }).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    triggerDownload(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`);
}

// ── XLSX Export (real Excel file, no dependency needed) ───────────────────────
export function exportToExcel(data, filename = "export", sheetName = "Sheet1") {
    if (!data?.length) return;

    const headers = Object.keys(data[0]);
    const escapeXml = (val) => String(val ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    // Build worksheet rows
    const colLetters = headers.map((_, i) => String.fromCharCode(65 + i));

    const headerRow = headers.map((h, i) =>
        `<c r="${colLetters[i]}1" t="inlineStr"><is><t>${escapeXml(h)}</t></is></c>`
    ).join("");

    const dataRows = data.map((row, ri) => {
        const cells = headers.map((h, ci) => {
            const val = row[h] ?? "";
            const isNum = typeof val === "number" || (typeof val === "string" && !isNaN(Number(val)) && val !== "");
            if (isNum) {
                return `<c r="${colLetters[ci]}${ri + 2}"><v>${val}</v></c>`;
            }
            return `<c r="${colLetters[ci]}${ri + 2}" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>`;
        }).join("");
        return `<row r="${ri + 2}">${cells}</row>`;
    }).join("");

    const worksheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>
<row r="1">${headerRow}</row>
${dataRows}
</sheetData>
</worksheet>`;

    const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;

    // Build a minimal ZIP manually (works for small files; falls back to CSV for large)
    try {
        const zip = buildMinimalZip({
            "[Content_Types].xml": contentTypesXml,
            "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
            "xl/workbook.xml": workbookXml,
            "xl/_rels/workbook.xml.rels": relsXml,
            "xl/worksheets/sheet1.xml": worksheetXml,
        });
        triggerDownload(new Blob([zip], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${filename}.xlsx`);
    } catch {
        // Graceful fallback to CSV if ZIP fails
        exportToCSV(data, filename);
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function strToBytes(str) {
    return new TextEncoder().encode(str);
}

function crc32(data) {
    const table = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        table[i] = c;
    }
    let crc = 0xFFFFFFFF;
    for (const byte of data) crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function uint32LE(n) {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, n, true);
    return b;
}
function uint16LE(n) {
    const b = new Uint8Array(2);
    new DataView(b.buffer).setUint16(0, n, true);
    return b;
}

function buildMinimalZip(files) {
    const entries = [];
    let offset = 0;
    const parts = [];

    for (const [name, content] of Object.entries(files)) {
        const nameBytes = strToBytes(name);
        const data = strToBytes(content);
        const crc = crc32(data);
        const local = new Uint8Array([
            0x50, 0x4B, 0x03, 0x04, // local file header sig
            0x14, 0x00,             // version needed
            0x00, 0x00,             // flags
            0x00, 0x00,             // compression (stored)
            0x00, 0x00, 0x00, 0x00, // mod time/date
            ...uint32LE(crc),
            ...uint32LE(data.length),
            ...uint32LE(data.length),
            ...uint16LE(nameBytes.length),
            0x00, 0x00,             // extra field length
            ...nameBytes,
            ...data,
        ]);
        entries.push({ nameBytes, crc, size: data.length, offset });
        parts.push(local);
        offset += local.length;
    }

    const centralStart = offset;
    for (const e of entries) {
        const cd = new Uint8Array([
            0x50, 0x4B, 0x01, 0x02,
            0x14, 0x00, 0x14, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            ...uint32LE(e.crc),
            ...uint32LE(e.size),
            ...uint32LE(e.size),
            ...uint16LE(e.nameBytes.length),
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            ...uint32LE(e.offset),
            ...e.nameBytes,
        ]);
        parts.push(cd);
        offset += cd.length;
    }

    const centralSize = offset - centralStart;
    const eocd = new Uint8Array([
        0x50, 0x4B, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00,
        ...uint16LE(entries.length),
        ...uint16LE(entries.length),
        ...uint32LE(centralSize),
        ...uint32LE(centralStart),
        0x00, 0x00,
    ]);
    parts.push(eocd);

    const total = parts.reduce((s, p) => s + p.length, 0);
    const out = new Uint8Array(total);
    let pos = 0;
    for (const p of parts) { out.set(p, pos); pos += p.length; }
    return out;
}
