# LLM do coracao - guia para rodar e atualizar o formulario

Este guia e para qualquer pessoa ou agente continuar o projeto sem se perder. O formulario roda como site estatico no GitHub Pages, envia os dados para um Web App do Google Apps Script, grava tudo no Google Sheets e organiza anexos/documentos no Google Drive.

Nao coloque IDs reais de planilha, pasta ou Apps Script neste arquivo. Use placeholders nas instrucoes e mantenha os valores reais apenas nos arquivos de configuracao/producao.

## 1. Estado atual do projeto

- Site publico:
  `https://antoniobezerra.github.io/formulario-coelba/`
- Repositorio:
  `https://github.com/antoniobezerra/formulario-coelba`
- Branch de producao:
  `main`
- O modo teste local foi removido.
- O site usa diretamente a URL final do Apps Script configurada em `app.js`.

## 2. Arquivos importantes

- `index.html`: estrutura do formulario.
- `style.css`: visual do formulario.
- `app.js`: comportamento do formulario, validacoes, anexos, modal de envio e URL do Apps Script.
- `Code.gs`: backend no Google Apps Script; recebe o envio, grava na planilha, cria pastas no Drive, salva anexos e gera Google Docs por consumidor.
- `README.md`: instrucoes gerais do projeto.
- `llm-do-coracao.md`: este guia operacional.

## 3. Como o fluxo funciona

```txt
Usuario preenche no GitHub Pages
  -> app.js valida dados e envia JSON para o Apps Script
  -> Code.gs recebe o envio
  -> cria/reaproveita a pasta do integrador no Drive
  -> cria/reaproveita a pasta de cada consumidor
  -> salva anexos por tipo de documento
  -> cria um Google Docs organizado para cada consumidor
  -> grava a resposta e links no Google Sheets
```

O documento de cada consumidor funciona como um resumo preenchido do formulario, com secoes organizadas e area de assinatura para:

- consumidor;
- integrador/responsavel pelo envio.

## 4. Configuracoes obrigatorias no `Code.gs`

No Apps Script, confira se estas constantes estao preenchidas com valores reais:

```js
const SPREADSHEET_ID = "ID_DA_PLANILHA";
const DRIVE_ROOT_FOLDER_ID = "ID_DA_PASTA_DO_DRIVE";
```

Use IDs extraidos das URLs do Google:

```txt
https://docs.google.com/spreadsheets/d/ID_DA_PLANILHA/edit
https://drive.google.com/drive/folders/ID_DA_PASTA_DO_DRIVE
```

Nunca invente ID e nunca publique placeholder em producao.

## 5. Configuracao obrigatoria no `app.js`

No `app.js`, a constante abaixo precisa ter a URL real do Web App do Apps Script:

```js
const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycb.../exec";
```

A URL precisa terminar em `/exec`.

Se aparecer a mensagem:

```txt
Configure a URL do Apps Script no arquivo app.js antes de enviar.
```

significa que o `app.js` ainda esta com placeholder ou URL invalida.

## 6. Publicar ou atualizar o Apps Script

Sempre que mudar `Code.gs`:

1. Abra o projeto no Google Apps Script.
2. Substitua todo o conteudo do arquivo `Codigo.gs` pelo conteudo local de `Code.gs`.
3. Salve.
4. Se houver nova permissao, execute uma funcao de autorizacao ou qualquer funcao que force o pedido de permissao.
5. Va em `Implantar > Gerenciar implantacoes`.
6. Edite a implantacao ativa.
7. Em versao, selecione `Nova versao`.
8. Coloque uma descricao curta.
9. Clique em `Implantar`.
10. Mantenha a mesma URL `/exec` sempre que possivel.

Permissoes esperadas:

- Google Sheets, para gravar respostas;
- Google Drive, para criar pastas e salvar anexos;
- Google Docs, para gerar o documento/resumo do consumidor.

## 7. Publicar ou atualizar o GitHub Pages

Depois de mudar `index.html`, `style.css`, `app.js`, `README.md` ou este guia:

```bash
git add .
git commit -m "Descricao curta da mudanca"
git push
```

O GitHub Pages publica a branch `main`. Aguarde alguns minutos e abra:

```txt
https://antoniobezerra.github.io/formulario-coelba/
```

Se parecer desatualizado, recarregue sem cache.

## 8. Organizacao no Google Drive

O `Code.gs` organiza assim:

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

Cada item do checklist pode receber varios arquivos.

## 9. Teste de producao

Nao existe mais botao de preenchimento automatico no site.

Para testar producao:

1. Abra o GitHub Pages publico.
2. Preencha um envio real ou um envio claramente identificado como teste.
3. Use pelo menos um consumidor.
4. Opcionalmente marque um item do checklist e anexe arquivo pequeno.
5. Clique em `Enviar relato`.
6. Confirme:
   - resposta apareceu na planilha;
   - pasta do integrador apareceu no Drive;
   - pasta do consumidor apareceu dentro da pasta do integrador;
   - Google Docs do consumidor foi criado;
   - anexos, se enviados, ficaram nas subpastas certas.

Depois do teste, se necessario, apague manualmente a linha/pastas de teste no Google Sheets e Drive.

## 10. Divisao de trabalho com agentes

Se for pedir ajuda para agentes, divida em tres frentes:

- Agente Drive: conferir pasta raiz, permissoes e organizacao das pastas.
- Agente Planilha: conferir colunas, linhas recebidas e links gravados.
- Agente Apps Script: conferir `Code.gs`, autorizacoes, deploy e URL `/exec`.

Um quarto agente pode cuidar do GitHub Pages:

- Agente GitHub: conferir `app.js`, `index.html`, commit, push e publicacao no Pages.

## 11. Cuidados importantes

- Nao exponha IDs reais neste guia.
- Nao volte o modo teste local para producao.
- Nao troque a URL do Apps Script no `app.js` sem atualizar e testar.
- Se alterar `Code.gs`, precisa atualizar o deploy do Apps Script; apenas salvar o editor nao atualiza a URL publica.
- Arquivos grandes podem falhar no Apps Script; o frontend limita anexos a 10 MB por arquivo.
- O Apps Script deve estar como Web App com acesso para `Anyone` e executando como o dono do projeto.
