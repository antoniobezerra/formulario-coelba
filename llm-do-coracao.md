# LLM do coracao - guia para colocar o formulario para rodar

Este guia explica como publicar, configurar e atualizar o formulario Coelba.

## 1. O que ja existe

- Site no GitHub Pages:
  `https://antoniobezerra.github.io/formulario-coelba/`
- Repositorio:
  `https://github.com/antoniobezerra/formulario-coelba`
- Planilha e pasta do Drive devem ser configuradas no `Code.gs` com os IDs reais do seu projeto.

## 2. Arquivos importantes

- `index.html`: estrutura do formulario.
- `style.css`: visual do formulario.
- `app.js`: comportamento do site e URL do Apps Script.
- `Code.gs`: codigo que roda no Google Apps Script, grava na planilha e salva anexos no Drive.

## 3. Configurar o Apps Script

1. Abra a planilha do Google Sheets.
2. Va em `Extensoes > Apps Script`.
3. Apague o conteudo antigo do editor.
4. Cole todo o conteudo do arquivo `Code.gs`.
5. Confirme que estas duas linhas estao preenchidas:

```js
const SPREADSHEET_ID = "ID_DA_PLANILHA";
const DRIVE_ROOT_FOLDER_ID = "ID_DA_PASTA_DO_DRIVE";
```

6. Salve o projeto.

## 4. Publicar o Apps Script como Web App

1. No Apps Script, clique em `Deploy > New deployment`.
2. Em tipo de deploy, escolha `Web app`.
3. Configure:
   - `Execute as`: `Me`
   - `Who has access`: `Anyone`
4. Clique em `Deploy`.
5. Autorize as permissoes solicitadas.
6. Copie a URL do Web App.

A URL correta deve parecer com isto:

```txt
https://script.google.com/macros/s/AKfycb.../exec
```

Ela precisa terminar em `/exec`.

## 5. Colocar a URL do Apps Script no site

Abra `app.js` e substitua:

```js
const APPS_SCRIPT_WEB_APP_URL = "COLE_AQUI_A_URL_DO_WEB_APP_DO_APPS_SCRIPT";
```

por:

```js
const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycb.../exec";
```

Depois salve, faca commit e envie para o GitHub:

```bash
git add app.js
git commit -m "Configure Apps Script web app URL"
git push
```

## 6. Atualizar o site no GitHub Pages

O GitHub Pages usa a branch `main`. Depois do `git push`, aguarde alguns minutos.

URL publica:

```txt
https://antoniobezerra.github.io/formulario-coelba/
```

Se o site nao atualizar na hora, recarregue com cache limpo.

## 7. Testar localmente

Na pasta do projeto, rode:

```bash
python3 -m http.server 4173
```

Abra:

```txt
http://127.0.0.1:4173/
```

No ambiente local aparece o botao `Preencher dados de teste`. Ele nao aparece no GitHub Pages publico.

Use esse botao para preencher os campos obrigatorios, marque um documento, anexe um arquivo pequeno e clique em `Enviar relato`.

## 8. Como os arquivos ficam organizados no Drive

O Apps Script salva os anexos assim:

```txt
Pasta raiz configurada
  CPF-CNPJ - Nome do integrador
    CPF-CNPJ - Nome do consumidor - UC numero
      Carta de cobranca
      TOI
      Contas de energia
      Extrato de geracao
      ART / projeto / protocolos / e-mails
      Fotos das instalacoes
      Parecer de acesso
      Procuracao
```

## 9. Atualizar o Apps Script depois de mudar `Code.gs`

Sempre que `Code.gs` mudar:

1. Abra o Apps Script.
2. Cole a nova versao de `Code.gs`.
3. Salve.
4. Crie um novo deployment ou atualize o deployment existente.
5. Se a URL `/exec` mudar, atualize tambem o `app.js`.

## 10. Erro comum

Se aparecer:

```txt
Configure a URL do Apps Script no arquivo app.js antes de enviar.
```

significa que a linha `APPS_SCRIPT_WEB_APP_URL` ainda esta com o texto `COLE_AQUI`.

Corrija colocando a URL do Web App do Apps Script no `app.js`.
