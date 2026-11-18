exibirSessao();

const rascunho = TecnolarDB.getRascunho();

function atualizarResumo(r, dia, horario) {
  document.getElementById("resumo-aparelho").textContent = `${r.aparelho || "Aparelho"} ${r.marca || ""}`.trim();
  document.getElementById("resumo-detalhes").textContent = [
    r.defeito,
    r.garantia === "sim" ? "na garantia" : "fora de garantia",
    "urgência " + (r.urgencia || "normal"),
  ]
    .filter(Boolean)
    .join(" · ");
  document.getElementById("resumo-endereco").textContent = r.endereco || "Endereço não informado";
  document.getElementById("resumo-data").textContent = `Terça, ${dia}/08 · ${horario} · equipe ${r.equipe || "Norte-2"}`;
}

atualizarResumo(rascunho, "26", "08:00 – 12:00");

document.querySelectorAll('input[name="horario"]').forEach((input) => {
  input.addEventListener("change", () => {
    const dia = document.querySelector('input[name="dia"]:checked').value;
    atualizarResumo(rascunho, dia, input.value);
  });
});

document.getElementById("form-passo-3").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const form = ev.target;
  const dia = form.dia.value;
  const horario = form.horario.value;
  const usuario = TecnolarDB.sessaoAtual();

  const aparelhoCompleto = `${rascunho.aparelho || "Aparelho"} ${rascunho.marca || ""}`.trim();

  let chamado = TecnolarDB.salvarChamado({
    numero: TecnolarDB.proximoNumeroChamado(),
    clienteId: usuario ? usuario.id : null,
    aparelho: aparelhoCompleto,
    defeito: rascunho.defeito || "",
    garantia: rascunho.garantia || "nao",
    urgencia: rascunho.urgencia || "normal",
    endereco: rascunho.endereco || "Endereço não informado",
    bairro: rascunho.bairro || "Aparecida",
    data: "2026-08-26",
    horario,
    equipe: rascunho.equipe || "Norte-2",
    tecnicoId: null,
    status: "novo",
    orcamento: null,
    linhaDoTempo: [
      { titulo: "Chamado criado", detalhe: rascunho.defeito || "", quando: `26/08 · ${horario}` },
    ],
  });

  // Distribuição automática: tenta achar um técnico aprovado com a
  // especialidade certa. Se não achar ninguém, o chamado fica "sem
  // técnico" esperando o admin atribuir manualmente no painel.
  const tecnicoSugerido = TecnolarDB.sugerirTecnico(aparelhoCompleto);
  if (tecnicoSugerido) {
    chamado = TecnolarDB.atribuirTecnico(chamado, tecnicoSugerido, "automatico");
  }

  TecnolarDB._salvar(TecnolarDB.CHAVES.ultimoChamado, chamado.id);
  TecnolarDB.limparRascunho();
  window.location.href = "chamado-confirmado.html";
});
