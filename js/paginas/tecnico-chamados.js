// Além de precisar estar logado como técnico, o cadastro precisa
// estar aprovado. Técnico pendente nem chega a ver esse painel.
const tecnico = TecnolarDB.sessaoAtual();
if (!tecnico || tecnico.tipo !== "tecnico" || tecnico.status !== "aprovado") {
  window.location.href = "../login.html";
}

document.getElementById("texto-tecnico-logado").textContent = `${tecnico.nome} · equipe ${tecnico.equipe}`;
document.getElementById("link-sair").addEventListener("click", (ev) => {
  ev.preventDefault();
  TecnolarDB.logout();
  window.location.href = "../login.html";
});

const ROTULOS_STATUS = {
  novo: { texto: "Novo", classe: "text-bg-secondary" },
  fila_atendimento: { texto: "Na fila", classe: "text-bg-primary" },
  em_rota: { texto: "Em rota", classe: "text-bg-info" },
  aguardando_cliente: { texto: "Aguardando cliente", classe: "text-bg-warning" },
  em_reparo: { texto: "Orçamento aprovado", classe: "text-bg-dark" },
  concluido: { texto: "Concluído", classe: "text-bg-success" },
};

const lista = document.getElementById("lista-chamados");

function clonar(idModelo) {
  return document.getElementById(idModelo).content.cloneNode(true);
}

function criarLinhaItemOrcamento() {
  const linha = clonar("modelo-item-orcamento");
  return linha.querySelector(".item-orcamento");
}

function montarMensagem(texto) {
  const frag = clonar("modelo-mensagem-simples");
  frag.querySelector(".js-texto").textContent = texto;
  return frag;
}

// Recebe o id (não o chamado inteiro) e busca os dados na hora: cada
// cartão pode ter uma ação em aberto por um tempo, e re-buscar evita
// trabalhar com uma cópia desatualizada se algo mudar nesse meio-tempo.
function montarAcao(chamadoId) {
  const chamado = TecnolarDB.buscarChamado(chamadoId);

  if (chamado.status === "fila_atendimento") {
    const frag = clonar("modelo-acao-fila");
    frag.querySelector('[data-acao="em-rota"]').addEventListener("click", () => {
      TecnolarDB.marcarEmRota(TecnolarDB.buscarChamado(chamadoId));
      renderizar();
    });
    return frag;
  }

  if (chamado.status === "em_rota") {
    // O formulário já nasce com uma linha de item e ganha mais
    // conforme o técnico clica em "+ item". Cada linha também vem
    // de um <template>, igual o cartão em volta dela.
    const frag = clonar("modelo-acao-orcamento");
    const form = frag.querySelector(".form-orcamento");
    const container = form.querySelector(".itens-orcamento");
    container.appendChild(criarLinhaItemOrcamento());

    form.querySelector('[data-acao="add-item"]').addEventListener("click", () => {
      container.appendChild(criarLinhaItemOrcamento());
    });

    form.addEventListener("click", (ev) => {
      if (ev.target.dataset.acao === "remover-item" && container.children.length > 1) {
        ev.target.closest(".item-orcamento").remove();
      }
    });

    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const itens = Array.from(container.querySelectorAll(".item-orcamento"))
        .map((linha) => ({
          descricao: linha.querySelector(".js-descricao").value.trim(),
          valor: Number(linha.querySelector(".js-valor").value) || 0,
        }))
        .filter((item) => item.descricao);

      if (itens.length === 0) return;

      TecnolarDB.enviarOrcamento(TecnolarDB.buscarChamado(chamadoId), itens);
      renderizar();
    });

    return frag;
  }

  if (chamado.status === "aguardando_cliente") {
    return montarMensagem(`Orçamento de R$ ${chamado.orcamento.total} enviado — aguardando o cliente aprovar.`);
  }

  if (chamado.status === "em_reparo") {
    const frag = clonar("modelo-acao-reparo");
    frag.querySelector('[data-acao="concluir-reparo"]').addEventListener("click", () => {
      TecnolarDB.concluirReparo(TecnolarDB.buscarChamado(chamadoId));
      renderizar();
    });
    return frag;
  }

  if (chamado.status === "concluido") {
    return montarMensagem("Chamado concluído. ✓");
  }

  return montarMensagem("Aguardando o admin distribuir este chamado.");
}

function renderizar() {
  const chamados = TecnolarDB.listarChamadosDoTecnico(tecnico.id).slice().reverse();

  lista.innerHTML = "";

  if (chamados.length === 0) {
    const paragrafo = document.createElement("p");
    paragrafo.className = "text-secondary";
    paragrafo.textContent = "Nenhum chamado atribuído a você ainda.";
    lista.appendChild(paragrafo);
    return;
  }

  chamados.forEach((c) => {
    const cliente = c.clienteId ? TecnolarDB.buscarUsuarioPorId(c.clienteId) : null;
    const status = ROTULOS_STATUS[c.status] || { texto: c.status, classe: "text-bg-secondary" };

    const cartao = clonar("modelo-chamado-tecnico");
    cartao.querySelector(".js-numero-aparelho").textContent = `#${c.numero} · ${c.aparelho}`;
    cartao.querySelector(".js-defeito").textContent = c.defeito || "";

    const badge = cartao.querySelector(".js-status");
    badge.classList.add(status.classe);
    badge.textContent = status.texto;

    cartao.querySelector(".js-cliente-endereco").textContent =
      `${cliente ? cliente.nome : "Cliente avulso"} · ${c.endereco}` + (c.horario ? ` · ${c.horario}` : "");

    cartao.querySelector(".js-acao").appendChild(montarAcao(c.id));

    lista.appendChild(cartao);
  });
}

renderizar();
