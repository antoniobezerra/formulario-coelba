/**
 * Apps Script para receber dados do GitHub Pages e gravar no Google Sheets.
 *
 * Passos:
 * 1. Crie uma planilha no Google Sheets.
 * 2. Extensions / Extensões > Apps Script.
 * 3. Cole este código.
 * 4. Ajuste SPREADSHEET_ID.
 * 5. Deploy > New deployment > Web app.
 * 6. Execute as: Me.
 * 7. Who has access: Anyone.
 * 8. Copie a Web App URL para app.js.
 */

const SPREADSHEET_ID = "COLE_AQUI_O_ID_DA_PLANILHA";
const SHEET_NAME = "respostas";

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const sheet = getOrCreateSheet_();

    appendObjectAsRow_(sheet, payload);

    return json_({
      ok: true,
      message: "Resposta gravada com sucesso."
    });
  } catch (err) {
    return json_({
      ok: false,
      error: String(err && err.message ? err.message : err)
    });
  }
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Requisição sem corpo.");
  }

  const raw = e.postData.contents;
  const data = JSON.parse(raw);

  data._received_at = new Date().toISOString();

  return data;
}

function getOrCreateSheet_() {
  if (SPREADSHEET_ID.includes("COLE_AQUI")) {
    throw new Error("Configure SPREADSHEET_ID no Apps Script.");
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  return sheet;
}

function appendObjectAsRow_(sheet, obj) {
  const headers = getHeaders_(sheet);
  const incomingKeys = Object.keys(obj);

  const newKeys = incomingKeys.filter(k => !headers.includes(k));
  const finalHeaders = headers.concat(newKeys);

  if (newKeys.length > 0) {
    sheet.getRange(1, 1, 1, finalHeaders.length).setValues([finalHeaders]);
  }

  const row = finalHeaders.map(key => normalizeCellValue_(obj[key]));
  sheet.appendRow(row);
}

function getHeaders_(sheet) {
  const lastColumn = sheet.getLastColumn();

  if (lastColumn === 0) {
    return [];
  }

  const values = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  return values.filter(String);
}

function normalizeCellValue_(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return value || "";
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
