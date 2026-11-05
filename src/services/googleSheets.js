const { parse } = require("csv-parse/sync");

const SHEET_ID = process.env.SHEET_ID || "1nwc54f3Si5OerCDNAiHwuCOiIZjB0R-AbNowCeqCZTI";
const SHEET_GID = process.env.SHEET_GID || "1987576848";

async function getSheetData() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
  const response = await fetch(url, {
    headers: { Accept: "text/csv" },
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) throw new Error(`Google Sheets HTTP error: ${response.status}`);

  const csvText = await response.text();
  if (!csvText.trim() || csvText.trim().startsWith("<")) {
    throw new Error("Google Sheet is not publicly accessible. Set General access to Anyone with the link - Viewer.");
  }

  const rows = parse(csvText, {
    bom: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
    trim: true
  });

  if (rows.length < 2) throw new Error("No product data found in the selected sheet/tab.");

  const headers = rows[0].map(value => String(value || "").trim());
  const products = rows.slice(1)
    .filter(row => row.some(cell => String(cell || "").trim()))
    .map(row => {
      const item = {};
      headers.forEach((header, index) => {
        if (header) item[header] = String(row[index] || "").trim();
      });
      return item;
    });

  return { headers, products };
}

module.exports = { getSheetData };
