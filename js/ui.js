/* ==========================================================
   TECNOLAR: pequenos utilitários de interface

   mostrarToast(): substitui o window.alert() por um aviso
   flutuante no canto da tela, que some sozinho.
   exibirSessao(): mostra o nome de quem está logado e um link
   de Sair no topo da página, quando a página tiver os dois
   elementos esperados.
   ========================================================== */

function mostrarToast(mensagem, tipo) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "alerta toast-aviso " + (tipo === "erro" ? "alerta-erro" : "alerta-info");

  const icone = document.createElement("span");
  icone.className = "alerta-icone";

  const texto = document.createElement("p");
  texto.textContent = mensagem;

  toast.appendChild(icone);
  toast.appendChild(texto);
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-saindo");
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

function exibirSessao() {
  const usuario = TecnolarDB.sessaoAtual();
  const nomeEl = document.getElementById("texto-usuario-logado");
  const sairEl = document.getElementById("link-sair-topo");
  // Estes dois são opcionais: só a landing page (índice) tem um botão
  // "Entrar" pra esconder e um link "Meus chamados" pra revelar.
  const entrarEl = document.getElementById("botao-entrar-topo");
  const meusChamadosEl = document.getElementById("link-meus-chamados-topo");
  if (!nomeEl || !sairEl) return;

  if (usuario) {
    nomeEl.textContent = usuario.nome;
    nomeEl.classList.remove("d-none");
    sairEl.classList.remove("d-none");
    if (entrarEl) entrarEl.classList.add("d-none");
    // Link volta pro painel de quem tá logado (cliente, técnico ou
    // admin). O caminho muda se a página é a raiz do site ou tá
    // dentro de cliente/, por isso o prefixo abaixo.
    if (meusChamadosEl) {
      const dentroDeCliente = window.location.pathname.includes("/cliente/");
      const prefixoRaiz = dentroDeCliente ? "../" : "";
      const destinos = {
        cliente: { href: dentroDeCliente ? "meus-chamados.html" : "cliente/meus-chamados.html", texto: "Meus chamados" },
        tecnico: { href: prefixoRaiz + "tecnico/chamados.html", texto: "Painel do técnico" },
        admin: { href: prefixoRaiz + "admin/chamados.html", texto: "Painel admin" },
      };
      const destino = destinos[usuario.tipo];
      if (destino) {
        meusChamadosEl.href = destino.href;
        meusChamadosEl.textContent = destino.texto;
        meusChamadosEl.classList.remove("d-none");
      }
    }
    sairEl.addEventListener("click", (ev) => {
      ev.preventDefault();
      TecnolarDB.logout();
      window.location.reload();
    });
  } else {
    nomeEl.classList.add("d-none");
    sairEl.classList.add("d-none");
    if (entrarEl) entrarEl.classList.remove("d-none");
    if (meusChamadosEl) meusChamadosEl.classList.add("d-none");
  }
}
