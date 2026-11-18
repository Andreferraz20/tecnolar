exibirSessao();

const usuario = TecnolarDB.sessaoAtual();
if (usuario && usuario.endereco) {
  document.getElementById("texto-endereco-salvo").textContent = usuario.endereco;
} else {
  document.getElementById("bloco-enderecos-salvos").classList.add("d-none");
  document.querySelector('input[name="endereco"][value="novo"]').checked = true;
}

// Máscara de CEP + busca pelo ViaCEP (função compartilhada em validacao.js)
const campoCep = document.getElementById("cep");
campoCep.addEventListener("input", (e) => {
  e.target.value = TecnolarValidacao.aplicarMascaraCep(e.target.value);
  if (e.target.value.replace(/\D/g, "").length === 8) buscarCep();
});
campoCep.addEventListener("blur", buscarCep);

function buscarCep() {
  TecnolarValidacao.buscarEnderecoPorCep(campoCep.value, {
    rua: document.getElementById("rua"),
    bairro: document.getElementById("bairro"),
    status: document.getElementById("status-cep"),
  });
}

document.getElementById("form-passo-2").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const form = ev.target;
  const usandoSalvo = form.endereco.value !== "novo";
  const endereco = usandoSalvo
    ? (usuario && usuario.endereco) || "R. das Acácias, 45 — apto 302 · Aparecida"
    : [form.rua.value, form.numero.value].filter(Boolean).join(", ") +
      (form.bairro.value ? " · " + form.bairro.value : "");

  TecnolarDB.salvarRascunho({
    endereco: endereco || "Endereço não informado",
    bairro: form.bairro.value || "Aparecida",
    equipe: "Norte-2",
  });

  window.location.href = "chamado-passo-3.html";
});
