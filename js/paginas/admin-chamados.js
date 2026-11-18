// Só admin entra aqui, qualquer outra sessão (ou nenhuma) volta pro login.
const usuario = TecnolarDB.sessaoAtual();
if (!usuario || usuario.tipo !== "admin") {
  window.location.href = "../login.html";
}
document.getElementById("texto-usuario-logado").textContent = usuario ? usuario.nome : "";

const ROTULOS_STATUS = {
  novo: { texto: "Novo", classe: "text-bg-secondary" },
  fila_atendimento: { texto: "Na fila", classe: "text-bg-primary" },
  em_rota: { texto: "Em rota", classe: "text-bg-info" },
  aguardando_cliente: { texto: "Aguard. cliente", classe: "text-bg-warning" },
  em_reparo: { texto: "Em reparo", classe: "text-bg-dark" },
  concluido: { texto: "Concluído", classe: "text-bg-success" },
};

function nomeCliente(chamado) {
  const cliente = chamado.clienteId ? TecnolarDB.buscarUsuarioPorId(chamado.clienteId) : null;
  return cliente ? cliente.nome : "Cliente avulso";
}

function nomeTecnico(chamado) {
  const tecnico = chamado.tecnicoId ? TecnolarDB.buscarUsuarioPorId(chamado.tecnicoId) : null;
  return tecnico ? `${chamado.equipe} · ${tecnico.nome}` : `${chamado.equipe || "—"} · sem técnico`;
}

function renderizarTabela(filtro) {
  const chamados = TecnolarDB.listarChamados();

  // Os cartões de estatística sempre somam o total geral, só a
  // tabela abaixo muda com o filtro selecionado.
  const emAberto = chamados.filter((c) => c.status !== "concluido");
  const aguardandoDistribuicao = chamados.filter((c) => !c.tecnicoId && c.status !== "concluido");
  const emAtendimento = chamados.filter((c) => c.tecnicoId && c.status !== "aguardando_cliente" && c.status !== "concluido");
  const aguardandoAprovacao = chamados.filter((c) => c.status === "aguardando_cliente");
  const emRisco = chamados.filter((c) => c.urgencia === "urgente" && c.status !== "concluido");

  document.getElementById("num-aguardando").textContent = aguardandoDistribuicao.length;
  document.getElementById("num-atendimento").textContent = emAtendimento.length;
  document.getElementById("num-aprovacao").textContent = aguardandoAprovacao.length;
  document.getElementById("num-risco").textContent = emRisco.length;
  document.getElementById("contador-risco").textContent = emRisco.length;
  document.getElementById("texto-resumo-topo").textContent = `${emAberto.length} abertos de ${chamados.length} no total`;

  let filtrados = chamados;
  if (filtro === "sem-tecnico") filtrados = chamados.filter((c) => !c.tecnicoId);
  if (filtro === "urgente") filtrados = chamados.filter((c) => c.urgencia === "urgente");

  const corpo = document.getElementById("corpo-tabela-chamados");
  corpo.innerHTML = "";

  if (filtrados.length === 0) {
    const linha = document.createElement("tr");
    const celula = document.createElement("td");
    celula.colSpan = 6;
    celula.className = "text-center text-secondary py-4";
    celula.textContent = "Nenhum chamado por aqui.";
    linha.appendChild(celula);
    corpo.appendChild(linha);
  } else {
    // #modelo-linha-chamado é um <template> no HTML, cada linha da
    // tabela é uma cópia dele (cloneNode) preenchida com os dados
    // do chamado. Nada de montar HTML como string aqui no script.
    const modelo = document.getElementById("modelo-linha-chamado");
    filtrados
      .slice()
      .reverse()
      .forEach((c) => {
        const status = ROTULOS_STATUS[c.status] || { texto: c.status, classe: "text-bg-secondary" };
        const linha = modelo.content.cloneNode(true);
        const tr = linha.querySelector("tr");

        tr.dataset.numero = c.numero;
        tr.querySelector(".js-numero").textContent = "#" + c.numero;
        tr.querySelector(".js-aparelho").textContent = c.aparelho;
        tr.querySelector(".js-defeito").textContent = c.defeito || "";
        tr.querySelector(".js-cliente").textContent = nomeCliente(c);
        tr.querySelector(".js-setor").textContent = c.equipe || "—";
        tr.querySelector(".js-equipe-tecnico").textContent = nomeTecnico(c);

        const sla = tr.querySelector(".js-sla");
        sla.textContent = c.urgencia === "urgente" ? "expira em breve" : "no prazo";
        if (c.urgencia === "urgente") sla.classList.add("text-danger", "fw-semibold");

        const badge = tr.querySelector(".js-status");
        badge.classList.add(status.classe);
        badge.textContent = status.texto;

        tr.addEventListener("click", () => {
          window.location.href = "chamado-detalhe.html?numero=" + c.numero;
        });

        corpo.appendChild(linha);
      });
  }

  document.getElementById("texto-paginacao").textContent = `Mostrando 1–${filtrados.length} de ${filtrados.length}`;
}

document.querySelectorAll("#filtros-status button").forEach((botao) => {
  botao.addEventListener("click", () => {
    document.querySelectorAll("#filtros-status button").forEach((b) => b.classList.remove("active"));
    botao.classList.add("active");
    renderizarTabela(botao.dataset.filtro);
  });
});

document.getElementById("link-em-risco").addEventListener("click", (ev) => {
  ev.preventDefault();
  document.querySelector('#filtros-status button[data-filtro="urgente"]').click();
});

document.getElementById("botao-exportar").addEventListener("click", () => {
  mostrarToast("Exportação de exemplo — em um sistema real isso geraria um CSV com os chamados filtrados.");
});

document.getElementById("link-sair").addEventListener("click", (ev) => {
  ev.preventDefault();
  TecnolarDB.logout();
  window.location.href = "../login.html";
});

// No celular a sidebar vira uma gaveta: esse botão só aparece
// nessa largura (regra em style.css) e alterna a classe "aberta".
document.getElementById("botao-menu-admin").addEventListener("click", () => {
  document.querySelector(".admin-sidebar").classList.toggle("aberta");
});

renderizarTabela("todos");
