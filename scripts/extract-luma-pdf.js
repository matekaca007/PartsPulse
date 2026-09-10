/**
 * Step 1: Extract SKU + product name from LUMA Ford Bronco PDF
 * Uses pdfjs-dist v3 (stable Node.js API)
 * Run: node scripts/extract-luma-pdf.js
 */

const fs   = require("fs");
const path = require("path");

const PDF_PATH = "C:/Users/User/Desktop/website commerceeee/preview.pdf";

const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
pdfjsLib.GlobalWorkerOptions.workerSrc = false;

async function extractText() {
  const buf  = fs.readFileSync(PDF_PATH);
  const data = new Uint8Array(buf);
  const pdfDoc = await pdfjsLib.getDocument({ data, disableFontFace: true }).promise;

  console.log(`PDF loaded. Pages: ${pdfDoc.numPages}`);

  let allText = "";
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page    = await pdfDoc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    allText += pageText + "\n";
  }
  return allText;
}

function parseProducts(rawText) {
  const rawOut = path.resolve(__dirname, "luma_raw_text.txt");
  fs.writeFileSync(rawOut, rawText, "utf8");

  // Tokenise on whitespace
  const tokens = rawText
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const products = [];

  // SKU pattern: LMBR + at least 2 uppercase/digit chars + optional -variant suffix
  // e.g. LMBRZW001, LMBRNS034-1, LMBRWS009-A, LMBRWS013-2
  const skuRe = /^LMBR[A-Z]{2}\d{3}([- ][A-Z0-9]{1,2})?$/;

  // Patterns that end a product name
  const dimRe = /^\d{2,4}[*x×]\d{2,4}/i;           // 32*29*6cm
  const wgtRe = /^\d+(\.\d+)?(kg|g|lb)$/i;           // 5kg 0.4kg
  const rowRe = /^\d{1,3}$/;                          // row numbers 1-161
  const hdrRe = /^(No\.|Picture|SKU|ITEM|NAME|Volume|weight|For|FORD|Bronco|Changzhou|LUMA|Contact|Email|Tel|WhatsApp)$/i;

  // Normalise tokens — collapse "LMBRNS034 - 1" into "LMBRNS034-1"
  const normalized = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (
      /^LMBR[A-Z]{2}\d{3}$/.test(t) &&
      i + 2 < tokens.length &&
      tokens[i + 1] === "-" &&
      /^[A-Z0-9]{1,2}$/.test(tokens[i + 2])
    ) {
      normalized.push(`${t}-${tokens[i + 2]}`);
      i += 2; // skip the "-" and suffix
    } else {
      normalized.push(t);
    }
  }

  let i = 0;
  while (i < normalized.length) {
    const tok = normalized[i];

    if (skuRe.test(tok)) {
      const sku       = tok;
      const nameParts = [];
      let   j         = i + 1;

      while (j < normalized.length) {
        const t = normalized[j];
        if (skuRe.test(t))  break;
        if (dimRe.test(t))  break;
        if (wgtRe.test(t))  break;
        if (rowRe.test(t))  break;
        if (hdrRe.test(t))  { j++; continue; } // skip header words
        // Skip dimension-like tokens that got merged (e.g. "39*7.5*6cm")
        if (/^\d/.test(t) && /[*x×]/.test(t)) break;
        nameParts.push(t);
        j++;
        if (nameParts.length >= 15) break;
      }

      const name = nameParts
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (name.length > 3) {
        products.push({ sku, name });
      }

      i = j;
    } else {
      i++;
    }
  }

  return products;
}

async function main() {
  const rawText  = await extractText();
  const products = parseProducts(rawText);

  console.log(`\n=== Extracted ${products.length} products ===\n`);
  products.forEach((p, idx) => {
    const num = String(idx + 1).padStart(3, " ");
    console.log(`${num}. [${p.sku.padEnd(16)}] ${p.name}`);
  });

  const jsonOut = path.resolve(__dirname, "luma_products.json");
  fs.writeFileSync(jsonOut, JSON.stringify(products, null, 2), "utf8");
  console.log(`\nJSON saved to: ${jsonOut}`);
  console.log(`Total: ${products.length} products`);
}

main().catch(console.error);
