// 1) Publique o Apps Script como Web App.
// 2) Cole a URL aqui:
const APPS_SCRIPT_WEB_APP_URL = "COLE_AQUI_A_URL_DO_WEB_APP_DO_APPS_SCRIPT";

const form = document.querySelector("#caseForm");
const consumersRoot = document.querySelector("#consumers");
const consumerTemplate = document.querySelector("#consumerTemplate");
const consumerCount = document.querySelector("#consumerCount");
const statusEl = document.querySelector("#status");
const submitBtn = document.querySelector("#submitBtn");

function renderConsumers() {
  const count = Number(consumerCount.value || 1);
  consumersRoot.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const clone = consumerTemplate.content.cloneNode(true);
    clone.querySelector("[data-consumer-number]").textContent = i;

    clone.querySelectorAll("[data-name]").forEach((field) => {
      const originalName = field.dataset.name;
      field.name = `c${i}_${originalName}`;
      if (field.id) field.id = `c${i}_${field.id}`;
    });

    consumersRoot.appendChild(clone);
  }
}

function formToPayload(formEl) {
  const fd = new FormData(formEl);
  const payload = {};

  for (const [key, value] of fd.entries()) {
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

async function submitForm(event) {
  event.preventDefault();

  if (APPS_SCRIPT_WEB_APP_URL.includes("COLE_AQUI")) {
    statusEl.className = "err";
    statusEl.textContent = "Configure a URL do Apps Script no arquivo app.js antes de enviar.";
    return;
  }

  const payload = formToPayload(form);

  submitBtn.disabled = true;
  statusEl.className = "";
  statusEl.textContent = "Enviando...";

  try {
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
    renderConsumers();

    statusEl.className = "ok";
    statusEl.textContent = "Relato enviado com sucesso. Obrigado.";
  } catch (error) {
    console.error(error);
    statusEl.className = "err";
    statusEl.textContent = "Erro ao enviar. Verifique a configuração do Apps Script.";
  } finally {
    submitBtn.disabled = false;
  }
}

consumerCount.addEventListener("change", renderConsumers);
form.addEventListener("submit", submitForm);
renderConsumers();
