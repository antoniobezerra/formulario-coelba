# Formulario Coletivo - GitHub Pages + Apps Script + Google Sheets + Drive

Este projeto publica um formulario estatico no GitHub Pages, envia os dados para um Web App do Google Apps Script, grava as respostas no Google Sheets e organiza anexos no Google Drive.

A versao atual tambem cria um documento Google Docs para cada consumidor, com os dados preenchidos e area de assinatura.

## Site em producao

```txt
https://antoniobezerra.github.io/formulario-coelba/
```

## Arquivos

- `index.html`: estrutura do formulario.
- `style.css`: layout visual.
- `app.js`: validacoes, abas de consumidores, anexos, modal de envio e URL do Apps Script.
- `Code.gs`: backend Apps Script para gravar no Sheets, organizar Drive, salvar arquivos e gerar Google Docs.
- `llm-do-coracao.md`: guia operacional para atualizar o projeto sem expor IDs reais.

## Fluxo

```txt
GitHub Pages
  -> Apps Script Web App
  -> Google Sheets
  -> Google Drive
  -> Google Docs por consumidor
```

## Funcionalidades principais

- Integrador com CPF/CNPJ, telefone e e-mail validados.
- Consumidores em abas, sem limite fixo.
- Remocao de consumidor pelo `x` no canto superior direito do bloco.
- Barra de progresso no rodape.
- Modal durante o envio.
- Confirmacao antes de enviar, informando quantos consumidores foram cadastrados.
- Checklist de documentos com upload por item.
- Varios arquivos por item de documento.
- Pastas organizadas por integrador e consumidor.
- Documento Google Docs por consumidor com area de assinatura.

## Como publicar no GitHub Pages

1. Suba `index.html`, `style.css`, `app.js`, `README.md`, `llm-do-coracao.md` e `Code.gs` para o repositorio.
2. No GitHub, va em `Settings > Pages`.
3. Configure:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
4. Salve.
5. Aguarde a publicacao.

## Como configurar o Google Sheets

1. Crie uma planilha no Google Sheets.
2. Copie o ID da planilha pela URL:

```txt
https://docs.google.com/spreadsheets/d/ID_DA_PLANILHA/edit
```

3. No `Code.gs`, configure:

```js
const SPREADSHEET_ID = "ID_DA_PLANILHA";
```

## Como configurar o Google Drive

1. Crie uma pasta raiz no Google Drive para receber envios.
2. Copie o ID da pasta pela URL:

```txt
https://drive.google.com/drive/folders/ID_DA_PASTA_DO_DRIVE
```

3. No `Code.gs`, configure:

```js
const DRIVE_ROOT_FOLDER_ID = "ID_DA_PASTA_DO_DRIVE";
```

## Organizacao no Drive

O Apps Script cria ou reaproveita esta estrutura:

```txt
Pasta raiz configurada
  CPF-CNPJ - Nome do integrador
    CPF-CNPJ - Nome do consumidor - UC numero
      Resumo do relato - Nome do consumidor
      Carta de cobranca
      TOI
      Contas de energia
      Extrato de geracao
      ART / projeto / protocolos / e-mails
      Fotos das instalacoes
      Parecer de acesso
      Procuracao
```

## Como publicar o Apps Script como Web App

1. Abra a planilha.
2. Va em `Extensoes > Apps Script`.
3. Cole o conteudo de `Code.gs`.
4. Salve.
5. Clique em `Implantar > Nova implantacao`.
6. Escolha o tipo `Web app`.
7. Configure:
   - Executar como: `Eu`
   - Quem pode acessar: `Qualquer pessoa`
8. Clique em `Implantar`.
9. Autorize as permissoes solicitadas.
10. Copie a URL do Web App terminada em `/exec`.

## Como conectar o site ao Apps Script

No `app.js`, configure:

```js
const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycb.../exec";
```

A URL precisa terminar em `/exec`.

## Como atualizar o Apps Script depois de mudar `Code.gs`

Salvar o editor do Apps Script nao basta para mudar a producao. Sempre que `Code.gs` mudar:

1. Cole a nova versao no editor do Apps Script.
2. Salve.
3. Va em `Implantar > Gerenciar implantacoes`.
4. Edite a implantacao ativa.
5. Em versao, selecione `Nova versao`.
6. Descreva a mudanca.
7. Clique em `Implantar`.
8. Mantenha a mesma URL `/exec` sempre que possivel.

## Como atualizar o GitHub Pages

Depois de mudar arquivos do site:

```bash
git add .
git commit -m "Descricao curta"
git push
```

O GitHub Pages publica a branch `main`. Pode levar alguns minutos.

## Observacoes sobre anexos

Cada consumidor tem anexos separados por item do checklist. Ao marcar um item, o campo de upload aparece.

Cada item aceita varios arquivos. Para evitar falhas no Apps Script, o site bloqueia arquivos acima de 10 MB.

## Teste de producao

O modo teste local foi removido. Para testar, use o GitHub Pages publicado e faca um envio real ou claramente identificado como teste.

Depois confirme:

- resposta na planilha;
- pasta do integrador no Drive;
- pasta do consumidor dentro do integrador;
- Google Docs do consumidor criado;
- anexos nas subpastas corretas, quando enviados.
