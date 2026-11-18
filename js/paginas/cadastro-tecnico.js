const formTecnico = document.getElementById("form-cadastro-tecnico");
const erroBoxTecnico = document.getElementById("erro-cadastro");
const textoErroTecnico = document.getElementById("texto-erro-cadastro");

function mostrarErroTecnico(mensagem) {
  textoErroTecnico.textContent = mensagem;
  erroBoxTecnico.classList.remove("d-none");
}

document.getElementById("cpf").addEventListener("input", (e) => {
  e.target.value = TecnolarValidacao.aplicarMascaraCpf(e.target.value);
});
document.getElementById("telefone").addEventListener("input", (e) => {
  e.target.value = TecnolarValidacao.aplicarMascaraTelefone(e.target.value);
});
document.getElementById("cep").addEventListener("input", (e) => {
  e.target.value = TecnolarValidacao.aplicarMascaraCep(e.target.value);
  if (e.target.value.replace(/\D/g, "").length === 8) buscarCepTecnico();
});
document.getElementById("cep").addEventListener("blur", buscarCepTecnico);

function buscarCepTecnico() {
  TecnolarValidacao.buscarEnderecoPorCep(document.getElementById("cep").value, {
    rua: document.getElementById("rua"),
    bairro: document.getElementById("bairroEndereco"),
    cidade: document.getElementById("cidade"),
    uf: document.getElementById("uf"),
    status: document.getElementById("status-cep"),
  });
}

formTecnico.addEventListener("submit", (ev) => {
  ev.preventDefault();
  erroBoxTecnico.classList.add("d-none");
  const form = ev.target;

  if (!TecnolarValidacao.nomeValido(form.nome.value)) {
    mostrarErroTecnico("Nome completo deve ter entre 15 e 80 letras.");
    return;
  }
  if (!TecnolarValidacao.cpfValido(form.cpf.value)) {
    mostrarErroTecnico("CPF inválido — confira o dígito verificador.");
    return;
  }
  if (!TecnolarValidacao.loginValido(form.login.value)) {
    mostrarErroTecnico("Login deve ter exatamente 6 letras.");
    return;
  }
  if (TecnolarDB.buscarUsuarioPorLogin(form.login.value)) {
    mostrarErroTecnico("Já existe uma conta com este login.");
    return;
  }
  if (!TecnolarValidacao.telefoneValido(form.telefone.value)) {
    mostrarErroTecnico("Telefone deve estar no formato (+55)XX-XXXXXXXX.");
    return;
  }
  if (!TecnolarValidacao.senhaValida(form.senha.value)) {
    mostrarErroTecnico("Senha deve ter exatamente 8 letras, sem número.");
    return;
  }
  if (form.senha.value !== form.confirmar_senha.value) {
    mostrarErroTecnico("As senhas não conferem.");
    return;
  }
  if (TecnolarDB.buscarUsuarioPorEmail(form.email.value)) {
    mostrarErroTecnico("Já existe uma conta com este e-mail.");
    return;
  }

  const bairros = Array.from(form.bairros.selectedOptions).map((o) => o.value);
  const especialidades = Array.from(form.querySelectorAll('input[name="especialidade"]:checked')).map((i) => i.value);

  // status "pendente" e equipe nula: o técnico só aparece nas opções
  // de atribuição do admin depois que alguém aprovar o cadastro.
  TecnolarDB.salvarUsuario({
    tipo: "tecnico",
    nome: form.nome.value.trim(),
    login: form.login.value.trim(),
    cpf: form.cpf.value,
    email: form.email.value,
    telefone: form.telefone.value,
    cidade: form.cidade.value,
    uf: form.uf.value,
    bairros,
    especialidades,
    experiencia: form.experiencia.value,
    senha: form.senha.value,
    status: "pendente",
    equipe: null,
  });

  // Sem login automático aqui, a conta ainda não pode entrar.
  form.classList.add("d-none");
  document.getElementById("bloco-sucesso").classList.remove("d-none");
  document.getElementById("link-voltar-inicio").classList.remove("d-none");
});
