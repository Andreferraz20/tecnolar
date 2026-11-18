// Em produção esta tela sumiria assim que o primeiro admin existisse;
// aqui só mostramos um aviso e deixamos acessível, pra dar pra demonstrar.
const adminExistente = TecnolarDB.listarUsuarios().find((u) => u.tipo === "admin");
if (adminExistente) {
  document.getElementById("aviso-ja-existe").classList.remove("d-none");
  document.getElementById("email-admin-existente").textContent = adminExistente.email;
}

const erroBoxSetup = document.getElementById("erro-cadastro");
const textoErroSetup = document.getElementById("texto-erro-cadastro");

function mostrarErroSetup(mensagem) {
  textoErroSetup.textContent = mensagem;
  erroBoxSetup.classList.remove("d-none");
}

document.getElementById("cpf").addEventListener("input", (e) => {
  e.target.value = TecnolarValidacao.aplicarMascaraCpf(e.target.value);
});

document.getElementById("telefone").addEventListener("input", (e) => {
  e.target.value = TecnolarValidacao.aplicarMascaraTelefone(e.target.value);
});

document.getElementById("cnpj").addEventListener("input", (e) => {
  const d = e.target.value.replace(/\D/g, "").slice(0, 14);
  e.target.value = d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
});

document.getElementById("cep").addEventListener("input", (e) => {
  e.target.value = TecnolarValidacao.aplicarMascaraCep(e.target.value);
  if (e.target.value.replace(/\D/g, "").length === 8) buscarCepSetup();
});
document.getElementById("cep").addEventListener("blur", buscarCepSetup);

function buscarCepSetup() {
  TecnolarValidacao.buscarEnderecoPorCep(document.getElementById("cep").value, {
    rua: document.getElementById("rua"),
    bairro: document.getElementById("bairroEndereco"),
    cidade: document.getElementById("cidadeEndereco"),
    uf: document.getElementById("uf"),
    status: document.getElementById("status-cep"),
  });
}

document.getElementById("form-setup").addEventListener("submit", (ev) => {
  ev.preventDefault();
  erroBoxSetup.classList.add("d-none");
  const form = ev.target;

  if (!TecnolarValidacao.nomeValido(form.nome.value)) {
    mostrarErroSetup("Nome completo deve ter entre 15 e 80 letras.");
    return;
  }
  if (!TecnolarValidacao.cpfValido(form.cpf.value)) {
    mostrarErroSetup("CPF inválido — confira o dígito verificador.");
    return;
  }
  if (!TecnolarValidacao.loginValido(form.login.value)) {
    mostrarErroSetup("Login deve ter exatamente 6 letras.");
    return;
  }
  if (TecnolarDB.buscarUsuarioPorLogin(form.login.value)) {
    mostrarErroSetup("Já existe uma conta com este login.");
    return;
  }
  if (!TecnolarValidacao.telefoneValido(form.telefone.value)) {
    mostrarErroSetup("Telefone deve estar no formato (+55)XX-XXXXXXXX.");
    return;
  }
  if (!TecnolarValidacao.senhaValida(form.senha.value)) {
    mostrarErroSetup("Senha deve ter exatamente 8 letras, sem número.");
    return;
  }
  if (form.senha.value !== form.confirmar_senha.value) {
    mostrarErroSetup("As senhas não conferem.");
    return;
  }
  if (TecnolarDB.buscarUsuarioPorEmail(form.email.value)) {
    mostrarErroSetup("Já existe uma conta com este e-mail.");
    return;
  }

  const admin = TecnolarDB.salvarUsuario({
    tipo: "admin",
    nome: form.nome.value.trim(),
    login: form.login.value.trim(),
    cpf: form.cpf.value,
    email: form.email.value,
    telefone: form.telefone.value,
    cidade: form.cidadeEndereco.value,
    uf: form.uf.value,
    senha: form.senha.value,
  });

  TecnolarDB.salvarEmpresa({
    nomeFantasia: form.nome_fantasia.value,
    cnpj: form.cnpj.value,
    cidade: form.cidade_empresa.value,
  });

  TecnolarDB.login(admin.id);
  window.location.href = "chamados.html";
});
