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

const SPREADSHEET_ID = "ID_DA_PLANILHA";
const DRIVE_ROOT_FOLDER_ID = "ID_DA_PASTA_DO_DRIVE";
const SHEET_NAME = "respostas";

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const driveResult = createDriveArtifacts_(payload);
    const sheet = getOrCreateSheet_();

    delete payload._files;
    payload._drive_folder_url = driveResult.folderUrl;
    payload._drive_files_count = driveResult.fileCount;
    payload._drive_file_links = driveResult.fileLinks.join("\n");
    payload._consumer_summary_docs = driveResult.summaryDocLinks.join("\n");

    appendObjectAsRow_(sheet, payload);

    return json_({
      ok: true,
      message: "Resposta gravada com sucesso.",
      drive_folder_url: driveResult.folderUrl,
      drive_files_count: driveResult.fileCount,
      summary_docs_count: driveResult.summaryDocLinks.length
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

function createDriveArtifacts_(payload) {
  const files = Array.isArray(payload._files) ? payload._files : [];

  if (DRIVE_ROOT_FOLDER_ID.includes("COLE_AQUI")) {
    throw new Error("Configure DRIVE_ROOT_FOLDER_ID no Apps Script.");
  }

  const rootFolder = DriveApp.getFolderById(DRIVE_ROOT_FOLDER_ID);
  const integratorFolder = getOrCreateChildFolder_(rootFolder, buildIntegratorFolderName_(payload));
  const consumerFolders = {};
  const documentFolders = {};
  const fileLinks = [];
  const summaryDocLinks = [];
  const consumerCount = getConsumerCount_(payload);

  for (let i = 1; i <= consumerCount; i++) {
    consumerFolders[String(i)] = getOrCreateChildFolder_(integratorFolder, buildConsumerFolderName_(payload, i));
    const summaryDoc = createConsumerSummaryDocument_(payload, i, consumerFolders[String(i)]);
    summaryDocLinks.push(summaryDoc);
  }

  files.forEach(fileData => {
    const consumerIndex = Number(fileData.consumer_index || 0);
    const folderKey = consumerIndex > 0 ? String(consumerIndex) : "geral";

    if (!consumerFolders[folderKey]) {
      const folderName = consumerIndex > 0 ? buildConsumerFolderName_(payload, consumerIndex) : "Arquivos gerais";
      consumerFolders[folderKey] = getOrCreateChildFolder_(integratorFolder, folderName);
    }

    const documentKey = fileData.document_key || "outros";
    const documentLabel = fileData.document_label || "Outros documentos";
    const documentFolderKey = `${folderKey}:${documentKey}`;

    if (!documentFolders[documentFolderKey]) {
      documentFolders[documentFolderKey] = getOrCreateChildFolder_(
        consumerFolders[folderKey],
        sanitizeFileName_(documentLabel)
      );
    }

    const blob = Utilities.newBlob(
      Utilities.base64Decode(fileData.base64),
      fileData.type || "application/octet-stream",
      sanitizeFileName_(fileData.name || "arquivo")
    );

    const createdFile = documentFolders[documentFolderKey].createFile(blob);
    fileLinks.push(`${consumerFolders[folderKey].getName()} / ${documentFolders[documentFolderKey].getName()} / ${createdFile.getName()}: ${createdFile.getUrl()}`);
  });

  return {
    folderUrl: integratorFolder.getUrl(),
    fileCount: fileLinks.length,
    fileLinks,
    summaryDocLinks
  };
}

function getConsumerCount_(payload) {
  const explicitCount = Number(payload.quantidade_consumidores || 0);

  if (explicitCount > 0) {
    return explicitCount;
  }

  return Object.keys(payload)
    .map(key => Number((key.match(/^c(\d+)_/) || [])[1] || 0))
    .reduce((max, current) => Math.max(max, current), 1);
}

function buildIntegratorFolderName_(payload) {
  const integrador = sanitizeFileName_(payload.integrador_nome || "integrador");
  const documento = sanitizeFileName_(payload.integrador_documento || "sem-documento");

  return `${documento} - ${integrador}`;
}

function buildConsumerFolderName_(payload, consumerIndex) {
  const prefix = `c${consumerIndex}_`;
  const nome = sanitizeFileName_(payload[`${prefix}consumidor_nome`] || `Consumidor ${consumerIndex}`);
  const documento = sanitizeFileName_(payload[`${prefix}consumidor_documento`] || "sem-documento");
  const uc = sanitizeFileName_(payload[`${prefix}consumidor_uc`] || "sem-uc");

  return `${documento} - ${nome} - UC ${uc}`;
}

function getOrCreateChildFolder_(parentFolder, folderName) {
  const safeName = sanitizeFileName_(folderName);
  const folders = parentFolder.getFoldersByName(safeName);

  if (folders.hasNext()) {
    return folders.next();
  }

  return parentFolder.createFolder(safeName);
}

function sanitizeFileName_(name) {
  return String(name)
    .replace(/[\\/:*?"<>|#%{}~&]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "arquivo";
}

function createConsumerSummaryDocument_(payload, consumerIndex, consumerFolder) {
  const prefix = `c${consumerIndex}_`;
  const consumerName = payload[`${prefix}consumidor_nome`] || `Consumidor ${consumerIndex}`;
  const documentTitle = sanitizeFileName_(`Resumo do relato - ${consumerName}`);
  const doc = DocumentApp.create(documentTitle);
  const body = doc.getBody();

  body.clear();
  appendTitle_(body, "Resumo do Relato - Geração Distribuída");
  appendMuted_(body, `Documento gerado automaticamente em ${formatDate_(new Date())}.`);

  appendSection_(body, "1. Identificação do Integrador");
  appendKeyValueTable_(body, [
    ["Nome / Razão social", payload.integrador_nome],
    ["CPF/CNPJ", payload.integrador_documento],
    ["Telefone / WhatsApp", payload.integrador_telefone],
    ["E-mail", payload.integrador_email],
    ["Cidade / UF", payload.integrador_cidade_uf]
  ]);

  appendSection_(body, "2. Identificação do Consumidor");
  appendKeyValueTable_(body, [
    ["Nome / Razão social", payload[`${prefix}consumidor_nome`]],
    ["CPF/CNPJ", payload[`${prefix}consumidor_documento`]],
    ["Telefone", payload[`${prefix}consumidor_telefone`]],
    ["E-mail", payload[`${prefix}consumidor_email`]],
    ["Cidade / UF", payload[`${prefix}consumidor_cidade_uf`]],
    ["Endereço da unidade consumidora", payload[`${prefix}consumidor_endereco`]],
    ["Número da instalação / UC", payload[`${prefix}consumidor_uc`]],
    ["Código do cliente", payload[`${prefix}consumidor_codigo_cliente`]]
  ]);

  appendSection_(body, "3. Dados do Caso");
  appendKeyValueTable_(body, [
    ["Distribuidora", payload[`${prefix}distribuidora`]],
    ["Data da inspeção", payload[`${prefix}data_inspecao`]],
    ["Houve aviso prévio?", payload[`${prefix}houve_aviso_previo`]],
    ["O técnico se identificou?", payload[`${prefix}tecnico_identificou`]],
    ["Foi entregue TOI no local?", payload[`${prefix}toi_entregue`]],
    ["Foi informada perícia/verificação metrológica?", payload[`${prefix}pericia_informada`]],
    ["Houve carta de cobrança retroativa?", payload[`${prefix}carta_cobranca`]],
    ["Valor cobrado", payload[`${prefix}valor_cobrado`]],
    ["Número da carta, inspeção e/ou TOI", payload[`${prefix}numero_carta_toi_inspecao`]],
    ["Foi apresentado relatório técnico completo?", payload[`${prefix}relatorio_tecnico`]],
    ["Foi apresentado cálculo detalhado da cobrança?", payload[`${prefix}calculo_detalhado`]]
  ]);

  appendSection_(body, "4. Relato da Inspeção");
  appendParagraphBlock_(body, "Como a inspeção aconteceu", payload[`${prefix}relato_inspecao`]);
  appendParagraphBlock_(body, "Testemunhas", payload[`${prefix}testemunhas`]);
  appendKeyValueTable_(body, [
    ["Entraram em área interna?", payload[`${prefix}entrada_area_interna`]],
    ["Houve fotos, vídeos ou retirada de equipamento?", payload[`${prefix}fotos_videos_retirada`]],
    ["Se houve retirada, houve lacre e comprovante?", payload[`${prefix}lacre_comprovante`]]
  ]);

  appendSection_(body, "5. Projeto e Regularização");
  appendKeyValueTable_(body, [
    ["Havia projeto aprovado anteriormente?", payload[`${prefix}projeto_aprovado_anterior`]],
    ["Houve aprovação posterior à notificação?", payload[`${prefix}aprovacao_posterior`]],
    ["Houve atualização de projeto?", payload[`${prefix}atualizacao_projeto`]],
    ["Quando a atualização foi enviada?", payload[`${prefix}data_envio_atualizacao`]],
    ["Há protocolo, ART, e-mails ou documentos de envio?", payload[`${prefix}documentos_regularizacao`]],
    ["A ampliação já estava em operação na inspeção?", payload[`${prefix}ampliacao_em_operacao`]]
  ]);
  appendParagraphBlock_(body, "Observações adicionais sobre regularização", payload[`${prefix}observacoes_regularizacao`]);

  appendSection_(body, "6. Documentos Informados");
  appendDocumentChecklist_(body, payload, prefix);

  appendSection_(body, "7. Observações Gerais");
  appendParagraphBlock_(body, "Observações do envio", payload.observacoes_gerais);

  appendSection_(body, "8. Assinaturas");
  appendSignatureBlock_(body, "Consumidor");
  appendSignatureBlock_(body, "Integrador / Responsável pelo envio");

  doc.saveAndClose();

  const file = DriveApp.getFileById(doc.getId());
  file.moveTo(consumerFolder);

  return `${consumerFolder.getName()} / ${file.getName()}: ${file.getUrl()}`;
}

function appendTitle_(body, text) {
  body.appendParagraph(text)
    .setHeading(DocumentApp.ParagraphHeading.TITLE)
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
}

function appendMuted_(body, text) {
  body.appendParagraph(text)
    .setFontSize(9)
    .setForegroundColor("#5d677a")
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
}

function appendSection_(body, text) {
  body.appendParagraph(text)
    .setHeading(DocumentApp.ParagraphHeading.HEADING2)
    .setSpacingBefore(14);
}

function appendKeyValueTable_(body, rows) {
  const safeRows = rows.map(row => [row[0], normalizeDocumentValue_(row[1])]);
  const table = body.appendTable(safeRows);

  for (let i = 0; i < table.getNumRows(); i++) {
    const labelCell = table.getRow(i).getCell(0);
    labelCell.setBackgroundColor("#eef3f8");
    labelCell.editAsText().setBold(true);
  }
}

function appendParagraphBlock_(body, label, value) {
  body.appendParagraph(label).setBold(true);
  body.appendParagraph(normalizeDocumentValue_(value)).setSpacingAfter(8);
}

function appendDocumentChecklist_(body, payload, prefix) {
  const documents = [
    ["Carta de cobrança", "doc_carta_cobranca"],
    ["TOI", "doc_toi"],
    ["Contas de energia", "doc_contas_energia"],
    ["Extrato de geração", "doc_extrato_geracao"],
    ["ART / projeto / protocolos / e-mails", "doc_art_projeto_protocolos"],
    ["Fotos das instalações", "doc_fotos_instalacoes"],
    ["Parecer de acesso", "doc_parecer_acesso"],
    ["Procuração", "doc_procuracao"]
  ];

  appendKeyValueTable_(body, documents.map(item => [
    item[0],
    payload[`${prefix}${item[1]}`] === "sim" ? "Informado pelo usuário" : "Não informado"
  ]));
}

function appendSignatureBlock_(body, label) {
  body.appendParagraph(label).setBold(true).setSpacingBefore(16);
  body.appendParagraph("\n______________________________________________");
  body.appendParagraph("Nome:");
  body.appendParagraph("CPF/CNPJ:");
  body.appendParagraph("Data: ____/____/______");
}

function normalizeDocumentValue_(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return value || "Não informado";
}

function formatDate_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
}

function authorizeGoogleDocs() {
  const doc = DocumentApp.create("Autorização temporária - Formulário Coelba");
  doc.getBody().appendParagraph("Arquivo temporário criado apenas para autorizar o Google Docs.");
  doc.saveAndClose();
  DriveApp.getFileById(doc.getId()).setTrashed(true);

  return "Autorização do Google Docs concluída.";
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
