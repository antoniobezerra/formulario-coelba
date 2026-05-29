/**
 * Apps Script para receber dados do GitHub Pages e gravar no Google Sheets.
 *
 * Passos:
 * 1. Crie uma planilha no Google Sheets.
 * 2. Crie uma pasta no Google Drive para receber os anexos.
 * 3. Extensions / Extensões > Apps Script.
 * 4. Cole este código.
 * 5. Ajuste SPREADSHEET_ID e DRIVE_ROOT_FOLDER_ID.
 * 6. Deploy > New deployment > Web app.
 * 7. Execute as: Me.
 * 8. Who has access: Anyone.
 * 9. Copie a Web App URL para app.js.
 */

const SPREADSHEET_ID = "COLE_AQUI_O_ID_DA_PLANILHA";
const DRIVE_ROOT_FOLDER_ID = "COLE_AQUI_O_ID_DA_PASTA_DO_DRIVE";
const SHEET_NAME = "respostas";

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const fileSaveResult = saveUploadedFiles_(payload);
    const sheet = getOrCreateSheet_();

    delete payload._files;
    payload._drive_folder_url = fileSaveResult.folderUrl;
    payload._drive_files_count = fileSaveResult.fileCount;
    payload._drive_file_links = fileSaveResult.fileLinks.join("\n");

    appendObjectAsRow_(sheet, payload);

    return json_({
      ok: true,
      message: "Resposta gravada com sucesso.",
      drive_folder_url: fileSaveResult.folderUrl,
      drive_files_count: fileSaveResult.fileCount
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

function saveUploadedFiles_(payload) {
  const files = Array.isArray(payload._files) ? payload._files : [];

  if (files.length === 0) {
    return {
      folderUrl: "",
      fileCount: 0,
      fileLinks: []
    };
  }

  if (DRIVE_ROOT_FOLDER_ID.includes("COLE_AQUI")) {
    throw new Error("Configure DRIVE_ROOT_FOLDER_ID no Apps Script.");
  }

  const rootFolder = DriveApp.getFolderById(DRIVE_ROOT_FOLDER_ID);
  const submissionFolder = rootFolder.createFolder(buildSubmissionFolderName_(payload));
  const consumerFolders = {};
  const fileLinks = [];

  files.forEach(fileData => {
    const consumerIndex = Number(fileData.consumer_index || 0);
    const folderKey = consumerIndex > 0 ? String(consumerIndex) : "geral";

    if (!consumerFolders[folderKey]) {
      const folderName = consumerIndex > 0 ? `Consumidor ${consumerIndex}` : "Arquivos gerais";
      consumerFolders[folderKey] = submissionFolder.createFolder(folderName);
    }

    const blob = Utilities.newBlob(
      Utilities.base64Decode(fileData.base64),
      fileData.type || "application/octet-stream",
      sanitizeFileName_(fileData.name || "arquivo")
    );

    const createdFile = consumerFolders[folderKey].createFile(blob);
    fileLinks.push(`${createdFile.getName()}: ${createdFile.getUrl()}`);
  });

  return {
    folderUrl: submissionFolder.getUrl(),
    fileCount: fileLinks.length,
    fileLinks
  };
}

function buildSubmissionFolderName_(payload) {
  const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH-mm-ss");
  const integrador = sanitizeFileName_(payload.integrador_nome || "integrador");
  const documento = sanitizeFileName_(payload.integrador_documento || "sem-documento");

  return `${date} - ${integrador} - ${documento}`;
}

function sanitizeFileName_(name) {
  return String(name)
    .replace(/[\\/:*?"<>|#%{}~&]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "arquivo";
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
