/* ==========================================================
   TECNOLAR: barrinha de acessibilidade (Desafio Plus)

   Cria uma pequena barra fixa no canto da tela com:
   - A- / A+   diminui/aumenta a fonte em vários níveis e
               salva a escolha, seguindo a técnica G178 da
               WCAG (controle incremental de texto até 200%).
   - Tema      alterna claro/escuro e também salva.

   O HTML dessa barra não existe em nenhuma página, é o
   próprio script que monta e já aplica o que tava salvo assim
   que a página carrega. Por isso ele entra em toda página,
   logo depois do js/app.js.
   ========================================================== */

(function () {
  const CHAVE_TEMA = "tecnolar_tema";
  const CHAVE_FONTE = "tecnolar_fonte";

  // Níveis em %, 100 é o padrão. O maior (200) é o teto que a
  // WCAG 1.4.4 pede (texto redimensionável até 200% sem perder
  // conteúdo); o menor (85) é pra quem prefere texto compacto.
  const NIVEIS_FONTE = [85, 100, 115, 130, 150, 175, 200];
  const NIVEL_PADRAO = 100;

  function aplicarTema(tema) {
    if (tema === "escuro") {
      document.documentElement.setAttribute("data-tema", "escuro");
    } else {
      document.documentElement.removeAttribute("data-tema");
    }
  }

  function aplicarFonte(nivel) {
    NIVEIS_FONTE.forEach((n) => document.documentElement.classList.remove("fonte-" + n));
    if (nivel !== NIVEL_PADRAO) {
      document.documentElement.classList.add("fonte-" + nivel);
    }
  }

  // Aplica o que já estava salvo antes mesmo de montar a barra,
  // pra página já nascer no tema/tamanho certo.
  const temaSalvo = localStorage.getItem(CHAVE_TEMA);
  const fonteSalva = parseInt(localStorage.getItem(CHAVE_FONTE), 10);
  let nivelAtual = NIVEIS_FONTE.includes(fonteSalva) ? fonteSalva : NIVEL_PADRAO;
  aplicarTema(temaSalvo);
  aplicarFonte(nivelAtual);

  function montarBarra() {
    const barra = document.createElement("div");
    barra.className = "barra-acessibilidade";
    barra.setAttribute("aria-label", "Acessibilidade");

    const criarBotao = (texto, rotulo) => {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "botao-acessibilidade";
      botao.textContent = texto;
      botao.setAttribute("aria-label", rotulo);
      return botao;
    };

    const anuncio = document.createElement("span");
    anuncio.className = "visually-hidden";
    anuncio.setAttribute("aria-live", "polite");

    const botaoMenos = criarBotao("A-", "Diminuir fonte");
    const botaoMais = criarBotao("A+", "Aumentar fonte");
    const botaoTema = criarBotao("◐", "Alternar tema claro/escuro");

    function mudarNivel(passo) {
      const indiceAtual = NIVEIS_FONTE.indexOf(nivelAtual);
      const novoIndice = Math.min(Math.max(indiceAtual + passo, 0), NIVEIS_FONTE.length - 1);
      nivelAtual = NIVEIS_FONTE[novoIndice];
      aplicarFonte(nivelAtual);
      localStorage.setItem(CHAVE_FONTE, nivelAtual);
      anuncio.textContent = "Tamanho da fonte: " + nivelAtual + "%";
    }

    botaoMenos.addEventListener("click", () => mudarNivel(-1));
    botaoMais.addEventListener("click", () => mudarNivel(1));

    botaoTema.addEventListener("click", () => {
      const atual = document.documentElement.getAttribute("data-tema") === "escuro" ? "escuro" : "claro";
      const novo = atual === "escuro" ? "claro" : "escuro";
      aplicarTema(novo);
      localStorage.setItem(CHAVE_TEMA, novo);
    });

    barra.appendChild(botaoMenos);
    barra.appendChild(botaoMais);
    barra.appendChild(botaoTema);
    barra.appendChild(anuncio);
    document.body.appendChild(barra);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", montarBarra);
  } else {
    montarBarra();
  }
})();
