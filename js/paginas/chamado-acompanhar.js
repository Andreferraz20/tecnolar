exibirSessao();

const ROTULOS_STATUS = {
  novo: "Novo",
  fila_atendimento: "Na fila de atendimento",
  em_rota: "Em rota",
  aguardando_cliente: "Aguardando você",
  em_reparo: "Em reparo",
  concluido: "Concluído",
};

// Guarda o chamado que tá na tela agora, pro clique em "Aprovar
// orçamento" (ligado uma vez só, lá embaixo) saber o que atualizar.
let chamadoAtual = null;

function clonar(idModelo) {
  return document.getElementById(idModelo).content.cloneNode(true);
}

function renderizarPassos(chamado) {
  // O "passo ativo" é o primeiro que ainda não foi concluído.
  // Os de trás já viraram ✓, os de frente ficam neutros.
  const temOrcamento = !!chamado.orcamento;
  const passos = [
    { nome: "Chamado aberto", feito: true },
    { nome: "Técnico designado", feito: !!chamado.tecnicoId },
    { nome: "Visita realizada", feito: temOrcamento || chamado.status === "concluido" },
    { nome: "Aprovar orçamento", feito: chamado.status === "em_reparo" || chamado.status === "concluido" },
    { nome: "Reparo e garantia", feito: chamado.status === "concluido" },
  ];
  const indiceAtivo = passos.findIndex((p) => !p.feito);

  const lista = document.getElementById("lista-passos");
  lista.innerHTML = "";
  passos.forEach((p, i) => {
    if (i > 0) lista.appendChild(clonar("modelo-passo-linha"));

    const item = clonar("modelo-passo-chamado");
    const li = item.querySelector(".passo");
    li.querySelector(".js-texto").textContent = p.nome;

    if (p.feito) {
      li.classList.add("feito");
      li.querySelector(".js-numero").textContent = "✓";
    } else if (i === indiceAtivo) {
      li.classList.add("ativo");
      li.setAttribute("aria-current", "step");
      li.querySelector(".js-numero").textContent = String(i + 1);
    }

    lista.appendChild(item);
  });

  return temOrcamento;
}

function renderizarChamado(chamado) {
  chamadoAtual = chamado;
  document.getElementById("busca-chamado").classList.add("d-none");
  document.getElementById("alerta-nao-encontrado").classList.add("d-none");
  document.getElementById("cartao-chamado").classList.remove("d-none");
  document.getElementById("texto-numero-chamado").textContent = "Chamado #" + chamado.numero;

  const primeiraPalavra = chamado.aparelho.split(" ")[0].toLowerCase();
  let titulo = chamado.aparelho;
  if (chamado.status === "aguardando_cliente") titulo = `Seu ${primeiraPalavra} está com orçamento pronto`;
  if (chamado.status === "em_reparo") titulo = `Seu ${primeiraPalavra} está em reparo`;
  if (chamado.status === "concluido") titulo = `Seu ${primeiraPalavra} foi consertado!`;
  document.getElementById("titulo-chamado").textContent = titulo;
  document.getElementById("subtitulo-chamado").textContent =
    `${chamado.aparelho} · aberto em ${(chamado.linhaDoTempo[0] || {}).quando || ""}`;
  document.getElementById("badge-status").textContent = ROTULOS_STATUS[chamado.status] || chamado.status;

  // renderizarPassos() já calcula se tem orçamento, então reaproveita
  // o resultado em vez de checar !!chamado.orcamento de novo aqui.
  const temOrcamento = renderizarPassos(chamado);

  const caixaOrcamento = document.getElementById("caixa-orcamento");
  if (temOrcamento) {
    caixaOrcamento.classList.remove("d-none");
    document.getElementById("texto-total-orcamento").textContent = "R$ " + chamado.orcamento.total;

    const listaItens = document.getElementById("lista-itens-orcamento");
    listaItens.innerHTML = "";
    chamado.orcamento.itens.forEach((item) => {
      const linha = clonar("modelo-item-orcamento-resumo");
      linha.querySelector(".js-descricao").textContent = item.descricao;
      linha.querySelector(".js-valor").textContent = "R$ " + item.valor;
      listaItens.appendChild(linha);
    });

    document.getElementById("texto-diagnostico").textContent =
      "Peça disponível em estoque, reparo no mesmo dia da aprovação. Garantia de 90 dias.";

    const acoes = document.getElementById("acoes-orcamento");
    const posAprovacao = document.getElementById("texto-pos-aprovacao");
    const avisoPrecisaLogar = document.getElementById("aviso-precisa-logar");
    if (chamado.status === "aguardando_cliente") {
      // Chamado "avulso" (sem conta) não tem dono pra checar, então
      // qualquer um com o número aprova, igual um link de WhatsApp.
      // Já um chamado com clienteId só deixa aprovar quem tá logado
      // como esse mesmo cliente.
      const usuarioAtual = TecnolarDB.sessaoAtual();
      const podeAprovar = !chamado.clienteId || (usuarioAtual && usuarioAtual.id === chamado.clienteId);
      acoes.classList.toggle("d-none", !podeAprovar);
      avisoPrecisaLogar.classList.toggle("d-none", podeAprovar);
      posAprovacao.classList.add("d-none");
    } else {
      acoes.classList.add("d-none");
      avisoPrecisaLogar.classList.add("d-none");
      posAprovacao.classList.remove("d-none");
      posAprovacao.textContent =
        chamado.status === "em_reparo"
          ? "Orçamento aprovado — aguardando o técnico confirmar o reparo."
          : "Reparo concluído. Garantia de 90 dias já está valendo.";
    }
  } else {
    caixaOrcamento.classList.add("d-none");
  }

  const tecnico = chamado.tecnicoId ? TecnolarDB.buscarUsuarioPorId(chamado.tecnicoId) : null;
  document.getElementById("texto-tecnico").textContent = tecnico
    ? `${tecnico.nome} · equipe ${tecnico.equipe}`
    : "Ainda não designado";
  document.getElementById("texto-endereco-visita").textContent = chamado.endereco;

  // A linha do tempo fica mais recente primeiro, então inverte a
  // lista, mas a numeração exibida continua contando na ordem real.
  const listaAcompanhamento = document.getElementById("lista-acompanhamento");
  listaAcompanhamento.innerHTML = "";
  chamado.linhaDoTempo
    .slice()
    .reverse()
    .forEach((passo, i) => {
      const evento = clonar("modelo-evento-acompanhamento");
      evento.querySelector(".js-numero").textContent = chamado.linhaDoTempo.length - i;
      evento.querySelector(".js-titulo").textContent = passo.titulo;
      evento.querySelector(".js-detalhe").textContent = [passo.detalhe, passo.quando ? "· " + passo.quando : ""]
        .filter(Boolean)
        .join(" ");
      listaAcompanhamento.appendChild(evento);
    });
}

function buscarPorNumero(numero) {
  const chamado = TecnolarDB.listarChamados().find((c) => String(c.numero) === String(numero));
  if (chamado) {
    renderizarChamado(chamado);
  } else {
    document.getElementById("alerta-nao-encontrado").classList.remove("d-none");
  }
}

// Ligado uma vez só (não dentro de renderizarChamado, que roda de novo
// a cada atualização), senão o clique ia acumular um listener por render.
document.getElementById("botao-aprovar").addEventListener("click", () => {
  if (!chamadoAtual) return;
  const usuarioAtual = TecnolarDB.sessaoAtual();
  const podeAprovar = !chamadoAtual.clienteId || (usuarioAtual && usuarioAtual.id === chamadoAtual.clienteId);
  if (!podeAprovar) return;
  TecnolarDB.aprovarOrcamento(chamadoAtual);
  renderizarChamado(chamadoAtual);
});

document.getElementById("form-busca").addEventListener("submit", (ev) => {
  ev.preventDefault();
  buscarPorNumero(document.getElementById("input-numero").value.trim());
});

const parametros = new URLSearchParams(window.location.search);
if (parametros.get("numero")) {
  buscarPorNumero(parametros.get("numero"));
}
