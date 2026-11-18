// Só cliente logado chega aqui, sem sessão (ou sessão de técnico/admin)
// volta pro login.
const cliente = TecnolarDB.sessaoAtual();
if (!cliente || cliente.tipo !== "cliente") {
  window.location.href = "../login.html";
}

exibirSessao();

const ROTULOS_STATUS = {
  novo: { texto: "Novo", classe: "text-bg-secondary" },
  fila_atendimento: { texto: "Na fila de atendimento", classe: "text-bg-primary" },
  em_rota: { texto: "Técnico a caminho", classe: "text-bg-info" },
  aguardando_cliente: { texto: "Orçamento aguardando você", classe: "text-bg-warning" },
  em_reparo: { texto: "Aguardando o reparo", classe: "text-bg-dark" },
  concluido: { texto: "Concluído", classe: "text-bg-success" },
};

function clonar(idModelo) {
  return document.getElementById(idModelo).content.cloneNode(true);
}

function renderizar() {
  const lista = document.getElementById("lista-chamados");
  const chamados = TecnolarDB.listarChamadosDoCliente(cliente.id).slice().reverse();

  lista.innerHTML = "";

  if (chamados.length === 0) {
    lista.appendChild(clonar("modelo-sem-chamados"));
    return;
  }

  chamados.forEach((c) => {
    const status = ROTULOS_STATUS[c.status] || { texto: c.status, classe: "text-bg-secondary" };

    const cartao = clonar("modelo-chamado-cliente");
    cartao.querySelector(".js-numero-aparelho").textContent = `#${c.numero} · ${c.aparelho}`;
    cartao.querySelector(".js-endereco-data").textContent =
      c.endereco + (c.horario ? ` · ${c.horario}` : "");

    const badge = cartao.querySelector(".js-status");
    badge.classList.add(status.classe);
    badge.textContent = status.texto;

    const avisoOrcamento = cartao.querySelector(".js-aviso-orcamento");
    if (c.status === "aguardando_cliente" && c.orcamento) {
      avisoOrcamento.textContent = `Orçamento de R$ ${c.orcamento.total} esperando sua aprovação.`;
    } else if (c.status === "em_reparo") {
      avisoOrcamento.textContent = "Orçamento aprovado — aguardando o técnico concluir o reparo.";
    } else {
      avisoOrcamento.remove();
    }

    cartao.querySelector(".js-link-acompanhar").href = `chamado-acompanhar.html?numero=${c.numero}`;

    lista.appendChild(cartao);
  });
}

renderizar();
