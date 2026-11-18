const botaoSenha = document.getElementById("mostrar-senha");
const campoSenha = document.getElementById("senha");

botaoSenha.addEventListener("click", () => {
  if (campoSenha.type === "password") {
    campoSenha.type = "text";
    botaoSenha.textContent = "ocultar";
  } else {
    campoSenha.type = "password";
    botaoSenha.textContent = "mostrar";
  }
});

document.getElementById("form-login").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const login = document.getElementById("login").value.trim();
  const senha = campoSenha.value;
  const usuario = TecnolarDB.buscarUsuarioPorLogin(login);

  if (!usuario || usuario.senha !== senha) {
    document.getElementById("erro-login").classList.remove("d-none");
    return;
  }

  // Senha certa, mas o cadastro ainda não foi aprovado: a mensagem
  // genérica de erro confundiria o técnico, então trocamos o texto.
  if (usuario.tipo === "tecnico" && usuario.status === "pendente") {
    document.getElementById("erro-login").classList.remove("d-none");
    document.querySelector("#erro-login p").textContent =
      "Seu cadastro de técnico ainda está pendente de aprovação do admin.";
    return;
  }

  // Cada tipo de usuário tem seu próprio painel depois do login.
  TecnolarDB.login(usuario.id);
  if (usuario.tipo === "admin") {
    window.location.href = "admin/chamados.html";
  } else if (usuario.tipo === "tecnico") {
    window.location.href = "tecnico/chamados.html";
  } else {
    window.location.href = "cliente/meus-chamados.html";
  }
});
