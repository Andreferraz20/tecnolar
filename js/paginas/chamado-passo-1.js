exibirSessao();

document.getElementById("form-passo-1").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const form = ev.target;
  const sintomas = Array.from(form.querySelectorAll('input[name="sintoma"]:checked')).map((i) => i.value);

  // salvarRascunho() mescla com o que já tiver salvo, assim os passos
  // 2 e 3 completam o mesmo rascunho em vez de sobrescrever este aqui.
  TecnolarDB.salvarRascunho({
    aparelho: form.aparelho.value,
    marca: form.marca.value,
    serie: form.serie.value,
    defeito: form.defeito.value,
    sintomas,
    garantia: form.garantia.value,
    urgencia: form.urgencia.value,
  });

  window.location.href = "chamado-passo-2.html";
});
