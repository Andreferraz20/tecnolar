exibirSessao();

// Essa página não recebe o número do chamado pela URL, ela lê o
// "ultimoChamado" que o passo 3 salvou antes de redirecionar pra cá.
const idChamado = TecnolarDB._ler(TecnolarDB.CHAVES.ultimoChamado, null);
const chamado = idChamado ? TecnolarDB.buscarChamado(idChamado) : null;

if (chamado) {
  document.getElementById("texto-protocolo").textContent = "Chamado #" + chamado.numero;
  document.getElementById("resumo-aparelho").textContent = chamado.aparelho;
  document.getElementById("resumo-detalhes").textContent =
    `${chamado.defeito} · ${chamado.garantia === "sim" ? "na garantia" : "fora de garantia"} · urgência ${chamado.urgencia}`;
  document.getElementById("resumo-endereco").textContent = chamado.endereco;
  document.getElementById("resumo-data").textContent = `Terça, 26/08 · ${chamado.horario} · equipe ${chamado.equipe}`;
  document.getElementById("link-acompanhar").href = "chamado-acompanhar.html?numero=" + chamado.numero;
} else {
  document.getElementById("resumo-aparelho").textContent = "Nenhum chamado recente encontrado.";
}
