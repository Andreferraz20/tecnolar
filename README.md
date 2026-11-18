# TecnoLar — site de assistência técnica (trabalho de front-end)

## O que é

Site da **TecnoLar**, uma assistência técnica de eletrodomésticos (geladeira, lava-roupas,
fogão, ar-condicionado). Cobre três jornadas:

- **Cliente**: conhece o serviço na landing page, cria conta, abre um chamado em 3 passos,
  acompanha a visita e aprova o orçamento. Logado, tem uma tela própria ("Meus chamados")
  que lista só os chamados dele.
- **Técnico**: se cadastra (fica pendente até um admin aprovar), depois usa um painel
  próprio pra marcar que está a caminho e enviar o orçamento.
- **Admin**: configura a empresa na primeira vez, acompanha todos os chamados num painel
  com indicadores de SLA, atribui técnicos e vê o detalhe de cada chamado.

## Tecnologias (só front-end)

- **HTML5 + CSS3** — nada de React/Vue/Angular.
- **[Bootstrap 5.3](https://getbootstrap.com/)** via CDN (`jsdelivr`) — grid, navbar, cards,
  tabelas, badges, accordion. É a "biblioteca pronta" que o trabalho permite usar (dá pra
  trocar o CDN por uma cópia baixada em `vendor/` se precisar rodar sem internet — só
  trocar o `<link>`/`<script>` do Bootstrap pelos arquivos locais).
- **CSS próprio** (`css/style.css`) — por cima do Bootstrap, com as cores e fontes da marca
  (variáveis `--azul-escuro`, `--azul`, etc.), os componentes que o Bootstrap não tem pronto
  (o selo de confirmação animado, a telinha de erro 404, os "chips" de sintomas...) e uma
  seção de **utilitários** (`.texto-azul`, `.fundo-azul-claro`, `.largura-640`...) pra não
  precisar de `style=""` solto no HTML.
- **JavaScript puro + `localStorage`** (`js/app.js` + `js/paginas/*.js`) — como não tem
  back-end, `app.js` faz o papel de um banquinho de dados no navegador: usuários, chamados
  e a sessão de quem está logado. Cada chamado criado, orçamento enviado/aprovado ou nota
  de atendente fica salvo aí, então o fluxo entre as páginas é de verdade (não é só
  maquete estática). Nenhum HTML tem `<script>` inline — cada página carrega o seu próprio
  arquivo em `js/paginas/`.
- **`js/validacao.js`** — as regras de formato (nome, CPF, telefone, login, senha) e a
  máscara/busca de CEP ficam num arquivo só, reaproveitado pelos três cadastros (cliente,
  técnico e admin) em vez de repetidas em cada um.
- **[ViaCEP](https://viacep.com.br)** — todo campo de CEP do site (passo 2 de abrir chamado
  e os três formulários de cadastro) preenche rua, bairro, cidade e UF sozinho.
- **`js/ui.js`** — substitui o `window.alert()` por avisos (toasts) que somem sozinhos, e
  mostra o nome de quem está logado + o link "Sair" no topo das páginas internas.
- **`js/acessibilidade.js`** — barra fixa (inspirada no Desafio Plus) com tema claro/escuro
  e aumento/diminuição da fonte, salvos no `localStorage` pra valer em toda navegação.

## Estrutura

Esta pasta (`projeto-tecnolar/`) é **só o site final** — é ela que deve ser entregue/zipada/
publicada. O material original do grupo (`SUELLEN/`, `Pagina Do ADM/`) ficou um nível acima,
fora daqui, só como histórico de onde cada tela veio.

As páginas ficam separadas por quem usa cada uma: `cliente/`, `tecnico/` e `admin/`. O que
é comum a todo mundo (landing page, login, 404, estilos e scripts) fica na raiz.

```
projeto-tecnolar/                      ← pasta de entrega — só isto aqui
├── index.html                         ← landing page
├── login.html
├── 404.html
├── css/
│   └── style.css                      ← tema + componentes + utilitários
├── js/
│   ├── app.js                         ← "banco de dados" em localStorage
│   ├── validacao.js                   ← regras de nome/CPF/telefone/login/senha + CEP
│   ├── ui.js                          ← toasts (sem alert()) e nome/Sair no topo
│   ├── acessibilidade.js              ← barra de tema claro/escuro + tamanho da fonte
│   └── paginas/                       ← um arquivo de script por página
│       ├── login.js
│       ├── cadastro-cliente.js
│       ├── cadastro-tecnico.js
│       ├── setup-admin.js
│       ├── chamado-passo-1.js
│       ├── chamado-passo-2.js
│       ├── chamado-passo-3.js
│       ├── chamado-confirmado.js
│       ├── chamado-acompanhar.js
│       ├── meus-chamados.js
│       ├── index.js
│       ├── admin-chamados.js
│       ├── admin-chamado-detalhe.js
│       └── tecnico-chamados.js
├── cliente/
│   ├── cadastro.html
│   ├── chamado-passo-1.html           ← abrir chamado: aparelho/defeito
│   ├── chamado-passo-2.html           ← abrir chamado: endereço (com busca por CEP)
│   ├── chamado-passo-3.html           ← abrir chamado: horário
│   ├── chamado-confirmado.html
│   ├── chamado-acompanhar.html        ← acompanhar / aprovar orçamento (sem precisar logar)
│   └── meus-chamados.html             ← painel do cliente logado: lista só os chamados dele
├── tecnico/
│   ├── cadastro.html
│   └── chamados.html                  ← painel do técnico: marcar "a caminho", enviar orçamento
├── admin/
│   ├── setup.html                     ← cria o 1º admin (aparece só uma vez)
│   ├── chamados.html                  ← painel admin: lista de chamados
│   └── chamado-detalhe.html           ← painel admin: detalhe + atribuir técnico
└── README.md                          ← este arquivo
```

Cada página de `cliente/`, `tecnico/` e `admin/` referencia os arquivos da raiz com `../`
(ex: `../css/style.css`, `../js/app.js`).

## Como testar localmente

Precisa de Python (ou qualquer servidor estático — não pode abrir os `.html` direto com
duplo clique porque o navegador bloqueia `localStorage` em `file://`).

```bash
cd projeto-tecnolar
python -m http.server 8088
```

Depois abra `http://localhost:8088`.

### Contas de teste (já vêm prontas na primeira visita)

O login é feito pelo campo **Login** (6 letras), não pelo e-mail — o e-mail só fica
guardado como canal de recuperação de senha.

- **Admin:** login `gestor` / senha `gestores`
- **Clientes:** login `ricard` / senha `clientes` (Ricardo Dias Pereira) e
  login `fernan` / senha `clientes` (Fernanda Souza Lima)
- **Técnicos (já aprovados):** login `leotec` (refrigeração), `brunot` (cocção, gás)
  e `ritafe` (todas as especialidades — serve de "curinga") — senha `tecnicos`
  pros três
- **Chamados de exemplo** (todos de `ricard`, menos o `#4820`) — prontos pra demonstrar
  cada etapa do fluxo sem precisar clicar em nada antes:
  - `#4822` — técnico (Leonardo) já foi designado mas **ainda não saiu**. Loga como
    `leotec` em `tecnico/chamados.html` pra ver o botão "Marcar que estou a caminho";
    só depois disso aparece o formulário pra mandar o orçamento.
  - `#4816` — orçamento **já enviado**, só falta o cliente aprovar. Loga como `ricard`
    e abre em "Meus chamados" → `Ver detalhes` (ou `chamado-acompanhar.html?numero=4816`)
    pra ver o botão "Aprovar orçamento".
  - `#4820` (de `fernan`) — técnico (Rita) **já está a caminho** e falta só ele mandar
    o orçamento depois da visita. Loga como `ritafe` em `tecnico/chamados.html` pra ver
    o formulário de orçamento já aberto.
  - `#4821` — novo, sem técnico atribuído — pra testar a atribuição manual no painel admin.

### O caminho de um chamado (status)

```
Novo → Na fila de atendimento → Em rota → Aguardando cliente → Em reparo → Concluído
 (sem        (técnico            (técnico      (orçamento        (cliente       (técnico
  técnico)    atribuído,          a caminho)     enviado,          aprovou,       confirmou
              ainda não saiu)                    esperando         falta o        o reparo)
                                                  aprovação)        técnico
                                                                    consertar)
```

Quando o cliente confirma um chamado (passo 3), o sistema tenta achar automaticamente um
técnico aprovado com a especialidade certa pro aparelho (`TecnolarDB.sugerirTecnico` em
`js/app.js` — por enquanto só olha a especialidade, não o bairro) e já coloca o chamado
**na fila** desse técnico. Se não achar ninguém, o chamado fica "Novo" e sem técnico,
esperando o admin atribuir na mão.

- No **painel do técnico** (`tecnico/chamados.html`), quem está na fila vê um botão
  "Marcar que estou a caminho"; quem já está em rota vê um formulário pra lançar os itens
  do orçamento e enviar; depois que o cliente aprova, aparece "Marcar reparo como
  concluído" — só esse clique fecha o chamado de verdade.
- A aprovação do orçamento (`cliente/chamado-acompanhar.html`) é pública por número do
  chamado (igual um link de WhatsApp — não precisa de conta), mas o botão "Aprovar
  orçamento" só aparece pra quem está logado como o cliente *daquele* chamado específico;
  pra qualquer outra sessão (ou nenhuma), a tela mostra um aviso em vez do botão. Chamados
  "avulsos" (sem conta, `clienteId: null`) continuam liberados pra qualquer um, já que não
  têm dono pra checar.
- No **painel admin** (`admin/chamado-detalhe.html`), a caixa "Equipe responsável" deixa
  atribuir ou reatribuir qualquer técnico aprovado a qualquer momento (serve de atalho/
  backup caso o técnico não tenha acesso à própria tela).

Tudo fica em `localStorage`, então é por navegador/aba — se "zerar" os dados, é só rodar
`localStorage.clear()` no console e recarregar a página que ele semeia tudo de novo
(função `TecnolarDB.semear()` em `js/app.js`).

## O que vale explicar na apresentação

- É só front-end: não existe servidor nem banco de dados de verdade. O `localStorage`
  simula isso — dá pra mostrar no DevTools (`Application → Local Storage`) os dados
  salvos como JSON.
- A tela de "primeiro admin" normalmente sumiria depois de criada; deixamos acessível
  por padrão para dar pra demonstrar na apresentação (tem um aviso na própria tela
  explicando isso).
- O 404.html é a página de erro do *site*, não do servidor: um servidor de arquivos
  simples (como o `python -m http.server` usado para testar) não sabe usá-la
  automaticamente — isso é configuração de hospedagem (ex: Netlify/Vercel permitem
  apontar um "custom 404 page"), fora do escopo deste trabalho.
- O Bootstrap foi escolhido porque é só CSS/JS "prontos para usar" (via CDN), sem virar
  um framework de componentes como React — continua sendo HTML/CSS/JS puro por baixo.
- Cada página HTML só tem `<link>`/`<script src="...">` — nenhum CSS ou JavaScript fica
  escrito dentro do HTML; tudo mora em `css/style.css` ou em `js/app.js` / `js/paginas/`.
- O caminho inverso também vale: **nenhum arquivo `.js` monta HTML como texto**. Páginas
  com listas dinâmicas (chamados do técnico, linha do tempo, tabela do admin...) usam a
  tag `<template>` do próprio HTML — um "molde" que fica escondido na página — e o JS só
  faz `cloneNode()` dele e troca o texto (`textContent`) pra cada item. Dá pra ver isso em
  `admin/chamados.html` (`#modelo-linha-chamado`), `admin/chamado-detalhe.html` e
  `tecnico/chamados.html`, por exemplo.
- **Nenhuma tela usa `window.alert()`** — todo aviso é um toast (`mostrarToast()`, em
  `js/ui.js`) ou uma caixa de erro que já faz parte da própria tela (`#erro-cadastro`
  nos três cadastros).

### Validação dos cadastros (cliente, técnico e admin)

Os três formulários de cadastro compartilham as mesmas regras, centralizadas em
`js/validacao.js`:

- **Nome completo:** só letras e espaço, de 15 a 80 caracteres.
- **CPF:** validação de verdade — calcula os dois dígitos verificadores (algoritmo
  módulo 11) em vez de só aplicar a máscara `000.000.000-00`. Um CPF com todos os
  dígitos iguais (`111.111.111-11`) ou com o dígito verificador errado é rejeitado.
- **Telefone/WhatsApp:** formato `(+55)DD-NNNNNNNN`, aplicado como máscara enquanto
  a pessoa digita.
- **Login:** exatamente 6 letras — é o campo usado para entrar (não é o e-mail).
- **Senha:** exatamente 8 letras, sem número.
- **CEP:** ao sair do campo, busca o endereço no [ViaCEP](https://viacep.com.br) e
  preenche rua, bairro, cidade e UF automaticamente; se o CEP não existir, mostra um
  aviso e deixa os campos livres para preenchimento manual.

### Acessibilidade (Desafio Plus)

Uma barrinha fixa no canto inferior direito, presente em todas as páginas
(`js/acessibilidade.js`), oferece:

- **A- / A+** — diminui/aumenta o tamanho da fonte do site inteiro em vários passos
  (85% → 100% → 115% → 130% → 150% → 175% → 200%), seguindo a técnica
  [G178 da WCAG](https://www.w3.org/WAI/WCAG22/Techniques/general/G178.html) de deixar
  o texto crescer incrementalmente até 200% sem perder conteúdo. A escala é em `%` no
  `<html>`, então reaproveita o `rem`/`em` que o CSS já usa — cada clique some ou volta
  um nível, travando nas pontas (85% e 200%).
- **◐** — alterna entre tema claro e escuro, trocando só as variáveis CSS
  (`:root[data-tema="escuro"]` em `css/style.css`) — os componentes não mudam, só as
  cores por trás deles.

As duas preferências ficam salvas no `localStorage` e continuam valendo ao navegar
para outra página ou recarregar.
ss
