const formCliente = document.getElementById("form-cadastro-cliente");
const erroBox = document.getElementById("erro-cadastro");
const textoErro = document.getElementById("texto-erro-cadastro");

function mostrarErroCadastro(mensagem) {
  textoErro.textContent = mensagem;
  erroBox.classList.remove("d-none");
}

// Máscaras aplicadas enquanto a pessoa digita.
document.getElementById("cpf").addEventListener("input", (e) => {
  e.target.value = TecnolarValidacao.aplicarMascaraCpf(e.target.value);
});
document.getElementById("telefone").addEventListener("input", (e) => {
  e.target.value = TecnolarValidacao.aplicarMascaraTelefone(e.target.value);
});
document.getElementById("cep").addEventListener("input", (e) => {
  e.target.value = TecnolarValidacao.aplicarMascaraCep(e.target.value);
  if (e.target.value.replace(/\D/g, "").length === 8) buscarCep();
});
document.getElementById("cep").addEventListener("blur", buscarCep);

function buscarCep() {
  TecnolarValidacao.buscarEnderecoPorCep(document.getElementById("cep").value, {
    rua: document.getElementById("rua"),
    bairro: document.getElementById("bairro"),
    cidade: document.getElementById("cidade"),
    uf: document.getElementById("uf"),
    status: document.getElementById("status-cep"),
  });
}

formCliente.addEventListener("submit", (ev) => {
  ev.preventDefault();
  erroBox.classList.add("d-none");
  const form = ev.target;

  if (!TecnolarValidacao.nomeValido(form.nome.value)) {
    mostrarErroCadastro("Nome completo deve ter entre 15 e 80 letras.");
    return;
  }
  if (!TecnolarValidacao.loginValido(form.login.value)) {
    mostrarErroCadastro("Login deve ter exatamente 6 letras.");
    return;
  }
  if (TecnolarDB.buscarUsuarioPorLogin(form.login.value)) {
    mostrarErroCadastro("Já existe uma conta com este login.");
    return;
  }
  if (!TecnolarValidacao.cpfValido(form.cpf.value)) {
    mostrarErroCadastro("CPF inválido — confira o dígito verificador.");
    return;
  }
  if (!TecnolarValidacao.telefoneValido(form.telefone.value)) {
    mostrarErroCadastro("Telefone deve estar no formato (+55)XX-XXXXXXXX.");
    return;
  }
  if (!TecnolarValidacao.senhaValida(form.senha.value)) {
    mostrarErroCadastro("Senha deve ter exatamente 8 letras, sem número.");
    return;
  }
  if (form.senha.value !== form.confirmar_senha.value) {
    mostrarErroCadastro("As senhas não conferem.");
    return;
  }
  if (TecnolarDB.buscarUsuarioPorEmail(form.email.value)) {
    mostrarErroCadastro("Já existe uma conta com este e-mail.");
    return;
  }

  const usuario = TecnolarDB.salvarUsuario({
    tipo: "cliente",
    nome: form.nome.value.trim(),
    login: form.login.value.trim(),
    email: form.email.value,
    senha: form.senha.value,
    cpf: form.cpf.value,
    telefone: form.telefone.value,
    cidade: form.cidade.value,
    uf: form.uf.value,
    endereco: [form.rua.value, form.bairro.value].filter(Boolean).join(" · "),
  });

  // Diferente do técnico, o cliente não espera aprovação de ninguém:
  // a conta já entra logada direto no fluxo de abrir chamado.
  TecnolarDB.login(usuario.id);
  window.location.href = "chamado-passo-1.html";
});
