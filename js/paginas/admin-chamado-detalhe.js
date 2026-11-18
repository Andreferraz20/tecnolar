// Mesma verificação de todas as páginas do painel admin.
const usuarioLogado = TecnolarDB.sessaoAtual();
if (!usuarioLogado || usuarioLogado.tipo !== "admin") {
  window.location.href = "../login.html";
}
document.getElementById("texto-usuario-logado").textContent = usuarioLogado ? usuarioLogado.nome : "";

const ROTULOS_STATUS = {
  novo: { texto: "Novo", classe: "text-bg-secondary" },
  fila_atendimento: { texto: "Na fila de atendimento", classe: "text-bg-primary" },
  em_rota: { texto: "Em rota", classe: "text-bg-info" },
  aguardando_cliente: { texto: "Aguardando cliente", classe: "text-bg-warning" },
  em_reparo: { texto: "Em reparo", classe: "text-bg-dark" },
  concluido: { texto: "Concluído", classe: "text-bg-success" },
};

function clonar(idModelo) {
  return document.getElementById(idModelo).content.cloneNode(true);
}

const numero = new URLSearchParams(window.location.search).get("numero");
let chamado = TecnolarDB.listarChamados().find((c) => String(c.numero) === String(numero));

const elCarregando = document.getElementById("estado-carregando");
const elNaoEncontrado = document.getElementById("estado-nao-encontrado");
const elChamado = document.getElementById("estado-chamado");

if (!chamado) {
  elCarregando.classList.add("d-none");
  elNaoEncontrado.classList.remove("d-none");
} else {
  elCarregando.classList.add("d-none");
  elChamado.classList.remove("d-none");
  iniciar();
}

// Os botões são fixos no HTML (não são clonados de um <template>),
// então os listeners só são ligados aqui, uma vez. A renderizar()
// só troca texto e classe, nunca recria elemento nem religa clique
// nenhum, senão ia empilhar o mesmo evento de novo a cada atualização.
function iniciar() {
  renderizar();

  document.getElementById("botao-salvar-nota").addEventListener("click", () => {
    const texto = document.getElementById("campo-nota").value.trim();
    if (!texto) return;
    chamado.notas = chamado.notas || [];
    chamado.notas.push({ texto, autor: usuarioLogado.nome, quando: "agora" });
    chamado = TecnolarDB.salvarChamado(chamado);
    document.getElementById("campo-nota").value = "";
    renderizarNotas();
  });

  document.getElementById("botao-reatribuir-topo").addEventListener("click", () => {
    document.getElementById("bloco-tecnico").scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("botao-contatar-cliente").addEventListener("click", () => {
    mostrarToast("Exemplo: abriria o WhatsApp do cliente.");
  });

  document.getElementById("botao-em-rota").addEventListener("click", () => {
    chamado = TecnolarDB.marcarEmRota(chamado);
    renderizar();
  });

  document.getElementById("botao-atribuir").addEventListener("click", () => {
    const idEscolhido = document.getElementById("select-tecnico").value;
    if (!idEscolhido) return;
    const tecnicoEscolhido = TecnolarDB.buscarUsuarioPorId(idEscolhido);
    chamado = TecnolarDB.atribuirTecnico(chamado, tecnicoEscolhido, "manual");
    renderizar();
  });
}

function renderizarNotas() {
  const lista = document.getElementById("lista-notas");
  lista.innerHTML = "";
  (chamado.notas || []).forEach((n) => {
    const item = clonar("modelo-nota");
    item.querySelector(".js-autor").textContent = n.autor + ":";
    item.querySelector(".js-texto").textContent = n.texto;
    item.querySelector(".js-quando").textContent = "· " + n.quando;
    lista.appendChild(item);
  });
}

function renderizar() {
  const cliente = chamado.clienteId ? TecnolarDB.buscarUsuarioPorId(chamado.clienteId) : null;
  const tecnico = chamado.tecnicoId ? TecnolarDB.buscarUsuarioPorId(chamado.tecnicoId) : null;
  const status = ROTULOS_STATUS[chamado.status] || { texto: chamado.status, classe: "text-bg-secondary" };
  const tecnicos = TecnolarDB.listarTecnicosAprovados();

  document.getElementById("texto-titulo-chamado").textContent = `#${chamado.numero} · ${chamado.aparelho}`;
  const badge = document.getElementById("badge-status");
  badge.className = "badge rounded-pill align-middle ms-2 " + status.classe;
  badge.textContent = status.texto;
  document.getElementById("texto-info-abertura").textContent =
    `Aberto em ${(chamado.linhaDoTempo[0] || {}).quando || "—"} por ${cliente ? cliente.nome : "cliente avulso"} · Setor ${chamado.equipe || "—"}`;

  const listaTempo = document.getElementById("lista-linha-tempo");
  listaTempo.innerHTML = "";
  chamado.linhaDoTempo.forEach((p) => {
    const item = clonar("modelo-evento-tempo");
    item.querySelector(".js-titulo").textContent = p.titulo;
    item.querySelector(".js-detalhe").textContent = p.detalhe || "";
    item.querySelector(".js-quando").textContent = p.quando || "";
    listaTempo.appendChild(item);
  });

  renderizarNotas();

  document.getElementById("texto-nome-cliente").textContent = cliente ? cliente.nome : "Cliente avulso";
  document.getElementById("texto-telefone-cliente").textContent = cliente ? cliente.telefone || "" : "";
  document.getElementById("texto-endereco-cliente").textContent = chamado.endereco;

  document.getElementById("texto-equipe-tecnico").textContent =
    `${chamado.equipe || "—"} ${tecnico ? "· " + tecnico.nome : "· sem técnico"}`;
  const chipsContainer = document.getElementById("chips-especialidades");
  chipsContainer.innerHTML = "";
  if (tecnico) {
    (tecnico.especialidades || []).forEach((especialidade) => {
      const chip = clonar("modelo-chip");
      chip.querySelector(".js-texto").textContent = especialidade;
      chipsContainer.appendChild(chip);
    });
  }

  // O botão "marcar a caminho" só faz sentido com o chamado na fila.
  // Nos outros status ele só some (visualmente), mas continua no
  // HTML com o clique ligado; marcarEmRota() ignora se o status
  // for outro, então não tem perigo.
  const emFila = chamado.status === "fila_atendimento";
  document.getElementById("aviso-na-fila").classList.toggle("d-none", !emFila);
  document.getElementById("botao-em-rota").classList.toggle("d-none", !emFila);

  document.getElementById("rotulo-select-tecnico").textContent = tecnico ? "Reatribuir para" : "Atribuir técnico";
  // <option> não precisa de <template>: é mais simples criar com
  // document.createElement e marcar o técnico atual como selected.
  const select = document.getElementById("select-tecnico");
  select.innerHTML = "";
  const opcaoPadrao = document.createElement("option");
  opcaoPadrao.value = "";
  opcaoPadrao.textContent = "-- selecionar --";
  select.appendChild(opcaoPadrao);
  tecnicos.forEach((t) => {
    const opcao = document.createElement("option");
    opcao.value = t.id;
    opcao.textContent = `${t.nome} · ${t.equipe} (${(t.especialidades || []).join(", ")})`;
    if (t.id === chamado.tecnicoId) opcao.selected = true;
    select.appendChild(opcao);
  });
  document.getElementById("botao-atribuir").textContent = tecnico ? "Reatribuir" : "Atribuir";

  const listaItens = document.getElementById("lista-itens-orcamento-admin");
  listaItens.innerHTML = "";
  const linhaTotal = document.getElementById("linha-total-orcamento");
  const textoSemOrcamento = document.getElementById("texto-sem-orcamento");
  if (chamado.orcamento) {
    chamado.orcamento.itens.forEach((item) => {
      const linha = clonar("modelo-item-orcamento-admin");
      linha.querySelector(".js-descricao").textContent = item.descricao;
      linha.querySelector(".js-valor").textContent = "R$ " + item.valor;
      listaItens.appendChild(linha);
    });
    document.getElementById("texto-total-orcamento-admin").textContent = "R$ " + chamado.orcamento.total;
    linhaTotal.classList.remove("d-none");
    textoSemOrcamento.classList.add("d-none");
  } else {
    linhaTotal.classList.add("d-none");
    textoSemOrcamento.classList.remove("d-none");
  }
}
