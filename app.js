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

const MAX_CONSUMERS = 5;
const MAX_FILE_SIZE_MB = 10;
let activeConsumer = 1;

function getConsumerCount() {
  const count = Number(consumerCount.value || 1);
  return Math.min(Math.max(count, 1), MAX_CONSUMERS);
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

  addConsumerBtn.disabled = count >= MAX_CONSUMERS;
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
}

function setActiveConsumer(index) {
  activeConsumer = index;
  updateVisibleConsumer();
}

function addConsumer() {
  const nextCount = Math.min(getConsumerCount() + 1, MAX_CONSUMERS);
  consumerCount.value = String(nextCount);
  activeConsumer = nextCount;
  syncConsumers();
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
  const count = getConsumerCount();

  for (let i = 1; i <= count; i++) {
    setActiveConsumer(i);

    if (!form.reportValidity()) {
      return false;
    }
  }

  return true;
}

function fileToPayload(file, consumerIndex) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",").pop() : result;

      resolve({
        consumer_index: consumerIndex,
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
    const consumerIndex = Number(input.name.match(/^c(\d+)_/)?.[1] || 0);

    for (const file of input.files) {
      if (file.size > maxSize) {
        throw new Error(`O arquivo ${file.name} passa de ${MAX_FILE_SIZE_MB} MB.`);
      }

      files.push(await fileToPayload(file, consumerIndex));
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
syncConsumers();
