# Formulário Coletivo — GitHub Pages + Apps Script + Google Sheets + Drive

Este projeto publica um formulário estático no GitHub Pages, grava as respostas em uma planilha do Google Sheets e salva anexos no Google Drive usando Google Apps Script.

## Arquivos

- `index.html`: página e formulário.
- `style.css`: layout visual.
- `app.js`: envio dos dados e anexos para o Apps Script.
- `Code.gs`: backend Apps Script para gravar no Google Sheets e salvar arquivos no Drive.

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie `index.html`, `style.css` e `app.js` para o repositório.
3. Vá em `Settings > Pages`.
4. Em `Build and deployment`, selecione:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Salve.
6. O GitHub mostrará a URL pública do site.

## Como configurar o Google Sheets

1. Crie uma planilha no Google Sheets.
2. Copie o ID da planilha. Ele fica na URL:
   `https://docs.google.com/spreadsheets/d/ID_DA_PLANILHA/edit`
3. Vá em `Extensões > Apps Script`.
4. Cole o conteúdo de `Code.gs`.
5. Substitua:
   `COLE_AQUI_O_ID_DA_PLANILHA`
   pelo ID real da sua planilha.
6. Salve.

## Como configurar o Google Drive

1. Crie uma pasta no Google Drive para receber os anexos.
2. Copie o ID da pasta. Ele fica na URL:
   `https://drive.google.com/drive/folders/ID_DA_PASTA`
3. No `Code.gs`, substitua:
   `COLE_AQUI_O_ID_DA_PASTA_DO_DRIVE`
   pelo ID real da pasta.

O Apps Script criará uma pasta para cada envio e, dentro dela, subpastas por consumidor.

## Como publicar o Apps Script como Web App

1. No Apps Script, clique em `Deploy > New deployment`.
2. Selecione o tipo `Web app`.
3. Configure:
   - Execute as: `Me`
   - Who has access: `Anyone`
4. Clique em `Deploy`.
5. Autorize o script.
6. Copie a URL gerada do Web App.

## Como conectar o site ao Apps Script

No arquivo `app.js`, substitua:

```js
const APPS_SCRIPT_WEB_APP_URL = "COLE_AQUI_A_URL_DO_WEB_APP_DO_APPS_SCRIPT";
```

pela URL real do Web App.

## Observação sobre anexos

Cada consumidor tem um campo para anexar arquivos. O envio aceita PDF, imagens, Word e Excel.

Para evitar falhas no Apps Script, o site bloqueia arquivos acima de 10 MB. Se houver muitos documentos ou arquivos pesados, divida em mais de um envio.
