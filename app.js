// 1) Publique o Apps Script como Web App.
// 2) Cole a URL aqui:
const APPS_SCRIPT_WEB_APP_URL = "COLE_AQUI_A_URL_DO_WEB_APP_DO_APPS_SCRIPT";

const form = document.querySelector("#caseForm");
const consumersRoot = document.querySelector("#consumers");
const consumerTemplate = document.querySelector("#consumerTemplate");
const consumerCount = document.querySelector("#consumerCount");
const consumerTabs = document.querySelector("#consumerTabs");
const addConsumerBtn = document.querySelector("#addConsumerBtn");
const statusEl = document.querySelector("#status");
const submitBtn = document.querySelector("#submitBtn");
const progressBar = document.querySelector("#progressBar");
const progressText = document.querySelector("#progressText");
const progressPercent = document.querySelector("#progressPercent");

const MAX_FILE_SIZE_MB = 10;
let activeConsumer = 1;

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatCpfCnpj(value) {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
}

function hasRepeatedDigits(digits) {
  return /^(\d)\1+$/.test(digits);
}

function isValidCpf(value) {
  const cpf = onlyDigits(value);

  if (cpf.length !== 11 || hasRepeatedDigits(cpf)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(cpf[i]) * (10 - i);
  }

  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(cpf[i]) * (11 - i);
  }

  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;

  return digit === Number(cpf[10]);
}

function isValidCnpj(value) {
  const cnpj = onlyDigits(value);

  if (cnpj.length !== 14 || hasRepeatedDigits(cnpj)) {
    return false;
  }

  function calculateDigit(base, weights) {
    const sum = weights.reduce((total, weight, index) => total + Number(base[index]) * weight, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  }

  const firstDigit = calculateDigit(cnpj, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateDigit(cnpj, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return firstDigit === Number(cnpj[12]) && secondDigit === Number(cnpj[13]);
}

function isValidCpfCnpj(value) {
  const digits = onlyDigits(value);

  if (digits.length === 11) return isValidCpf(digits);
  if (digits.length === 14) return isValidCnpj(digits);

  return false;
}

function applyCpfCnpjMask(event) {
  const field = event.target;
  const digits = onlyDigits(field.value);
  field.value = formatCpfCnpj(field.value);

  if (digits.length === 11 || digits.length === 14) {
    validateCpfCnpjField(field);
  } else {
    field.setCustomValidity("");
  }
}

function validateCpfCnpjField(field) {
  const digits = onlyDigits(field.value);

  if (!digits && !field.required) {
    field.setCustomValidity("");
    return true;
  }

  if (!isValidCpfCnpj(field.value)) {
    field.setCustomValidity("Informe um CPF ou CNPJ válido.");
    return false;
  }

  field.value = formatCpfCnpj(field.value);
  field.setCustomValidity("");
  return true;
}

function setupCpfCnpjFields(root = document) {
  root.querySelectorAll("[data-document-field]").forEach((field) => {
    if (field.dataset.maskReady === "true") {
      return;
    }

    field.dataset.maskReady = "true";
    field.addEventListener("input", applyCpfCnpjMask);
    field.addEventListener("blur", () => validateCpfCnpjField(field));
    field.addEventListener("change", () => validateCpfCnpjField(field));
  });
}

function formatPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits.replace(/^(\d{1,2})/, "($1");
  }

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/^(\(\d{2}\) \d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/^(\(\d{2}\) \d{5})(\d)/, "$1-$2");
}

function applyPhoneMask(event) {
  event.target.value = formatPhone(event.target.value);
}

function setupPhoneFields(root = document) {
  root.querySelectorAll("[data-phone-field]").forEach((field) => {
    if (field.dataset.phoneMaskReady === "true") {
      return;
    }

    field.dataset.phoneMaskReady = "true";
    field.addEventListener("input", applyPhoneMask);
    field.addEventListener("blur", () => {
      field.value = formatPhone(field.value);
    });
  });
}

function isElementVisible(element) {
  return !element.closest("[hidden], .is-hidden");
}

function getRequiredFields() {
  return [...form.querySelectorAll("input[required], select[required], textarea[required]")]
    .filter((field) => !field.disabled && isElementVisible(field));
}

function isFieldComplete(field) {
  if (field.type === "checkbox" || field.type === "radio") {
    return field.checked;
  }

  return String(field.value || "").trim().length > 0 && field.validity.valid;
}

function updateFieldCompletion(field) {
  const label = field.closest("label");

  if (!label) {
    return;
  }

  label.classList.toggle("is-complete", isFieldComplete(field));
}

function updateProgress() {
  const requiredFields = getRequiredFields();
  const completed = requiredFields.filter(isFieldComplete).length;
  const total = requiredFields.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  form.querySelectorAll("input, select, textarea").forEach(updateFieldCompletion);

  if (progressBar) {
    progressBar.style.width = `${percent}%`;
  }

  if (progressText) {
    progressText.textContent = `${completed} de ${total} campos obrigatórios`;
  }

  if (progressPercent) {
    progressPercent.textContent = `${percent}%`;
  }
}

function getConsumerCount() {
  const count = Number(consumerCount.value || 1);
  return Math.max(count, 1);
}

function createConsumerBlock(index) {
  const clone = consumerTemplate.content.cloneNode(true);
  const block = clone.querySelector(".consumer-block");

  block.id = `consumer-panel-${index}`;
  block.dataset.consumerIndex = String(index);
  block.setAttribute("role", "tabpanel");
  block.setAttribute("aria-labelledby", `consumer-tab-${index}`);
  clone.querySelector("[data-consumer-number]").textContent = index;

  clone.querySelectorAll("[data-name]").forEach((field) => {
    const originalName = field.dataset.name;

    if (field.hasAttribute("required")) {
      field.dataset.required = "true";
    }

    field.name = `c${index}_${originalName}`;
    field.required = false;
  });

  setupDocumentUploads(block);
  setupCpfCnpjFields(block);
  setupPhoneFields(block);
  consumersRoot.appendChild(clone);
}

function renderTabs() {
  const count = getConsumerCount();
  consumerTabs.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const tab = document.createElement("button");
    tab.id = `consumer-tab-${i}`;
    tab.className = "consumer-tab";
    tab.type = "button";
    tab.role = "tab";
    tab.setAttribute("aria-controls", `consumer-panel-${i}`);
    tab.textContent = `Consumidor ${i}`;
    tab.addEventListener("click", () => setActiveConsumer(i));
    consumerTabs.appendChild(tab);
  }

  addConsumerBtn.disabled = false;
}

function updateVisibleConsumer() {
  const count = getConsumerCount();
  activeConsumer = Math.min(activeConsumer, count);

  consumersRoot.querySelectorAll(".consumer-block").forEach((block) => {
    const isActive = Number(block.dataset.consumerIndex) === activeConsumer;

    block.classList.toggle("is-hidden", !isActive);
    block.hidden = !isActive;

    block.querySelectorAll("[data-required='true']").forEach((field) => {
      field.required = isActive;
    });
  });

  consumerTabs.querySelectorAll(".consumer-tab").forEach((tab, index) => {
    const isActive = index + 1 === activeConsumer;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
}

function syncConsumers() {
  const count = getConsumerCount();
  consumerCount.value = String(count);

  for (let i = 1; i <= count; i++) {
    if (!consumersRoot.querySelector(`[data-consumer-index="${i}"]`)) {
      createConsumerBlock(i);
    }
  }

  renderTabs();
  updateVisibleConsumer();
  updateProgress();
}

function setActiveConsumer(index) {
  activeConsumer = index;
  updateVisibleConsumer();
  updateProgress();
}

function addConsumer() {
  const nextCount = getConsumerCount() + 1;
  consumerCount.value = String(nextCount);
  activeConsumer = nextCount;
  syncConsumers();
}

function setupDocumentUploads(block) {
  block.querySelectorAll("[data-upload-target]").forEach((checkbox) => {
    const uploadKey = checkbox.dataset.uploadTarget;
    const upload = block.querySelector(`[data-upload-for="${uploadKey}"]`);
    const fileInput = upload ? upload.querySelector("input[type='file']") : null;

    function syncUploadVisibility() {
      const isChecked = checkbox.checked;

      if (upload) {
        upload.classList.toggle("is-hidden", !isChecked);
      }

      if (fileInput) {
        fileInput.disabled = !isChecked;

        if (!isChecked) {
          fileInput.value = "";
        }
      }
    }

    checkbox.addEventListener("change", syncUploadVisibility);
    syncUploadVisibility();
  });
}

function formToPayload(formEl) {
  const fd = new FormData(formEl);
  const payload = {};

  for (const [key, value] of fd.entries()) {
    if (value instanceof File) {
      continue;
    }

    // Se houver múltiplos campos com mesmo name, agrupa em array.
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      if (!Array.isArray(payload[key])) payload[key] = [payload[key]];
      payload[key].push(value);
    } else {
      payload[key] = value;
    }
  }

  payload._submitted_at = new Date().toISOString();
  payload._user_agent = navigator.userAgent;
  payload._page_url = window.location.href;

  return payload;
}

function validateConsumers() {
  for (const field of form.querySelectorAll("[data-document-field]")) {
    if (!validateCpfCnpjField(field)) {
      field.reportValidity();
      return false;
    }
  }

  const count = getConsumerCount();

  for (let i = 1; i <= count; i++) {
    setActiveConsumer(i);

    if (!form.reportValidity()) {
      return false;
    }
  }

  return true;
}

function fileToPayload(file, consumerIndex, documentKey, documentLabel) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",").pop() : result;

      resolve({
        consumer_index: consumerIndex,
        document_key: documentKey,
        document_label: documentLabel,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        base64
      });
    };

    reader.onerror = () => reject(new Error(`Falha ao ler o arquivo ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

async function collectFiles() {
  const files = [];
  const maxSize = MAX_FILE_SIZE_MB * 1024 * 1024;

  for (const input of form.querySelectorAll("input[type='file'][name]")) {
    if (input.disabled) {
      continue;
    }

    const consumerIndex = Number(input.name.match(/^c(\d+)_/)?.[1] || 0);
    const documentKey = input.dataset.documentKey || "outros";
    const documentLabel = input.dataset.documentLabel || "Outros documentos";

    for (const file of input.files) {
      if (file.size > maxSize) {
        throw new Error(`O arquivo ${file.name} passa de ${MAX_FILE_SIZE_MB} MB.`);
      }

      files.push(await fileToPayload(file, consumerIndex, documentKey, documentLabel));
    }
  }

  return files;
}

async function submitForm(event) {
  event.preventDefault();

  if (APPS_SCRIPT_WEB_APP_URL.includes("COLE_AQUI")) {
    statusEl.className = "err";
    statusEl.textContent = "Configure a URL do Apps Script no arquivo app.js antes de enviar.";
    return;
  }

  if (!validateConsumers()) {
    return;
  }

  const consumerTotal = getConsumerCount();
  const confirmMessage = `Foram cadastrados ${consumerTotal} ${consumerTotal === 1 ? "consumidor" : "consumidores"}. Deseja continuar com o envio?`;

  if (!window.confirm(confirmMessage)) {
    statusEl.className = "";
    statusEl.textContent = "Envio cancelado. Confira os dados antes de enviar.";
    return;
  }

  submitBtn.disabled = true;
  statusEl.className = "";
  statusEl.textContent = "Preparando anexos...";

  try {
    const payload = formToPayload(form);
    payload._files = await collectFiles();

    statusEl.textContent = payload._files.length > 0 ? "Enviando dados e anexos..." : "Enviando...";

    // text/plain evita preflight CORS em muitos cenários de Apps Script.
    const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let result;

    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error("Resposta inválida do Apps Script.");
    }

    if (!result.ok) {
      throw new Error(result.error || "Falha ao gravar resposta.");
    }

    form.reset();
    consumerCount.value = "1";
    activeConsumer = 1;
    consumersRoot.innerHTML = "";
    syncConsumers();

    statusEl.className = "ok";
    statusEl.textContent = "Relato enviado com sucesso. Obrigado.";
  } catch (error) {
    console.error(error);
    statusEl.className = "err";
    statusEl.textContent = error.message || "Erro ao enviar. Verifique a configuração do Apps Script.";
  } finally {
    submitBtn.disabled = false;
  }
}

addConsumerBtn.addEventListener("click", addConsumer);
form.addEventListener("submit", submitForm);
form.addEventListener("input", updateProgress);
form.addEventListener("change", updateProgress);
form.addEventListener("focusout", updateProgress);
setupCpfCnpjFields();
setupPhoneFields();
syncConsumers();
